import React from 'react';
import {
  LayoutDashboard,
  FolderTree,
  FileQuestion,
  AlertOctagon,
  Layers,
  Compass,
  HelpCircle,
  ShieldAlert,
  Sliders,
  Sparkles,
  Download,
  Plug,
  ExternalLink,
  Link2Off,
  CopyCheck,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'sitemaps'
  | 'duplicates'
  | 'orphans'
  | 'missing'
  | 'problems'
  | 'pagetypes'
  | 'taxonomy'
  | 'critical'
  | 'howitworks'
  | 'config'
  | 'recommendations'
  | 'exports'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  missingCount: number;
  problemsCount: number;
  criticalIssuesCount: number;
  duplicateCount?: number;
  orphanCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  missingCount,
  problemsCount,
  criticalIssuesCount,
  duplicateCount = 13,
  orphanCount = 8,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'sitemaps' as NavTab,
      label: 'Sitemap Explorer',
      icon: FolderTree,
      badge: null,
    },
    {
      id: 'duplicates' as NavTab,
      label: 'Duplicate URLs Finder',
      icon: Layers,
      badge: duplicateCount > 0 ? `${duplicateCount}` : null,
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    },
    {
      id: 'orphans' as NavTab,
      label: 'Orphan Pages Finder',
      icon: Link2Off,
      badge: orphanCount > 0 ? `${orphanCount}` : null,
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    },
    {
      id: 'missing' as NavTab,
      label: 'Missing from Sitemap',
      icon: FileQuestion,
      badge: missingCount > 0 ? missingCount.toLocaleString() : null,
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    },
    {
      id: 'problems' as NavTab,
      label: 'Sitemap Problems',
      icon: AlertOctagon,
      badge: problemsCount > 0 ? problemsCount.toLocaleString() : null,
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
    },
    {
      id: 'pagetypes' as NavTab,
      label: 'Page-Type Coverage',
      icon: Layers,
      badge: null,
    },
    {
      id: 'taxonomy' as NavTab,
      label: 'URL Taxonomy & Classifier',
      icon: Compass,
      badge: '11',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    {
      id: 'howitworks' as NavTab,
      label: 'How It Works',
      icon: HelpCircle,
      badge: 'Guide',
      badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    },
    {
      id: 'critical' as NavTab,
      label: 'Critical Pages Monitor',
      icon: ShieldAlert,
      badge: criticalIssuesCount > 0 ? `${criticalIssuesCount}` : null,
      badgeColor: 'bg-rose-100 text-rose-700 border-rose-200',
    },
    {
      id: 'recommendations' as NavTab,
      label: 'AI Recommendations',
      icon: Sparkles,
      badge: 'Gemini',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    {
      id: 'config' as NavTab,
      label: 'Crawl Configuration',
      icon: Sliders,
      badge: null,
    },
    {
      id: 'exports' as NavTab,
      label: 'Exports & Reports',
      icon: Download,
      badge: null,
    },
    {
      id: 'settings' as NavTab,
      label: 'Future Integrations',
      icon: Plug,
      badge: 'Soon',
      badgeColor: 'bg-slate-200 text-slate-700 border-slate-300',
    },
  ];

  return (
    <aside
      id="app-main-sidebar"
      className="w-72 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-61px)] border-r border-slate-800"
    >
      <div className="p-4 border-b border-slate-800">
        <div className="text-xs uppercase tracking-wider text-blue-400 font-bold mb-0.5">
          SemanticMapper Engine
        </div>
        <div className="text-xs text-slate-400">
          Deterministic Link & Sitemap Auditor
        </div>
      </div>

      {/* Nav List */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-1">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`inline-flex items-center justify-center h-5 min-w-[20px] px-2 text-[10px] font-bold rounded-full border shrink-0 whitespace-nowrap leading-none ml-2 ${
                    isActive
                      ? 'bg-blue-800 text-blue-50 border-blue-400/60'
                      : item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3.5 border-t border-slate-800 text-[11px] text-slate-400 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <span>Max Crawl Limit:</span>
          <span className="text-slate-200 font-mono font-medium">250,000 URLs</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span>Robots.txt:</span>
          <span className="text-emerald-400 font-medium">Enforced</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span>Domain Bound:</span>
          <span className="text-slate-200 font-medium">Same-Host Only</span>
        </div>
      </div>
    </aside>
  );
};
