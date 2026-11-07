export type IntentClusterId =
  | 'active_resume_friction'
  | 'transferable_pivot'
  | 'healthcare_rcm_authority'
  | 'interview_urgency'
  | 'negative_noise';

export interface KeywordRule {
  id: string;
  phrase: string;
  cluster: IntentClusterId;
  clusterLabel: string;
  weight: number; // +10 to +35 for buying signals, -15 to -40 for noise
  rationale: string;
  enabled: boolean;
}

export interface ServicePackage {
  id: 'diy_free' | 'student_50' | 'revamp_99' | 'scratch_145';
  name: string;
  price: number;
  priceDisplay: string;
  turnaround: string;
  targetAudience: string;
  deliverables: string[];
  whenToRecommend: string;
  directUrl: string;
}

export interface LeadSignal {
  id: string;
  personName: string;
  headline: string;
  location: string;
  sourceType:
    | 'Reddit r/MedicalCoding'
    | 'Reddit r/healthIT'
    | 'Reddit r/resumes'
    | 'Reddit r/careerguidance'
    | 'Reddit r/jobs'
    | 'Public Web Discussion'
    | 'Comment on Your Post'
    | 'Public LinkedIn Post'
    | 'Inbound Profile Visit / DM'
    | 'Inbound Consultation Request'
    | 'Healthcare Network Post';
  sourceContext: string;
  sourceUrl?: string;
  authorUrl?: string;
  isRealTimeLive?: boolean;
  verificationStatus?: 'live_verified' | 'user_ingested' | 'case_study';
  timestamp: string;
  rawText: string;
  yearsExperience: number;
  isHealthcareOrOps: boolean;
  hasExistingResume: boolean;
  status: 'new_signal' | 'diagnostic_sent' | 'diy_review_offered' | 'booked_client' | 'filtered_noise';
  detectedCluster?: 'healthcare_rcm' | 'career_pivot' | 'layoff_urgent' | 'student_grad' | 'general';
  recommendedPackageId: ServicePackage['id'];
  diagnosticBottleNeck: string;
  dutyVsContributionGap: string;
  diagnosticQuestionToAsk: string;
  publicCommentDraft: string;
  warmDmDraft: string;
}

export const PURPOSE_GLOW_PACKAGES: ServicePackage[] = [
  {
    id: 'diy_free',
    name: 'DIY Résumé Recommendations',
    price: 0,
    priceDisplay: 'Free',
    turnaround: '24 hrs',
    targetAudience: 'Warm LinkedIn engagers & cautious job seekers who want expert eyes first',
    deliverables: [
      'Personalized, non-obligatory diagnostic feedback on top 3 positioning gaps',
      'Duty-list vs. contribution-statement contrast examples',
      'Natural upgrade bridge to the $99 Résumé Revamp when they realize the rewrite effort'
    ],
    whenToRecommend:
      'Use when someone comments with mild frustration or hesitates to invest immediately. Builds immediate trust without pressure.',
    directUrl: 'https://purposeglowcareer.com/'
  },
  {
    id: 'student_50',
    name: 'Student Résumé Services',
    price: 50,
    priceDisplay: '$50',
    turnaround: '24–48 hrs',
    targetAudience: 'Students & recent graduates translating coursework, clinicals, or part-time roles',
    deliverables: [
      'ATS-friendly editable Word document + polished PDF delivery',
      'Translation of academic projects, internships, and part-time work into workplace readiness',
      'Clear keyword alignment for entry-level target roles'
    ],
    whenToRecommend:
      'Use when a graduating student or new entrant feels they "lack real experience" and needs help framing what they bring to the table.',
    directUrl: 'https://purposeglowcareer.com/'
  },
  {
    id: 'revamp_99',
    name: 'Résumé Revamp',
    price: 99,
    priceDisplay: '$99',
    turnaround: '24–48 hrs',
    targetAudience: 'Experienced professionals whose current résumé reads like a generic job description',
    deliverables: [
      'Complete professional revision of existing résumé (ATS-optimized Word + polished PDF)',
      'Reframing of daily duties into concrete contributions (time saved, errors reduced, workflows improved)',
      'LinkedIn profile alignment suggestions to match the new positioning'
    ],
    whenToRecommend:
      'Core revenue driver. Recommend when a capable professional has strong experience but isn’t getting interviews due to a communication bottleneck.',
    directUrl: 'https://purposeglowcareer.com/'
  },
  {
    id: 'scratch_145',
    name: 'Résumé Created From Scratch',
    price: 145,
    priceDisplay: '$145',
    turnaround: '24–48 hrs',
    targetAudience: 'Long-tenured veterans (8–15+ yrs) or career pivoters with no updated résumé',
    deliverables: [
      'Brand-new résumé built from raw career history, achievements, and target role mapping',
      'Explicit transferable-skill bridge so employers don’t have to guess how past work applies',
      'Editable Word + PDF + LinkedIn alignment + 22-Page Interview Success Playbook pairing'
    ],
    whenToRecommend:
      'Recommend for professionals leaving long tenures (like 10+ years at one company) or making a cross-industry transition from scratch.',
    directUrl: 'https://purposeglowcareer.com/'
  }
];

