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
} from 'lucide-react';
import { IssueItem } from '../../types/audit.js';

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
              </div>

              {/* Action Button */}
              <div className="shrink-0 flex md:flex-col items-end justify-between gap-2">
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
    </div>
  );
};
