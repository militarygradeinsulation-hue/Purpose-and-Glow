import React, { useState } from 'react';
import { KeywordRule, IntentClusterId } from '../data/purposeGlowData';
import { Plus, Trash2, Copy, Check, Search } from 'lucide-react';
import { safeCopyToClipboard } from '../utils/clipboard';

interface KeywordRulesManagerProps {
  rules: KeywordRule[];
  onToggleRule: (id: string) => void;
  onAddRule: (rule: KeywordRule) => void;
  onDeleteRule: (id: string) => void;
}

const CLUSTER_META: {
  id: IntentClusterId;
  title: string;
  subtitle: string;
  defaultWeight: number;
}[] = [
  {
    id: 'active_resume_friction',
    title: '01. Active Résumé & ATS Friction',
    subtitle: 'Identifies people actively applying and getting rejected or asking for a résumé rewrite.',
    defaultWeight: 28
  },
  {
    id: 'transferable_pivot',
    title: '02. Transferable Skill Mapping & Career Transitions',
    subtitle: 'Matches job seekers struggling to explain how past experience transfers into a new role.',
    defaultWeight: 26
  },
  {
    id: 'healthcare_rcm_authority',
    title: '03. Healthcare Revenue Cycle, Denials & Ops Niche',
    subtitle: 'Your 12+ year unfair advantage—leads in RCM, AR, denials, and compliance who immediately trust your expertise.',
    defaultWeight: 28
  },
  {
    id: 'interview_urgency',
    title: '04. Urgency, Layoffs & Interview Readiness',
    subtitle: 'High-urgency candidates needing a 24–48hr turnaround or your 22-Page Interview Success Playbook.',
    defaultWeight: 25
  },
  {
    id: 'negative_noise',
    title: '05. Passive Engagement & Peer Applause Filter (Exclusions)',
    subtitle: 'Automatically down-scores generic "Great post!" comments and fellow resume writers so you only focus on real buyers.',
    defaultWeight: -25
  }
];

const SAVED_BOOLEAN_QUERIES = [
  {
    label: 'Active Résumé Buyers (All Industries)',
    targetOffer: '$99 Résumé Revamp / $145 From Scratch',
    query:
      '("not getting interviews" OR "update my resume" OR "resume review" OR "ATS") AND ("applying" OR "job search" OR "open to work") -recruiter -coach'
  },
  {
    label: 'Healthcare Revenue Cycle & Denials Niche',
    targetOffer: '$99 Résumé Revamp (High-Trust Fast Close)',
    query:
      '("revenue cycle" OR "accounts receivable" OR "medical billing" OR "denials") AND ("resume" OR "applying" OR "laid off" OR "open to work")'
  },
  {
    label: 'Career Changers & Long-Tenure Pivoters',
    targetOffer: '$145 Résumé Created From Scratch',
    query:
      '("transferable skills" OR "haven\'t updated my resume" OR "pivoting") AND ("years" OR "career change" OR "new role")'
  },
  {
    label: 'Graduating Students & Early Career',
    targetOffer: '$50 Student Résumé Services',
    query:
      '("graduating" OR "recent graduate" OR "entry level") AND ("resume" OR "first job" OR "healthcare administration")'
  }
];

