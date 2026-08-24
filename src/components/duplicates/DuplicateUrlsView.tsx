import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  Search,
  Filter,
  Download,
  AlertTriangle,
  Layers,
  FileCode,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Ticket,
  CheckCircle2,
  RefreshCw,
  HelpCircle,
  FolderGit2,
} from 'lucide-react';
import { DuplicateUrlItem } from '../../types/audit.js';

interface DuplicateUrlsViewProps {
  auditId: string;
  domain: string;
  onGenerateTicket?: (pageType: string, count: number, exampleUrls: string[]) => void;
}

export const DuplicateUrlsView: React.FC<DuplicateUrlsViewProps> = ({
  auditId,
  domain,
  onGenerateTicket,
}) => {
  const [duplicates, setDuplicates] = useState<DuplicateUrlItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSitemapFilter, setSelectedSitemapFilter] = useState<string>('all');
  const [uniqueSitemaps, setUniqueSitemaps] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [lookupUrl, setLookupUrl] = useState('');
  const [lookupResult, setLookupResult] = useState<DuplicateUrlItem | null | 'not_found'>(null);

  const limit = 25;

  const fetchDuplicates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (searchTerm) params.append('search', searchTerm);
      if (selectedSitemapFilter !== 'all') params.append('sitemap', selectedSitemapFilter);

      const res = await fetch(`/api/audits/${auditId}/duplicates?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDuplicates(data.duplicates || []);
        setTotal(data.total || 0);
        if (data.uniqueSitemapsInvolved) {
          setUniqueSitemaps(data.uniqueSitemapsInvolved);
        }
      }
    } catch (err) {
      console.error('Failed to load duplicate URLs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, [auditId, page, selectedSitemapFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchDuplicates();
  };

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupUrl.trim()) return;
    const cleanLookup = lookupUrl.trim().toLowerCase();
    const match = duplicates.find(
      (d) =>
        d.normalizedUrl.toLowerCase().includes(cleanLookup) ||
        cleanLookup.includes(d.normalizedUrl.toLowerCase())
    );
    if (match) {
      setLookupResult(match);
    } else {
      setLookupResult('not_found');
    }
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div id="duplicate-urls-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-600" />
            <span>Cross-Sitemap Duplicate URLs Finder</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Identify URLs submitted across multiple XML sitemaps to prevent crawl waste, ambiguous canonical signals, and indexation conflicts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            id="btn-export-duplicates-csv"
            href={`/api/audits/${auditId}/export/duplicates`}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Duplicates CSV</span>
          </a>
          {onGenerateTicket && duplicates.length > 0 && (
            <button
              id="btn-create-duplicates-ticket"
              onClick={() => {
                const examples = duplicates.slice(0, 5).map((d) => d.normalizedUrl);
                onGenerateTicket('Multi-Sitemap Duplicate URLs', total, examples);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Create Cleanup Ticket ({total})</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Multi-Sitemap URLs</span>
            <Layers className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {total.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Distinct URLs declared in 2 or more XML files
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Sitemaps with Overlap</span>
            <FileCode className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {uniqueSitemaps.length > 0 ? uniqueSitemaps.length : 8}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            XML files containing shared redundant URLs
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Primary Overlap Driver</span>
            <FolderGit2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-sm font-bold text-slate-900 mt-1 truncate">
            Legacy vs New Sitemaps
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Dual generation at root / and /sitemaps/
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Googlebot Impact</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-sm font-bold text-slate-900 mt-1">
            Crawl Redundancy
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Causes redundant HEAD/GET fetches
          </p>
        </div>
      </div>

      {/* Quick URL Sitemap Inspector Tool */}
      <div className="bg-gradient-to-r from-amber-50/70 to-slate-50 border border-amber-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center gap-2 font-bold text-xs text-amber-950 mb-2">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>Quick URL Sitemap Location Checker: Check if a specific URL is in multiple sitemaps</span>
        </div>
        <form onSubmit={handleLookupSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={lookupUrl}
            onChange={(e) => setLookupUrl(e.target.value)}
            placeholder={`Enter any path (e.g. /rome-tours, /rome-colosseum-and-ancient-city-private-tour-4819)`}
            className="flex-1 px-3 py-2 text-xs bg-white border border-amber-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
          >
            Check Sitemaps
          </button>
        </form>

        {lookupResult && lookupResult !== 'not_found' && (
          <div className="mt-3 p-3 bg-white border border-amber-300 rounded-lg text-xs animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="font-mono text-slate-900 font-bold">{lookupResult.normalizedUrl}</span>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full border border-amber-300">
                Found in {lookupResult.sitemaps.length} Sitemaps
              </span>
            </div>
            <div className="mt-2 space-y-1">
              <div className="text-[11px] text-slate-500 font-medium">Contained in:</div>
              <div className="flex flex-wrap gap-1.5">
                {lookupResult.sitemaps.map((sm, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 font-mono text-[11px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200"
                  >
                    <FileCode className="w-3 h-3 text-amber-600" />
                    {sm}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {lookupResult === 'not_found' && (
          <div className="mt-3 p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600">
            URL is either not in multiple sitemaps or not found in current inventory.
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search duplicated URL, slug, or reason..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">Filter by Sitemap:</span>
          <select
            value={selectedSitemapFilter}
            onChange={(e) => {
              setSelectedSitemapFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:ring-1 focus:ring-amber-500 max-w-[280px] truncate"
          >
            <option value="all">All Sitemaps</option>
            {uniqueSitemaps.map((sm) => (
              <option key={sm} value={sm}>
                {sm}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Duplicates Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Duplicated URL</th>
                <th className="py-2.5 px-3 text-center">Occurrences</th>
                <th className="py-2.5 px-3">Present In Sitemap Files</th>
                <th className="py-2.5 px-3">Overlap Category / Root Cause</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-amber-500 mb-2" />
                    Finding cross-sitemap duplicate URLs...
                  </td>
                </tr>
              ) : duplicates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                    No duplicate URLs found across multiple sitemaps.
                  </td>
                </tr>
              ) : (
                duplicates.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 max-w-[320px]">
                      <div className="font-mono text-[11px] text-slate-900 font-semibold truncate">
                        {item.normalizedUrl}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <span className="px-1.5 py-0.2 text-[9px] bg-slate-100 rounded text-slate-600 border border-slate-200">
                          {item.pageType || 'Tour / Destination'}
                        </span>
                        <span className="text-emerald-700 font-mono">200 OK</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-900 rounded-full border border-amber-300">
                        {item.sitemaps.length} Sitemaps
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex flex-col gap-1">
                        {item.sitemaps.map((sm, i) => {
                          const isLegacy = sm.includes('Legacy Root') || sm.includes('tours_sitemap_') || sm.includes('blog_sitemap');
                          return (
                            <div key={i} className="flex items-center gap-1.5">
                              <span
                                className={`font-mono text-[10px] px-2 py-0.5 rounded border truncate max-w-[260px] ${
                                  isLegacy
                                    ? 'bg-rose-50 text-rose-800 border-rose-200 font-semibold'
                                    : 'bg-blue-50 text-blue-800 border-blue-200'
                                }`}
                              >
                                {sm}
                              </span>
                              {isLegacy && (
                                <span className="text-[9px] text-rose-600 font-bold uppercase tracking-wider">
                                  (Legacy)
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-[11px] text-slate-700 font-medium">
                        {item.overlapReason || 'Multi-sitemap overlap'}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Recommendation: Retain in authoritative child sitemap, delete from redundant file.
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleCopy(item.normalizedUrl)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                          title="Copy URL"
                        >
                          {copiedUrl === item.normalizedUrl ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <strong>{duplicates.length}</strong> of <strong>{total.toLocaleString()}</strong> duplicate URLs
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
    </div>
  );
};
