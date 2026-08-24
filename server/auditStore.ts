import {
  AuditProject,
  CrawledUrlRecord,
  SitemapFileRecord,
  CriticalPageItem,
  PageTypeCoverageStats,
  IssueItem,
  CrawlConfig,
  PageTypeRule,
  IssueSeverity,
} from '../src/types/audit.js';
import { createDemoAuditDataset } from './sampleData.js';
import { SitemapDiscoveryEngine } from './sitemapParser.js';
import { PoliteCrawler } from './crawler.js';
import { AuditAnalyzer, DEFAULT_PAGE_TYPE_RULES } from './analyzer.js';
import { GeminiAuditAdvisor } from './geminiService.js';
import { normalizeUrl } from './normalizer.js';

export interface AuditSession {
  project: AuditProject;
  crawledUrls: Map<string, CrawledUrlRecord>;
  sitemapFiles: Map<string, SitemapFileRecord>;
  allSitemapUrls: Set<string>;
  duplicateUrlsAcrossSitemaps: { normalizedUrl: string; sitemaps: string[] }[];
  patternCandidates: SitemapFileRecord[];
  criticalPages: CriticalPageItem[];
  pageTypeCoverage: PageTypeCoverageStats[];
  pageTypeRules: PageTypeRule[];
  issues: IssueItem[];
  crawlerInstance?: PoliteCrawler;
}

export class AuditStore {
  private audits: Map<string, AuditSession> = new Map();

  constructor() {
    this.initDemoAudit();
  }

  private initDemoAudit() {
    const demo = createDemoAuditDataset();
    const session: AuditSession = {
      project: demo.project,
      crawledUrls: demo.crawledUrls,
      sitemapFiles: demo.sitemapFiles,
      allSitemapUrls: demo.allSitemapUrls,
      duplicateUrlsAcrossSitemaps: demo.duplicateUrlsAcrossSitemaps,
      patternCandidates: demo.patternCandidates,
      criticalPages: demo.criticalPages,
      pageTypeCoverage: demo.pageTypeCoverage,
      pageTypeRules: [...DEFAULT_PAGE_TYPE_RULES],
      issues: demo.issues,
    };
    this.audits.set(demo.project.id, session);
  }

  getAllProjects(): AuditProject[] {
    return Array.from(this.audits.values()).map((s) => s.project);
  }

  getAudit(auditId: string): AuditSession | undefined {
    return this.audits.get(auditId);
  }

