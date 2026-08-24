import React, { useState } from 'react';
import {
  Layers,
  HelpCircle,
  Plus,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Info,
  Sparkles,
  Download,
  Code,
  X,
  RotateCcw,
} from 'lucide-react';
import { PageTypeCoverageStats, PageTypeRule } from '../../types/audit.js';

interface PageTypeCoverageViewProps {
  auditId: string;
  pageTypeCoverage: PageTypeCoverageStats[];
  onGenerateTicket: (pageType: string, count: number, examples: string[]) => void;
  onRefreshRules: () => void;
}

export const PageTypeCoverageView: React.FC<PageTypeCoverageViewProps> = ({
  auditId,
  pageTypeCoverage,
  onGenerateTicket,
  onRefreshRules,
}) => {
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [rules, setRules] = useState<PageTypeRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [savingRules, setSavingRules] = useState(false);

  const openRuleModal = async () => {
    setIsRuleModalOpen(true);
    setLoadingRules(true);
    try {
      const res = await fetch(`/api/audits/${auditId}/page-types`);
      if (res.ok) {
        const data = await res.json();
        setRules(data.rules || []);
      }
    } catch (e) {
      console.error('Failed to load rules:', e);
    } finally {
      setLoadingRules(false);
    }
  };

  const handleSaveRules = async () => {
    setSavingRules(true);
    try {
      const res = await fetch(`/api/audits/${auditId}/page-types`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules }),
      });
      if (res.ok) {
        setIsRuleModalOpen(false);
        onRefreshRules();
      }
    } catch (e) {
      console.error('Failed to update rules:', e);
    } finally {
      setSavingRules(false);
    }
  };

  const handleAddRule = () => {
    const newRule: PageTypeRule = {
      id: 'rule-' + Math.random().toString(36).substring(2, 7),
      name: 'New Custom Template',
      pattern: '^/custom-path/',
      expectedSitemap: 'sitemap_custom.xml',
      isIndexableDefault: true,
      priority: 'high',
    };
    setRules([...rules, newRule]);
  };

  const handleUpdateRule = (index: number, field: keyof PageTypeRule, value: any) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], [field]: value };
    setRules(updated);
  };

  const handleDeleteRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  return (
    <div id="page-type-coverage-view" className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <span>Page-Type & Template Coverage Matrix</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Identify template-level sitemap omission patterns across different section directories.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <a
            id="btn-export-pagetypes-csv"
            href={`/api/audits/${auditId}/export/pagetypes`}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold border border-slate-300 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </a>
          <button
            onClick={openRuleModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Code className="w-4 h-4" />
            <span>Configure Page-Type Rules</span>
          </button>
        </div>
      </div>

      {/* Coverage Formula Explanation Box */}
      <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl text-blue-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-bold text-slate-900">Deterministic Coverage Formula:</div>
            <div className="font-mono bg-white px-2.5 py-1 rounded-md border border-blue-200 text-blue-900 inline-block font-semibold">
              Coverage % = (Valid Discovered URLs in Sitemap ÷ Total Valid Discovered URLs) × 100
            </div>
            <p className="text-slate-600 text-[11px]">
              Non-canonical, 301 redirecting, and 404 URLs are excluded from the valid denominator so coverage directly reflects true indexable pages.
            </p>
          </div>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold">
                <th className="py-3 px-4">Page Type / Template</th>
                <th className="py-3 px-4">Expected Sitemap</th>
                <th className="py-3 px-4 text-right">Discovered Valid</th>
                <th className="py-3 px-4 text-right">In Sitemap</th>
                <th className="py-3 px-4 text-right">Missing Count</th>
                <th className="py-3 px-4 w-44">Coverage %</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageTypeCoverage.map((pt) => {
                const coverage = pt.coveragePercentage;
                const isCritical = pt.severity === 'critical';
                const isHigh = pt.severity === 'high';
                const isMedium = pt.severity === 'medium';
                const isHealthy = pt.severity === 'healthy';

                return (
                  <tr key={pt.pageType} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{pt.pageType}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {pt.recommendedAction}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-blue-700">
                      {pt.expectedSitemap}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800">
                      {pt.discoveredValidUrls.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-emerald-700 font-semibold">
                      {pt.inSitemapCount.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-700">
                      {pt.potentiallyMissingCount > 0 ? pt.potentiallyMissingCount.toLocaleString() : '0'}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                          <div
                            className={`h-full rounded-full ${
                              coverage >= 95
                                ? 'bg-emerald-500'
                                : coverage >= 80
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(coverage, 100)}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-[11px] text-slate-800 w-10 text-right">
                          {coverage}%
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
                          isCritical
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : isHigh
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : isMedium
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        {pt.severity}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {pt.potentiallyMissingCount > 0 && (
                        <button
                          onClick={() =>
                            onGenerateTicket(
                              pt.pageType,
                              pt.potentiallyMissingCount,
                              [
                                `https://${auditId}.example.com/${(pt.pageType || 'template').toLowerCase().replace(/\s+/g, '-')}/sample-1`,
                              ]
                            )
                          }
                          className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors cursor-pointer flex items-center gap-1 ml-auto"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Dev Ticket</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rules Config Modal */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Page-Type Classification Rules
                </h3>
                <p className="text-xs text-slate-500">
                  Customize regular expressions and expected sitemap targets for each template.
                </p>
              </div>
              <button
                onClick={() => setIsRuleModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 overflow-y-auto flex-1 text-xs">
              {loadingRules ? (
                <div className="text-center py-8 text-slate-500">Loading rules...</div>
              ) : (
                rules.map((rule, idx) => (
                  <div
                    key={rule.id || idx}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Template Name
                        </label>
                        <input
                          type="text"
                          value={rule.name}
                          onChange={(e) => handleUpdateRule(idx, 'name', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Regex URL Pattern
                        </label>
                        <input
                          type="text"
                          value={rule.pattern}
                          onChange={(e) => handleUpdateRule(idx, 'pattern', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Expected Sitemap File
                        </label>
                        <input
                          type="text"
                          value={rule.expectedSitemap}
                          onChange={(e) => handleUpdateRule(idx, 'expectedSitemap', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Priority:</span>
                        <select
                          value={rule.priority}
                          onChange={(e) => handleUpdateRule(idx, 'priority', e.target.value)}
                          className="px-2 py-0.5 border border-slate-300 rounded bg-white"
                        >
                          <option value="critical">Critical</option>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteRule(idx)}
                        className="text-rose-600 hover:text-rose-800 font-semibold"
                      >
                        Remove Rule
                      </button>
                    </div>
                  </div>
                ))
              )}

              <button
                type="button"
                onClick={handleAddRule}
                className="w-full py-2.5 border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-xl text-slate-700 font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Template Classification Rule</span>
              </button>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Saving will re-calculate coverage metrics across all discovered URLs.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingRules}
                  onClick={handleSaveRules}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className={`w-4 h-4 ${savingRules ? 'animate-spin' : ''}`} />
                  <span>Save & Re-calculate</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
