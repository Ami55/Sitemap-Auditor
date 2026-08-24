import React, { useState, useEffect } from 'react';
import {
  FileQuestion,
  Search,
  Filter,
  Download,
  ExternalLink,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Info,
  Sparkles,
  Layers,
  ArrowUpDown,
  X,
} from 'lucide-react';
import { CrawledUrlRecord, PageTypeCoverageStats } from '../../types/audit.js';

interface MissingUrlsViewProps {
  auditId: string;
  domain: string;
  pageTypeCoverage: PageTypeCoverageStats[];
  onGenerateTicketForMissing: (pageType: string, count: number, examples: string[]) => void;
}

export const MissingUrlsView: React.FC<MissingUrlsViewProps> = ({
  auditId,
  domain,
  pageTypeCoverage,
  onGenerateTicketForMissing,
}) => {
  const [urls, setUrls] = useState<CrawledUrlRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPageType, setSelectedPageType] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedCanonical, setSelectedCanonical] = useState('all');

  // Selected row for detail drawer
  const [inspectRecord, setInspectRecord] = useState<CrawledUrlRecord | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const fetchUrls = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        onlyMissing: 'true',
      });
      if (searchTerm) params.set('search', searchTerm);
      if (selectedPageType !== 'all') params.set('pageType', selectedPageType);
      if (selectedPriority !== 'all') params.set('priority', selectedPriority);
      if (selectedCanonical !== 'all') params.set('canonicalStatus', selectedCanonical);

      const res = await fetch(`/api/audits/${auditId}/urls?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUrls(data.urls);
        setTotalCount(data.total);
      }
    } catch (e) {
      console.error('Failed to fetch missing URLs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUrls();
  }, [auditId, page, limit, selectedPageType, selectedPriority, selectedCanonical]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUrls();
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div id="missing-urls-view" className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileQuestion className="w-5 h-5 text-rose-600" />
            <span>Potentially Missing from Sitemaps</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Valid, live indexable pages discovered during internal crawling that are absent from all XML sitemaps.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <a
            id="btn-export-missing-csv"
            href={`/api/audits/${auditId}/export/missing`}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold border border-slate-300 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </a>

          {selectedPageType !== 'all' && (
            <button
              onClick={() => {
                const examples = urls.slice(0, 5).map((u) => u.normalizedUrl);
                onGenerateTicketForMissing(selectedPageType, totalCount, examples);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create Dev Ticket for {selectedPageType}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search URL path, page title, or H1 heading..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Page Type Filter */}
            <select
              value={selectedPageType}
              onChange={(e) => {
                setSelectedPageType(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-slate-50 font-medium text-slate-700 focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Page Types</option>
              {pageTypeCoverage.map((pt) => (
                <option key={pt.pageType} value={pt.pageType}>
                  {pt.pageType} ({pt.potentiallyMissingCount} missing)
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => {
                setSelectedPriority(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-slate-50 font-medium text-slate-700 focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="review">Review Required</option>
            </select>

            {/* Canonical Filter */}
            <select
              value={selectedCanonical}
              onChange={(e) => {
                setSelectedCanonical(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-slate-50 font-medium text-slate-700 focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Canonicals</option>
              <option value="self_referencing">Self-Referencing Canonical</option>
              <option value="missing">Missing Canonical Tag</option>
              <option value="mismatch">Canonical Mismatch</option>
            </select>

            <button
              type="submit"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Apply Filter
            </button>
          </div>
        </form>

        {/* Count Summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>
            Found <strong className="text-slate-900 font-mono">{totalCount.toLocaleString()}</strong> potentially missing URLs
          </span>
          <span>Showing page {page} of {totalPages}</span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold">
                <th className="py-2.5 px-3.5 w-20">Priority</th>
                <th className="py-2.5 px-3.5">Missing URL & Title</th>
                <th className="py-2.5 px-3.5">Page Type</th>
                <th className="py-2.5 px-3.5">Status</th>
                <th className="py-2.5 px-3.5">Canonical</th>
                <th className="py-2.5 px-3.5">Depth</th>
                <th className="py-2.5 px-3.5">Inlinks</th>
                <th className="py-2.5 px-3.5">Suggested Sitemap</th>
                <th className="py-2.5 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500">
                    Loading missing URLs...
                  </td>
                </tr>
              ) : urls.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500">
                    No missing URLs match the current filter criteria.
                  </td>
                </tr>
              ) : (
                urls.map((record) => (
                  <tr
                    key={record.normalizedUrl}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3 px-3.5">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
                          record.priority === 'critical'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : record.priority === 'high'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : record.priority === 'medium'
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : record.priority === 'review'
                            ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        {record.priority}
                      </span>
                    </td>

                    <td className="py-3 px-3.5 max-w-sm">
                      <div className="font-mono text-slate-900 font-semibold truncate">
                        {record.normalizedUrl}
                      </div>
                      {record.pageTitle && (
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {record.pageTitle}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-medium border border-slate-200">
                        {record.pageType}
                      </span>
                    </td>

                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[11px]">
                        {record.httpStatus} OK
                      </span>
                    </td>

                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span
                        className={`text-[11px] font-medium ${
                          record.canonicalStatus === 'self_referencing'
                            ? 'text-emerald-700'
                            : record.canonicalStatus === 'missing'
                            ? 'text-amber-700'
                            : 'text-rose-700 font-semibold'
                        }`}
                      >
                        {record.canonicalStatus.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-3.5 font-mono text-slate-700">
                      {record.crawlDepth}
                    </td>

                    <td className="py-3 px-3.5 font-mono font-semibold text-slate-800">
                      {record.inboundInternalLinksCount}
                    </td>

                    <td className="py-3 px-3.5 font-mono text-[11px] text-blue-700 max-w-[130px] truncate">
                      {record.suggestedSitemap || 'sitemap.xml'}
                    </td>

                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleCopy(record.normalizedUrl)}
                          title="Copy URL"
                          className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800"
                        >
                          {copiedUrl === record.normalizedUrl ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => setInspectRecord(record)}
                          className="px-2 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors cursor-pointer"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(parseInt(e.target.value, 10));
                setPage(1);
              }}
              className="px-2 py-1 border border-slate-300 rounded bg-white"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 border border-slate-300 rounded-md hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 border border-slate-300 rounded-md hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Row Inspect Drawer Modal */}
      {inspectRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  URL Inspection Record
                </h3>
                <span className="text-xs text-slate-500">
                  Discovered URL missing from XML sitemap
                </span>
              </div>
              <button
                onClick={() => setInspectRecord(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs flex-1">
              <div>
                <span className="text-slate-400 font-semibold block text-[11px]">Normalized URL</span>
                <span className="font-mono text-slate-900 break-all font-semibold">
                  {inspectRecord.normalizedUrl}
                </span>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 space-y-1">
                <span className="font-bold block">Omission Finding & Evidence:</span>
                <p className="text-[11px] leading-relaxed">
                  {inspectRecord.missingReason ||
                    'Discovered valid canonical URL via internal crawl, not found in any parsed sitemap.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px]">Page Type</span>
                  <span className="font-medium text-slate-800">{inspectRecord.pageType}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px]">Suggested Sitemap</span>
                  <span className="font-mono text-blue-700 font-semibold">{inspectRecord.suggestedSitemap || 'sitemap.xml'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px]">HTTP Status</span>
                  <span className="font-mono text-emerald-700 font-bold">{inspectRecord.httpStatus} OK</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px]">Crawl Depth</span>
                  <span className="font-mono text-slate-800">Depth {inspectRecord.crawlDepth}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px]">Inbound Internal Links</span>
                  <span className="font-mono font-bold text-slate-800">{inspectRecord.inboundInternalLinksCount} links</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px]">Canonical Status</span>
                  <span className="capitalize text-slate-800">{inspectRecord.canonicalStatus.replace(/_/g, ' ')}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block text-[11px]">Canonical Tag in DOM</span>
                <span className="font-mono text-slate-700 break-all text-[11px]">
                  {inspectRecord.canonicalUrl || 'None declared'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block text-[11px]">First Discovered From</span>
                <span className="font-mono text-slate-700 break-all text-[11px]">
                  {inspectRecord.firstDiscoveredFrom || 'Root crawl'}
                </span>
              </div>

              {inspectRecord.pageTitle && (
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px]">Page Title</span>
                  <span className="text-slate-800">{inspectRecord.pageTitle}</span>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                onClick={() => setInspectRecord(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
