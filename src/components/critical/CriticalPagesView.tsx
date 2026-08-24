import React, { useState } from 'react';
import {
  ShieldAlert,
  Plus,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Flame,
  Globe,
  ExternalLink,
  Copy,
  Check,
  X,
  Info,
} from 'lucide-react';
import { CriticalPageItem } from '../../types/audit.js';

interface CriticalPagesViewProps {
  auditId: string;
  criticalPages: CriticalPageItem[];
  onAddCriticalPage: (item: {
    name: string;
    url: string;
    expectedSitemap: string;
    priority: 'critical' | 'high';
    notes?: string;
  }) => void;
}

export const CriticalPagesView: React.FC<CriticalPagesViewProps> = ({
  auditId,
  criticalPages,
  onAddCriticalPage,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [expectedSitemap, setExpectedSitemap] = useState('sitemap.xml');
  const [priority, setPriority] = useState<'critical' | 'high'>('critical');
  const [notes, setNotes] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const handleCopy = (u: string) => {
    navigator.clipboard.writeText(u);
    setCopiedUrl(u);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    onAddCriticalPage({
      name: name.trim() || 'Monitored URL',
      url: url.trim(),
      expectedSitemap: expectedSitemap.trim() || 'sitemap.xml',
      priority,
      notes: notes.trim() || undefined,
    });
    setIsAddModalOpen(false);
    setName('');
    setUrl('');
    setNotes('');
  };

  const missingCriticalCount = criticalPages.filter((p) => !p.inSitemap).length;

  return (
    <div id="critical-pages-view" className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <span>Critical Pages & Revenue Hubs Monitor</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Explicit verification of high-priority URLs (Homepage, core landing hubs, top products) against XML sitemap inclusion.
          </p>
        </div>

        <button
          id="btn-add-critical-page"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Monitored Page</span>
        </button>
      </div>

      {/* Alert if Homepage or any critical page is missing */}
      {missingCriticalCount > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 flex items-start gap-3">
          <Flame className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-bold block text-sm">
              Critical Alert: {missingCriticalCount} High-Priority Page(s) Missing From Sitemaps!
            </span>
            <p className="text-rose-800 leading-relaxed">
              Essential URLs (such as your homepage or top landing categories) are not present in any processed XML sitemap. This is a severe technical SEO defect that risks indexing delays and search visibility loss.
            </p>
          </div>
        </div>
      )}

      {/* Critical Checklist Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold">
                <th className="py-3 px-4 w-24">Priority</th>
                <th className="py-3 px-4">Page Label & Monitored URL</th>
                <th className="py-3 px-4">Expected Sitemap</th>
                <th className="py-3 px-4 text-center">In Sitemap</th>
                <th className="py-3 px-4 text-center">Internal Inlinks</th>
                <th className="py-3 px-4 text-center">HTTP Status</th>
                <th className="py-3 px-4 text-center">Canonical</th>
                <th className="py-3 px-4 text-center">Indexable</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {criticalPages.map((page) => (
                <tr key={page.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
                        page.priority === 'critical'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}
                    >
                      {page.priority}
                    </span>
                  </td>

                  <td className="py-3 px-4 max-w-sm">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      {page.name?.toLowerCase().includes('homepage') && (
                        <Globe className="w-3.5 h-3.5 text-blue-600" />
                      )}
                      <span>{page.name || 'Untitled Page'}</span>
                    </div>
                    <div className="font-mono text-slate-600 text-[11px] truncate mt-0.5">
                      {page.url}
                    </div>
                    {page.notes && (
                      <div className="text-[10px] text-slate-400 mt-0.5 italic">
                        {page.notes}
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-4 font-mono text-[11px] text-blue-700">
                    {page.expectedSitemap}
                  </td>

                  <td className="py-3 px-4 text-center">
                    {page.inSitemap ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Included</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-800 bg-rose-100 px-2 py-0.5 rounded border border-rose-300 font-bold text-[11px] animate-pulse">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>MISSING</span>
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-center font-mono">
                    {page.isInternallyLinked ? (
                      <span className="text-emerald-700 font-semibold">Yes</span>
                    ) : (
                      <span className="text-amber-700 font-semibold">0 links</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-center font-mono">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                        page.httpStatus === 200
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {page.httpStatus || 200}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center text-[11px]">
                    {page.hasValidCanonical ? (
                      <span className="text-emerald-700 font-medium">Valid</span>
                    ) : (
                      <span className="text-rose-700 font-bold">Mismatch</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-center text-[11px]">
                    {page.isIndexable ? (
                      <span className="text-emerald-700 font-medium">Indexable</span>
                    ) : (
                      <span className="text-amber-700 font-bold">Noindex/Blocked</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleCopy(page.url)}
                      title="Copy URL"
                      className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800"
                    >
                      {copiedUrl === page.url ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Critical Page Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Add Monitored Critical Page
                </h3>
                <p className="text-xs text-slate-500">
                  Track vital revenue pages and guarantee their sitemap status.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Page Label / Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Flagship Tour Page"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  URL <span className="text-rose-600">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/destinations/europe"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Expected Sitemap File
                  </label>
                  <input
                    type="text"
                    value={expectedSitemap}
                    onChange={(e) => setExpectedSitemap(e.target.value)}
                    placeholder="sitemap_tours.xml"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Notes / Business Justification
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Top organic revenue conversion page..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  Add Monitored URL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
