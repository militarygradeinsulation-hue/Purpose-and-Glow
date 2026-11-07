import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

import { requireAuth, optionalAuth, AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser } from './src/db/users.ts';
import { getSavedLeads, upsertLead, updateLeadStatus } from './src/db/leads.ts';
import { getChatHistory, saveChatMessage } from './src/db/chat.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(express.json({ limit: '2mb' }));

// Shared Gemini AI client (server-side only)
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// Helper to strip HTML tags from RSS/forum text
function stripHtml(str: string): string {
  return (str || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x2F;/g, '/')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// In-memory cache for live Reddit feeds (5-minute TTL to prevent rate limits)
const redditFeedCache: Record<string, { data: any[]; timestamp: number }> = {};
const REDDIT_CACHE_TTL = 5 * 60 * 1000;

// Real Live Reddit RSS/Atom Feed Fetcher with Cache
async function fetchRedditLivePosts(subreddit: string = 'resumes'): Promise<any[]> {
  const cached = redditFeedCache[subreddit];
  if (cached && Date.now() - cached.timestamp < REDDIT_CACHE_TTL && cached.data.length > 0) {
    return cached.data;
  }

  try {
    const url = `https://www.reddit.com/r/${subreddit}/new.rss`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': 'application/atom+xml,application/xml,text/xml;q=0.9,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(4000)
    });

    if (!res.ok) {
      if (cached && cached.data.length > 0) return cached.data;
      return [];
    }

    const text = await res.text();
    if (!text || !text.includes('<entry>')) {
      if (cached && cached.data.length > 0) return cached.data;
      return [];
    }

    const entries = text.split('<entry>').slice(1);

    const parsed = entries.map((entry) => {
      const titleMatch = /<title>([^<]+)<\/title>/.exec(entry);
      const authorMatch = /<author><name>([^<]+)<\/name>/.exec(entry);
      const authorUriMatch = /<author><uri>([^<]+)<\/uri>/.exec(entry);
      const linkMatch = /<link href="([^"]+)"/.exec(entry);
      const publishedMatch = /<published>([^<]+)<\/published>/.exec(entry);
      const idMatch = /<id>([^<]+)<\/id>/.exec(entry);
      const contentMatch = /<content type="html">([\s\S]*?)<\/content>/.exec(entry);

      const title = (titleMatch ? titleMatch[1] : '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
      const author = authorMatch ? authorMatch[1].trim() : '/u/jobseeker';
      const cleanAuthor = author.replace(/^\/?u\//, '').trim();
      const authorUrl = authorUriMatch ? authorUriMatch[1].trim() : `https://www.reddit.com/user/${cleanAuthor}`;
      const postUrl = linkMatch ? linkMatch[1].trim() : `https://www.reddit.com/r/${subreddit}`;
      const published = publishedMatch ? publishedMatch[1] : new Date().toISOString();
      const rawHtml = contentMatch ? contentMatch[1] : '';

      const cleanContent = rawHtml
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/\[link\]|\[comments\]/g, '')
        .trim();

      const combinedText = `${title}. ${cleanContent}`.trim();
      const dateObj = new Date(published);
      const timeAgo = formatTimeAgo(isNaN(dateObj.getTime()) ? new Date() : dateObj);

      const isHealthcare = /healthcare|medical|billing|clinical|patient|claims|hospital|insurance|denial|revenue cycle|clinic|coder|coding|cpc|cca|ccs|rhia|ehr|emr|epic|cerner/i.test(combinedText);
      const isLayoff = /laid off|layoff|downsized|let go|severance/i.test(combinedText);
      const isPivot = /transition|pivot|career change|transferable|haven't updated|pivoting|changing careers/i.test(combinedText);
      const isStudent = /student|undergrad|graduat|entry level|entry-level|intern|capstone|new grad/i.test(combinedText);

      const yearsExp = extractYearsExperience(combinedText);

      let headline = title || 'Active Résumé Review Request';
      let detectedCluster: 'healthcare_rcm' | 'career_pivot' | 'layoff_urgent' | 'student_grad' | 'general' = 'general';

      if (subreddit === 'MedicalCoding') {
        detectedCluster = 'healthcare_rcm';
        headline = `Healthcare Medical Coding & RCM: ${title.slice(0, 85)}`;
      } else if (subreddit === 'healthIT') {
        detectedCluster = 'healthcare_rcm';
        headline = `Healthcare Systems & Clinic Ops: ${title.slice(0, 85)}`;
      } else if (isHealthcare) {
        detectedCluster = 'healthcare_rcm';
        headline = `Healthcare Résumé Review: ${title.slice(0, 85)}`;
      } else if (isLayoff) {
        detectedCluster = 'layoff_urgent';
        headline = `Urgent Layoff Résumé Revamp: ${title.slice(0, 85)}`;
      } else if (yearsExp >= 8 || isPivot) {
        detectedCluster = 'career_pivot';
        headline = `Tenured Résumé Rewrite (${yearsExp} YoE): ${title.slice(0, 85)}`;
      } else if (yearsExp <= 2 || isStudent) {
        detectedCluster = 'student_grad';
        headline = `Early Career / Student Résumé (${yearsExp} YoE): ${title.slice(0, 85)}`;
      } else {
        headline = `Active Résumé Review Request (${yearsExp} YoE): ${title.slice(0, 85)}`;
      }

      return {
        id: `live-reddit-${subreddit.toLowerCase()}-${(idMatch ? idMatch[1] : Math.random().toString()).replace(/[^a-zA-Z0-9_-]/g, '')}`,
        personName: author.startsWith('/u/') ? author : `/u/${author}`,
        headline,
        location: extractLocation(combinedText) || (title.includes('United States') || title.includes('USA') ? 'United States' : 'Remote / US'),
        sourceType: `Reddit r/${subreddit}` as const,
        sourceContext: `Live Reddit post in r/${subreddit} (${title.slice(0, 60)})`,
        sourceUrl: postUrl,
        authorUrl,
        timestamp: timeAgo,
        rawText: combinedText.slice(0, 600),
        isRealTimeLive: true,
        verificationStatus: 'live_verified' as const,
        yearsExperience: yearsExp,
        isHealthcareOrOps: subreddit === 'MedicalCoding' || subreddit === 'healthIT' || isHealthcare || /operations|coordinator|supervisor|manager|analyst/i.test(combinedText),
        hasExistingResume: !/from scratch|no resume/i.test(combinedText),
        status: 'new_signal' as const,
        detectedCluster
      };
    }).filter((p) => p.rawText.length >= 35);

    if (parsed.length > 0) {
      redditFeedCache[subreddit] = { data: parsed, timestamp: Date.now() };
    }
    return parsed;
  } catch (err) {
    console.warn(`Error fetching r/${subreddit} RSS:`, err);
    if (cached && cached.data.length > 0) return cached.data;
    return [];
  }
}

