import React from 'react';
import { CheckCircle2, Clock3, Database, Gauge, ShieldCheck, TriangleAlert } from 'lucide-react';
import { AuditProject, AuditSummaryStats } from '../../types/audit.js';

export const AuditValidationPanel: React.FC<{ project: AuditProject; stats: AuditSummaryStats }> = ({ project, stats }) => {
  const progress = project.crawlProgress;
  const processed = progress?.urlsProcessed || 0;
  const queued = progress?.urlsQueued || 0;
  const completion = project.status === 'completed' ? 100 : processed + queued > 0 ? Math.round((processed / (processed + queued)) * 100) : 0;
  const duration = progress?.endTime && progress?.startTime
    ? Math.max(0, Math.round((new Date(progress.endTime).getTime() - new Date(progress.startTime).getTime()) / 1000))
    : progress?.elapsedSeconds || 0;
  const complete = Boolean(project.dataProvenance?.recordsComplete);

  const cells = [
    { icon: Gauge, label: 'Crawl completion', value: `${completion}%`, detail: `${processed.toLocaleString()} URLs checked` },
    { icon: Database, label: 'Sitemap evidence', value: `${stats.totalSitemapFiles.toLocaleString()} files`, detail: `${stats.totalProcessedSitemapUrls.toLocaleString()} entries parsed` },
    { icon: ShieldCheck, label: 'robots.txt policy', value: project.crawlConfig.respectRobotsTxt ? 'Respected' : 'Disabled', detail: project.crawlConfig.userAgent || 'Default crawler agent' },
    { icon: Clock3, label: 'Audit duration', value: duration ? `${duration.toLocaleString()} sec` : 'Not available', detail: `Limit: ${project.crawlConfig.maxUrls.toLocaleString()} URLs` },
  ];

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs" aria-label="Audit validation">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div><h3 className="font-bold text-slate-900 flex items-center gap-2">{complete ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <TriangleAlert className="w-5 h-5 text-amber-600" />} Audit validation</h3><p className="text-xs text-slate-500 mt-1">Scope and collection details behind this report.</p></div>
        <span className={`self-start px-2.5 py-1 rounded-full text-[11px] font-bold border ${complete ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-900 border-amber-200'}`}>{complete ? 'Complete for configured scope' : 'Partial evidence — interpret carefully'}</span>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {cells.map(({ icon: Icon, label, value, detail }) => <div key={label} className="bg-slate-50 border border-slate-200 rounded-xl p-3"><div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 flex items-center gap-1.5"><Icon className="w-3.5 h-3.5 text-violet-600" />{label}</div><div className="text-lg font-extrabold mt-1 text-slate-900">{value}</div><div className="text-[10px] text-slate-500 mt-0.5 truncate" title={detail}>{detail}</div></div>)}
      </div>
      <p className="text-[11px] text-slate-600 mt-4 border-t border-slate-200 pt-3"><strong>Claim boundary:</strong> “Sitemap inclusion candidate” means discovered and technically eligible under the configured evidence. It does not mean “not indexed by Google.” Failed requests and URLs outside configured discovery sources may be absent.</p>
    </section>
  );
};