  /**
   * Create and launch a new live or demo audit
   */
  async createAudit(params: {
    name: string;
    homepageUrl: string;
    customSitemapUrl?: string;
    additionalSitemaps?: string[];
    config?: Partial<CrawlConfig>;
    isDemo?: boolean;
  }): Promise<AuditProject> {
    const auditId = 'audit-' + Math.random().toString(36).substring(2, 9);
    const normHome = normalizeUrl(params.homepageUrl || 'https://example.com');
    const domain = new URL(normHome).hostname;

    const crawlConfig: CrawlConfig = {
      maxUrls: params.config?.maxUrls || 250000,
      crawlDepth: params.config?.crawlDepth ?? 0,
      crawlSpeed: params.config?.crawlSpeed || 'conservative',
      includeSubdomains: params.config?.includeSubdomains || false,
      respectRobotsTxt: params.config?.respectRobotsTxt ?? true,
      userAgent: params.config?.userAgent || 'SitemapCoverageAuditor/1.0 (+https://example.com/bot)',
      excludeQueryPatterns: params.config?.excludeQueryPatterns || ['sessionid', 'gclid', 'fbclid', 'utm_'],
      excludeDirectoryPatterns: params.config?.excludeDirectoryPatterns || ['/cdn-cgi/', '/wp-admin/', '/checkout/'],
      excludeFileExtensions: params.config?.excludeFileExtensions || ['pdf', 'zip', 'jpg', 'png', 'css', 'js'],
      customSitemapUrls: [
        ...(params.customSitemapUrl ? [params.customSitemapUrl] : []),
        ...(params.additionalSitemaps || []),
      ],
      retryCount: params.config?.retryCount || 2,
    };

    const project: AuditProject = {
      id: auditId,
      name: params.name || `${domain} Sitemap Audit`,
      domain,
      homepageUrl: normHome,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemo: Boolean(params.isDemo),
      status: 'pending',
      crawlConfig,
      stats: {
        totalDiscoveredInternalUrls: 0,
        totalProcessedSitemapUrls: 0,
        potentiallyMissingUrlsCount: 0,
        validSitemapUrlsCount: 0,
        invalidSitemapUrlsCount: 0,
        sitemapCoveragePercentage: 100,
        criticalIssuesCount: 0,
        highPriorityCount: 0,
        mediumPriorityCount: 0,
        reviewRequiredCount: 0,
        orphanInSitemapCount: 0,
        canonicalMismatchCount: 0,
        sitemapRedirectCount: 0,
        sitemapBrokenCount: 0,
        unreferencedSitemapsCount: 0,
        duplicateAcrossSitemapsCount: 0,
        totalSitemapFiles: 0,
      },
      crawlProgress: {
        currentUrl: normHome,
        urlsProcessed: 0,
        urlsQueued: 1,
        sitemapsProcessed: 0,
        elapsedSeconds: 0,
        startTime: new Date().toISOString(),
      },
    };

    const initialCriticalPages: CriticalPageItem[] = [
      {
        id: 'crit-root',
        name: 'Homepage Root',
        url: normHome,
        expectedSitemap: 'sitemap.xml',
        priority: 'critical',
        notes: 'Primary brand entry point.',
        isInternallyLinked: true,
        inSitemap: false,
        httpStatus: 0,
        isIndexable: true,
        hasValidCanonical: true,
        isRedirecting: false,
        isBlocked: false,
      },
    ];

    const session: AuditSession = {
      project,
      crawledUrls: new Map(),
      sitemapFiles: new Map(),
      allSitemapUrls: new Set(),
      duplicateUrlsAcrossSitemaps: [],
      patternCandidates: [],
      criticalPages: initialCriticalPages,
      pageTypeCoverage: [],
      pageTypeRules: [...DEFAULT_PAGE_TYPE_RULES],
      issues: [],
    };

    this.audits.set(auditId, session);

    // Launch execution in background
    this.runAuditJob(auditId).catch((err) => {
      console.error(`Audit ${auditId} execution failed:`, err);
      session.project.status = 'failed';
    });

    return project;
  }

  /**
   * Background Audit Execution Job
   */
  private async runAuditJob(auditId: string) {
    const session = this.audits.get(auditId);
    if (!session) return;

    const startTime = Date.now();
    session.project.status = 'discovering_sitemaps';

    // 1. Discover Sitemaps
    const sitemapEngine = new SitemapDiscoveryEngine(session.project.crawlConfig.userAgent);
    const sitemapResults = await sitemapEngine.discoverAndParseAll(
      session.project.homepageUrl,
      session.project.crawlConfig.customSitemapUrls
    );

    session.sitemapFiles = sitemapResults.sitemapFiles;
    session.allSitemapUrls = sitemapResults.allSitemapUrls;
    session.duplicateUrlsAcrossSitemaps = sitemapResults.duplicateUrlsAcrossSitemaps;
    session.patternCandidates = sitemapResults.patternCandidates;

    session.project.stats.totalSitemapFiles = sitemapResults.sitemapFiles.size;
    session.project.stats.totalProcessedSitemapUrls = sitemapResults.allSitemapUrls.size;
    session.project.crawlProgress!.sitemapsProcessed = sitemapResults.sitemapFiles.size;

    // 2. Fetch robots.txt disallowed paths for crawler
    const robotsResult = await sitemapEngine.fetchRobotsTxtSitemaps(session.project.homepageUrl);
    const disallowedPaths: string[] = [];
    if (robotsResult.robotsContent) {
      for (const line of robotsResult.robotsContent.split('\n')) {
        if (/^disallow:\s*/i.test(line.trim())) {
          disallowedPaths.push(line.trim().replace(/^disallow:\s*/i, '').trim());
        }
      }
    }

    // 3. Run Internal Crawler
    session.project.status = 'crawling';
    const crawler = new PoliteCrawler(
      session.project.homepageUrl,
      session.project.crawlConfig,
      disallowedPaths
    );
    session.crawlerInstance = crawler;

    const crawledMap = await crawler.runCrawl((progress) => {
      session.project.crawlProgress = {
        currentUrl: progress.currentUrl,
        urlsProcessed: progress.urlsProcessed,
        urlsQueued: progress.urlsQueued,
        sitemapsProcessed: session.sitemapFiles.size,
        elapsedSeconds: Math.floor((Date.now() - startTime) / 1000),
        startTime: session.project.crawlProgress!.startTime,
      };
      session.project.stats.totalDiscoveredInternalUrls = progress.urlsProcessed;
    });

    session.crawledUrls = crawledMap;

    // 4. Run Deterministic Analysis & Issue Classification
    session.project.status = 'analyzing';
    const analysis = AuditAnalyzer.analyzeAudit(
      session.crawledUrls,
      session.sitemapFiles,
      session.allSitemapUrls,
      session.duplicateUrlsAcrossSitemaps,
      session.patternCandidates,
      session.pageTypeRules,
      session.criticalPages
    );

    session.crawledUrls = analysis.classifiedUrls;
    session.pageTypeCoverage = analysis.pageTypeCoverage;
    session.issues = analysis.issues;
    session.project.stats = analysis.summaryStats;
    session.criticalPages = analysis.evaluatedCriticalPages;

    // 5. Generate AI Recommendations grounded in facts
    try {
      const sampleMissing = Array.from(session.crawledUrls.values()).filter((u) => u.isPotentiallyMissing);
      const recommendations = await GeminiAuditAdvisor.generateAuditRecommendations(
        session.project.domain,
        session.project.stats,
        session.pageTypeCoverage,
        session.issues,
        sampleMissing
      );
      session.project.recommendation = recommendations;
    } catch (e) {
      console.warn('AI recommendation generation error:', e);
    }

    session.project.status = 'completed';
    session.project.crawlProgress!.endTime = new Date().toISOString();
    session.project.updatedAt = new Date().toISOString();
  }