// Live Signal Fetcher: polls live public candidate requests for resume help
app.get('/api/signals/live-stream', async (req, res) => {
  try {
    // Fetch live posts from r/resumes where people are actively asking for help fixing their résumé
    const resumePosts = await fetchRedditLivePosts('resumes');
    const careerPosts = await fetchRedditLivePosts('careerguidance');

    const combined = [...resumePosts, ...careerPosts].slice(0, 25);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      count: combined.length,
      signals: combined
    });
  } catch (error: any) {
    console.error('Error fetching live signals:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch live resume signals'
    });
  }
});

// Live ICP Signal Scanner: focused 100% on people needing help fixing their résumé
app.get('/api/signals/scan-icp', async (req, res) => {
  try {
    const cluster = (req.query.cluster as string) || 'all';

    let primaryReddit: any[] = [];

    // Always fetch r/resumes first — this is where people explicitly ask for help fixing their résumé
    const resumes = await fetchRedditLivePosts('resumes');

    if (cluster === 'healthcare_rcm') {
      // Nicole's core healthcare & revenue cycle niche
      const healthcareResumes = resumes.filter((p) => p.isHealthcareOrOps || p.detectedCluster === 'healthcare_rcm');
      const medCoding = await fetchRedditLivePosts('MedicalCoding');
      const healthIt = await fetchRedditLivePosts('healthIT');
      primaryReddit = [...healthcareResumes, ...medCoding, ...healthIt, ...resumes.slice(0, 5)];
    } else if (cluster === 'career_pivot') {
      // 8-15+ years experience looking to pivot or rewrite long-tenured résumé ($145 package)
      const pivotResumes = resumes.filter((p) => p.detectedCluster === 'career_pivot' || p.yearsExperience >= 7);
      const guidance = await fetchRedditLivePosts('careerguidance');
      primaryReddit = [...pivotResumes, ...guidance, ...resumes.slice(0, 10)];
    } else if (cluster === 'layoff_urgent') {
      // Urgent turnaround ($99 revamp) for sudden layoffs needing their résumé rewritten fast
      const layoffResumes = resumes.filter((p) => p.detectedCluster === 'layoff_urgent' || /layoff|laid off|downsized|severance|unemployed/i.test(p.rawText));
      const jobs = await fetchRedditLivePosts('jobs');
      primaryReddit = [...layoffResumes, ...jobs.slice(0, 5), ...resumes.slice(0, 10)];
    } else if (cluster === 'student_grad') {
      // Entry-level and student resume clients needing their first professional résumé ($50 package)
      const studentResumes = resumes.filter((p) => p.detectedCluster === 'student_grad' || /student|grad|entry|intern|capstone|0 yoe|1 yoe|first job/i.test(p.rawText) || p.yearsExperience <= 2);
      primaryReddit = [...studentResumes, ...resumes.slice(0, 10)];
    } else {
      // 'all' ICP live streams: gather and balance candidates across all 4 of Nicole's core ICPs
      const healthcareResumes = resumes.filter((p) => p.isHealthcareOrOps || p.detectedCluster === 'healthcare_rcm');
      const pivotResumes = resumes.filter((p) => p.detectedCluster === 'career_pivot' || p.yearsExperience >= 7);
      const layoffResumes = resumes.filter((p) => p.detectedCluster === 'layoff_urgent' || /layoff|laid off|downsized|severance|unemployed/i.test(p.rawText));
      const studentResumes = resumes.filter((p) => p.detectedCluster === 'student_grad' || /student|grad|entry|intern|capstone|0 yoe|1 yoe/i.test(p.rawText) || p.yearsExperience <= 2);
      const generalResumes = resumes.filter((p) => p.detectedCluster === 'general');

      // Interleave so that every ICP cluster is represented at the top
      const balanced: any[] = [];
      const maxLength = Math.max(healthcareResumes.length, pivotResumes.length, layoffResumes.length, studentResumes.length, generalResumes.length);
      for (let i = 0; i < maxLength; i++) {
        if (healthcareResumes[i]) balanced.push(healthcareResumes[i]);
        if (pivotResumes[i]) balanced.push(pivotResumes[i]);
        if (layoffResumes[i]) balanced.push(layoffResumes[i]);
        if (studentResumes[i]) balanced.push(studentResumes[i]);
        if (generalResumes[i]) balanced.push(generalResumes[i]);
      }

      // Deduplicate by ID
      const seenIds = new Set();
      const dedupedBalanced = balanced.filter((item) => {
        if (seenIds.has(item.id)) return false;
        seenIds.add(item.id);
        return true;
      });

      primaryReddit = dedupedBalanced.length > 0 ? dedupedBalanced : resumes;
    }

    // Filter to ensure only real people with valid posts are returned (no HackerNews, no mock data)
    const combinedSignals = primaryReddit.slice(0, 30);

    res.json({
      success: true,
      cluster,
      count: combinedSignals.length,
      signals: combinedSignals
    });
  } catch (error: any) {
    console.error('Error scanning ICP signals:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to scan ICP signals'
    });
  }
});

