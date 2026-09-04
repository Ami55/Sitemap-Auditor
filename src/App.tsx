import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header.js';
import { Sidebar, NavTab } from './components/layout/Sidebar.js';
import { NewAuditModal } from './components/audit/NewAuditModal.js';
import { StartAuditView, CreateAuditParams } from './components/audit/StartAuditView.js';
import { DashboardView } from './components/dashboard/DashboardView.js';
import { SitemapExplorerView } from './components/sitemaps/SitemapExplorerView.js';
import { MissingUrlsView } from './components/missing/MissingUrlsView.js';
import { SitemapProblemsView } from './components/problems/SitemapProblemsView.js';
import { PageTypeCoverageView } from './components/pagetypes/PageTypeCoverageView.js';
import { UrlTaxonomyClassifierView } from './components/taxonomy/UrlTaxonomyClassifierView.js';
import { DuplicateUrlsView } from './components/duplicates/DuplicateUrlsView.js';
import { OrphanPagesView } from './components/orphans/OrphanPagesView.js';
import { HowItWorksView } from './components/howitworks/HowItWorksView.js';
import { CriticalPagesView } from './components/critical/CriticalPagesView.js';
import { RecommendationsView } from './components/recommendations/RecommendationsView.js';
import { CrawlConfigView } from './components/config/CrawlConfigView.js';
import { ExportsView } from './components/exports/ExportsView.js';
import { SettingsIntegrationsView } from './components/settings/SettingsIntegrationsView.js';
import { AuditComparisonView } from './components/comparison/AuditComparisonView.js';
import {
  AuditProject,
  AuditSummaryStats,
  PageTypeCoverageStats,
  IssueItem,
  SitemapFileRecord,
  CriticalPageItem,
  DeveloperTicket,
  AuditRecommendation,
} from './types/audit.js';
import { Loader2 } from 'lucide-react';