export const INITIAL_KEYWORD_RULES: KeywordRule[] = [
  // Cluster 1: Active Résumé & ATS Friction
  {
    id: 'kw-1',
    phrase: 'not getting interviews',
    cluster: 'active_resume_friction',
    clusterLabel: 'Active Résumé & ATS Friction',
    weight: 32,
    rationale: 'Direct indicator of a communication bottleneck despite active applications.',
    enabled: true
  },
  {
    id: 'kw-2',
    phrase: 'update my resume',
    cluster: 'active_resume_friction',
    clusterLabel: 'Active Résumé & ATS Friction',
    weight: 28,
    rationale: 'Explicit statement of need for résumé revision or rebuild.',
    enabled: true
  },
  {
    id: 'kw-3',
    phrase: 'ats',
    cluster: 'active_resume_friction',
    clusterLabel: 'Active Résumé & ATS Friction',
    weight: 24,
    rationale: 'Job seeker is worried their résumé is being filtered out before human review.',
    enabled: true
  },
  {
    id: 'kw-4',
    phrase: 'applied to',
    cluster: 'active_resume_friction',
    clusterLabel: 'Active Résumé & ATS Friction',
    weight: 26,
    rationale: 'High application volume with low response signals positioning fatigue.',
    enabled: true
  },
  {
    id: 'kw-5',
    phrase: 'resume writer',
    cluster: 'active_resume_friction',
    clusterLabel: 'Active Résumé & ATS Friction',
    weight: 35,
    rationale: 'Actively shopping for a paid résumé service provider.',
    enabled: true
  },
  {
    id: 'kw-6',
    phrase: 'resume review',
    cluster: 'active_resume_friction',
    clusterLabel: 'Active Résumé & ATS Friction',
    weight: 30,
    rationale: 'Directly requesting feedback—ideal match for Free DIY Review -> $99 Revamp.',
    enabled: true
  },

  // Cluster 2: Transferable Skills & Career Transition
  {
    id: 'kw-7',
    phrase: 'transferable skills',
    cluster: 'transferable_pivot',
    clusterLabel: 'Transferable Skill Mapping',
    weight: 28,
    rationale: 'Core Purpose & Glow thesis: connecting prior experience explicitly so employers don’t guess.',
    enabled: true
  },
  {
    id: 'kw-8',
    phrase: 'pivoting',
    cluster: 'transferable_pivot',
    clusterLabel: 'Transferable Skill Mapping',
    weight: 25,
    rationale: 'Career changers struggle most to translate past duties into new industry language.',
    enabled: true
  },
  {
    id: 'kw-9',
    phrase: 'changing careers',
    cluster: 'transferable_pivot',
    clusterLabel: 'Transferable Skill Mapping',
    weight: 26,
    rationale: 'High-value candidate for $99 Revamp or $145 Created From Scratch.',
    enabled: true
  },
  {
    id: 'kw-10',
    phrase: 'explain what i actually do',
    cluster: 'transferable_pivot',
    clusterLabel: 'Transferable Skill Mapping',
    weight: 30,
    rationale: 'Matches Nicole’s exact mission: helping talented people explain what they bring to the table.',
    enabled: true
  },
  {
    id: 'kw-11',
    phrase: 'meet most of the requirements',
    cluster: 'transferable_pivot',
    clusterLabel: 'Transferable Skill Mapping',
    weight: 22,
    rationale: 'Practical-fit applicant who needs confidence and targeted positioning.',
    enabled: true
  },

  // Cluster 3: Healthcare Revenue Cycle & Operations Niche (Nicole's Unfair Advantage)
  {
    id: 'kw-12',
    phrase: 'revenue cycle',
    cluster: 'healthcare_rcm_authority',
    clusterLabel: 'Healthcare RCM & Ops Authority',
    weight: 30,
    rationale: 'Nicole’s 12+ year domain background creates instant trust and zero learning curve.',
    enabled: true
  },
  {
    id: 'kw-13',
    phrase: 'denials',
    cluster: 'healthcare_rcm_authority',
    clusterLabel: 'Healthcare RCM & Ops Authority',
    weight: 28,
    rationale: 'Direct shared context with Nicole’s Insurance Specialist / appeals expertise.',
    enabled: true
  },
  {
    id: 'kw-14',
    phrase: 'accounts receivable',
    cluster: 'healthcare_rcm_authority',
    clusterLabel: 'Healthcare RCM & Ops Authority',
    weight: 26,
    rationale: 'Finance/AR professionals often list transactional tasks instead of revenue recovery outcomes.',
    enabled: true
  },
  {
    id: 'kw-15',
    phrase: 'healthcare administration',
    cluster: 'healthcare_rcm_authority',
    clusterLabel: 'Healthcare RCM & Ops Authority',
    weight: 25,
    rationale: 'High-trust vertical where Nicole’s Sevita Health & Voyage Healthcare background converts fast.',
    enabled: true
  },
  {
    id: 'kw-16',
    phrase: 'compliance',
    cluster: 'healthcare_rcm_authority',
    clusterLabel: 'Healthcare RCM & Ops Authority',
    weight: 20,
    rationale: 'Aligns with Nicole’s operational readiness and regulatory consulting experience.',
    enabled: true
  },

  // Cluster 4: Urgency & Interview Readiness
  {
    id: 'kw-17',
    phrase: 'laid off',
    cluster: 'interview_urgency',
    clusterLabel: 'Urgency & Interview Prep',
    weight: 28,
    rationale: 'Immediate need to get an updated résumé on the market within 24–48 hours.',
    enabled: true
  },
  {
    id: 'kw-18',
    phrase: 'haven’t updated my resume in',
    cluster: 'interview_urgency',
    clusterLabel: 'Urgency & Interview Prep',
    weight: 34,
    rationale: 'Prime candidate for the $145 Résumé Created From Scratch package.',
    enabled: true
  },
  {
    id: 'kw-19',
    phrase: 'interview',
    cluster: 'interview_urgency',
    clusterLabel: 'Urgency & Interview Prep',
    weight: 18,
    rationale: 'Natural entry point for the 22-Page Interview Success Playbook & prep coaching.',
    enabled: true
  },

  // Cluster 5: Negative / Exclusion Signals (Passive Engagement Trap Filter)
  {
    id: 'kw-20',
    phrase: 'great post',
    cluster: 'negative_noise',
    clusterLabel: 'Passive Engagement Noise',
    weight: -25,
    rationale: 'Supportive applause without personal job-search friction or buying intent.',
    enabled: true
  },
  {
    id: 'kw-21',
    phrase: 'fellow resume writer',
    cluster: 'negative_noise',
    clusterLabel: 'Passive Engagement Noise',
    weight: -45,
    rationale: 'Peer industry networking—great for community, not a paying client.',
    enabled: true
  },
  {
    id: 'kw-22',
    phrase: 'thanks for sharing',
    cluster: 'negative_noise',
    clusterLabel: 'Passive Engagement Noise',
    weight: -20,
    rationale: 'Generic LinkedIn comment habit unless paired with a specific career struggle.',
    enabled: true
  },
  {
    id: 'kw-23',
    phrase: 'dm me for',
    cluster: 'negative_noise',
    clusterLabel: 'Passive Engagement Noise',
    weight: -40,
    rationale: 'Outbound seller pitching their own services in comments.',
    enabled: true
  }
];

