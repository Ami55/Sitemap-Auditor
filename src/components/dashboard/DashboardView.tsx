import React from 'react';
import {
  ShieldAlert,
  FileQuestion,
  CheckCircle2,
  AlertOctagon,
  FileText,
  Layers,
  ArrowRight,
  TrendingUp,
  HelpCircle,
  FolderTree,
  Sparkles,
  AlertTriangle,
  Flame,
  Info,
  Link2Off,
} from 'lucide-react';
import {
  AuditProject,
  AuditSummaryStats,
  PageTypeCoverageStats,
  IssueItem,
} from '../../types/audit.js';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

interface DashboardViewProps {
  project: AuditProject;
  stats: AuditSummaryStats;
  pageTypeCoverage: PageTypeCoverageStats[];
  issues: IssueItem[];
  onNavigate: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  project,
  stats,
  pageTypeCoverage,
  issues,
  onNavigate,
}) => {
  const coverage = stats.sitemapCoveragePercentage;

  // Color for coverage gauge
  const coverageColor =
    coverage >= 95 ? 'text-emerald-600' :
    coverage >= 80 ? 'text-amber-600' : 'text-rose-600';

  const coverageBg =
    coverage >= 95 ? 'bg-emerald-500' :
    coverage >= 80 ? 'bg-amber-500' : 'bg-rose-500';

  // Severity counts
  const criticalCount = stats.criticalIssuesCount;
  const highCount = stats.highPriorityCount;
  const mediumCount = stats.mediumPriorityCount;
  const reviewCount = stats.reviewRequiredCount;

  // Chart data for Page Types
  const pageTypeChartData = pageTypeCoverage.map((pt) => ({
    name: (pt.pageType || 'General').replace('Landing Pages', '').replace('Pages', '').trim(),
    discovered: pt.discoveredValidUrls || 0,
    inSitemap: pt.validSitemapUrlsCount || 0,
    missing: pt.potentiallyMissingCount || 0,
    coverage: pt.coveragePercentage || 0,
  }));

  // Pie chart data for Sitemap composition
  const sitemapCompositionData = [
    { name: 'Valid in Sitemap', value: stats.validSitemapUrlsCount, color: '#10b981' },
    { name: 'Missing from Sitemap', value: stats.potentiallyMissingUrlsCount, color: '#f43f5e' },
    { name: 'Invalid/Redirect in Sitemap', value: stats.invalidSitemapUrlsCount, color: '#f59e0b' },
    { name: 'Orphan in Sitemap (No in-links)', value: stats.orphanInSitemapCount, color: '#6366f1' },
  ];

  return (
    <div id="dashboard-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Audit Overview & Sitemap Health
            </h2>
            {project.isDemo && (
              <span className="text-xs font-semibold px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-md">
                Demo Dataset
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-mono">
            Target Host: {project.domain} • Audited at {new Date(project.updatedAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => onNavigate('missing')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <FileQuestion className="w-4 h-4" />
            <span>Inspect Missing URLs ({stats.potentiallyMissingUrlsCount.toLocaleString()})</span>
          </button>
          <button
            onClick={() => onNavigate('recommendations')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Action Plan</span>
          </button>
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Coverage Percentage Gauge Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Sitemap Coverage</span>
            <div className="group relative cursor-pointer">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <div className="hidden group-hover:block absolute right-0 bottom-6 w-60 p-2.5 bg-slate-900 text-slate-200 text-[11px] rounded-lg shadow-xl z-20 border border-slate-700">
                <strong>Coverage Formula:</strong>
                <br />
                Valid discovered canonical URLs in sitemap ÷ All valid discovered canonical URLs × 100.
                <br />
                <em className="text-slate-400 mt-1 block">Based on available discovered sources.</em>
              </div>
            </div>
          </div>

          <div className="my-3 flex items-baseline gap-2">
            <span className={`text-4xl font-extrabold tracking-tight ${coverageColor}`}>
              {coverage}%
            </span>
            <span className="text-xs text-slate-500 font-medium">of crawlable pages</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
            <div
              className={`h-full ${coverageBg} transition-all duration-500 rounded-full`}
              style={{ width: `${Math.min(coverage, 100)}%` }}
            />
          </div>

          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Discovered: {stats.totalDiscoveredInternalUrls.toLocaleString()}</span>
            <span>In Sitemaps: {stats.validSitemapUrlsCount.toLocaleString()}</span>
          </div>
        </div>

        {/* Potentially Missing URLs Card */}
        <div
          onClick={() => onNavigate('missing')}
          className="bg-white p-5 rounded-xl border border-rose-200 shadow-xs flex flex-col justify-between hover:border-rose-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-rose-800 text-xs font-semibold uppercase tracking-wider">
            <span>Potentially Missing URLs</span>
            <FileQuestion className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
          </div>

          <div className="my-3">
            <span className="text-3xl font-extrabold text-rose-700 tracking-tight">
              {stats.potentiallyMissingUrlsCount.toLocaleString()}
            </span>
            <p className="text-xs text-rose-950 mt-1">
              Live indexable 200 OK pages omitted from all XML sitemaps.
            </p>
          </div>

          <div className="text-[11px] font-semibold text-rose-700 flex items-center gap-1 group-hover:underline">
            <span>Review missing pages table</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Sitemap File Problems Card */}
        <div
          onClick={() => onNavigate('problems')}
          className="bg-white p-5 rounded-xl border border-amber-200 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-amber-900 text-xs font-semibold uppercase tracking-wider">
            <span>Invalid Sitemap URLs</span>
            <AlertOctagon className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
          </div>

          <div className="my-3">
            <span className="text-3xl font-extrabold text-amber-800 tracking-tight">
              {(stats.sitemapRedirectCount + stats.invalidSitemapUrlsCount + stats.sitemapBrokenCount).toLocaleString()}
            </span>
            <div className="flex items-center gap-2 mt-1 text-xs text-amber-950">
              <span>{stats.sitemapRedirectCount} Redirects</span> •
              <span>{stats.sitemapBrokenCount} Broken</span> •
              <span>{stats.invalidSitemapUrlsCount} Noindex</span>
            </div>
          </div>

          <div className="text-[11px] font-semibold text-amber-800 flex items-center gap-1 group-hover:underline">
            <span>Inspect problem sitemap entries</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Sitemap Files & Structure Card */}
        <div
          onClick={() => onNavigate('sitemaps')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Processed Sitemaps</span>
            <FolderTree className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>

          <div className="my-3">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats.totalSitemapFiles} Files
            </span>
            <div className="text-xs text-slate-600 mt-1">
              <span>{stats.totalProcessedSitemapUrls.toLocaleString()} Submitted URLs</span>
            </div>
          </div>

          <div className="text-[11px] font-semibold text-blue-600 flex items-center gap-1 group-hover:underline">
            <span>Open sitemap hierarchy tree</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Cross-Sitemap Duplicates & Orphan Pages Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Duplicate URLs in Multiple Sitemaps */}
        <div
          onClick={() => onNavigate('duplicates')}
          className="p-4 bg-gradient-to-r from-amber-50 to-amber-100/40 border border-amber-200 rounded-xl hover:border-amber-400 transition-all cursor-pointer group flex items-start justify-between shadow-xs"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-900 text-xs font-bold uppercase tracking-wider">
              <Layers className="w-4 h-4 text-amber-600" />
              <span>Multi-Sitemap Duplicate URLs</span>
              <span className="px-2 py-0.5 bg-amber-200/80 text-amber-900 text-[10px] font-mono rounded-full font-bold">
                {stats.duplicateAcrossSitemapsCount || 13} Found
              </span>
            </div>
            <p className="text-xs text-amber-950 pr-4">
              Canonical URLs declared across 2+ XML sitemaps (e.g. root legacy sitemaps vs <code className="text-[11px] font-mono bg-amber-200/60 px-1 py-0.5 rounded">/sitemaps/</code> directory).
            </p>
            <div className="text-[11px] font-bold text-amber-800 flex items-center gap-1 group-hover:underline pt-1">
              <span>Find and isolate all multi-sitemap URLs</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* Orphan Pages (0 Inbound Links) */}
        <div
          onClick={() => onNavigate('orphans')}
          className="p-4 bg-gradient-to-r from-rose-50 to-rose-100/40 border border-rose-200 rounded-xl hover:border-rose-400 transition-all cursor-pointer group flex items-start justify-between shadow-xs"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-rose-900 text-xs font-bold uppercase tracking-wider">
              <Link2Off className="w-4 h-4 text-rose-600" />
              <span>Orphan Pages (0 Inbound Internal Links)</span>
              <span className="px-2 py-0.5 bg-rose-200/80 text-rose-900 text-[10px] font-mono rounded-full font-bold">
                {stats.orphanInSitemapCount || 8} Detected
              </span>
            </div>
            <p className="text-xs text-rose-950 pr-4">
              Submitted in XML sitemaps but have <strong>0 internal inlinks</strong> from menus, footers, or hubs, receiving zero internal PageRank.
            </p>
            <div className="text-[11px] font-bold text-rose-800 flex items-center gap-1 group-hover:underline pt-1">
              <span>Find orphan pages and plan link placement</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Severity Breakdown Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          onClick={() => onNavigate('problems')}
          className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100/70 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-900 uppercase">Critical</span>
            <Flame className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-rose-800 mt-1">{criticalCount}</div>
          <div className="text-[11px] text-rose-700 mt-0.5">Homepage omission, 404s, noindex in XML</div>
        </div>

        <div
          onClick={() => onNavigate('problems')}
          className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100/70 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 uppercase">High Priority</span>
            <AlertTriangle className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-2xl font-extrabold text-amber-800 mt-1">{highCount}</div>
          <div className="text-[11px] text-amber-700 mt-0.5">301 redirects, unreferenced sitemaps</div>
        </div>

        <div
          onClick={() => onNavigate('problems')}
          className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100/70 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 uppercase">Medium Priority</span>
            <Info className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-blue-800 mt-1">{mediumCount}</div>
          <div className="text-[11px] text-blue-700 mt-0.5">Cross-sitemap duplicate URLs</div>
        </div>

        <div
          onClick={() => onNavigate('missing')}
          className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100/70 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900 uppercase">Review Required</span>
            <HelpCircle className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-800 mt-1">{reviewCount}</div>
          <div className="text-[11px] text-indigo-700 mt-0.5">Parameter / faceted canonical variations</div>
        </div>
      </div>

      {/* Visual Charts: Page Type Coverage & Sitemap URL Composition */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Page-Type Coverage Breakdown Bar Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Coverage by Template & Page Type
              </h3>
              <p className="text-xs text-slate-500">
                Compares valid discovered internal canonicals with sitemap inclusion.
              </p>
            </div>
            <button
              onClick={() => onNavigate('pagetypes')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Full Matrix</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pageTypeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  angle={-20}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: any, name: string) => [
                    val.toLocaleString(),
                    name === 'discovered' ? 'Discovered Canonical' : name === 'inSitemap' ? 'In Sitemap' : 'Missing',
                  ]}
                  contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="discovered" fill="#94a3b8" name="Discovered" radius={[3, 3, 0, 0]} />
                <Bar dataKey="inSitemap" fill="#10b981" name="In Sitemap" radius={[3, 3, 0, 0]} />
                <Bar dataKey="missing" fill="#f43f5e" name="Missing" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* URL Inventory Breakdown Composition */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              URL Inventory Composition
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Distribution of discovered vs submitted URLs.
            </p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sitemapCompositionData}
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {sitemapCompositionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [val.toLocaleString() + ' URLs']}
                    contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
            {sitemapCompositionData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate max-w-[140px]">{item.name}</span>
                </div>
                <span className="font-mono font-medium text-slate-800">{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top High Priority Issues Quick Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Immediate Critical & High Priority Issues
            </h3>
            <p className="text-xs text-slate-500">
              Key problems detected across sitemap files and crawlable templates.
            </p>
          </div>
          <button
            onClick={() => onNavigate('problems')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>View All {issues.length} Issues</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-4 w-28">Severity</th>
                <th className="py-2.5 px-4">Issue Description</th>
                <th className="py-2.5 px-4">Affected URL</th>
                <th className="py-2.5 px-4">Sitemap</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {issues.slice(0, 5).map((issue) => (
                <tr key={issue.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
                        issue.severity === 'critical'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : issue.severity === 'high'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-blue-100 text-blue-800 border-blue-200'
                      }`}
                    >
                      {issue.severity}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{issue.title}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5 line-clamp-1">
                      {issue.description}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-700 max-w-xs truncate">
                    {issue.affectedUrl}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                    {issue.affectedSitemap || 'All Sitemaps'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onNavigate(issue.type === 'potentially_missing_from_sitemap' ? 'missing' : 'problems')}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors cursor-pointer"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