export function App() {
  const [projects, setProjects] = useState<AuditProject[]>([]);
  const [currentProject, setCurrentProject] = useState<AuditProject | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isNewAuditModalOpen, setIsNewAuditModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasEnteredWorkspace, setHasEnteredWorkspace] = useState(false);
  const [isCreatingAudit, setIsCreatingAudit] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Loaded audit detail states
  const [stats, setStats] = useState<AuditSummaryStats | null>(null);
  const [pageTypeCoverage, setPageTypeCoverage] = useState<PageTypeCoverageStats[]>([]);
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [sitemaps, setSitemaps] = useState<SitemapFileRecord[]>([]);
  const [duplicateUrls, setDuplicateUrls] = useState<{ normalizedUrl: string; sitemaps: string[] }[]>([]);
  const [patternCandidates, setPatternCandidates] = useState<SitemapFileRecord[]>([]);
  const [criticalPages, setCriticalPages] = useState<CriticalPageItem[]>([]);
  const [recommendation, setRecommendation] = useState<AuditRecommendation | undefined>(undefined);
  const [tickets, setTickets] = useState<DeveloperTicket[]>([]);

  // 1. Load Projects
  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/audits');
      if (res.ok) {
        const data: AuditProject[] = await res.json();
        setProjects(data);
      }
    } catch (e) {
      console.error('Error fetching projects:', e);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // 2. Load Active Audit Data
  const loadAuditData = async (auditId: string) => {
    setIsRefreshing(true);
    try {
      const [resSummary, resSitemaps, resProblems, resPageTypes, resCritical] = await Promise.all([
        fetch(`/api/audits/${auditId}`),
        fetch(`/api/audits/${auditId}/sitemaps`),
        fetch(`/api/audits/${auditId}/problems`),
        fetch(`/api/audits/${auditId}/page-types`),
        fetch(`/api/audits/${auditId}/critical-pages`),
      ]);

      if (resSummary.ok) {
        const sumData = await resSummary.json();
        setCurrentProject(sumData.project);
        setStats(sumData.stats);
        setRecommendation(sumData.recommendation);
        setTickets(sumData.tickets || []);
      }

      if (resSitemaps.ok) {
        const smData = await resSitemaps.json();
        setSitemaps(smData.sitemaps || []);
        setDuplicateUrls(smData.duplicateUrls || []);
        setPatternCandidates(smData.patternCandidates || []);
      }

      if (resProblems.ok) {
        const probData = await resProblems.json();
        setIssues(probData.allIssues || []);
      }

      if (resPageTypes.ok) {
        const ptData = await resPageTypes.json();
        setPageTypeCoverage(ptData.coverage || []);
      }

      if (resCritical.ok) {
        const critData = await resCritical.json();
        setCriticalPages(critData || []);
      }
    } catch (e) {
      console.error('Failed to load audit data:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (currentProject?.id) {
      loadAuditData(currentProject.id);
    }
  }, [currentProject?.id]);

  // Real-time polling when crawling
  useEffect(() => {
    if (!currentProject) return;
    const isRunning =
      currentProject.status === 'crawling' ||
      currentProject.status === 'discovering_sitemaps' ||
      currentProject.status === 'analyzing';

    if (!isRunning) return;

    const interval = setInterval(() => {
      loadAuditData(currentProject.id);
    }, 2500);

    return () => clearInterval(interval);
  }, [currentProject?.id, currentProject?.status]);

  // Actions
  const handleSelectProject = (id: string) => {
    const p = projects.find((x) => x.id === id);
    if (p) {
      setCurrentProject(p);
      setHasEnteredWorkspace(true);
    }
  };

  const handleCreateAudit = async (params: CreateAuditParams): Promise<boolean> => {
    setIsCreatingAudit(true);
    setCreateError(null);
    try {
      const res = await fetch('/api/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        const newProject: AuditProject = await res.json();
        setProjects((prev) => [newProject, ...prev]);
        setCurrentProject(newProject);
        setActiveTab('dashboard');
        setHasEnteredWorkspace(true);
        setIsNewAuditModalOpen(false);
        return true;
      }
      const body = await res.json().catch(() => null);
      setCreateError(body?.error || `Could not start the audit (HTTP ${res.status}).`);
    } catch (e) {
      console.error('Failed to create audit:', e);
      setCreateError('Could not connect to the audit service. Please try again.');
    } finally {
      setIsCreatingAudit(false);
    }
    return false;
  };

  const handleOpenDemo = () => {
    const demo = projects.find((project) => project.isDemo);
    if (!demo) {
      setCreateError('The illustrative demo dataset is not available.');
      return;
    }
    setCurrentProject(demo);
    setActiveTab('dashboard');
    setHasEnteredWorkspace(true);
    setIsNewAuditModalOpen(false);
    setCreateError(null);
  };

  if (!hasEnteredWorkspace) {
    return (
      <StartAuditView
        projects={projects}
        onStart={handleCreateAudit}
        onOpenDemo={handleOpenDemo}
        onOpenExisting={handleSelectProject}
        isSubmitting={isCreatingAudit}
        error={createError}
      />
    );
  }

  const handlePauseCrawl = async () => {
    if (!currentProject) return;
    await fetch(`/api/audits/${currentProject.id}/pause`, { method: 'POST' });
    loadAuditData(currentProject.id);
  };

  const handleResumeCrawl = async () => {
    if (!currentProject) return;
    await fetch(`/api/audits/${currentProject.id}/resume`, { method: 'POST' });
    loadAuditData(currentProject.id);
  };

  const handleStopCrawl = async () => {
    if (!currentProject) return;
    await fetch(`/api/audits/${currentProject.id}/stop`, { method: 'POST' });
    loadAuditData(currentProject.id);
  };

  const handleAddCriticalPage = async (page: any) => {
    if (!currentProject) return;
    try {
      const res = await fetch(`/api/audits/${currentProject.id}/critical-pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(page),
      });
      if (res.ok) {
        const added = await res.json();
        setCriticalPages((prev) => [...prev, added]);
      }
    } catch (e) {
      console.error('Failed to add critical page:', e);
    }
  };

  const handleTriggerTicketForIssue = (
    category: string,
    count: number,
    examples: string[],
    pageType: string = 'General Template'
  ) => {
    setActiveTab('recommendations');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Main Header */}
      <Header
        currentProject={currentProject}
        projects={projects}
        onSelectProject={handleSelectProject}
        onOpenNewAuditModal={() => setIsNewAuditModalOpen(true)}
        onOpenHowItWorks={() => setActiveTab('howitworks')}
        onPauseCrawl={handlePauseCrawl}
        onResumeCrawl={handleResumeCrawl}
        onStopCrawl={handleStopCrawl}
        onRefresh={() => currentProject && loadAuditData(currentProject.id)}
        isRefreshing={isRefreshing}
        onBackToStart={() => setHasEnteredWorkspace(false)}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          missingCount={stats?.potentiallyMissingUrlsCount || 0}
          problemsCount={
            (stats?.sitemapRedirectCount || 0) +
            (stats?.invalidSitemapUrlsCount || 0) +
            (stats?.sitemapBrokenCount || 0)
          }
          criticalIssuesCount={stats?.criticalIssuesCount || 0}
          duplicateCount={duplicateUrls.length || stats?.duplicateAcrossSitemapsCount || 0}
          orphanCount={stats?.orphanInSitemapCount || 0}
        />

        {/* Content View Container */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto overflow-x-hidden flex flex-col justify-between">
          <div>
            {!currentProject || !stats ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
                <p className="text-xs font-semibold">Loading Sitemap Coverage Audit data...</p>
              </div>
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  <DashboardView
                    project={currentProject}
                    stats={stats}
                    pageTypeCoverage={pageTypeCoverage}
                    issues={issues}
                    onNavigate={setActiveTab}
                  />
                )}

                {activeTab === 'comparison' && (
                  <AuditComparisonView projects={projects} currentAuditId={currentProject.id} />
                )}

                {activeTab === 'sitemaps' && (
                  <SitemapExplorerView
                    sitemaps={sitemaps}
                    duplicateUrls={duplicateUrls}
                    patternCandidates={patternCandidates}
                    onInspectUrl={() => {}}
                    onNavigateToDuplicates={() => setActiveTab('duplicates')}
                  />
                )}

                {activeTab === 'duplicates' && (
                  <DuplicateUrlsView
                    auditId={currentProject.id}
                    domain={currentProject.domain}
                    onGenerateTicket={(pt, count, ex) => {
                      handleTriggerTicketForIssue('Multi-Sitemap Duplicate URLs', count, ex, pt);
                    }}
                  />
                )}

                {activeTab === 'orphans' && (
                  <OrphanPagesView
                    auditId={currentProject.id}
                    domain={currentProject.domain}
                    onGenerateTicket={(pt, count, ex) => {
                      handleTriggerTicketForIssue('Orphan Pages without Inbound Links', count, ex, pt);
                    }}
                  />
                )}

                {activeTab === 'missing' && (
                  <MissingUrlsView
                    auditId={currentProject.id}
                    domain={currentProject.domain}
                    pageTypeCoverage={pageTypeCoverage}
                    onGenerateTicketForMissing={(pt, count, ex) => {
                      handleTriggerTicketForIssue('Missing from Sitemaps', count, ex, pt);
                    }}
                  />
                )}

                {activeTab === 'problems' && (
                  <SitemapProblemsView
                    auditId={currentProject.id}
                    issues={issues}
                    onIssueReviewed={(updated) => setIssues((current) => current.map((issue) => issue.id === updated.id ? updated : issue))}
                    onGenerateTicket={(cat, count, ex, pt) => {
                      handleTriggerTicketForIssue(cat, count, ex, pt);
                    }}
                  />
                )}

                {activeTab === 'pagetypes' && (
                  <PageTypeCoverageView
                    auditId={currentProject.id}
                    pageTypeCoverage={pageTypeCoverage}
                    onGenerateTicket={(pt, count, ex) => {
                      handleTriggerTicketForIssue('Template Missing from Sitemaps', count, ex, pt);
                    }}
                    onRefreshRules={() => loadAuditData(currentProject.id)}
                  />
                )}

                {activeTab === 'taxonomy' && (
                  <UrlTaxonomyClassifierView
                    auditId={currentProject.id}
                    onSelectUrl={(u) => console.log('Selected url:', u)}
                  />
                )}

                {activeTab === 'howitworks' && (
                  <HowItWorksView
                    onNavigateToTab={(tab) => setActiveTab(tab as NavTab)}
                  />
                )}

                {activeTab === 'critical' && (
                  <CriticalPagesView
                    auditId={currentProject.id}
                    criticalPages={criticalPages}
                    onAddCriticalPage={handleAddCriticalPage}
                  />
                )}

                {activeTab === 'recommendations' && (
                  <RecommendationsView
                    auditId={currentProject.id}
                    domain={currentProject.domain}
                    recommendation={recommendation}
                    savedTickets={tickets}
                    pageTypeCoverage={pageTypeCoverage}
                    issues={issues}
                    onRefreshRecommendations={() => loadAuditData(currentProject.id)}
                    onTicketGenerated={(t) => setTickets((prev) => [t, ...prev])}
                  />
                )}

                {activeTab === 'config' && (
                  <CrawlConfigView config={currentProject.crawlConfig} />
                )}

                {activeTab === 'exports' && (
                  <ExportsView
                    auditId={currentProject.id}
                    domain={currentProject.domain}
                    stats={stats}
                    issues={issues}
                  />
                )}

                {activeTab === 'settings' && <SettingsIntegrationsView />}
              </>
            )}
          </div>

          {/* Dedicated Application Footer */}
          <footer
            id="app-main-footer"
            className="mt-12 pt-6 pb-4 border-t border-slate-200 text-center text-xs text-slate-500"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto px-2">
              <p className="font-medium text-slate-600">
                © 2026 Sitemap Auditor. Developed by <strong className="sg-developer">Ami - SEO Girl</strong>. All rights reserved.
              </p>
              <div className="flex items-center gap-4 text-slate-500 text-[11px]">
                <span>Deterministic Link Graph Analysis</span>
                <span>•</span>
                <span>Enterprise XML Sitemap Protocol</span>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* New Audit Modal */}
      <NewAuditModal
        isOpen={isNewAuditModalOpen}
        onClose={() => setIsNewAuditModalOpen(false)}
        onSubmit={handleCreateAudit}
        onLoadDemo={handleOpenDemo}
      />
    </div>
  );
}

export default App;