  pauseAudit(auditId: string): boolean {
    const session = this.audits.get(auditId);
    if (session && session.crawlerInstance) {
      session.crawlerInstance.pause();
      session.project.status = 'paused';
      return true;
    }
    return false;
  }

  resumeAudit(auditId: string): boolean {
    const session = this.audits.get(auditId);
    if (session && session.crawlerInstance) {
      session.crawlerInstance.resume();
      session.project.status = 'crawling';
      return true;
    }
    return false;
  }

  stopAudit(auditId: string): boolean {
    const session = this.audits.get(auditId);
    if (session && session.crawlerInstance) {
      session.crawlerInstance.stop();
      session.project.status = 'stopped';
      return true;
    }
    return false;
  }

  /**
   * Get filterable, searchable, paginated crawled / missing URLs
   */
  getCrawledUrls(
    auditId: string,
    filters: {
      page?: number;
      limit?: number;
      onlyMissing?: boolean;
      pageType?: string;
      priority?: string;
      search?: string;
      httpStatus?: number;
      canonicalStatus?: string;
      suggestedSitemap?: string;
    }
  ): { urls: CrawledUrlRecord[]; total: number; page: number; limit: number } {
    const session = this.audits.get(auditId);
    if (!session) return { urls: [], total: 0, page: 1, limit: 50 };

    const page = filters.page || 1;
    const limit = filters.limit || 50;

    let items = Array.from(session.crawledUrls.values());

    if (filters.onlyMissing) {
      items = items.filter((u) => u.isPotentiallyMissing);
    }

    if (filters.pageType && filters.pageType !== 'all') {
      items = items.filter((u) => u.pageType.toLowerCase() === filters.pageType!.toLowerCase());
    }

    if (filters.priority && filters.priority !== 'all') {
      items = items.filter((u) => u.priority === filters.priority);
    }

    if (filters.httpStatus) {
      items = items.filter((u) => u.httpStatus === filters.httpStatus);
    }

    if (filters.canonicalStatus && filters.canonicalStatus !== 'all') {
      items = items.filter((u) => u.canonicalStatus === filters.canonicalStatus);
    }

    if (filters.suggestedSitemap && filters.suggestedSitemap !== 'all') {
      items = items.filter((u) => u.suggestedSitemap?.toLowerCase().includes(filters.suggestedSitemap!.toLowerCase()));
    }

    if (filters.search) {
      const s = filters.search.toLowerCase();
      items = items.filter(
        (u) =>
          u.normalizedUrl.toLowerCase().includes(s) ||
          (u.pageTitle && u.pageTitle.toLowerCase().includes(s)) ||
          (u.h1 && u.h1.toLowerCase().includes(s))
      );
    }

    const total = items.length;
    const startIndex = (page - 1) * limit;
    const paginated = items.slice(startIndex, startIndex + limit);

    return { urls: paginated, total, page, limit };
  }

