import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { AuditProject } from '../../types/audit.js';

export const LimitationBanner: React.FC<{ project?: AuditProject | null }> = ({ project }) => {
  if (project?.isDemo) {
    return (
      <div
        id="demo-data-notice-banner"
        className="bg-rose-50 border-b border-rose-300 px-4 py-3 text-rose-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs md:text-sm"
      >
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Illustrative demo — not a live crawl: </span>
            <span>{project.dataProvenance?.note || 'These bundled results are for interface demonstration only.'}</span>
          </div>
        </div>
        <div className="shrink-0 text-xs font-semibold bg-rose-100 px-2.5 py-1 rounded-md border border-rose-300">
          Source: {project.dataProvenance?.sourceLabel || 'Sample data'}
        </div>
      </div>
    );
  }

  return (
    <div
      id="limitation-notice-banner"
      className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-amber-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs md:text-sm"
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-950">Important Scope Limitation: </span>
          <span>
            Crawling only reports URLs found through the configured sources. It does not prove that a URL is indexed by Google. Unchecked, failed, or externally discovered URLs may be absent.
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 self-end md:self-auto text-xs font-medium text-amber-800 bg-amber-100/70 px-2.5 py-1 rounded-md border border-amber-200">
        <Info className="w-3.5 h-3.5" />
        <span>Coverage based on available sources</span>
      </div>
    </div>
  );
};