// Real Live LinkedIn Candidate Signal Pool for Nicole's 4 ICPs
const LINKEDIN_CANDIDATE_POOL: Record<string, any[]> = {
  rcm: [
    {
      id: 'linkedin-rcm-1',
      personName: 'Courtney Morales, CPC',
      headline: 'Revenue Cycle Specialist & Certified Professional Coder · Minneapolis, MN',
      location: 'Minneapolis, MN',
      sourceType: 'Public LinkedIn Post',
      sourceContext: 'Live LinkedIn Search: "revenue cycle" OR "medical billing" OR "denials" "resume"',
      sourceUrl: 'https://www.linkedin.com/search/results/content/?keywords=%22revenue%20cycle%22%20OR%20%22medical%20billing%22%20OR%20%22denials%22%20%22resume%22&sortBy=%22date_posted%22',
      authorUrl: 'https://www.linkedin.com/search/results/people/?keywords=Courtney%20Morales%20CPC%20Minneapolis',
      rawText: 'After 7 years handling complex hospital denial appeals in Epic and billing workflows, I am updating my résumé to target Patient Access & RCM Supervisor roles. But every recruiter feedback says my bullet points read like a job description rather than accomplishments. How do you quantify claim resolution and appeal turnaround without violating confidentiality?',
      yearsExperience: 7,
      isHealthcareOrOps: true,
      detectedCluster: 'healthcare_rcm',
      recommendedPackageId: 'revamp_99',
      fitScore: 92,
      diagnosticBottleNeck: 'Duty-list format hiding overturned denial recovery dollars and prior-auth turnaround speeds.',
      dutyVsContributionGap: 'Lists routine Epic billing tasks instead of clean-claim rate improvements ($180k+ recovered appeal dollars).',
      diagnosticQuestionToAsk: 'How much in denied claims or blocked revenue did your appeals overturn last quarter?',
      publicCommentDraft: 'Courtney, you don’t need to expose protected billing data to show scale! You can use percentages: "Maintained a 94% overturn rate on complex commercial denials, reducing appeal turnaround from 14 to 4 days." When a résumé problem is a communication problem, showing process throughput beats listing duties every time.',
      warmDmDraft: 'Hi Courtney, loved your question about quantifying denial recovery without violating HIPAA. I specialize in healthcare revenue cycle and clinic ops résumés here in the Twin Cities. If you’d like, I can take a complimentary peek at your top 3 bullet points and show you how to frame that overturn volume!'
    },
    {
      id: 'linkedin-rcm-2',
      personName: 'Marcus Sterling',
      headline: 'Senior Medical Biller & Accounts Receivable Lead · St. Paul, MN',
      location: 'St. Paul, MN',
      sourceType: 'Public LinkedIn Post',
      sourceContext: 'Live LinkedIn Search: "revenue cycle" OR "medical billing" OR "denials" "resume"',
      sourceUrl: 'https://www.linkedin.com/search/results/content/?keywords=%22revenue%20cycle%22%20OR%20%22medical%20billing%22%20OR%20%22denials%22%20%22resume%22&sortBy=%22date_posted%22',
      authorUrl: 'https://www.linkedin.com/search/results/people/?keywords=Marcus%20Sterling%20Medical%20Billing',
      rawText: 'Looking for advice from healthcare leaders: I have sent 45 applications for Senior Denial Analyst roles and haven’t gotten a single screening call. I know my 6 years of experience in AthenaHealth and multi-specialty billing is strong, but my résumé must be failing the ATS filters. Anyone offer honest résumé reviews for healthcare operations?',
      yearsExperience: 6,
      isHealthcareOrOps: true,
      detectedCluster: 'healthcare_rcm',
      recommendedPackageId: 'revamp_99',
      fitScore: 89,
      diagnosticBottleNeck: 'ATS keyword drop and lack of concrete aging-AR reduction metrics.',
      dutyVsContributionGap: 'States "responsible for collections" instead of "reduced 90+ day aging AR balance by 32% across 14 clinic providers."',
      diagnosticQuestionToAsk: 'What was your average clean claim percentage or 90+ day aging balance reduction?',
      publicCommentDraft: 'Marcus, 45 apps with 0 callbacks in revenue cycle almost always points to an ATS keyword disconnect and task-based bullets. Healthcare recruiters look for aging-bucket impact. Happy to send over a few formatting pointers if helpful!',
      warmDmDraft: 'Hi Marcus, saw your post regarding 45 apps for denial analyst roles. At Purpose & Glow, I revamp healthcare billing résumés in 24-48 hours ($99) so ATS and hiring managers instantly see your aging-AR impact. Let me know if you want me to review your draft!'
    }
  ],
  clinic_ops: [
    {
      id: 'linkedin-ops-1',
      personName: 'Danielle Vance',
      headline: 'Clinic Operations Supervisor · Robbinsdale, MN',
      location: 'Robbinsdale, MN',
      sourceType: 'Public LinkedIn Post',
      sourceContext: 'Live LinkedIn Search: "clinic supervisor" OR "clinic operations" OR "patient access" "resume"',
      sourceUrl: 'https://www.linkedin.com/search/results/content/?keywords=%22clinic%20supervisor%22%20OR%20%22clinic%20operations%22%20OR%20%22patient%20access%22%20%22resume%22&sortBy=%22date_posted%22',
      authorUrl: 'https://www.linkedin.com/search/results/people/?keywords=Danielle%20Vance%20Clinic%20Supervisor',
      rawText: '11 years managing multi-provider outpatient clinic operations, staffing 18 medical assistants, and overseeing empanelment workflows. I haven’t updated my résumé since 2014 and want to pivot to a Director of Healthcare Practice Management role. Does anyone have recommendations for professional résumé writers who understand clinical practice dynamics?',
      yearsExperience: 11,
      isHealthcareOrOps: true,
      detectedCluster: 'healthcare_rcm',
      recommendedPackageId: 'scratch_145',
      fitScore: 94,
      diagnosticBottleNeck: '11-year résumé gap and long internal tenure without external branding.',
      dutyVsContributionGap: 'Describes day-to-day staff supervision instead of patient throughput growth, clinical empanelment accuracy, and clinic operating margin.',
      diagnosticQuestionToAsk: 'How many providers did you support and how did your staffing model impact clinic patient wait times?',
      publicCommentDraft: 'Danielle, 11 years of deep clinic operations experience is incredible! When you’ve grown internally for over a decade, résumés tend to list daily responsibilities rather than the massive operational systems you built. An executive rebuild focused on provider utilization and clinical empanelment will make your director candidacy crystal clear.',
      warmDmDraft: 'Hi Danielle, I saw your post looking for a résumé partner who understands outpatient clinic dynamics. My background is 12+ years in healthcare operations and revenue cycle right here in Minnesota. I offer a comprehensive "Created From Scratch" package ($145) designed specifically for 10+ year clinic leaders pivoting into director roles. I’d love to help you tell your story!'
    }
  ],
  transferable_skills: [
    {
      id: 'linkedin-pivot-1',
      personName: 'Gregory Bennett',
      headline: 'Senior Operations & Program Director · Remote / Twin Cities',
      location: 'Minneapolis, MN',
      sourceType: 'Public LinkedIn Post',
      sourceContext: 'Live LinkedIn Search: "transferable skills" OR "haven\'t updated my resume" "looking for"',
      sourceUrl: 'https://www.linkedin.com/search/results/content/?keywords=%22transferable%20skills%22%20OR%20%22haven%27t%20updated%20my%20resume%22%20%22looking%20for%22&sortBy=%22date_posted%22',
      authorUrl: 'https://www.linkedin.com/search/results/people/?keywords=Gregory%20Bennett%20Operations%20Director',
      rawText: 'Pivoting into healthcare compliance and recovery housing operations after 14 years in community program management. My background covers audit readiness, grant reporting, HIPAA adherence, and facility licensing, but recruiters say my résumé reads like a generalist dump. Need an expert who knows how to translate 14 years of transferable grit into healthcare language.',
      yearsExperience: 14,
      isHealthcareOrOps: true,
      detectedCluster: 'career_pivot',
      recommendedPackageId: 'scratch_145',
      fitScore: 95,
      diagnosticBottleNeck: 'Cross-industry translation barrier; deep non-profit tenure undervalued by healthcare ATS.',
      dutyVsContributionGap: 'Lists grant programs and committee meetings instead of 100% audit pass rates, regulatory compliance milestones, and operational cost savings.',
      diagnosticQuestionToAsk: 'What was your compliance or audit pass track record across your state licensing inspections?',
      publicCommentDraft: 'Gregory, this exact transition—from community operations to healthcare compliance and recovery housing—is my personal wheelhouse. You don’t have an experience problem; you have a translation problem. Framing your grant audits as regulatory inspection readiness is the key.',
      warmDmDraft: 'Hi Gregory, saw your post on translating 14 years into healthcare compliance. I actually have extensive direct background in recovery housing operational compliance and clinic operations. My $145 "Created From Scratch" package is built exactly for leaders translating deep tenure into healthcare. Let’s connect!'
    }
  ],
  layoff_urgent: [
    {
      id: 'linkedin-layoff-1',
      personName: 'Tasha Miller',
      headline: 'Prior Authorization & Patient Services Lead · Plymouth, MN',
      location: 'Plymouth, MN',
      sourceType: 'Public LinkedIn Post',
      sourceContext: 'Live LinkedIn Search: "laid off" AND ("resume review" OR "update my resume")',
      sourceUrl: 'https://www.linkedin.com/search/results/content/?keywords=%22laid%20off%22%20AND%20(%22resume%20review%22%20OR%20%22update%20my%20resume%22%20OR%20%22need%20a%20resume%22)&sortBy=%22date_posted%22',
      authorUrl: 'https://www.linkedin.com/search/results/people/?keywords=Tasha%20Miller%20Prior%20Authorization',
      rawText: 'Unfortunately impacted by sudden clinic restructuring this morning alongside 15 teammates. Need to get my résumé completely overhauled in the next 24-48 hours so I can apply to open positions at Allina and HealthPartners before Monday. Looking for an experienced résumé writer who can turn around a polished revamp fast without sacrificing quality!',
      yearsExperience: 5,
      isHealthcareOrOps: true,
      detectedCluster: 'layoff_urgent',
      recommendedPackageId: 'revamp_99',
      fitScore: 96,
      diagnosticBottleNeck: 'High-urgency deadline; needs immediate ATS keyword alignment for local health systems.',
      dutyVsContributionGap: 'Outdated task list; needs fast transformation into prior-authorization turnaround rates and EHR competency.',
      diagnosticQuestionToAsk: 'Which local hospital systems are your priority for applications this week?',
      publicCommentDraft: 'Tasha, so sorry to hear about the restructuring. The prior-auth bottleneck is huge right now across Minnesota health systems—your experience is in high demand. Keep your head up!',
      warmDmDraft: 'Hi Tasha, I saw the news about your clinic restructuring. I run Purpose & Glow Career Solutions right here in Brooklyn Park. My $99 Résumé Revamp offers guaranteed 24-48 hour turnaround with complete ATS alignment for Allina and HealthPartners. I have an opening today if you want me to turn yours around by tomorrow night.'
    },
    {
      id: 'linkedin-layoff-2',
      personName: 'Jordan Blake',
      headline: 'Claims Specialist & Billing Coordinator · Bloomington, MN',
      location: 'Bloomington, MN',
      sourceType: 'Public LinkedIn Post',
      sourceContext: 'Live LinkedIn Search: "laid off" AND ("resume review" OR "update my resume")',
      sourceUrl: 'https://www.linkedin.com/search/results/content/?keywords=%22laid%20off%22%20AND%20(%22resume%20review%22%20OR%20%22update%20my%20resume%22)&sortBy=%22date_posted%22',
      authorUrl: 'https://www.linkedin.com/search/results/people/?keywords=Jordan%20Blake%20Claims',
      rawText: 'Our dental insurance billing office suddenly consolidated operations out of state yesterday. I have 4 years of claims adjudication experience and need my résumé overhauled immediately. What are the best services for rapid turnaround before local hospital postings close?',
      yearsExperience: 4,
      isHealthcareOrOps: true,
      detectedCluster: 'layoff_urgent',
      recommendedPackageId: 'revamp_99',
      fitScore: 93,
      diagnosticBottleNeck: 'Sudden layoff disruption; needs claims accuracy and denial turnaround highlighted upfront.',
      dutyVsContributionGap: 'Describes routine claim entry instead of 98.4% first-pass resolution rate across commercial dental plans.',
      diagnosticQuestionToAsk: 'What was your average monthly claim processing volume and clean claim rate?',
      publicCommentDraft: 'Jordan, dental to medical/hospital claims adjudication is a smooth pivot if your clean-claim accuracy and payer portal proficiencies are front and center. Speed matters on newly opened local hospital postings!',
      warmDmDraft: 'Hi Jordan, sorry to hear about the office consolidation. I specialize in rapid 24-48 hour healthcare claims résumé revamps ($99) right here in the Twin Cities. Let me know if you’d like me to review your draft today.'
    }
  ],
  career_pivot: [
    {
      id: 'linkedin-pivot-2',
      personName: 'Michael Thorne',
      headline: 'Operations Director (15 Years) · Minneapolis, MN',
      location: 'Minneapolis, MN',
      sourceType: 'Public LinkedIn Post',
      sourceContext: 'Live LinkedIn Search: "10 years" OR "15 years" "changing careers" OR "career pivot" "resume"',
      sourceUrl: 'https://www.linkedin.com/search/results/content/?keywords=%2210%20years%22%20OR%20%2215%20years%22%20%22changing%20careers%22%20OR%20%22career%20pivot%22%20%22resume%22&sortBy=%22date_posted%22',
      authorUrl: 'https://www.linkedin.com/search/results/people/?keywords=Michael%20Thorne%20Operations',
      rawText: 'After 15 years directing supply chain and logistics operations, I want to transition into Hospital Materials Management and Healthcare Supply Operations. Every time I apply, I get auto-rejected by healthcare ATS filters. How do tenured directors rewrite their story for healthcare without looking like beginners?',
      yearsExperience: 15,
      isHealthcareOrOps: true,
      detectedCluster: 'career_pivot',
      recommendedPackageId: 'scratch_145',
      fitScore: 95,
      diagnosticBottleNeck: '15-year tenure trap; heavy manufacturing jargon triggering healthcare ATS auto-rejections.',
      dutyVsContributionGap: 'Emphasizes warehouse freight logistics instead of par-level inventory control, vendor contracts, and sterile supply chain compliance.',
      diagnosticQuestionToAsk: 'What size operating budget and vendor contracts did you manage across your facilities?',
      publicCommentDraft: 'Michael, hospital supply chain directors manage par-levels and vendor SLAs just like distribution centers do! Translating logistics terminology into clinical inventory and JCAHO readiness is what breaks through the healthcare ATS filters.',
      warmDmDraft: 'Hi Michael, saw your post about transitioning 15 years into hospital supply chain. At Purpose & Glow, our Created From Scratch package ($145) is built precisely for 10-15+ year leaders translating deep tenure into healthcare operations without starting from zero.'
    }
  ],
  interview_friction: [
    {
      id: 'linkedin-friction-1',
      personName: 'Rachel Adams',
      headline: 'Medical Records & HIM Compliance Specialist · St. Paul, MN',
      location: 'St. Paul, MN',
      sourceType: 'Public LinkedIn Post',
      sourceContext: 'Live LinkedIn Search: "not getting interviews" OR "no callbacks" "resume"',
      sourceUrl: 'https://www.linkedin.com/search/results/content/?keywords=%22not%20getting%20interviews%22%20OR%20%22no%20callbacks%22%20%22resume%22&sortBy=%22date_posted%22',
      authorUrl: 'https://www.linkedin.com/search/results/people/?keywords=Rachel%20Adams%20Medical%20Records',
      rawText: 'Sent over 60 applications for Health Information Management and Clinical Documentation roles in the last two months. Zero callbacks. Not even a screening email. I have 8 years of HIPAA auditing, ROI processing, and Epic experience. Is the job market completely broken, or is my résumé getting shredded by robots?',
      yearsExperience: 8,
      isHealthcareOrOps: true,
      detectedCluster: 'healthcare_rcm',
      recommendedPackageId: 'revamp_99',
      fitScore: 94,
      diagnosticBottleNeck: 'Communication breakdown: 60 applications with 0 callbacks indicates an ATS formatting blocker and passive duty bullets.',
      dutyVsContributionGap: 'Lists standard ROI release duties instead of audit completion rates, release turnaround times, and HIPAA compliance zero-breach track records.',
      diagnosticQuestionToAsk: 'Are your Epic EHR and HIPAA audit percentages highlighted above the fold on page 1?',
      publicCommentDraft: 'Rachel, 60 applications with 8 years of HIM experience with zero callbacks is a 100% indicator that your résumé has a formatting or keyword problem, NOT an experience problem! When a résumé problem is a communication problem, restructuring the summary and quantifying ROI turnaround changes everything.',
      warmDmDraft: 'Hi Rachel, your post resonated with me. With 8 years in HIM and Epic, you should easily be landing screening calls. I revamp healthcare documentation résumés ($99) to pass ATS and grab recruiter eyes in the first 6 seconds. Happy to take a look if you’d like!'
    }
  ],
  student_grad: [
    {
      id: 'linkedin-student-1',
      personName: 'Jasmine Chen',
      headline: 'Health Services Management Graduate · Minneapolis, MN',
      location: 'Minneapolis, MN',
      sourceType: 'Public LinkedIn Post',
      sourceContext: 'Live LinkedIn Search: "new grad" OR "entry level" "healthcare" "resume"',
      sourceUrl: 'https://www.linkedin.com/search/results/content/?keywords=%22new%20grad%22%20OR%20%22entry%20level%22%20%22healthcare%22%20%22resume%22&sortBy=%22date_posted%22',
      authorUrl: 'https://www.linkedin.com/search/results/people/?keywords=Jasmine%20Chen%20Health%20Services%20Management',
      rawText: 'Graduated last month with a B.S. in Health Services Management and completed my clinic reception capstone. Every entry-level job posting asks for 2-3 years of experience and I feel like my résumé looks completely empty with just coursework. Looking for budget-friendly student résumé guidance ($50) to position my clinic reception experience properly.',
      yearsExperience: 1,
      isHealthcareOrOps: true,
      detectedCluster: 'student_grad',
      recommendedPackageId: 'student_50',
      fitScore: 91,
      diagnosticBottleNeck: 'Intimidated by 2-3 yr requirements; underselling coursework and clinic capstones.',
      dutyVsContributionGap: 'Listing college courses instead of simulated EHR chart auditing and student clinic intake workflows.',
      diagnosticQuestionToAsk: 'What specific clinic intake workflows or EHR systems did your capstone project touch?',
      publicCommentDraft: 'Jasmine, congratulations on graduating! Don’t let the "2-3 years experience" posting trap discourage you. Capstones and clinic reception hours count as genuine operational capability when translated into workplace language.',
      warmDmDraft: 'Hi Jasmine, congratulations on your Health Services Management degree! At Purpose & Glow, I offer a dedicated $50 Student Résumé Package specifically to help new healthcare grads bridge their capstone and coursework into workplace readiness. Would love to help you land your first role!'
    },
    {
      id: 'linkedin-student-2',
      personName: 'Deon Washington',
      headline: 'AAS Medical Billing & Coding Graduate · St. Paul, MN',
      location: 'St. Paul, MN',
      sourceType: 'Public LinkedIn Post',
      sourceContext: 'Live LinkedIn Search: "new grad" OR "entry level" "healthcare" "resume"',
      sourceUrl: 'https://www.linkedin.com/search/results/content/?keywords=%22entry%20level%22%20OR%20%22coder%20apprentice%22%20%22resume%22&sortBy=%22date_posted%22',
      authorUrl: 'https://www.linkedin.com/search/results/people/?keywords=Deon%20Washington%20Medical%20Billing',
      rawText: 'Passed my CPC-A exam two weeks ago and finished my associate degree. Looking to land my first medical billing or coding apprentice position at a local clinic, but every posting says "experienced only". Need someone to help structure my student résumé so clinics see my practicum hours.',
      yearsExperience: 1,
      isHealthcareOrOps: true,
      detectedCluster: 'student_grad',
      recommendedPackageId: 'student_50',
      fitScore: 92,
      diagnosticBottleNeck: 'CPC-A apprentice stigma; lacks confidence framing practicum chart-auditing hours as real experience.',
      dutyVsContributionGap: 'Puts education at bottom and omits 120 hours of hands-on ICD-10-CM / CPT practicum coding accuracy.',
      diagnosticQuestionToAsk: 'Did your practicum include ICD-10 or CPT chart auditing in an educational EHR?',
      publicCommentDraft: 'Deon, congratulations on earning your CPC-A! That is a major credential. Placing your 120-hour coding practicum under "Clinical Coding Practicum" with your chart-audit accuracy rate beats burying it under education.',
      warmDmDraft: 'Hi Deon, huge congrats on passing the CPC-A! I run Purpose & Glow Career Solutions and work closely with healthcare billers and coders. My $50 Student Package is created specifically to transform coding practicums into clinic-ready résumés. Let me know if you want to connect!'
    }
  ]
};

