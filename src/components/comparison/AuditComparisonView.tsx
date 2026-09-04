import React, { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, GitCompareArrows, Minus, ShieldCheck, TriangleAlert } from 'lucide-react';
import { AuditProject } from '../../types/audit.js';

interface Props { projects: AuditProject[]; currentAuditId: string; }

export const AuditComparisonView: React.FC<Props> = ({ projects, currentAuditId }) => {
  const completed = projects.filter((project) => project.status === 'completed');
  const currentDefault = completed.find((project) => project.id === currentAuditId)?.id || completed[0]?.id || '';
  const baselineDefault = completed.find((project) => project.id !== currentDefault && project.domain === completed.find((p) => p.id === currentDefault)?.domain)?.id
    || completed.find((project) => project.id !== currentDefault)?.id || '';
  const [baselineId, setBaselineId] = useState(baselineDefault);
  const [comparisonId, setComparisonId] = useState(currentDefault);
  const baseline = completed.find((project) => project.id === baselineId);
  const comparison = completed.find((project) => project.id === comparisonId);
  const comparable = baseline && comparison && baseline.id !== comparison.id;
  const sameDomain = comparable && baseline.domain === comparison.domain;

  const metrics = useMemo(() => {
    if (!baseline || !comparison) return [];
    const rows = [
      { label: 'Sitemap coverage', before: baseline.stats.sitemapCoveragePercentage, after: comparison.stats.sitemapCoveragePercentage, suffix: '%', lowerIsBetter: false },
      { label: 'Inclusion candidates', before: baseline.stats.potentiallyMissingUrlsCount, after: comparison.stats.potentiallyMissingUrlsCount, suffix: '', lowerIsBetter: true },
      { label: 'Critical issues', before: baseline.stats.criticalIssuesCount, after: comparison.stats.criticalIssuesCount, suffix: '', lowerIsBetter: true },
      { label: 'Invalid sitemap URLs', before: baseline.stats.invalidSitemapUrlsCount + baseline.stats.sitemapBrokenCount + baseline.stats.sitemapRedirectCount, after: comparison.stats.invalidSitemapUrlsCount + comparison.stats.sitemapBrokenCount + comparison.stats.sitemapRedirectCount, suffix: '', lowerIsBetter: true },
      { label: 'Canonical mismatches', before: baseline.stats.canonicalMismatchCount, after: comparison.stats.canonicalMismatchCount, suffix: '', lowerIsBetter: true },
      { label: 'Discovered URLs', before: baseline.stats.totalDiscoveredInternalUrls, after: comparison.stats.totalDiscoveredInternalUrls, suffix: '', lowerIsBetter: null },
    ];
    return rows.map((row) => ({ ...row, delta: row.after - row.before }));
  }, [baseline, comparison]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-slate-200 pb-4"><h2 className="text-xl font-bold flex items-center gap-2"><GitCompareArrows className="w-5 h-5 text-violet-600" /> Audit comparison</h2><p className="text-xs text-slate-500 mt-1">Measure improvements and regressions between two completed snapshots.</p></div>
      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
          <label><span className="text-xs font-bold text-slate-600 block mb-2">Baseline audit</span><select value={baselineId} onChange={(e) => setBaselineId(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm"><option value="">Select baseline</option>{completed.map((project) => <option key={project.id} value={project.id}>{project.domain} · {new Date(project.updatedAt).toLocaleDateString()}{project.isDemo ? ' · demo' : ''}</option>)}</select></label>
          <GitCompareArrows className="w-5 h-5 text-slate-400 mb-3 hidden md:block" />
          <label><span className="text-xs font-bold text-slate-600 block mb-2">Newer audit</span><select value={comparisonId} onChange={(e) => setComparisonId(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm"><option value="">Select newer audit</option>{completed.map((project) => <option key={project.id} value={project.id}>{project.domain} · {new Date(project.updatedAt).toLocaleDateString()}{project.isDemo ? ' · demo' : ''}</option>)}</select></label>
        </div>
      </section>

      {!comparable ? <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-sm text-amber-900"><strong>Two different completed audits are required.</strong> Run the same website again after making changes, then return here to measure the impact.</div> : <>
        <div className={`p-4 rounded-xl border flex items-start gap-3 text-sm ${sameDomain ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-amber-50 border-amber-200 text-amber-950'}`}>{sameDomain ? <ShieldCheck className="w-5 h-5 shrink-0" /> : <TriangleAlert className="w-5 h-5 shrink-0" />}<div><strong>{sameDomain ? 'Comparable snapshots' : 'Different domains selected'}</strong><p className="text-xs mt-0.5">{sameDomain ? `Both audits target ${baseline.domain}. Deltas are suitable for trend review when crawl settings are equivalent.` : 'These results can be explored, but the deltas should not be treated as site improvement or regression.'}</p></div></div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">{metrics.map((metric) => {
          const improved = metric.lowerIsBetter === null ? null : metric.lowerIsBetter ? metric.delta < 0 : metric.delta > 0;
          const worsened = metric.lowerIsBetter === null ? null : metric.lowerIsBetter ? metric.delta > 0 : metric.delta < 0;
          const Icon = metric.delta > 0 ? ArrowUpRight : metric.delta < 0 ? ArrowDownRight : Minus;
          return <div key={metric.label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs"><div className="text-xs font-bold uppercase tracking-wider text-slate-500">{metric.label}</div><div className="flex items-end justify-between mt-3"><div><div className="text-[11px] text-slate-400">{metric.before.toLocaleString()}{metric.suffix} →</div><div className="text-3xl font-extrabold text-slate-900">{metric.after.toLocaleString()}{metric.suffix}</div></div><div className={`flex items-center gap-1 font-bold text-sm ${improved ? 'text-emerald-700' : worsened ? 'text-rose-700' : 'text-slate-500'}`}><Icon className="w-4 h-4" />{metric.delta > 0 ? '+' : ''}{metric.delta.toLocaleString()}{metric.suffix}</div></div></div>;
        })}</div>
        <p className="text-[11px] text-slate-500">Comparison uses stored aggregate measurements. Verify that URL limits, crawl depth, robots policy and sitemap inputs match before presenting a change as causal.</p>
      </>}
    </div>
  );
};
