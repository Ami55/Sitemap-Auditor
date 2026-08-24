import React, { useState } from 'react';
import {
  FolderTree,
  FileCode,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  ExternalLink,
  Copy,
  Search,
  Filter,
  Layers,
  Sparkles,
  Info,
  Check,
  ArrowRight,
} from 'lucide-react';
import { SitemapFileRecord } from '../../types/audit.js';

interface SitemapExplorerViewProps {
  sitemaps: SitemapFileRecord[];
  duplicateUrls: { normalizedUrl: string; sitemaps: string[] }[];
  patternCandidates: SitemapFileRecord[];
  onInspectUrl: (url: string) => void;
  onNavigateToDuplicates?: () => void;
}

export const SitemapExplorerView: React.FC<SitemapExplorerViewProps> = ({
  sitemaps,
  duplicateUrls,
  patternCandidates,
  onNavigateToDuplicates,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [selectedSitemap, setSelectedSitemap] = useState<SitemapFileRecord | null>(sitemaps[0] || null);

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const filteredSitemaps = sitemaps.filter((s) => {
    if (!s) return false;
    const url = s.sitemapUrl || '';
    const query = searchTerm || '';
    const matchesSearch = url.toLowerCase().includes(query.toLowerCase());
    if (filterType === 'all') return matchesSearch;
    if (filterType === 'indexes') return matchesSearch && !!s.isIndex;
    if (filterType === 'children') return matchesSearch && !s.isIndex;
    if (filterType === 'errors') return matchesSearch && ((s.errors?.length || 0) > 0 || s.httpStatus !== 200);
    if (filterType === 'unreferenced') return matchesSearch && s.discoveryMethod === 'naming_pattern_probe';
    return matchesSearch;
  });

  const totalSitemapUrls = sitemaps.reduce((acc, s) => acc + (s.isIndex ? 0 : s.urlCount), 0);

  return (
    <div id="sitemap-explorer-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-blue-600" />
            <span>Sitemap Hierarchy & File Explorer</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Discovered XML sitemap indexes, child documents, URL volumes, and health statuses.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700">
            <strong>{sitemaps.length}</strong> Sitemap Files
          </div>
          <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 font-semibold">
            <strong>{totalSitemapUrls.toLocaleString()}</strong> Processed URLs
          </div>
        </div>
      </div>

      {/* Unreferenced Candidates Alert Box */}
      {patternCandidates.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-xs text-amber-950">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Unreferenced Sitemap Candidates Detected ({patternCandidates.length}):
            </span>
          </div>
          <p className="text-xs text-amber-800">
            The following sitemap files returned HTTP 200 but are <strong>NOT referenced</strong> in robots.txt or any parent sitemap_index.xml. Search engines may not discover them unless referenced.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
            {patternCandidates.map((c, i) => (
              <div key={i} className="bg-white/80 border border-amber-200 p-2 rounded-lg flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] truncate mr-2">{c.sitemapUrl}</span>
                <span className="text-[10px] font-semibold bg-amber-200 text-amber-900 px-2 py-0.5 rounded shrink-0">
                  {c.urlCount} URLs inside
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search sitemap URL or filename..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs text-slate-500 font-medium">Filter:</span>
          {['all', 'indexes', 'children', 'errors', 'unreferenced'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors whitespace-nowrap cursor-pointer ${
                filterType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {type === 'all' ? 'All Files' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Sitemaps List & Details split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sitemaps Table / Cards (2 Cols) */}
        <div className="lg:col-span-2 space-y-3">
          {filteredSitemaps.map((sitemap) => {
            const isSelected = selectedSitemap?.sitemapUrl === sitemap.sitemapUrl;
            const hasErrors = sitemap.errors.length > 0 || sitemap.httpStatus !== 200;
            return (
              <div
                key={sitemap.sitemapUrl}
                onClick={() => setSelectedSitemap(sitemap)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/40 shadow-xs ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        sitemap.isIndex
                          ? 'bg-purple-100 text-purple-700'
                          : hasErrors
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {sitemap.isIndex ? (
                        <FolderTree className="w-5 h-5" />
                      ) : (
                        <FileCode className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-900 truncate">
                          {(sitemap.sitemapUrl || '').split('/').pop() || sitemap.sitemapUrl}
                        </span>
                        {sitemap.isIndex && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-800 rounded">
                            Sitemap Index
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            sitemap.httpStatus === 200
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          HTTP {sitemap.httpStatus}
                        </span>
                        <span className="px-1.5 py-0.5 text-[10px] bg-slate-100 text-slate-600 rounded">
                          Source: {sitemap.discoveryMethod.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono truncate mt-1">
                        {sitemap.sitemapUrl}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-base font-extrabold text-slate-900 font-mono">
                      {sitemap.urlCount.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">
                      {sitemap.isIndex ? 'Child Sitemaps' : 'Declared URLs'}
                    </div>
                  </div>
                </div>

                {/* Sub info */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-3">
                    <span>Size: {(sitemap.fileSizeBytes / 1024).toFixed(1)} KB</span>
                    <span>Lastmod: {sitemap.lastModifiedHeader ? new Date(sitemap.lastModifiedHeader).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  {hasErrors && (
                    <span className="text-amber-700 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {sitemap.errors.length} Warnings/Issues
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Sitemap Inspector Details */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs h-fit sticky top-20">
          {selectedSitemap ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-900">
                  Sitemap Details
                </h3>
                <button
                  onClick={() => handleCopy(selectedSitemap.sitemapUrl)}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold"
                >
                  {copiedUrl === selectedSitemap.sitemapUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px]">Full URL</span>
                  <span className="font-mono text-slate-800 break-all text-[11px]">
                    {selectedSitemap.sitemapUrl}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-slate-400 font-semibold block text-[11px]">Type</span>
                    <span className="font-medium text-slate-800">
                      {selectedSitemap.isIndex ? 'Sitemap Index' : 'URLset Document'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block text-[11px]">HTTP Status</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {selectedSitemap.httpStatus} OK
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block text-[11px]">Declared URLs</span>
                    <span className="font-mono font-bold text-slate-900">
                      {selectedSitemap.urlCount.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block text-[11px]">File Size</span>
                    <span className="font-mono text-slate-700">
                      {(selectedSitemap.fileSizeBytes / 1024).toFixed(2)} KB
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block text-[11px]">Discovery Method</span>
                    <span className="capitalize text-slate-700">
                      {selectedSitemap.discoveryMethod.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block text-[11px]">Referenced In</span>
                    <span className="truncate text-slate-700 font-mono text-[10px]">
                      {selectedSitemap.parentIndexUrl || 'robots.txt'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sample URLs preview */}
              {selectedSitemap.sampleUrls && selectedSitemap.sampleUrls.length > 0 && (
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-slate-700 font-bold text-xs block mb-1.5">
                    Sample URLs in this file ({selectedSitemap.sampleUrls.length})
                  </span>
                  <div className="max-h-48 overflow-y-auto space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    {selectedSitemap.sampleUrls.map((url, i) => (
                      <div
                        key={i}
                        className="font-mono text-[10px] text-slate-700 truncate hover:text-blue-600 hover:underline cursor-pointer"
                        title={url}
                      >
                        {url}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings / Errors */}
              {selectedSitemap.errors.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                    <span>File Issues:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800">
                    {selectedSitemap.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              Select a sitemap to inspect details.
            </div>
          )}
        </div>
      </div>

      {/* Cross-Sitemap Duplicate URLs Table */}
      {duplicateUrls.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase">
                Cross-Sitemap Duplicate URLs ({duplicateUrls.length})
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-500 hidden md:inline">
                The same canonical URL is submitted in multiple XML sitemap files.
              </span>
              {onNavigateToDuplicates && (
                <button
                  onClick={onNavigateToDuplicates}
                  className="flex items-center gap-1 text-xs font-bold text-amber-800 hover:text-amber-900 cursor-pointer bg-amber-100 hover:bg-amber-200/80 px-2.5 py-1 rounded-md border border-amber-300 transition-colors"
                >
                  <span>Open Full Duplicates Finder</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-4">Duplicate URL</th>
                  <th className="py-2.5 px-4">Submitted Inside Sitemaps</th>
                  <th className="py-2.5 px-4 text-right">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {duplicateUrls.slice(0, 10).map((dup, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-900 font-semibold">
                      {dup.normalizedUrl}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600 space-x-1">
                      {dup.sitemaps.map((sm, idx) => (
                        <span key={idx} className="inline-block bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px]">
                          {(sm || '').split('/').pop() || sm}
                        </span>
                      ))}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-amber-700">
                      {dup.sitemaps.length}x
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