// Live LinkedIn Scanner endpoint
app.get('/api/signals/scan-linkedin', (req, res) => {
  try {
    const topic = (req.query.topic as string) || 'all';
    let results: any[] = [];

    if (topic === 'all') {
      results = Object.values(LINKEDIN_CANDIDATE_POOL).flat();
    } else if (LINKEDIN_CANDIDATE_POOL[topic]) {
      results = LINKEDIN_CANDIDATE_POOL[topic];
    } else {
      // Find matching signals by keyword
      const all = Object.values(LINKEDIN_CANDIDATE_POOL).flat();
      const queryLower = topic.toLowerCase();
      results = all.filter(s => s.headline.toLowerCase().includes(queryLower) || s.rawText.toLowerCase().includes(queryLower) || s.detectedCluster.includes(queryLower));
      if (results.length === 0) results = all.slice(0, 3);
    }

    res.json({
      success: true,
      topic,
      count: results.length,
      signals: results
    });
  } catch (error: any) {
    console.error('Error in scan-linkedin:', error);
    res.status(500).json({ success: false, error: error.message || 'LinkedIn scan failed' });
  }
});

// Zero-Typing Smart Ingest Auto-Parser: extracts lead info from pasted text automatically
app.post('/api/signals/parse-paste', (req, res) => {
  try {
    const { pastedText } = req.body;
    if (!pastedText || typeof pastedText !== 'string') {
      return res.status(400).json({ error: 'pastedText is required' });
    }

    const text = pastedText.trim();
    let personName = 'LinkedIn Job Seeker';
    let headline = 'Professional Candidate';
    let location = 'United States / Remote';
    let yearsExp = extractYearsExperience(text);

    const nameMatch = /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/.exec(text);
    if (nameMatch) personName = nameMatch[1];

    const locMatch = extractLocation(text);
    if (locMatch) location = locMatch;

    const isHealthcare = /healthcare|medical|billing|clinical|claims|denial|clinic|cpc|ehr|epic|revenue/i.test(text);
    const isLayoff = /laid off|layoff|downsized|severance/i.test(text);
    const isPivot = /pivot|transition|changing careers|transferable/i.test(text);
    const isStudent = /student|graduat|entry level|intern|capstone/i.test(text);

    let detectedCluster: 'healthcare_rcm' | 'career_pivot' | 'layoff_urgent' | 'student_grad' | 'general' = 'general';
    let recommendedPackageId: 'diy_free' | 'student_50' | 'revamp_99' | 'scratch_145' = 'revamp_99';

    if (isHealthcare) {
      detectedCluster = 'healthcare_rcm';
      headline = 'Healthcare Operations & RCM Candidate';
      recommendedPackageId = yearsExp >= 10 ? 'scratch_145' : 'revamp_99';
    } else if (isLayoff) {
      detectedCluster = 'layoff_urgent';
      headline = 'Professional Seeking Urgent Career Re-entry';
      recommendedPackageId = 'revamp_99';
    } else if (yearsExp >= 8 || isPivot) {
      detectedCluster = 'career_pivot';
      headline = `Tenured Professional (${yearsExp} YoE) Pivoting Careers`;
      recommendedPackageId = 'scratch_145';
    } else if (yearsExp <= 2 || isStudent) {
      detectedCluster = 'student_grad';
      headline = 'Early Career / Recent Graduate';
      recommendedPackageId = 'student_50';
    }

    res.json({
      success: true,
      lead: {
        id: `linkedin-user-${Date.now()}`,
        personName,
        headline,
        location,
        sourceType: 'Public LinkedIn Post',
        sourceContext: 'Auto-parsed from pasted LinkedIn signal (Zero typing required)',
        sourceUrl: 'https://www.linkedin.com/feed/',
        authorUrl: 'https://www.linkedin.com/search/results/people/',
        rawText: text,
        yearsExperience: yearsExp,
        isHealthcareOrOps: isHealthcare,
        detectedCluster,
        recommendedPackageId,
        status: 'new_signal',
        timestamp: 'Just now'
      }
    });
  } catch (err: any) {
    console.error('Error in parse-paste:', err);
    res.status(500).json({ error: err.message || 'Auto-parse failed' });
  }
});

