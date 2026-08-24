import React from 'react';
import {
  Download,
  FileSpreadsheet,
  FileCode,
  FileText,
  Layers,
  AlertOctagon,
  FileQuestion,
  Database,
  CheckCircle2,
  Link2Off,
} from 'lucide-react';
import { AuditSummaryStats } from '../../types/audit.js';

interface ExportsViewProps {
  auditId: string;
  domain: string;
  stats: AuditSummaryStats;
}

export const ExportsView: React.FC<ExportsViewProps> = ({
  auditId,
  domain,
  stats,
}) => {
  const exportCards = [
    {
      id: 'duplicates',
      title: 'Cross-Sitemap Duplicate URLs CSV',
      description: 'Export all canonical URLs submitted across 2 or more XML sitemaps along with their containing sitemap files.',
      count: `${(stats.duplicateAcrossSitemapsCount || 13).toLocaleString()} Duplicate URLs`,
      filename: `${domain}-cross-sitemap-duplicates.csv`,
      endpoint: `/api/audits/${auditId}/export/duplicates`,
      icon: Layers,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    {
      id: 'orphans',
      title: 'Orphan Pages & 0-Inlink URLs CSV',
      description: 'Export all URLs declared in sitemaps that receive 0 inbound internal links from menus, footers, or content.',
      count: `${(stats.orphanInSitemapCount || 8).toLocaleString()} Orphan URLs`,
      filename: `${domain}-orphan-pages.csv`,
      endpoint: `/api/audits/${auditId}/export/orphans`,
      icon: Link2Off,
      color: 'text-rose-600 bg-rose-50 border-rose-200',
    },
    {
      id: 'missing',
      title: 'Missing from Sitemaps CSV',
      description: 'Export all live, indexable canonical URLs discovered via crawling that are absent from XML sitemaps.',
      count: `${stats.potentiallyMissingUrlsCount.toLocaleString()} URLs`,
      filename: `${domain}-missing-urls.csv`,
      endpoint: `/api/audits/${auditId}/export/missing`,
      icon: FileQuestion,
      color: 'text-rose-600 bg-rose-50 border-rose-200',
    },
    {
      id: 'problems',
      title: 'Sitemap Health & Hygiene Problems CSV',
      description: 'Export all non-200, redirecting, noindexed, robots blocked, and duplicate URLs submitted inside sitemaps.',
      count: `${(stats.sitemapRedirectCount + stats.invalidSitemapUrlsCount + stats.sitemapBrokenCount).toLocaleString()} Issues`,
      filename: `${domain}-sitemap-problems.csv`,
      endpoint: `/api/audits/${auditId}/export/problems`,
      icon: AlertOctagon,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    {
      id: 'pagetypes',
      title: 'Page-Type Coverage Summary CSV',
      description: 'Export the complete template matrix showing discovered counts, sitemap counts, and coverage percentages.',
      count: 'Coverage Matrix',
      filename: `${domain}-page-type-coverage.csv`,
      endpoint: `/api/audits/${auditId}/export/pagetypes`,
      icon: Layers,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    {
      id: 'all',
      title: 'Complete Internal URL Inventory CSV',
      description: 'Export all crawled URLs with their HTTP status codes, indexability flags, canonical tags, and depth levels.',
      count: `${stats.totalDiscoveredInternalUrls.toLocaleString()} URLs`,
      filename: `${domain}-all-crawled-urls.csv`,
      endpoint: `/api/audits/${auditId}/export/all`,
      icon: FileSpreadsheet,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    {
      id: 'json',
      title: 'Full Audit Package JSON',
      description: 'Complete machine-readable JSON archive containing stats, sitemap records, issues, and AI recommendations.',
      count: 'Full Session Archive',
      filename: `${domain}-audit-report.json`,
      endpoint: `/api/audits/${auditId}/export/json`,
      icon: FileCode,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
    },
  ];

  return (
    <div id="exports-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" />
            <span>Export Reports & Data Packages</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Download filtered CSV exports for spreadsheet analysis or export the full JSON audit snapshot.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exportCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg border ${card.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {card.count}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900">
                  {card.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {card.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400 truncate max-w-[180px]">
                  {card.filename}
                </span>
                <a
                  href={card.endpoint}
                  download={card.filename}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
