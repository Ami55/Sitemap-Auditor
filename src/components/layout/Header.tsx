import React from 'react';
import {
  Globe,
  Play,
  Pause,
  Square,
  Plus,
  RefreshCw,
  Sparkles,
  Database,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import { AuditProject } from '../../types/audit.js';

interface HeaderProps {
  currentProject: AuditProject | null;
  projects: AuditProject[];
  onSelectProject: (id: string) => void;
  onOpenNewAuditModal: () => void;
  onOpenHowItWorks?: () => void;
  onPauseCrawl: () => void;
  onResumeCrawl: () => void;
  onStopCrawl: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentProject,
  projects,
  onSelectProject,
  onOpenNewAuditModal,
  onOpenHowItWorks,
  onPauseCrawl,
  onResumeCrawl,
  onStopCrawl,
  onRefresh,
  isRefreshing,
}) => {
  const isCrawling = currentProject?.status === 'crawling' || currentProject?.status === 'discovering_sitemaps';
  const isPaused = currentProject?.status === 'paused';

  return (
    <header
      id="app-main-header"
      className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs"
    >
      <div className="px-4 lg:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Project info & selector */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-slate-900 leading-none">
                SemanticMapper
              </h1>
              <span className="text-xs text-blue-600 font-medium hidden sm:inline">Enterprise Sitemap Auditor</span>
              {currentProject?.isDemo && (
                <span
                  id="badge-demo-data"
                  className="px-2 py-0.5 text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300 rounded-full"
                >
                  Demo Scale
                </span>
              )}
              {currentProject && !currentProject.isDemo && (
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full">
                  Live Audit
                </span>
              )}
            </div>

            {/* Audit dropdown selector */}
            <div className="flex items-center gap-2 mt-1">
              <select
                id="select-active-audit"
                value={currentProject?.id || ''}
                onChange={(e) => onSelectProject(e.target.value)}
                className="text-xs font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-md px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.isDemo ? '(Sample 240k Scale)' : `(${p.domain})`}
                  </option>
                ))}
              </select>
              <span className="text-xs text-slate-500 font-mono">
                {currentProject?.domain}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Crawl Status & Controls */}
          {isCrawling && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-900">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>
                Crawling: {currentProject?.crawlProgress?.urlsProcessed || 0} URLs
              </span>
              <button
                id="btn-pause-crawl"
                onClick={onPauseCrawl}
                title="Pause Crawl"
                className="p-1 hover:bg-blue-200 rounded text-blue-700 ml-1"
              >
                <Pause className="w-3.5 h-3.5" />
              </button>
              <button
                id="btn-stop-crawl"
                onClick={onStopCrawl}
                title="Stop Crawl"
                className="p-1 hover:bg-rose-200 rounded text-rose-700"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {isPaused && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-900">
              <Pause className="w-3.5 h-3.5 text-amber-600" />
              <span>Crawl Paused</span>
              <button
                id="btn-resume-crawl"
                onClick={onResumeCrawl}
                title="Resume Crawl"
                className="p-1 bg-amber-200 hover:bg-amber-300 rounded text-amber-900 ml-1 flex items-center gap-1"
              >
                <Play className="w-3 h-3" /> Resume
              </button>
              <button
                id="btn-stop-crawl-paused"
                onClick={onStopCrawl}
                title="Stop Crawl"
                className="p-1 hover:bg-rose-200 rounded text-rose-700"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {currentProject?.status === 'completed' && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Audit Completed</span>
            </div>
          )}

          {/* How It Works Button */}
          {onOpenHowItWorks && (
            <button
              id="btn-header-how-it-works"
              onClick={onOpenHowItWorks}
              className="flex items-center gap-1.5 px-3 py-2 text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
              <span>How It Works</span>
            </button>
          )}

          {/* Refresh Button */}
          <button
            id="btn-refresh-audit"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* New Audit Modal Trigger */}
          <button
            id="btn-new-audit-header"
            onClick={onOpenNewAuditModal}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Audit</span>
          </button>
        </div>
      </div>
    </header>
  );
};