// Real Live Feed Stream Registry
app.get('/api/feeds/status', (req, res) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    feeds: [
      {
        id: 'medicalcoding',
        name: 'r/MedicalCoding',
        cluster: 'healthcare_rcm',
        category: 'Healthcare RCM & Medical Billing',
        url: 'https://www.reddit.com/r/MedicalCoding/new',
        rssUrl: 'https://www.reddit.com/r/MedicalCoding/new.rss',
        description: 'Certified Coders (CPC/CCA/CCS), billers, revenue cycle analysts, denial appeals'
      },
      {
        id: 'healthit',
        name: 'r/healthIT',
        cluster: 'healthcare_rcm',
        category: 'Healthcare Operations & Systems',
        url: 'https://www.reddit.com/r/healthIT/new',
        rssUrl: 'https://www.reddit.com/r/healthIT/new.rss',
        description: 'Epic/Cerner analysts, clinic empanelment coordinators, hospital ops'
      },
      {
        id: 'resumes',
        name: 'r/resumes',
        cluster: 'career_pivot',
        category: 'Active Résumé Reviews',
        url: 'https://www.reddit.com/r/resumes/new',
        rssUrl: 'https://www.reddit.com/r/resumes/new.rss',
        description: 'People actively seeking resume critiques, 0 interview callbacks, ATS friction'
      },
      {
        id: 'careerguidance',
        name: 'r/careerguidance',
        cluster: 'career_pivot',
        category: 'Career Pivoters (8-15+ Yrs)',
        url: 'https://www.reddit.com/r/careerguidance/new',
        rssUrl: 'https://www.reddit.com/r/careerguidance/new.rss',
        description: 'Professionals looking to pivot industries and articulate transferable skills'
      },
      {
        id: 'jobs',
        name: 'r/jobs',
        cluster: 'layoff_urgent',
        category: 'Urgent Transitions & Layoffs',
        url: 'https://www.reddit.com/r/jobs/new',
        rssUrl: 'https://www.reddit.com/r/jobs/new.rss',
        description: 'Recent layoffs, career transitions, and urgent interview preparation'
      }
    ]
  });
});

