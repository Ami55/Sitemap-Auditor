import React from 'react';
import {
  Plug,
  Search,
  Database,
  FileText,
  BarChart3,
  Bell,
  Clock,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export const SettingsIntegrationsView: React.FC = () => {
  const integrations = [
    {
      name: 'Google Search Console (GSC) API',
      badge: 'Coming later',
      icon: Search,
      description:
        'Import search performance URLs and indexation coverage feeds. Discovers orphan pages receiving organic impressions that lack internal links.',
      benefit: 'Eliminates blind spots for orphan URLs indexed by Google.',
    },
    {
      name: 'CMS & Database Direct Connectors',
      badge: 'Coming later',
      icon: Database,
      description:
        'Connect directly to WordPress, Shopify, Contentful, or PostgreSQL/MySQL databases to extract 100% of published active entity records.',
      benefit: 'Guarantees complete page inventory regardless of site architecture depth.',
    },
    {
      name: 'Server Access Log Analyzer',
      badge: 'Coming later',
      icon: FileText,
      description:
        'Stream web server access logs (Nginx, Apache, Cloudflare) to observe every URL crawled by Googlebot and search engine spiders.',
      benefit: 'Detects crawl budget waste on legacy redirect chains and 404s.',
    },
    {
      name: 'Google Analytics 4 (GA4)',
      badge: 'Coming later',
      icon: BarChart3,
      description:
        'Pull all landing pages that generated user pageviews or organic conversions over the past 90 days.',
      benefit: 'Prioritizes sitemap inclusion for high-traffic revenue generators.',
    },
    {
      name: 'Scheduled Weekly Audits & Drift Alerts',
      badge: 'Coming later',
      icon: Clock,
      description:
        'Automatically re-run polite sitemap coverage audits every week and alert the engineering team if coverage drops below 95%.',
      benefit: 'Catches CMS publishing regressions before Google de-indexes pages.',
    },
    {
      name: 'Slack & Webhook Integrations',
      badge: 'Coming later',
      icon: Bell,
      description:
        'Send instantaneous issue notifications and Jira tickets directly to DevOps and SEO communication channels.',
      benefit: 'Accelerates engineering resolution cycles for critical SEO defects.',
    },
  ];

  return (
    <div id="settings-integrations-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Plug className="w-5 h-5 text-blue-600" />
            <span>Future Integrations & Data Sources</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Connecting external data sources will expand coverage beyond internal link discovery and eliminate crawler blind spots.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900">
                  {item.name}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-blue-900 bg-blue-50/60 p-2.5 rounded-lg border border-blue-100">
                <strong className="text-blue-950 font-semibold block mb-0.5">Coverage Benefit:</strong>
                <span>{item.benefit}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
