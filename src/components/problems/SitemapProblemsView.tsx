import React, { useState } from 'react';
import {
  AlertOctagon,
  Flame,
  AlertTriangle,
  Info,
  HelpCircle,
  Copy,
  Check,
  Download,
  Sparkles,
  ArrowRight,
  Filter,
  Layers,
  FileCode,
  Eye,
  X,
} from 'lucide-react';
import { IssueItem, IssueReviewStatus } from '../../types/audit.js';

interface SitemapProblemsViewProps {
  auditId: string;
  issues: IssueItem[];
  onGenerateTicket: (category: string, count: number, examples: string[], pageType: string) => void;
}

export const SitemapProblemsView: React.FC<SitemapProblemsViewProps> = ({
  auditId,
  issues,
  onGenerateTicket,
}) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<IssueItem | null>(null);
  const [reviewOverrides, setReviewOverrides] = useState<Record<string, IssueReviewStatus>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const updateReview = async (issue: IssueItem, reviewStatus: IssueReviewStatus) => {
    setSavingId(issue.id);
    try {
      const response = await fetch(`/api/audits/${auditId}/issues/${issue.id}/review`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reviewStatus }),
      });
      if (!response.ok) throw new Error('Could not save review');
      const updated: IssueItem = await response.json();
      setReviewOverrides((current) => ({ ...current, [issue.id]: updated.reviewStatus || 'unreviewed' }));
      setSelectedIssue((current) => current?.id === issue.id ? { ...current, ...updated } : current);
    } finally {
      setSavingId(null);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Group issues by category
  const categories = [
    { id: 'all', label: 'All Issues', count: issues.length },
    {
      id: 'redirects',
      label: 'Redirects (301/302)',
      count: issues.filter((i) => i.type === 'sitemap_redirect').length,
    },
    {
      id: 'broken',
      label: 'Broken (4xx/5xx)',
      count: issues.filter((i) => i.type === 'sitemap_broken').length,
    },
    {
      id: 'noindex',
      label: 'Noindex in XML',
      count: issues.filter((i) => i.type === 'sitemap_noindex').length,
    },
    {
      id: 'robots',
      label: 'Robots.txt Blocked',
      count: issues.filter((i) => i.type === 'sitemap_robots_blocked').length,
    },
    {
      id: 'canonical',
      label: 'Canonical Mismatch',
      count: issues.filter((i) => i.type === 'canonical_mismatch').length,
    },
    {
      id: 'duplicates',
      label: 'Duplicate URLs',
      count: issues.filter((i) => i.type === 'duplicate_across_sitemaps').length,
    },
    {
      id: 'unreferenced',
      label: 'Unreferenced Sitemaps',
      count: issues.filter((i) => i.type === 'unreferenced_sitemap_candidate').length,
    },
  ];

  const filteredIssues = issues.filter((issue) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'redirects') return issue.type === 'sitemap_redirect';
    if (activeTab === 'broken') return issue.type === 'sitemap_broken';
    if (activeTab === 'noindex') return issue.type === 'sitemap_noindex';
    if (activeTab === 'robots') return issue.type === 'sitemap_robots_blocked';
    if (activeTab === 'canonical') return issue.type === 'canonical_mismatch';
    if (activeTab === 'duplicates') return issue.type === 'duplicate_across_sitemaps';
    if (activeTab === 'unreferenced') return issue.type === 'unreferenced_sitemap_candidate';
    return true;
  });

  return (
    <div id="sitemap-problems-view" className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-amber-600" />
            <span>Sitemap Health & Hygiene Problems</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Identify invalid, non-200, noindex, redirecting, or unreferenced URLs present within XML sitemaps.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <a
            id="btn-export-problems-csv"
            href={`/api/audits/${auditId}/export/problems`}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold border border-slate-300 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Problems CSV</span>
          </a>
        </div>
      </div>

      {/* Categories Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === cat.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>{cat.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === cat.id ? 'bg-blue-800 text-blue-100' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Problems List */}
      <div className="space-y-3">
        {filteredIssues.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500 text-xs">
            No issues found in this category.
          </div>
        ) : (
          filteredIssues.map((issue) => (
            <div
              key={issue.id}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
                      issue.severity === 'critical'
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : issue.severity === 'high'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-blue-100 text-blue-800 border-blue-200'
                    }`}
                  >
                    {issue.severity}
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    {issue.title}
                  </span>
                  {issue.pageType && (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium border border-slate-200">
                      {issue.pageType}
                    </span>
                  )}
                  {issue.ruleId && (
                    <span className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded text-[10px] font-mono border border-violet-200">
                      {issue.ruleId} • {issue.confidence || 'unknown'} confidence
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-600 font-mono break-all flex items-center gap-1.5">
                  <span className="text-slate-400">URL:</span>
                  <span className="font-semibold text-slate-800">{issue.affectedUrl}</span>
                  <button
                    onClick={() => handleCopy(issue.id, issue.affectedUrl)}
                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700"
                    title="Copy URL"
                  >
                    {copiedId === issue.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center gap-2">
                  <span>Found in sitemap: <strong className="font-mono text-blue-700">{issue.affectedSitemap || 'sitemap_index.xml'}</strong></span>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 mt-2">
                  <strong className="text-slate-900">Recommended Action: </strong>
                  <span>{issue.suggestedAction}</span>
                </div>
                {issue.evidence && issue.evidence.length > 0 && (
                  <div className="text-[10px] text-slate-600 flex flex-wrap gap-1.5">
                    {issue.evidence.map((item, index) => (
                      <span key={`${item.check}-${index}`} className="px-2 py-1 bg-blue-50 border border-blue-100 rounded font-mono">
                        {item.check}={String(item.value)}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="shrink-0 flex md:flex-col items-stretch md:items-end justify-between gap-2">
                <select
                  aria-label={`Review status for ${issue.title}`}
                  disabled={savingId === issue.id}
                  value={reviewOverrides[issue.id] || issue.reviewStatus || 'unreviewed'}
                  onChange={(event) => updateReview(issue, event.target.value as IssueReviewStatus)}
                  className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white min-w-40"
                >
                  <option value="unreviewed">Unreviewed</option>
                  <option value="confirmed">Confirmed issue</option>
                  <option value="false_positive">False positive</option>
                  <option value="needs_review">Needs review</option>
                  <option value="intentional_exclusion">Intentional exclusion</option>
                  <option value="fixed">Fixed</option>
                </select>
                <button onClick={() => setSelectedIssue(issue)} className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-violet-200 bg-violet-50 text-violet-800 rounded-lg text-xs font-semibold">
                  <Eye className="w-3.5 h-3.5" /> Inspect evidence
                </button>
                <button
                  onClick={() =>
                    onGenerateTicket(
                      issue.title,
                      1,
                      [issue.affectedUrl],
                      issue.pageType || 'Sitemap Hygiene'
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Create Dev Ticket</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedIssue && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex justify-end" onClick={() => setSelectedIssue(null)}>
          <aside className="w-full max-w-xl h-full bg-white shadow-2xl overflow-y-auto" onClick={(event) => event.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-200 p-5 flex items-start justify-between z-10">
              <div><div className="text-[10px] uppercase tracking-wider font-bold text-violet-700">Evidence record</div><h3 className="font-extrabold text-lg mt-1">{selectedIssue.title}</h3></div>
              <button onClick={() => setSelectedIssue(null)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-5 text-sm">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4"><div className="text-xs font-bold text-slate-500 uppercase mb-2">Affected URL</div><div className="font-mono text-xs break-all text-slate-900">{selectedIssue.affectedUrl}</div></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-slate-200 rounded-xl p-3"><div className="text-[10px] uppercase font-bold text-slate-500">Confidence</div><div className="font-bold capitalize mt-1">{selectedIssue.confidence || 'Unknown'}</div></div>
                <div className="border border-slate-200 rounded-xl p-3"><div className="text-[10px] uppercase font-bold text-slate-500">Rule</div><div className="font-mono font-bold mt-1">{selectedIssue.ruleId || 'Legacy rule'}</div></div>
                <div className="border border-slate-200 rounded-xl p-3"><div className="text-[10px] uppercase font-bold text-slate-500">Observed</div><div className="font-bold mt-1">{selectedIssue.observedAt ? new Date(selectedIssue.observedAt).toLocaleString() : 'Not recorded'}</div></div>
                <div className="border border-slate-200 rounded-xl p-3"><div className="text-[10px] uppercase font-bold text-slate-500">Sitemap</div><div className="font-mono text-xs break-all mt-1">{selectedIssue.affectedSitemap || 'Not applicable'}</div></div>
              </div>
              <div><h4 className="font-bold mb-2">Why it was flagged</h4><p className="text-slate-600 leading-relaxed">{selectedIssue.description}</p></div>
              <div><h4 className="font-bold mb-2">Collected evidence</h4>{selectedIssue.evidence?.length ? <div className="space-y-2">{selectedIssue.evidence.map((item, index) => <div key={`${item.check}-${index}`} className="grid grid-cols-[1fr_auto] gap-4 border border-slate-200 rounded-xl p-3"><div><div className="font-semibold">{item.check}</div><div className="text-[10px] text-slate-500 mt-0.5">Source: {item.source.replaceAll('_', ' ')}</div></div><code className="text-xs bg-slate-100 rounded px-2 py-1 self-center max-w-52 break-all">{String(item.value)}</code></div>)}</div> : <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">This legacy finding has no structured evidence record. Verify it manually before actioning.</p>}</div>
              <div className="bg-violet-50 border border-violet-200 rounded-xl p-4"><h4 className="font-bold text-violet-950">Recommended action</h4><p className="text-sm text-violet-900 mt-1">{selectedIssue.suggestedAction}</p></div>
              <label className="block"><span className="font-bold block mb-2">Human review status</span><select value={reviewOverrides[selectedIssue.id] || selectedIssue.reviewStatus || 'unreviewed'} onChange={(event) => updateReview(selectedIssue, event.target.value as IssueReviewStatus)} className="w-full border border-slate-300 rounded-xl px-3 py-2.5"><option value="unreviewed">Unreviewed</option><option value="confirmed">Confirmed issue</option><option value="false_positive">False positive</option><option value="needs_review">Needs review</option><option value="intentional_exclusion">Intentional exclusion</option><option value="fixed">Fixed</option></select></label>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