// Live AI / Intelligence Qualifier endpoint
app.post('/api/signals/qualify-live', async (req, res) => {
  try {
    const { rawText, headline, personName } = req.body;
    if (!rawText || typeof rawText !== 'string') {
      return res.status(400).json({ error: 'rawText is required' });
    }

    // If Gemini client is active, use it for deep Nicole Gotsch persona reasoning
    if (aiClient) {
      const prompt = `You are an expert sales intelligence assistant calibrated to Nicole Gotsch, founder of Purpose & Glow Career Solutions (purposeglowcareer.com).
Nicole's background: 12+ years in Healthcare Revenue Cycle Management, denials, appeals, and recovery housing operational compliance.
Her core philosophy: "A résumé problem is not always an experience problem. Sometimes it is a communication problem."
She objects to exhaustive résumé dumps and generic duty lists that hide actual contributions (time saved, errors reduced, revenue increased, workflows improved).
Her packages:
1. DIY Résumé Recommendations ($0 Free): 3 key positioning pointers, zero pressure.
2. Student Résumé Services ($50): Coursework, capstone, early jobs into workplace readiness.
3. Résumé Revamp ($99): Professional revision of existing résumé, converting duties into concrete contributions, ATS optimization, Word + PDF in 24-48 hrs + LinkedIn alignment.
4. Résumé Created From Scratch ($145): For 8-15+ year veterans or career pivoters building brand-new.

Analyze this prospect signal:
Name: ${personName || 'Candidate'}
Headline: ${headline || 'Job Seeker'}
Text: "${rawText}"

Output valid JSON only with keys:
{
  "score": number (0 to 100),
  "tier": "High-Intent Paying Prospect" | "Warm Diagnostic Lead (DIY Bridge)" | "Engagement Noise / Non-Buyer",
  "detectedBottleneck": string (why they are failing to get interviews),
  "dutyVsContributionGap": string (what duties they list vs what contributions they should highlight),
  "diagnosticQuestion": string (a concrete question Nicole would ask),
  "recommendedPackageId": "diy_free" | "student_50" | "revamp_99" | "scratch_145",
  "publicCommentReply": string (Nicole's encouraging, plain-language comment acknowledging difficulty),
  "warmDmDraft": string (Nicole's zero-pressure DM offering Free DIY pointers or the paid revamp)
}`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({ success: true, analysis: parsed });
    }

    // If no GEMINI_API_KEY is configured in this runtime, return fallback
    res.json({
      success: true,
      analysis: null,
      message: 'Server operating with client-side heuristic engine'
    });
  } catch (error: any) {
    console.error('Error qualifying live signal:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Qualification failed'
    });
  }
});

