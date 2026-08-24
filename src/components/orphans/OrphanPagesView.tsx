import React, { useState, useEffect } from 'react';
import {
  Link2Off,
  Search,
  Filter,
  Download,
  AlertTriangle,
  FileQuestion,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Ticket,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight,
  Layers,
  Network,
  RefreshCw,
  Info,
} from 'lucide-react';
import { OrphanUrlItem, IssueSeverity } from '../../types/audit.js';

interface OrphanPagesViewProps {
  auditId: string;
  domain: string;
  onGenerateTicket?: (pageType: string, count: number, exampleUrls: string[]) => void;
}

export const OrphanPagesView: React.FC<OrphanPagesViewProps> = ({
  auditId,
  domain,
  onGenerateTicket,
}) => {
  const [orphans, setOrphans] = useState<OrphanUrlItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPageType, setSelectedPageType] = useState<string>('all');
  const [maxLinksFilter, setMaxLinksFilter] = useState<number>(1);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({
    zeroLinksCount: 0,
    shallowLinksCount: 0,
    totalPagesEvaluated: 0,
  });
  const [selectedOrphan, setSelectedOrphan] = useState<OrphanUrlItem | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const limit = 25;

  const fetchOrphans = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        maxLinks: maxLinksFilter.toString(),
      });
      if (searchTerm) params.append('search', searchTerm);
      if (selectedPageType !== 'all') params.append('pageType', selectedPageType);

      const res = await fetch(`/api/audits/${auditId}/orphans?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrphans(data.orphans || []);
        setTotal(data.total || 0);
        if (data.stats) {
          setStats(data.stats);
        }
        if (data.orphans && data.orphans.length > 0 && !selectedOrphan) {
          setSelectedOrphan(data.orphans[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load orphan pages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrphans();
  }, [auditId, page, maxLinksFilter, selectedPageType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrphans();
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  const pageTypesList = [
    'all',
    'Tour Itinerary Detail Pages',
    'Destination & City Tour Hubs',
    'Blog & Travel Stories',
    'Local Tour Guide Profiles',
    'Static & Informational Pages',
  ];

  return (
    <div id="orphan-pages-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Link2Off className="w-5 h-5 text-rose-600" />
            <span>Orphan Pages & Link Equity Finder</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Identify URLs submitted in XML sitemaps with <strong>0 internal inbound links</strong> that rely entirely on sitemap discovery and receive no internal PageRank.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            id="btn-export-orphans-csv"
            href={`/api/audits/${auditId}/export/orphans`}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Orphans CSV</span>
          </a>
          {onGenerateTicket && orphans.length > 0 && (
            <button
              id="btn-create-orphan-ticket"
              onClick={() => {
                const examples = orphans.slice(0, 5).map((o) => o.normalizedUrl);
                onGenerateTicket(selectedPageType !== 'all' ? selectedPageType : 'Orphan Pages', total, examples);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Create Dev Ticket ({total})</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs">
          <div className="flex items-center justify-between text-rose-600 text-xs font-bold uppercase tracking-wider mb-1">
            <span>True Sitemap Orphans</span>
            <Link2Off className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {stats.zeroLinksCount.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Pages in XML sitemaps with <strong>0 internal inlinks</strong>
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Shallow / At-Risk</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {stats.shallowLinksCount.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Pages with only <strong>1 inbound link</strong> from crawl
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Discovery Gap</span>
            <Network className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {stats.zeroLinksCount > 0 ? `${((stats.zeroLinksCount / Math.max(1, stats.totalPagesEvaluated)) * 100).toFixed(1)}%` : '0%'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Of inventory isolated from site architecture
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold uppercase tracking-wider mb-1">
            <span>SEO Impact</span>
            <ShieldAlert className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-sm font-bold text-slate-900 mt-1">
            {stats.zeroLinksCount > 0 ? 'Zero PageRank Flow' : 'Healthy Link Graph'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Orphans struggle to rank and waste crawl budget
          </p>
        </div>
      </div>

      {/* SEO Architectural Alert */}
      <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl text-rose-950 text-xs space-y-1">
        <div className="flex items-center gap-2 font-bold text-rose-900">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>Why Sitemap Orphans Matter:</span>
        </div>
        <p className="text-[11px] text-rose-800 leading-relaxed">
          Googlebot treats XML sitemaps as a discovery hint, not a ranking signal. Pages that are only found in XML sitemaps receive <strong>zero internal link equity</strong>. They are rarely indexed or ranked prominently. If the page is valuable, add navigation links from high-authority category hubs or breadcrumbs. If the page is dead or seasonal, 301 redirect or purge it from the sitemap.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search orphan URL, slug, or title..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {/* Link Threshold Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => {
                setMaxLinksFilter(0);
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                maxLinksFilter === 0
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              0 Links (True Orphans)
            </button>
            <button
              onClick={() => {
                setMaxLinksFilter(1);
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                maxLinksFilter === 1
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ≤ 1 Link (At-Risk)
            </button>
          </div>

          {/* Page Type Filter */}
          <select
            value={selectedPageType}
            onChange={(e) => {
              setSelectedPageType(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:ring-1 focus:ring-rose-500"
          >
            {pageTypesList.map((pt) => (
              <option key={pt} value={pt}>
                {pt === 'all' ? 'All Page Types' : pt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table & Inspector Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Orphan Page URL</th>
                  <th className="py-2.5 px-3">Page Type</th>
                  <th className="py-2.5 px-3 text-center">Inbound Links</th>
                  <th className="py-2.5 px-3">Sitemap Declared In</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-rose-500 mb-2" />
                      Scanning link graph for orphan URLs...
                    </td>
                  </tr>
                ) : orphans.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <Check className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                      No orphan pages found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  orphans.map((item) => {
                    const isSelected = selectedOrphan?.id === item.id;
                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedOrphan(item)}
                        className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                          isSelected ? 'bg-rose-50/50 font-medium' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 max-w-[240px]">
                          <div className="font-mono text-[11px] text-slate-900 truncate font-semibold">
                            {item.normalizedUrl}
                          </div>
                          {item.pageTitle && (
                            <div className="text-[10px] text-slate-500 truncate mt-0.5">
                              {item.pageTitle}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-block px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded border border-slate-200 truncate max-w-[140px]">
                            {item.pageType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {item.inboundInternalLinksCount === 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-800 rounded-full border border-rose-300">
                              <Link2Off className="w-3 h-3" />
                              0 Inlinks
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-300">
                              1 Inlink
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-mono text-[10px] text-slate-600 truncate max-w-[130px]">
                            {item.sitemapNames.length > 0
                              ? item.sitemapNames[0].split('/').pop()
                              : 'None'}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(item.normalizedUrl);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                            title="Copy URL"
                          >
                            {copiedUrl === item.normalizedUrl ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing <strong>{orphans.length}</strong> of <strong>{total.toLocaleString()}</strong> orphan pages
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Selected Orphan Inspector Details (1 col) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs h-fit sticky top-20">
          {selectedOrphan ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs">
                  <Link2Off className="w-4 h-4" />
                  <span>Orphan URL Inspector</span>
                </div>
                <button
                  onClick={() => handleCopy(selectedOrphan.normalizedUrl)}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold"
                >
                  {copiedUrl === selectedOrphan.normalizedUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px]">Normalized URL</span>
                  <span className="font-mono text-slate-900 break-all text-[11px] font-semibold">
                    {selectedOrphan.normalizedUrl}
                  </span>
                </div>

                {selectedOrphan.pageTitle && (
                  <div>
                    <span className="text-slate-400 font-semibold block text-[11px]">Page Title</span>
                    <span className="text-slate-800 font-medium">
                      {selectedOrphan.pageTitle}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-slate-400 font-semibold block text-[11px]">Inbound Internal Links</span>
                    <span
                      className={`font-mono font-bold text-xs ${
                        selectedOrphan.inboundInternalLinksCount === 0
                          ? 'text-rose-600'
                          : 'text-amber-600'
                      }`}
                    >
                      {selectedOrphan.inboundInternalLinksCount} Links ({selectedOrphan.inboundInternalLinksCount === 0 ? 'True Orphan' : 'Shallow'})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block text-[11px]">HTTP Status</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {selectedOrphan.httpStatus} OK
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block text-[11px]">Page Type</span>
                    <span className="font-medium text-slate-800">
                      {selectedOrphan.pageType}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block text-[11px]">Discovery Method</span>
                    <span className="font-medium text-slate-700 capitalize">
                      {selectedOrphan.discoverySource.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <div className="pt-1">
                  <span className="text-slate-400 font-semibold block text-[11px]">Declared in Sitemaps</span>
                  <div className="space-y-1 mt-1">
                    {selectedOrphan.sitemapNames.map((sm, i) => (
                      <span
                        key={i}
                        className="inline-block bg-slate-100 text-slate-700 font-mono text-[10px] px-2 py-0.5 rounded border border-slate-200 mr-1"
                      >
                        {sm}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actionable Link Placement Recommendation */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-2">
                <div className="font-bold text-amber-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Recommended SEO Action:</span>
                </div>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  {selectedOrphan.suggestedAction}
                </p>
                {selectedOrphan.recommendedParentHub && (
                  <div className="pt-1 border-t border-amber-200/70 text-[11px] text-amber-900">
                    <span className="font-semibold">Suggested Parent Hub: </span>
                    <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-950 font-mono">
                      {selectedOrphan.recommendedParentHub}
                    </code>
                  </div>
                )}
              </div>

              {/* Dev ticket trigger */}
              {onGenerateTicket && (
                <button
                  onClick={() =>
                    onGenerateTicket(
                      selectedOrphan.pageType,
                      1,
                      [selectedOrphan.normalizedUrl]
                    )
                  }
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Generate Fix Ticket for this URL</span>
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              Select an orphan URL from the table to view internal link equity details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