export interface ICPProfile {
  id: 'healthcare_rcm' | 'career_pivot' | 'layoff_urgent' | 'student_grad';
  title: string;
  tagline: string;
  description: string;
  targetRoles: string[];
  keyPainPoints: string[];
  matchedPackageId: 'diy_free' | 'student_50' | 'revamp_99' | 'scratch_145';
  booleanQueries: {
    label: string;
    query: string;
    linkedInUrl: string;
  }[];
}

export const NICOLE_ICP_PROFILES: ICPProfile[] = [
  {
    id: 'healthcare_rcm',
    title: 'Healthcare Operations & Revenue Cycle (Primary Niche)',
    tagline: '12+ years of shared domain vocabulary in claims, denials, and clinic workflows',
    description: 'Medical billers, coding specialists, denial analysts, clinic supervisors, and patient access reps whose résumés read like a dry list of daily transactional tasks rather than revenue recovery and workflow impact.',
    targetRoles: [
      'Revenue Cycle Analyst / Specialist',
      'Medical Biller & Certified Coder (CPC)',
      'Denials Management & Appeals Coordinator',
      'Clinic Operations Supervisor',
      'Patient Access Representative / Lead'
    ],
    keyPainPoints: [
      'Lists EHR/billing systems (Epic, Cerner) and routine charges instead of clean claim rates',
      'Cannot articulate dollars recovered or denial percentage reductions',
      'Hitting a ceiling when applying for supervisor, analyst, or revenue integrity roles'
    ],
    matchedPackageId: 'revamp_99',
    booleanQueries: [
      {
        label: 'Live LinkedIn: RCM & Denials',
        query: '"revenue cycle" OR "medical billing" OR "denials" "resume"',
        linkedInUrl: 'https://www.linkedin.com/search/results/content/?keywords=%22revenue%20cycle%22%20OR%20%22medical%20billing%22%20OR%20%22denials%22%20%22resume%22&sortBy=%22date_posted%22'
      },
      {
        label: 'Live LinkedIn: Clinic Operations',
        query: '"clinic supervisor" OR "clinic operations" OR "patient access" "resume"',
        linkedInUrl: 'https://www.linkedin.com/search/results/content/?keywords=%22clinic%20supervisor%22%20OR%20%22clinic%20operations%22%20OR%20%22patient%20access%22%20%22resume%22&sortBy=%22date_posted%22'
      }
    ]
  },
  {
    id: 'career_pivot',
    title: 'Career Pivoters with 8–15+ Years (Transferable Skills)',
    tagline: 'Translating deep institutional tenure into new industry opportunities',
    description: 'Experienced managers, non-profit coordinators, and long-tenured operators who haven’t updated their résumé in 8–15 years and don’t know how to translate their background without losing credit for their career.',
    targetRoles: [
      'Operations Manager / Director',
      'Healthcare Compliance Specialist',
      'Program Director / Coordinator',
      'Operational Readiness Specialist'
    ],
    keyPainPoints: [
      'Has not updated résumé in 8–15 years (grew via internal promotions / word of mouth)',
      'Sends 50–100 applications with zero callbacks due to ATS keyword mismatch',
      'Struggles to explain what they actually bring to the table in a new sector'
    ],
    matchedPackageId: 'scratch_145',
    booleanQueries: [
      {
        label: 'Live LinkedIn: Transferable Skills',
        query: '"transferable skills" OR "haven\'t updated my resume" "looking for"',
        linkedInUrl: 'https://www.linkedin.com/search/results/content/?keywords=%22transferable%20skills%22%20OR%20%22haven%27t%20updated%20my%20resume%22%20%22looking%20for%22&sortBy=%22date_posted%22'
      },
      {
        label: 'Live LinkedIn: 10+ Year Career Pivot',
        query: '"10 years" OR "15 years" "changing careers" OR "career pivot" "resume"',
        linkedInUrl: 'https://www.linkedin.com/search/results/content/?keywords=%2210%20years%22%20OR%20%2215%20years%22%20%22changing%20careers%22%20OR%20%22career%20pivot%22%20%22resume%22&sortBy=%22date_posted%22'
      }
    ]
  },
  {
    id: 'layoff_urgent',
    title: 'Recent Layoffs & High-Urgency Re-entry',
    tagline: '24–48 hour rapid turnaround to submit before application windows close',
    description: 'Operations, healthcare, and support professionals impacted by recent clinic or corporate downsizing who need immediate keyword alignment and professional presentation to secure interviews fast.',
    targetRoles: [
      'Operations Specialist',
      'Insurance Appeals Specialist',
      'Billing / Claims Coordinator',
      'Administrative & Support Lead'
    ],
    keyPainPoints: [
      'Sudden layoff or department consolidation created immediate pressure',
      'Previous résumé rejected by ATS on roles they are 100% qualified to perform',
      'Needs rapid 24–48 hour delivery to hit active interview deadlines'
    ],
    matchedPackageId: 'revamp_99',
    booleanQueries: [
      {
        label: 'Live LinkedIn: Recent Layoffs',
        query: '"laid off" AND ("resume review" OR "update my resume" OR "need a resume")',
        linkedInUrl: 'https://www.linkedin.com/search/results/content/?keywords=%22laid%20off%22%20AND%20(%22resume%20review%22%20OR%20%22update%20my%20resume%22%20OR%20%22need%20a%20resume%22)&sortBy=%22date_posted%22'
      },
      {
        label: 'Live LinkedIn: Interview Friction',
        query: '"not getting interviews" OR "no callbacks" "resume"',
        linkedInUrl: 'https://www.linkedin.com/search/results/content/?keywords=%22not%20getting%20interviews%22%20OR%20%22no%20callbacks%22%20%22resume%22&sortBy=%22date_posted%22'
      }
    ]
  },
  {
    id: 'student_grad',
    title: 'Students & Early Healthcare Grads',
    tagline: 'Bridging coursework and capstones into corporate healthcare readiness ($50)',
    description: 'Recent graduates with Health Services Management, Health Informatics, or medical coding certifications intimidated by 2–3 years experience requirements.',
    targetRoles: [
      'Entry-Level Healthcare Administrator',
      'Patient Service Coordinator',
      'Health Informatics Specialist',
      'Medical Records Technician'
    ],
    keyPainPoints: [
      'Feels their résumé looks thin because they only have coursework and capstone projects',
      'Undersells student clinic reception or part-time customer service experience',
      'Unsure how to position academic projects as workplace capability'
    ],
    matchedPackageId: 'student_50',
    booleanQueries: [
      {
        label: 'Live LinkedIn: Early Healthcare Careerists',
        query: '"new grad" OR "entry level" "healthcare" "resume"',
        linkedInUrl: 'https://www.linkedin.com/search/results/content/?keywords=%22new%20grad%22%20OR%20%22entry%20level%22%20%22healthcare%22%20%22resume%22&sortBy=%22date_posted%22'
      }
    ]
  }
];