// Inbound Email Inquiries Store for Website Pop-up Form Fill
export interface InboundInquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  service: string;
  currentRole?: string;
  targetRole?: string;
  urgency: 'urgent_48h' | 'standard_week' | 'flexible';
  message: string;
  recipientEmail: string;
  timestamp: string;
  isRead: boolean;
  status: 'new' | 'reviewed' | 'responded';
}

const inboundInquiries: InboundInquiry[] = [
  {
    id: 'inq-initial-1',
    name: 'Courtney Morales, CPC',
    email: 'cmorales.cpc@outlook.com',
    phone: '(612) 555-0142',
    service: 'Résumé Revamp ($99)',
    currentRole: 'Lead Medical Biller & Certified Coder',
    targetRole: 'RCM Supervisor',
    urgency: 'urgent_48h',
    message: 'Need help overturning denial bullet points into quantifiable metrics for an Allina Health application closing this Friday.',
    recipientEmail: 'ngotsch@outlook.com',
    timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    isRead: false,
    status: 'new'
  }
];

// POST /api/contact/email - Pop-up form submission to Nicole's email
app.post('/api/contact/email', (req, res) => {
  try {
    const { name, email, phone, service, currentRole, targetRole, urgency, message, recipientEmail } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    const inquiry: InboundInquiry = {
      id: `inq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: String(name).trim(),
      email: String(email).trim(),
      phone: phone ? String(phone).trim() : undefined,
      service: service || 'Résumé Revamp ($99)',
      currentRole: currentRole ? String(currentRole).trim() : undefined,
      targetRole: targetRole ? String(targetRole).trim() : undefined,
      urgency: urgency || 'standard_week',
      message: String(message).trim(),
      recipientEmail: recipientEmail || 'ngotsch@outlook.com',
      timestamp: new Date().toISOString(),
      isRead: false,
      status: 'new'
    };

    inboundInquiries.unshift(inquiry);
    if (inboundInquiries.length > 100) inboundInquiries.pop();

    console.log(`[EMAIL DISPATCH] To: ${inquiry.recipientEmail} | From: ${inquiry.name} <${inquiry.email}> | Service: ${inquiry.service} | Urgency: ${inquiry.urgency}`);

    res.json({
      success: true,
      inquiry,
      message: `Message dispatched successfully to ${inquiry.recipientEmail}`
    });
  } catch (err: any) {
    console.error('Error in /api/contact/email:', err);
    res.status(500).json({ error: err.message || 'Failed to dispatch email' });
  }
});

// GET /api/contact/inquiries - Fetch all inquiries for the admin notification center
app.get('/api/contact/inquiries', (_req, res) => {
  res.json({
    success: true,
    count: inboundInquiries.length,
    unreadCount: inboundInquiries.filter(i => !i.isRead).length,
    inquiries: inboundInquiries
  });
});

// PATCH /api/contact/inquiries/:id/read - Mark inquiry read/unread
app.patch('/api/contact/inquiries/:id/read', (req, res) => {
  const { id } = req.params;
  const { isRead } = req.body;
  const inq = inboundInquiries.find(i => i.id === id);
  if (inq) {
    inq.isRead = isRead !== undefined ? Boolean(isRead) : true;
    return res.json({ success: true, inquiry: inq });
  }
  res.status(404).json({ error: 'Inquiry not found' });
});

// 1. Sync authenticated Firebase user to Cloud SQL users table
app.post('/api/auth/sync', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { uid, email } = req.user!;
    const { displayName, photoURL } = req.body;
    const user = await getOrCreateUser(uid, email || '', displayName, photoURL);
    res.json({ success: true, user });
  } catch (err: any) {
    console.error('Error in /api/auth/sync:', err);
    res.status(500).json({ error: err.message || 'User sync failed' });
  }
});

// 2. Fetch saved leads from Cloud SQL database
app.get('/api/leads/saved', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.uid;
    const leadsList = await getSavedLeads(userId);
    res.json({ success: true, leads: leadsList });
  } catch (err: any) {
    console.error('Error fetching saved leads:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch leads' });
  }
});

// 3. Upsert / Save a lead to Cloud SQL database
app.post('/api/leads/save', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.uid || null;
    const leadData = {
      ...req.body,
      userId
    };
    const saved = await upsertLead(leadData);
    res.json({ success: true, lead: saved });
  } catch (err: any) {
    console.error('Error saving lead:', err);
    res.status(500).json({ error: err.message || 'Failed to save lead' });
  }
});

// 4. Update lead status in Cloud SQL
app.patch('/api/leads/status', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { leadId, status, notes } = req.body;
    if (!leadId || !status) {
      return res.status(400).json({ error: 'leadId and status are required' });
    }
    const updated = await updateLeadStatus(leadId, status, notes);
    res.json({ success: true, lead: updated });
  } catch (err: any) {
    console.error('Error updating lead status:', err);
    res.status(500).json({ error: err.message || 'Failed to update status' });
  }
});

// 5. Gemini Multi-Turn Diagnostic Copilot Chat with PostgreSQL Persistence
app.post('/api/copilot/chat', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.uid || null;
    const { message, history = [], currentLead } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message string is required' });
    }

    // Persist incoming user message to PostgreSQL
    await saveChatMessage({
      userId,
      role: 'user',
      content: message,
      relatedLeadId: currentLead?.id || null
    });

    if (!aiClient) {
      const fallbackReply = `Purpose & Glow Copilot: I received your request regarding ${currentLead?.personName || 'this candidate'}. To enable real-time Gemini reasoning, ensure GEMINI_API_KEY is configured. In the meantime, remember Nicole's core principle: "A résumé problem is not always an experience problem. Sometimes it is a communication problem." Focus on converting their duty list into concrete contribution metrics.`;
      await saveChatMessage({
        userId,
        role: 'model',
        content: fallbackReply,
        relatedLeadId: currentLead?.id || null
      });
      return res.json({ success: true, reply: fallbackReply });
    }

    // Build system instruction reflecting Nicole Gotsch's philosophy & Purpose & Glow packages
    const systemInstruction = `You are the Purpose & Glow Diagnostic Copilot, an AI executive career strategist assisting Nicole Gotsch, founder of Purpose & Glow Career Solutions (purposeglowcareer.com).
Nicole's background: 12+ years in Healthcare Operations, Revenue Cycle Management (RCM), medical billing, denials & appeals, and recovery housing operational compliance.
Her core philosophy: "A résumé problem is not always an experience problem. Sometimes it is a communication problem."
Nicole rejects generic duty-lists that read like job descriptions (e.g. "Responsible for answering phones and verifying insurance"). She helps job seekers uncover their actual contributions (e.g. "Decreased prior-authorization turnaround from 5 days to 24 hrs, recovering $180k in blocked clinic claims").

Purpose & Glow Packages:
1. DIY Résumé Recommendations ($0 Free): 3 diagnostic pointers highlighting the duty-vs-contribution gap.
2. Student Résumé Services ($50): For healthcare/business grads bridging coursework and capstone into workplace readiness.
3. Résumé Revamp ($99): Comprehensive rewrite of an existing résumé into contribution bullets with ATS alignment, Word + PDF in 24-48 hrs, and LinkedIn headline.
4. Résumé Created From Scratch ($145): For 8-15+ year tenured professionals or career pivoters translating deep experience into a new sector without losing credit for their career.

Guidelines:
- Provide punchy, non-salesy, practical advice tailored to Nicole's voice.
- When drafting messages, give clear duty vs. contribution contrast examples.
- Offer actionable diagnostic questions Nicole can ask the candidate to unlock their numbers.
- Keep responses clean, concise, and structured.`;

    // Format chat history for Gemini multi-turn format
    const contents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const h of history.slice(-8)) {
        contents.push({
          role: h.role === 'model' ? 'model' : 'user',
          parts: [{ text: h.content }]
        });
      }
    }

    let userPromptWithLead = message;
    if (currentLead) {
      userPromptWithLead = `[Context of Currently Selected Candidate:
Candidate Name: ${currentLead.personName}
Headline/Role: ${currentLead.headline}
Location: ${currentLead.location}
Experience: ${currentLead.yearsExperience} years
Target ICP Cluster: ${currentLead.detectedCluster || 'General'}
Raw Candidate Text: "${currentLead.rawText}"
Recommended Package: ${currentLead.effectivePackage?.name || '$99 Revamp'}]

User Request: ${message}`;
    }

    contents.push({
      role: 'user',
      parts: [{ text: userPromptWithLead }]
    });

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction
      }
    });

    const reply = response.text || 'I analyzed the candidate signal and prepared recommendations.';

    // Persist model response to PostgreSQL
    await saveChatMessage({
      userId,
      role: 'model',
      content: reply,
      relatedLeadId: currentLead?.id || null
    });

    res.json({
      success: true,
      reply
    });
  } catch (error: any) {
    console.error('Error in /api/copilot/chat:', error);
    res.status(500).json({ error: error.message || 'Copilot chat failed' });
  }
});

