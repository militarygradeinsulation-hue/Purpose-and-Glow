import React, { useState, useMemo } from 'react';
import {
  KeywordRule,
  LeadSignal,
  PURPOSE_GLOW_PACKAGES,
  analyzeSignalText
} from '../data/purposeGlowData';
import { Copy, Check, Plus, Sparkles, ArrowRight, RotateCcw } from 'lucide-react';
import { safeCopyToClipboard } from '../utils/clipboard';

interface LiveQualifierPanelProps {
  keywordRules: KeywordRule[];
  onAddLeadToPipeline: (lead: LeadSignal) => void;
}

const SAMPLE_LINKEDIN_SNIPPETS = [
  {
    label: 'ICP 1: Healthcare RCM & Denials',
    name: '@clinic-rcm-lead',
    headline: 'Medical Billing & Denials Specialist · 8 Years in Clinic Revenue Cycle',
    location: 'Minneapolis–St. Paul, MN',
    sourceType: 'Comment on Your Post' as const,
    text: 'Nicole, your post on transferable skills really spoke to me. I’ve been working in healthcare revenue cycle and insurance denials for 8 years, and I’m applying for Revenue Integrity Analyst and Billing Supervisor roles. I’ve applied to 25 roles and I’m not getting interviews. I feel like my resume just reads like a boring job description and I need a resume review to explain what I actually do.'
  },
  {
    label: 'ICP 2: 12-Year Ops Career Pivot',
    name: '@operations-pivoter',
    headline: 'Operations & Compliance Supervisor · Human Services',
    location: 'Remote / US',
    sourceType: 'Public LinkedIn Post' as const,
    text: 'After 12 years at the same agency, I am officially back on the market and pivoting into corporate operational readiness or project management. I haven’t updated my resume in over a decade and I’m struggling to connect my compliance and team training background so ATS doesn’t immediately filter me out. Looking for a resume writer who understands real operations.'
  },
  {
    label: 'ICP 3: Urgent Clinic Layoff',
    name: '@urgent-claims-specialist',
    headline: 'Insurance Appeals & Prior Authorization Specialist',
    location: 'Remote / US',
    sourceType: 'Public LinkedIn Post' as const,
    text: 'Was laid off last week due to clinic billing department consolidation. Have an interview in 4 days for an Appeals Specialist role and need an urgent 24-48 hr resume review and revamp to make sure my prior authorization and denial wins stand out.'
  },
  {
    label: 'Negative Noise: Passive Commenter',
    name: '@growth-influencer',
    headline: 'Personal Branding & LinkedIn Growth Strategist',
    location: 'Miami, FL',
    sourceType: 'Comment on Your Post' as const,
    text: 'Great post Nicole! Consistency is everything when building your personal brand on LinkedIn. Thanks for sharing such valuable career tips with your network! DM me for my latest hook guide.'
  }
];