export const KeywordRulesManager: React.FC<KeywordRulesManagerProps> = ({
  rules,
  onToggleRule,
  onAddRule,
  onDeleteRule
}) => {
  const [newPhrase, setNewPhrase] = useState('');
  const [selectedCluster, setSelectedCluster] = useState<IntentClusterId>('active_resume_friction');
  const [customWeight, setCustomWeight] = useState<number>(28);
  const [customRationale, setCustomRationale] = useState('');
  const [copiedQueryIdx, setCopiedQueryIdx] = useState<number | null>(null);
  const [activeClusterFilter, setActiveClusterFilter] = useState<IntentClusterId | 'all'>('all');

  const handleClusterChange = (clusterId: IntentClusterId) => {
    setSelectedCluster(clusterId);
    const meta = CLUSTER_META.find((c) => c.id === clusterId);
    if (meta) {
      setCustomWeight(meta.defaultWeight);
    }
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhrase.trim()) return;
    const meta = CLUSTER_META.find((c) => c.id === selectedCluster)!;
    const newRule: KeywordRule = {
      id: `kw-custom-${Date.now()}`,
      phrase: newPhrase.trim().toLowerCase(),
      cluster: selectedCluster,
      clusterLabel: meta.title.replace(/^\d+\.\s*/, ''),
      weight: Number(customWeight),
      rationale:
        customRationale.trim() ||
        (customWeight >= 0
          ? 'Custom buying-intent keyword added for Purpose & Glow lead qualification.'
          : 'Custom exclusion keyword to filter out non-buying engagement.'),
      enabled: true
    };
    onAddRule(newRule);
    setNewPhrase('');
    setCustomRationale('');
  };

  const handleCopyQuery = async (query: string, idx: number) => {
    await safeCopyToClipboard(query);
    setCopiedQueryIdx(idx);
    setTimeout(() => setCopiedQueryIdx(null), 1800);
  };

  const visibleClusters =
    activeClusterFilter === 'all'
      ? CLUSTER_META
      : CLUSTER_META.filter((c) => c.id === activeClusterFilter);

  return (
    <div className="space-y-10">
      {/* Top Section: Ready-to-Use LinkedIn Boolean Search Strings */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <p className="text-xs font-medium text-teal-800 mb-1">
              Outbound Discovery · Copy &amp; Paste into LinkedIn Posts Search
            </p>
            <h2 className="text-xl font-semibold text-slate-900">
              High-Intent LinkedIn Search Queries for Purpose &amp; Glow
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Instead of scrolling your home feed, paste any of these 4 targeted search strings into LinkedIn Search (filter by <strong>Posts</strong> · <strong>Past Week</strong>) to surface people actively asking for résumé help right now.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SAVED_BOOLEAN_QUERIES.map((item, idx) => (
            <div
              key={item.label}
              className="p-4 bg-slate-50 border border-slate-200/90 rounded-lg flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1">
                  <span className="font-semibold text-slate-900">{item.label}</span>
                  <span>Target: {item.targetOffer}</span>
                </div>
                <p className="text-xs font-mono text-slate-800 bg-white p-2.5 rounded border border-slate-200 select-all leading-relaxed">
                  {item.query}
                </p>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-500">
                  Excludes fellow coaches &amp; recruiters
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyQuery(item.query, idx)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 rounded-md transition-colors cursor-pointer"
                >
                  {copiedQueryIdx === idx ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-teal-700" />
                      Copied Search String
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy LinkedIn Search
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add New Keyword Rule Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-1">
          Add Custom Keyword or Exclusion Phrase
        </h3>
        <p className="text-xs text-slate-600 mb-4">
          Every enabled phrase automatically scores incoming LinkedIn comments and posts across your Signal Feed and Live Qualifier.
        </p>

        <form onSubmit={handleCreateRule} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Keyword or Phrase
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={newPhrase}
                onChange={(e) => setNewPhrase(e.target.value)}
                placeholder="e.g. career gap, claims denials"
                className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-teal-700"
              />
            </div>
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Signal Category
            </label>
            <select
              value={selectedCluster}
              onChange={(e) => handleClusterChange(e.target.value as IntentClusterId)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-teal-700"
            >
              {CLUSTER_META.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Score Weight
            </label>
            <input
              type="number"
              min={-50}
              max={50}
              value={customWeight}
              onChange={(e) => setCustomWeight(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-teal-700"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Why It Matters (Optional)
            </label>
            <input
              type="text"
              value={customRationale}
              onChange={(e) => setCustomRationale(e.target.value)}
              placeholder="Qualification note..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-teal-700"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full py-2 px-4 bg-teal-800 hover:bg-teal-900 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 h-[38px] cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add Rule
            </button>
          </div>
        </form>
      </div>

      {/* Interactive Cluster Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveClusterFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeClusterFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Rules ({rules.length})
          </button>
          {CLUSTER_META.map((c) => {
            const count = rules.filter((r) => r.cluster === c.id).length;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveClusterFilter(c.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeClusterFilter === c.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {c.title.replace(/^\d+\.\s*/, '').split(' ')[0]} ({count})
              </button>
            );
          })}
        </div>

        <div className="text-xs text-slate-500 font-mono tabular-nums">
          {rules.filter((r) => r.enabled).length} of {rules.length} rules active
        </div>
      </div>

      {/* Rules Grouped by Cluster */}
      <div className="space-y-6">
        {visibleClusters.map((cluster) => {
          const clusterRules = rules.filter((r) => r.cluster === cluster.id);
          return (
            <div key={cluster.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{cluster.title}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">{cluster.subtitle}</p>
                </div>
                <span className="text-xs text-slate-500 font-mono tabular-nums shrink-0">
                  {clusterRules.filter((r) => r.enabled).length} active phrases
                </span>
              </div>

              <div className="divide-y divide-slate-200">
                {clusterRules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors ${
                      !rule.enabled ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-mono font-semibold text-slate-900">
                          “{rule.phrase}”
                        </span>
                        <span aria-hidden="true" className="text-slate-300">
                          ·
                        </span>
                        <span
                          className={`font-mono text-xs font-semibold tabular-nums ${
                            rule.weight >= 0 ? 'text-teal-800' : 'text-amber-800'
                          }`}
                        >
                          {rule.weight >= 0 ? `+${rule.weight} pts` : `${rule.weight} pts (Exclusion)`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{rule.rationale}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => onToggleRule(rule.id)}
                        className={`px-3 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                          rule.enabled
                            ? 'bg-teal-50/70 border-teal-200 text-teal-900 hover:bg-teal-100/70'
                            : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {rule.enabled ? 'Monitoring Active' : 'Paused'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteRule(rule.id)}
                        title="Remove keyword rule"
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