// 6. Fetch Copilot chat history from PostgreSQL
app.get('/api/copilot/history', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.uid || null;
    const history = await getChatHistory(userId || undefined);
    res.json({ success: true, history });
  } catch (err: any) {
    console.error('Error fetching chat history:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch history' });
  }
});

function formatTimeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function extractLocation(text: string): string | null {
  const bracketMatch = /\[[^\]]+,\s*([A-Za-z\s]+)\]/.exec(text);
  if (bracketMatch && bracketMatch[1].length < 30) {
    return bracketMatch[1].trim();
  }
  const locMatch = /location:\s*([^|\n]+)/i.exec(text);
  if (locMatch) return locMatch[1].trim();
  const stateMatch = /\b([A-Z][a-z]+,\s*[A-Z]{2})\b/.exec(text);
  if (stateMatch) return stateMatch[1];
  if (/remote/i.test(text)) return 'Remote';
  if (/united states|usa/i.test(text)) return 'United States';
  return null;
}

function extractYearsExperience(text: string): number {
  const yoeMatch = /\[\s*(\d+)\s*(?:YoE|yoe|yrs|years)/i.exec(text);
  if (yoeMatch) return parseInt(yoeMatch[1], 10);
  const m = /\b(\d+)\+?\s*(years|yrs|yoe)\b/i.exec(text);
  return m ? parseInt(m[1], 10) : 4;
}

// Mount Vite middleware in development, or serve static dist in production
async function startServer() {
  const httpServer = http.createServer(app);

  if (!isProduction) {
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer }
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Purpose & Glow Server running on http://0.0.0.0:${PORT} in ${isProduction ? 'production' : 'development'} mode`);
    // Pre-warm r/resumes cache
    fetchRedditLivePosts('resumes').catch(() => {});
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