export const LiveQualifierPanel: React.FC<LiveQualifierPanelProps> = ({
  keywordRules,
  onAddLeadToPipeline
}) => {
  const [personName, setPersonName] = useState('@clinic-rcm-lead');
  const [headline, setHeadline] = useState(
    'Medical Billing & Denials Specialist · 8 Years in Clinic Revenue Cycle'
  );
  const [location, setLocation] = useState('Remote / US');
  const [sourceType, setSourceType] = useState<LeadSignal['sourceType']>('Comment on Your Post');
  const [rawText, setRawText] = useState(SAMPLE_LINKEDIN_SNIPPETS[0].text);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  const analysis = useMemo(
    () => analyzeSignalText(rawText, headline, keywordRules),
    [rawText, headline, keywordRules]
  );

  const handleCopy = async (text: string, fieldId: string) => {
    await safeCopyToClipboard(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const handleLoadSample = (sample: (typeof SAMPLE_LINKEDIN_SNIPPETS)[0]) => {
    setPersonName(sample.name);
    setHeadline(sample.headline);
    setLocation(sample.location);
    setSourceType(sample.sourceType);
    setRawText(sample.text);
    setSavedNotice(false);
  };

  const handleSaveToPipeline = () => {
    if (!rawText.trim()) return;
    const newLead: LeadSignal = {
      id: `lead-custom-${Date.now()}`,
      personName: personName.trim() || 'LinkedIn Prospect',
      headline: headline.trim() || 'Professional Job Seeker',
      location: location.trim() || 'Remote / US',
      sourceType,
      sourceContext: 'Qualified via Live Keyword & Bottleneck Analyzer',
      timestamp: 'Just now',
      rawText: rawText.trim(),
      yearsExperience: 6,
      isHealthcareOrOps:
        /healthcare|revenue|denials|billing|clinic|compliance|operations/i.test(
          `${headline} ${rawText}`
        ),
      hasExistingResume: !/haven't updated|from scratch|no resume/i.test(rawText),
      status:
        analysis.tier === 'Engagement Noise / Non-Buyer' ? 'filtered_noise' : 'new_signal',
      recommendedPackageId: analysis.recommendedPackage.id,
      diagnosticBottleNeck: analysis.detectedBottleneck,
      dutyVsContributionGap: analysis.dutyVsContributionInsight,
      diagnosticQuestionToAsk: analysis.diagnosticQuestion,
      publicCommentDraft: analysis.suggestedPublicReply,
      warmDmDraft: analysis.suggestedWarmDm
    };
    onAddLeadToPipeline(newLead);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Header & Quick-Test Scenarios */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <p className="text-xs font-medium text-teal-800 mb-1">
            Real-Time Signal Qualification · Experience vs. Communication Bottleneck
          </p>
          <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Paste Any LinkedIn Comment, Post, or DM to Qualify Buying Intent
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Distinguishes people who just enjoy your career content from job seekers actively hitting a résumé communication bottleneck—and maps them to your exact Purpose &amp; Glow service tier.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500 mr-1">Load test signal:</span>
          {SAMPLE_LINKEDIN_SNIPPETS.map((sample) => (
            <button
              key={sample.label}
              type="button"
              onClick={() => handleLoadSample(sample)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Two-Column Analyzer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">
              01. Incoming LinkedIn Text &amp; Context
            </h3>
            <button
              type="button"
              onClick={() => {
                setPersonName('');
                setHeadline('');
                setRawText('');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear fields
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Person Name or Handle
              </label>
              <input
                type="text"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="e.g. @username or Contact Name"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-teal-700 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Signal Source
              </label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value as LeadSignal['sourceType'])}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-teal-700 transition-colors"
              >
                <option value="Comment on Your Post">Comment on Your Post</option>
                <option value="Public LinkedIn Post">Public LinkedIn Post</option>
                <option value="Inbound Profile Visit / DM">Inbound Profile Visit / DM</option>
                <option value="Healthcare Network Post">Healthcare Network Post</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              LinkedIn Headline / Current Role
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Revenue Cycle Specialist · 10 Years in Healthcare"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-teal-700 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Pasted Comment, Post, or Message Text
            </label>
            <textarea
              rows={6}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste the comment or post here to scan for buying keywords, transferable skill friction, and package fit..."
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-teal-700 transition-colors leading-relaxed"
            />
          </div>

          {/* Keyword Trigger Breakdown */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Matched Positive Intent Keywords ({analysis.matchedPositiveRules.length})</span>
              <span className="font-mono tabular-nums">
                Noise Triggers ({analysis.matchedNegativeRules.length})
              </span>
            </div>

            {analysis.matchedPositiveRules.length > 0 ? (
              <div className="text-xs text-slate-700 leading-relaxed">
                <span className="font-semibold text-teal-800">Buying Signals: </span>
                {analysis.matchedPositiveRules.map((r, i) => (
                  <React.Fragment key={r.id}>
                    {i > 0 && <span className="mx-1.5 text-slate-300">·</span>}
                    <span className="font-medium text-slate-900">
                      “{r.phrase}”
                    </span>{' '}
                    <span className="font-mono text-teal-700 tabular-nums">(+{r.weight})</span>
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                No explicit buying keywords detected in current text.
              </p>
            )}

            {analysis.matchedNegativeRules.length > 0 && (
              <div className="text-xs text-amber-900 leading-relaxed">
                <span className="font-semibold">Passive / Non-Buyer Signals: </span>
                {analysis.matchedNegativeRules.map((r, i) => (
                  <React.Fragment key={r.id}>
                    {i > 0 && <span className="mx-1.5 text-slate-300">·</span>}
                    <span>“{r.phrase}”</span>{' '}
                    <span className="font-mono tabular-nums">({r.weight})</span>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleSaveToPipeline}
              className="w-full py-2.5 px-4 bg-teal-800 hover:bg-teal-900 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {savedNotice ? 'Added to Active Lead Pipeline!' : 'Save Qualified Signal to Lead Pipeline'}
            </button>
          </div>
        </div>

        {/* Right Column: Qualification Verdict & Nicole-Voice Conversion Scripts */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          {/* Top Verdict Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <span>Qualification Verdict</span>
                <span aria-hidden="true">·</span>
                <span>Practical Fit Assessment</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900">
                {analysis.tier}
              </h3>
            </div>

            <div className="flex items-baseline gap-4">
              <div className="text-right">
                <span className="block text-xs text-slate-500">Client Conversion Score</span>
                <span
                  className={`text-2xl font-semibold font-mono tabular-nums ${
                    analysis.score >= 68
                      ? 'text-teal-800'
                      : analysis.score >= 35
                      ? 'text-amber-700'
                      : 'text-slate-500'
                  }`}
                >
                  {analysis.score}/100
                </span>
              </div>
              <div className="text-right pl-4 border-l border-slate-200">
                <span className="block text-xs text-slate-500">Best-Fit Offer</span>
                <span className="text-base font-semibold text-slate-900 font-mono tabular-nums">
                  {analysis.recommendedPackage.name} ({analysis.recommendedPackage.priceDisplay})
                </span>
              </div>
            </div>
          </div>

          {/* Bottleneck & Duty-vs-Contribution Diagnostic */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-200">
            <div>
              <h4 className="text-xs font-semibold text-slate-900 mb-1.5">
                01. Why They Are Stalling (Bottleneck Diagnosis)
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed">
                {analysis.detectedBottleneck}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-900 mb-1.5">
                02. Job Duties vs. Actual Contribution Angle
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed">
                {analysis.dutyVsContributionInsight}
              </p>
            </div>
          </div>

          {/* Concrete Diagnostic Question to Unlock the Conversation */}
          <div className="pb-6 border-b border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-teal-800">
                03. Diagnostic Question to Ask (Opens Trust Without Pitching)
              </span>
              <button
                type="button"
                onClick={() => handleCopy(analysis.diagnosticQuestion, 'diag-q')}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                {copiedField === 'diag-q' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-teal-700" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy question
                  </>
                )}
              </button>
            </div>
            <p className="text-sm font-medium text-slate-900 bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
              “{analysis.diagnosticQuestion}”
            </p>
          </div>

          {/* Drafted Public Comment & Warm DM Bridge */}
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-xs font-semibold text-slate-900">
                    Step A: Public Reply Comment
                  </span>
                  <span className="text-xs text-slate-500 ml-2">
                    · Validates difficulty &amp; contrasts experience vs. communication
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(analysis.suggestedPublicReply, 'pub-reply')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md transition-colors cursor-pointer"
                >
                  {copiedField === 'pub-reply' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-teal-700" />
                      Copied Reply
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Public Reply
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-200/80 leading-relaxed whitespace-pre-line">
                {analysis.suggestedPublicReply}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-xs font-semibold text-slate-900">
                    Step B: Zero-Pressure Follow-Up DM
                  </span>
                  <span className="text-xs text-slate-500 ml-2">
                    · Bridges from Free DIY Recommendations to {analysis.recommendedPackage.name} ({analysis.recommendedPackage.priceDisplay})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(analysis.suggestedWarmDm, 'warm-dm')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-teal-800 hover:bg-teal-900 text-white rounded-md transition-colors cursor-pointer"
                >
                  {copiedField === 'warm-dm' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copied DM
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Warm DM
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-200/80 leading-relaxed whitespace-pre-line">
                {analysis.suggestedWarmDm}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