  /**
   * Get duplicate URLs present in multiple sitemaps
   */
  getDuplicateUrls(
    auditId: string,
    filters: {
      search?: string;
      sitemap?: string;
      page?: number;
      limit?: number;
    }
  ): {
    duplicates: {
      id: string;
      normalizedUrl: string;
      sitemaps: string[];
      occurrences: number;
      pageType?: string;
      overlapReason?: string;
      httpStatus?: number;
      isIndexable?: boolean;
    }[];
    total: number;
    page: number;
    limit: number;
    uniqueSitemapsInvolved: string[];
  } {
    const session = this.audits.get(auditId);
    if (!session) return { duplicates: [], total: 0, page: 1, limit: 50, uniqueSitemapsInvolved: [] };

    const page = filters.page || 1;
    const limit = filters.limit || 50;

    let items = session.duplicateUrlsAcrossSitemaps.map((d, index) => {
      const crawled = session.crawledUrls.get(d.normalizedUrl);
      let overlapReason = 'Cross-sitemap duplicate submission';
      if (d.sitemaps.some((s) => s.includes('Legacy Root') || s.includes('tours_sitemap_') || s.includes('blog_sitemap'))) {
        overlapReason = 'Active /sitemaps/ vs Legacy Root Sitemaps (Parallel Generation)';
      } else if (d.sitemaps.some((s) => s.includes('search_results_'))) {
        overlapReason = 'Primary Category Sitemap vs Search Results Filter Sitemaps';
      }

      return {
        id: `dup-${index + 1}`,
        normalizedUrl: d.normalizedUrl,
        sitemaps: d.sitemaps,
        occurrences: d.sitemaps.length,
        pageType: crawled?.pageType || 'Tour / Destination',
        overlapReason,
        httpStatus: crawled?.httpStatus ?? 200,
        isIndexable: crawled?.isIndexable ?? true,
      };
    });

    if (filters.search) {
      const s = filters.search.toLowerCase();
      items = items.filter(
        (item) =>
          item.normalizedUrl.toLowerCase().includes(s) ||
          item.sitemaps.some((sm) => sm.toLowerCase().includes(s)) ||
          item.overlapReason.toLowerCase().includes(s) ||
          (item.pageType && item.pageType.toLowerCase().includes(s))
      );
    }

    if (filters.sitemap && filters.sitemap !== 'all') {
      const smFilter = filters.sitemap.toLowerCase();
      items = items.filter((item) =>
        item.sitemaps.some((sm) => sm.toLowerCase().includes(smFilter))
      );
    }

    const uniqueSitemaps = Array.from(
      new Set(session.duplicateUrlsAcrossSitemaps.flatMap((d) => d.sitemaps))
    );

    const total = items.length;
    const startIndex = (page - 1) * limit;
    const paginated = items.slice(startIndex, startIndex + limit);

    return { duplicates: paginated, total, page, limit, uniqueSitemapsInvolved: uniqueSitemaps };
  }