// Pure live signals — no mock or fabricated personas.
export const INITIAL_LEAD_SIGNALS: LeadSignal[] = [];

export interface QualificationAnalysisResult {
  score: number;
  tier: 'High-Intent Paying Prospect' | 'Warm Diagnostic Lead (DIY Bridge)' | 'Engagement Noise / Non-Buyer';
  matchedPositiveRules: KeywordRule[];
  matchedNegativeRules: KeywordRule[];
  detectedBottleneck: string;
  dutyVsContributionInsight: string;
  recommendedPackage: ServicePackage;
  diagnosticQuestion: string;
  suggestedPublicReply: string;
  suggestedWarmDm: string;
}

export function analyzeSignalText(
  text: string,
  headline: string,
  rules: KeywordRule[]
): QualificationAnalysisResult {
  const normalized = `${headline} ${text}`.toLowerCase();
  const activeRules = rules.filter((r) => r.enabled);

  const matchedPositiveRules: KeywordRule[] = [];
  const matchedNegativeRules: KeywordRule[] = [];

  let rawScore = 25; // baseline for someone interacting

  for (const rule of activeRules) {
    if (normalized.includes(rule.phrase.toLowerCase())) {
      if (rule.weight >= 0) {
        matchedPositiveRules.push(rule);
        rawScore += rule.weight;
      } else {
        matchedNegativeRules.push(rule);
        rawScore += rule.weight;
      }
    }
  }

  // Additional heuristic signals custom to Nicole's mental model and active resume seekers
  const mentionsYears = /\b(\d+)\+?\s*(years|yrs|yoe)\b/i.exec(normalized);
  const yearsCount = mentionsYears ? parseInt(mentionsYears[1], 10) : 0;
  const isResumeReviewRequest =
    /resume|cv|callbacks|applications|apps|yoe|critique|roast|formatting|bullet points|ats/i.test(
      normalized
    );
  const isApplicationFriction =
    /0 callbacks|no callbacks|no interviews|0 interviews|rejections|ghosted|struggling|feedback/i.test(
      normalized
    );
  const isStudent = /student|graduat|entry-level|intern|coursework|capstone|0 yoe|1 yoe/i.test(normalized);
  const isScratchNeed =
    /from scratch|no resume|haven't updated|havent updated|10 years|11 years|12 years|15 years|16 years|14 yoe|15 yoe|16 yoe/i.test(
      normalized
    );
  const isHealthcare =
    /healthcare|revenue cycle|denials|appeals|billing|claims|clinic|patient|ar |accounts receivable|compliance|recovery housing|coder|cpc|cca|medical/i.test(
      normalized
    );

  if (isResumeReviewRequest) {
    rawScore += 24;
  }
  if (isApplicationFriction) {
    rawScore += 18;
  }
  if (isHealthcare) {
    rawScore += 15;
  }
  if (yearsCount >= 5) {
    rawScore += 8;
  }

  const finalScore = Math.max(5, Math.min(98, rawScore));

  let tier: QualificationAnalysisResult['tier'] = 'Warm Diagnostic Lead (DIY Bridge)';
  if (finalScore >= 68) {
    tier = 'High-Intent Paying Prospect';
  } else if (finalScore < 35 || (matchedNegativeRules.length > 0 && matchedPositiveRules.length === 0)) {
    tier = 'Engagement Noise / Non-Buyer';
  }

  // Select best Purpose & Glow package
  let recommendedPackage = PURPOSE_GLOW_PACKAGES[2]; // default $99 Revamp
  if (tier === 'Engagement Noise / Non-Buyer' || finalScore < 52) {
    recommendedPackage = PURPOSE_GLOW_PACKAGES[0]; // Free DIY
  } else if (isStudent) {
    recommendedPackage = PURPOSE_GLOW_PACKAGES[1]; // $50 Student
  } else if (isScratchNeed || yearsCount >= 10) {
    recommendedPackage = PURPOSE_GLOW_PACKAGES[3]; // $145 From Scratch
  } else {
    recommendedPackage = PURPOSE_GLOW_PACKAGES[2]; // $99 Revamp
  }

  const detectedBottleneck =
    tier === 'Engagement Noise / Non-Buyer'
      ? 'Passive social applause or peer networking—no active résumé or job-transition problem stated.'
      : isHealthcare
      ? 'Healthcare / Revenue Cycle specialist with strong operational history whose résumé isn’t translating process & reimbursement outcomes.'
      : isScratchNeed
      ? 'Long-tenured or pivoting professional who needs a clean, selective build from scratch without burying key strengths.'
      : isStudent
      ? 'Early-career candidate underestimating how coursework and part-time roles transfer into workplace reliability.'
      : 'Capable professional experiencing a communication bottleneck: listing generic job duties rather than concrete contributions.';

  const dutyVsContributionInsight =
    tier === 'Engagement Noise / Non-Buyer'
      ? 'Do not pitch. Acknowledge warmly in one line to maintain community consistency and save your energy.'
      : 'Help them shift from "what the job description required" to "what improved, sped up, or had fewer errors because they were in the role."';

  const diagnosticQuestion = isHealthcare
    ? 'Did you improve a billing/claims workflow, reduce denial errors, speed up reimbursement, or train teammates on payer changes?'
    : 'In your most recent role, what is one process you improved, error you reduced, or workflow you made easier for your team or customers?';

  const suggestedPublicReply =
    tier === 'Engagement Noise / Non-Buyer'
      ? 'Thank you so much for reading and sharing your thoughts! Consistency and supporting each other makes such a difference here.'
      : `Thank you for sharing this so openly! A résumé problem is rarely an experience problem—most often it’s just a communication bottleneck where daily duties hide what you actually contributed. When you make those transferable skills and process wins explicit so an employer doesn’t have to guess, it changes the whole conversation. I’ll send you a quick note with a practical way to frame that!`;

  const suggestedWarmDm =
    tier === 'Engagement Noise / Non-Buyer'
      ? 'No DM needed—keep your daily outreach focused on job seekers actively navigating a transition.'
      : `Hi there! I really appreciated what you shared earlier. I started Purpose & Glow Career Solutions (purposeglowcareer.com) because I kept seeing talented people struggle to explain what they actually bring to the table—especially when trying to connect transferable experience to a new role.\n\nOne question that usually unlocks the strongest résumé points is: "${diagnosticQuestion}"\n\nIf you’d like a second set of eyes, I offer Free DIY Résumé Recommendations on my site, or we can do my ${recommendedPackage.name} (${recommendedPackage.priceDisplay}, ${recommendedPackage.turnaround} turnaround in editable Word + PDF with LinkedIn alignment) so your real contributions stand right out. No pressure at all—how is the search feeling this week?`;

  return {
    score: finalScore,
    tier,
    matchedPositiveRules,
    matchedNegativeRules,
    detectedBottleneck,
    dutyVsContributionInsight,
    recommendedPackage,
    diagnosticQuestion,
    suggestedPublicReply,
    suggestedWarmDm
  };
}
