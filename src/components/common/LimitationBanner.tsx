import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

export const LimitationBanner: React.FC = () => {
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
            “Crawling can only discover pages accessible through internal links or provided URL sources. Pages with no internal links, no sitemap inclusion and no external data source may not be discovered. Connecting Google Search Console, CMS data, analytics or server logs in the future will improve coverage.”
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