  /**
   * Get orphan pages (in sitemaps with 0 internal links or crawled with 0 links)
   */
  getOrphanUrls(
    auditId: string,
    filters: {
      search?: string;
      pageType?: string;
      maxLinks?: number;
      page?: number;
      limit?: number;
    }
  ): {
    orphans: {
      id: string;
      url: string;
      normalizedUrl: string;
      pageType: string;
      httpStatus: number;
      inboundInternalLinksCount: number;
      discoverySource: 'sitemap_only' | 'external_or_seed' | 'crawl_shallow';
      sitemapNames: string[];
      isIndexable: boolean;
      pageTitle?: string;
      suggestedAction: string;
      recommendedParentHub?: string;
      priority: IssueSeverity;
    }[];
    total: number;
    page: number;
    limit: number;
    stats: {
      zeroLinksCount: number;
      shallowLinksCount: number;
      totalPagesEvaluated: number;
    };
  } {
    const session = this.audits.get(auditId);
    if (!session) {
      return {
        orphans: [],
        total: 0,
        page: 1,
        limit: 50,
        stats: { zeroLinksCount: 0, shallowLinksCount: 0, totalPagesEvaluated: 0 },
      };
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const maxLinks = filters.maxLinks !== undefined ? filters.maxLinks : 1;

    const allUrls = Array.from(session.crawledUrls.values());
    const zeroLinksCount = allUrls.filter((u) => u.inboundInternalLinksCount === 0 && u.inSitemap).length;
    const shallowLinksCount = allUrls.filter((u) => u.inboundInternalLinksCount === 1 && u.inSitemap).length;

    let items = allUrls
      .filter((u) => u.inboundInternalLinksCount <= maxLinks)
      .map((u) => {
        let suggestedAction = 'Add contextual internal navigation links from parent hub or category menu.';
        if (u.pageType.includes('Blog')) {
          suggestedAction = 'Link from blog category index and related articles, or 301 redirect if outdated.';
        } else if (u.pageType.includes('Static')) {
          suggestedAction = 'Add to site footer navigation or header menu, or purge from XML sitemap if campaign expired.';
        } else if (u.pageType.includes('Tour')) {
          suggestedAction = 'Add to destination city hub carousel and attraction overview page.';
        }

        let recHub = '/';
        if (u.normalizedUrl.includes('rome')) recHub = '/rome-tours';
        else if (u.normalizedUrl.includes('paris')) recHub = '/paris-tours';
        else if (u.normalizedUrl.includes('florence')) recHub = '/florence-tours';
        else if (u.normalizedUrl.includes('blog')) recHub = '/blog';

        return {
          id: u.id,
          url: u.originalUrl,
          normalizedUrl: u.normalizedUrl,
          pageType: u.pageType,
          httpStatus: u.httpStatus,
          inboundInternalLinksCount: u.inboundInternalLinksCount,
          discoverySource: (u.inboundInternalLinksCount === 0
            ? 'sitemap_only'
            : 'crawl_shallow') as 'sitemap_only' | 'external_or_seed' | 'crawl_shallow',
          sitemapNames: u.sitemapNames,
          isIndexable: u.isIndexable,
          pageTitle: u.pageTitle,
          suggestedAction,
          recommendedParentHub: recHub,
          priority: (u.inboundInternalLinksCount === 0 ? 'critical' : 'high') as IssueSeverity,
        };
      });

    if (filters.search) {
      const s = filters.search.toLowerCase();
      items = items.filter(
        (item) =>
          item.normalizedUrl.toLowerCase().includes(s) ||
          (item.pageTitle && item.pageTitle.toLowerCase().includes(s)) ||
          item.pageType.toLowerCase().includes(s) ||
          item.sitemapNames.some((sm) => sm.toLowerCase().includes(s))
      );
    }

    if (filters.pageType && filters.pageType !== 'all') {
      items = items.filter((item) => item.pageType.toLowerCase() === filters.pageType!.toLowerCase());
    }

    const total = items.length;
    const startIndex = (page - 1) * limit;
    const paginated = items.slice(startIndex, startIndex + limit);

    return {
      orphans: paginated,
      total,
      page,
      limit,
      stats: {
        zeroLinksCount,
        shallowLinksCount,
        totalPagesEvaluated: allUrls.length,
      },
    };
  }

  /**
   * Export CSV for various report types
   */
  exportCsv(auditId: string, type: 'missing' | 'all' | 'problems' | 'pagetypes' | 'duplicates' | 'orphans'): string {
    const session = this.audits.get(auditId);
    if (!session) return '';

    if (type === 'duplicates') {
      const dups = this.getDuplicateUrls(auditId, { limit: 10000 }).duplicates;
      const headers = ['URL', 'Page Type', 'Occurrences Count', 'Sitemaps List', 'Overlap Reason'];
      const rows = dups.map((d) => [
        `"${d.normalizedUrl}"`,
        `"${d.pageType || ''}"`,
        d.occurrences,
        `"${d.sitemaps.join('; ').replace(/"/g, '""')}"`,
        `"${(d.overlapReason || '').replace(/"/g, '""')}"`,
      ]);
      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    if (type === 'orphans') {
      const orphs = this.getOrphanUrls(auditId, { limit: 10000, maxLinks: 1 }).orphans;
      const headers = ['URL', 'Page Title', 'Page Type', 'Inbound Internal Links', 'In Sitemap', 'Sitemap Files', 'Suggested Parent Hub', 'Action'];
      const rows = orphs.map((o) => [
        `"${o.normalizedUrl}"`,
        `"${(o.pageTitle || '').replace(/"/g, '""')}"`,
        `"${o.pageType}"`,
        o.inboundInternalLinksCount,
        o.sitemapNames.length > 0 ? 'YES' : 'NO',
        `"${o.sitemapNames.join('; ').replace(/"/g, '""')}"`,
        `"${o.recommendedParentHub || ''}"`,
        `"${o.suggestedAction.replace(/"/g, '""')}"`,
      ]);
      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    if (type === 'missing') {
      const missing = Array.from(session.crawledUrls.values()).filter((u) => u.isPotentiallyMissing);
      const headers = ['URL', 'Page Type', 'HTTP Status', 'Canonical Status', 'Crawl Depth', 'Inbound Links', 'Suggested Sitemap', 'Priority', 'Reason'];
      const rows = missing.map((m) => [
        `"${m.normalizedUrl}"`,
        `"${m.pageType}"`,
        m.httpStatus,
        `"${m.canonicalStatus}"`,
        m.crawlDepth,
        m.inboundInternalLinksCount,
        `"${m.suggestedSitemap || ''}"`,
        `"${m.priority}"`,
        `"${(m.missingReason || '').replace(/"/g, '""')}"`,
      ]);
      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    if (type === 'problems') {
      const headers = ['Issue ID', 'Severity', 'Type', 'Title', 'Affected URL', 'Affected Sitemap', 'Suggested Action'];
      const rows = session.issues.map((i) => [
        `"${i.id}"`,
        `"${i.severity}"`,
        `"${i.type}"`,
        `"${i.title.replace(/"/g, '""')}"`,
        `"${i.affectedUrl}"`,
        `"${i.affectedSitemap || ''}"`,
        `"${i.suggestedAction.replace(/"/g, '""')}"`,
      ]);
      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    if (type === 'pagetypes') {
      const headers = ['Page Type', 'Discovered Valid URLs', 'In Sitemap Count', 'Potentially Missing', 'Coverage %', 'Expected Sitemap', 'Severity', 'Recommended Action'];
      const rows = session.pageTypeCoverage.map((p) => [
        `"${p.pageType}"`,
        p.discoveredValidUrls,
        p.inSitemapCount,
        p.potentiallyMissingCount,
        `${p.coveragePercentage}%`,
        `"${p.expectedSitemap}"`,
        `"${p.severity}"`,
        `"${p.recommendedAction.replace(/"/g, '""')}"`,
      ]);
      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    // Default 'all'
    const all = Array.from(session.crawledUrls.values());
    const headers = ['URL', 'Page Type', 'HTTP Status', 'Indexable', 'In Sitemap', 'Canonical URL', 'Canonical Status', 'Crawl Depth', 'Inbound Links'];
    const rows = all.map((m) => [
      `"${m.normalizedUrl}"`,
      `"${m.pageType}"`,
      m.httpStatus,
      m.isIndexable ? 'YES' : 'NO',
      m.inSitemap ? 'YES' : 'NO',
      `"${m.canonicalUrl || ''}"`,
      `"${m.canonicalStatus}"`,
      m.crawlDepth,
      m.inboundInternalLinksCount,
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  /**
   * Update or Add Critical Page
   */
  addCriticalPage(auditId: string, item: Omit<CriticalPageItem, 'id' | 'isInternallyLinked' | 'inSitemap' | 'httpStatus' | 'isIndexable' | 'hasValidCanonical' | 'isRedirecting' | 'isBlocked'>): CriticalPageItem | undefined {
    const session = this.audits.get(auditId);
    if (!session) return undefined;

    const norm = normalizeUrl(item.url);
    const crawled = session.crawledUrls.get(norm);
    const inSitemap = session.allSitemapUrls.has(norm);

    const newPage: CriticalPageItem = {
      ...item,
      id: 'crit-' + Math.random().toString(36).substring(2, 9),
      url: norm,
      isInternallyLinked: Boolean(crawled && crawled.inboundInternalLinksCount > 0),
      inSitemap,
      httpStatus: crawled ? crawled.httpStatus : inSitemap ? 200 : 0,
      isIndexable: crawled ? crawled.isIndexable : true,
      hasValidCanonical: crawled ? crawled.canonicalStatus === 'self_referencing' || crawled.canonicalStatus === 'missing' : true,
      isRedirecting: Boolean(crawled && (crawled.httpStatus === 301 || crawled.httpStatus === 302)),
      isBlocked: Boolean(crawled?.isRobotsBlocked),
      foundUrl: norm,
      lastChecked: new Date().toISOString(),
    };

    session.criticalPages.push(newPage);
    return newPage;
  }
}

export const auditStore = new AuditStore();
