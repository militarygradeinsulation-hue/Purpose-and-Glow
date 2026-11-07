import React, { useState } from 'react';
import { PURPOSE_GLOW_PACKAGES, LeadSignal } from '../data/purposeGlowData';
import { Check, ExternalLink, Calendar, FileText, ArrowUpRight } from 'lucide-react';

interface CadenceBoundaryPlannerProps {
  leads: LeadSignal[];
  onSelectLeadForAction: (leadId: string) => void;
}

export const CadenceBoundaryPlanner: React.FC<CadenceBoundaryPlannerProps> = ({
  leads,
  onSelectLeadForAction
}) => {
  // Interactive weekly slot planner (protects her full-time healthcare revenue career boundaries)
  const [weeklyRevampCount, setWeeklyRevampCount] = useState(3);
  const [weeklyScratchCount, setWeeklyScratchCount] = useState(1);
  const [weeklyStudentCount, setWeeklyStudentCount] = useState(1);
  const [diyConversionRate, setDiyConversionRate] = useState(40); // % of Free DIY reviews that upgrade to $99/$145
  const [completedChecklist, setCompletedChecklist] = useState<string[]>(['step-1']);

  const toggleStep = (id: string) => {
    setCompletedChecklist((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const weeklyPaidProjects = weeklyRevampCount + weeklyScratchCount + weeklyStudentCount;
  const weeklyRevenue =
    weeklyRevampCount * 99 + weeklyScratchCount * 145 + weeklyStudentCount * 50;
  const monthlyRevenue = weeklyRevenue * 4;
  const estimatedHoursPerWeek =
    weeklyRevampCount * 1.5 + weeklyScratchCount * 2.5 + weeklyStudentCount * 1.0;

  const topThreeActionableLeads = leads
    .filter((l) => l.status !== 'filtered_noise' && l.status !== 'booked_client')
    .slice(0, 3);

  const DAILY_CADENCE_STEPS = [
    {
      id: 'step-1',
      timeBox: '5 mins',
      title: '01. Filter Yesterday’s Post Comments for Communication Bottlenecks',
      detail:
        'Skip passive "Great post!" applause. Identify 1–2 commenters mentioning application fatigue, ATS rejection, or transferable skills.'
    },
    {
      id: 'step-2',
      timeBox: '5 mins',
      title: '02. Ask One Concrete Diagnostic Question Publicly',
      detail:
        'Reply with a plain-language contrast (Experience vs. Communication Problem) and ask what process they improved, time they saved, or error they reduced.'
    },
    {
      id: 'step-3',
      timeBox: '5 mins',
      title: '03. Send 2 Boundary-Safe DIY Review / $99 Revamp Bridges',
      detail:
        'Offer Free DIY Résumé Recommendations on purposeglowcareer.com as the zero-pressure first step, paired with clear 24–48hr scope for the $99 Revamp.'
    }
  ];

  return (
    <div className="space-y-10">
      {/* Section 1: Dual-Track Boundary & Weekly Revenue Planner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <p className="text-xs font-medium text-teal-800 mb-1">
              Dual-Track Portfolio Protection · 24–48 Hour Turnaround Guardrails
            </p>
            <h2 className="text-xl font-semibold text-slate-900">
              Weekly Client Capacity &amp; Revenue Simulator
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Balances your full-time Healthcare Revenue Cycle career and compliance consulting alongside Purpose &amp; Glow Career Solutions—so you hit steady client revenue without rushing or burning out.
            </p>
          </div>

          {/* Interactive Sliders for Purpose & Glow Packages */}
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="font-medium text-slate-900">
                  Résumé Revamp ($99 · Core Offer)
                </span>
                <span className="font-mono font-semibold text-teal-800 tabular-nums">
                  {weeklyRevampCount} clients / wk · ${weeklyRevampCount * 99}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={8}
                value={weeklyRevampCount}
                onChange={(e) => setWeeklyRevampCount(Number(e.target.value))}
                className="w-full accent-teal-800 cursor-pointer"
              />
              <p className="text-xs text-slate-500 mt-1">
                Existing résumé revision + ATS optimization + Word &amp; PDF + LinkedIn alignment (~1.5 hrs each)
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="font-medium text-slate-900">
                  Résumé Created From Scratch ($145 · Pivot / 10+ Yr Veterans)
                </span>
                <span className="font-mono font-semibold text-teal-800 tabular-nums">
                  {weeklyScratchCount} clients / wk · ${weeklyScratchCount * 145}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={5}
                value={weeklyScratchCount}
                onChange={(e) => setWeeklyScratchCount(Number(e.target.value))}
                className="w-full accent-teal-800 cursor-pointer"
              />
              <p className="text-xs text-slate-500 mt-1">
                Full build from raw work history, transferable skill mapping &amp; accomplishments (~2.5 hrs each)
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="font-medium text-slate-900">
                  Student Résumé Services ($50 · Coursework to Career)
                </span>
                <span className="font-mono font-semibold text-teal-800 tabular-nums">
                  {weeklyStudentCount} clients / wk · ${weeklyStudentCount * 50}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={6}
                value={weeklyStudentCount}
                onChange={(e) => setWeeklyStudentCount(Number(e.target.value))}
                className="w-full accent-teal-800 cursor-pointer"
              />
              <p className="text-xs text-slate-500 mt-1">
                Early work history, clinicals/internships &amp; academic projects (~1.0 hr each)
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="font-medium text-slate-900">
                  Free DIY Review → Paid Revamp Conversion Rate
                </span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {diyConversionRate}% upgrade rate
                </span>
              </div>
              <input
                type="range"
                min={20}
                max={75}
                step={5}
                value={diyConversionRate}
                onChange={(e) => setDiyConversionRate(Number(e.target.value))}
                className="w-full accent-teal-800 cursor-pointer"
              />
              <p className="text-xs text-slate-500 mt-1">
                To book {weeklyPaidProjects} paid clients/week at a {diyConversionRate}% conversion rate, you only need{' '}
                <strong className="font-mono text-slate-900 tabular-nums">
                  {Math.ceil(weeklyPaidProjects / (diyConversionRate / 100))}
                </strong>{' '}
                qualified diagnostic conversations per week (just 1–2 per day).
              </p>
            </div>
          </div>

          {/* Summary Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 border-t border-slate-200">
            <div>
              <span className="block text-xs text-slate-500">Weekly Paid Clients</span>
              <span className="text-xl font-semibold font-mono tabular-nums text-slate-900">
                {weeklyPaidProjects} slots
              </span>
            </div>
            <div>
              <span className="block text-xs text-slate-500">Weekly Revenue</span>
              <span className="text-xl font-semibold font-mono tabular-nums text-teal-800">
                ${weeklyRevenue.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="block text-xs text-slate-500">4-Week Pacing</span>
              <span className="text-xl font-semibold font-mono tabular-nums text-teal-800">
                ${monthlyRevenue.toLocaleString()}/mo
              </span>
            </div>
            <div>
              <span className="block text-xs text-slate-500">Est. Delivery Time</span>
              <span
                className={`text-xl font-semibold font-mono tabular-nums ${
                  estimatedHoursPerWeek > 12 ? 'text-amber-700' : 'text-slate-900'
                }`}
              >
                {estimatedHoursPerWeek.toFixed(1)} hrs/wk
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: "One Task at a Time" 15-Minute Daily Cadence */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <p className="text-xs font-medium text-teal-800 mb-1">
              Consistent Execution Over Perfect Readiness
            </p>
            <h3 className="text-lg font-semibold text-slate-900">
              15-Minute Daily Conversion Cadence
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              “I’ve learned not to rush the process — everything I need to accomplish will still be there tomorrow.” Focus on one task at a time:
            </p>
          </div>

          <div className="space-y-3">
            {DAILY_CADENCE_STEPS.map((step) => {
              const checked = completedChecklist.includes(step.id);
              return (
                <div
                  key={step.id}
                  onClick={() => toggleStep(step.id)}
                  className={`p-3.5 rounded-lg border transition-colors cursor-pointer ${
                    checked
                      ? 'bg-teal-50/40 border-teal-200'
                      : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                        checked
                          ? 'bg-teal-800 border-teal-800 text-white'
                          : 'bg-white border-slate-300'
                      }`}
                    >
                      {checked && <Check className="w-3 h-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-xs font-semibold ${
                            checked ? 'line-through text-slate-500' : 'text-slate-900'
                          }`}
                        >
                          {step.title}
                        </span>
                        <span className="text-xs font-mono text-slate-500 tabular-nums shrink-0">
                          {step.timeBox}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {step.detail}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Today's Top 3 High-Probability Leads */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900">
                Today’s 3 Priority Conversations (No Exhaustive Lists)
              </span>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                Max 3 / day
              </span>
            </div>

            <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
              {topThreeActionableLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="p-3 flex items-center justify-between gap-3 bg-white hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {lead.personName}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {lead.headline}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectLeadForAction(lead.id)}
                    className="px-2.5 py-1 text-xs font-medium text-teal-800 hover:text-teal-950 bg-teal-50/80 hover:bg-teal-100 rounded transition-colors shrink-0 cursor-pointer whitespace-nowrap"
                  >
                    Open Script
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Purpose & Glow Service Architecture & Pricing Reference */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <p className="text-xs font-medium text-teal-800 mb-1">
              purposeglowcareer.com · Service Positioning Matrix
            </p>
            <h3 className="text-lg font-semibold text-slate-900">
              How Every Qualified Signal Maps to Your Exact Website Offers
            </h3>
          </div>
          <a
            href="https://purposeglowcareer.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-800 hover:text-teal-950 underline underline-offset-4 shrink-0"
          >
            Visit purposeglowcareer.com
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PURPOSE_GLOW_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className="border border-slate-200 rounded-lg p-5 flex flex-col justify-between space-y-4 bg-slate-50/40"
            >
              <div className="space-y-2.5">
                <div className="flex items-baseline justify-between gap-2 border-b border-slate-200 pb-2.5">
                  <h4 className="text-sm font-semibold text-slate-900">{pkg.name}</h4>
                  <span className="text-lg font-semibold font-mono tabular-nums text-teal-800">
                    {pkg.priceDisplay}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono tabular-nums">
                  Turnaround: {pkg.turnaround} · Word + PDF
                </p>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  {pkg.targetAudience}
                </p>
                <ul className="space-y-1.5 pt-1">
                  {pkg.deliverables.map((item, i) => (
                    <li key={i} className="text-xs text-slate-600 leading-relaxed">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-slate-200/80">
                <span className="block text-[11px] font-semibold text-slate-900 mb-0.5">
                  Qualification Trigger:
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {pkg.whenToRecommend}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Mindprint Operating System Calibration Summary + Direct PDF Link */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <p className="text-xs font-medium text-teal-800 mb-1">
              Calibrated to Nicole Gotsch’s Mindprint Intelligence Profile
            </p>
            <h3 className="text-lg font-semibold text-slate-900">
              Why This System Operates the Way You Think
            </h3>
          </div>
          <a
            href="/assets/aistudio/Nicole_MINDPRINT_Intelligence_Report_3a181470.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg transition-colors shrink-0"
          >
            <FileText className="w-4 h-4 text-teal-800" />
            Open Full Mindprint Dossier PDF
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
          <div>
            <h4 className="text-xs font-semibold text-slate-900 mb-1">
              01. Pattern-Seeking (100) &amp; Practical Fit (87)
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              You reject rigid all-or-nothing qualification filters and exhaustive résumé dumps that hide what matters. This tool surfaces only the 2–3 decisive buying signals in a prospect’s post and translates their transferable skills.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-900 mb-1">
              02. Demonstrated Expertise (100) &amp; Healthcare RCM Bridge
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your 12+ years in Healthcare Revenue Cycle (Sevita Health, Voyage Healthcare MN) and recovery housing compliance is your highest-converting trust anchor. The keyword engine prioritizes healthcare admin, AR, and denials leads who already speak your language.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-900 mb-1">
              03. Service-First Trust Over High-Pressure Sales (94%)
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Because you value trust and building others up rather than pushy cold pitches, every outreach script starts with a concrete diagnostic question and uses your Free DIY Résumé Recommendations on purposeglowcareer.com as a natural bridge to the $99 Revamp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
