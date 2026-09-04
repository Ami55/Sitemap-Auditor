export type AuditStatus = 'pending' | 'discovering_sitemaps' | 'crawling' | 'analyzing' | 'completed' | 'paused' | 'failed' | 'stopped';

export type DiscoverySource =
  | 'internal_crawl'
  | 'sitemap'
  | 'robots_txt'
  | 'manual_input'
  | 'pattern_discovered'
  | 'uploaded_file'
  | 'structured_data'
  | 'future_gsc'
  | 'future_cms'
  | 'future_analytics'
  | 'future_server_log';

export type SitemapFileType =
  | 'sitemap_index'
  | 'url_sitemap'
  | 'invalid_xml'
  | 'html_page'
  | 'redirect'
  | 'unavailable'
  | 'pattern_candidate';

export type CanonicalStatus =
  | 'self_referencing'
  | 'points_to_other_internal'
  | 'points_to_external'
  | 'missing'
  | 'multiple_found'
  | 'review_required';

export type IssueSeverity = 'critical' | 'high' | 'medium' | 'review';

export type IssueType =
  | 'potentially_missing_from_sitemap'
  | 'sitemap_redirect'
  | 'sitemap_broken'
  | 'sitemap_noindex'
  | 'sitemap_robots_blocked'
  | 'canonical_mismatch'
  | 'orphan_in_sitemap'
  | 'duplicate_across_sitemaps'
  | 'unreferenced_sitemap_candidate'
  | 'missing_critical_page'
  | 'invalid_sitemap_xml'
  | 'sitemap_exceeds_limit';

export type TechnicalEligibility = 'eligible' | 'ineligible' | 'review' | 'unchecked';
export type EvidenceConfidence = 'high' | 'medium' | 'low';

export interface AuditEvidence {
  check: string;
  value: string | number | boolean;
  source: 'http_response' | 'html' | 'robots_txt' | 'sitemap' | 'rule_engine' | 'sample_data';
}

export interface CrawlConfig {
  maxUrls: number;
  crawlDepth: number; // 0 = unlimited within host
  crawlSpeed: 'conservative' | 'moderate' | 'fast';
  includeSubdomains: boolean;
  respectRobotsTxt: boolean;
  userAgent: string;
  excludeQueryPatterns: string[];
  excludeDirectoryPatterns: string[];
  excludeFileExtensions: string[];
  customSitemapUrls: string[];
  retryCount: number;
  concurrency?: number;
}

export interface SitemapFileRecord {
  id: string;
  url: string;
  parentSitemapUrl?: string;
  type: SitemapFileType;
  httpStatus: number;
  urlCount: number;
  lastModified?: string;
  fileSizeBytes?: number;
  referencedByParent: boolean;
  discoveredThroughRobots: boolean;
  discoveryMethod: DiscoverySource;
  errors: string[];
  warnings: string[];
  processingDate: string;
  childSitemaps?: string[];
  isPatternCandidate?: boolean;
}

export interface CrawledUrlRecord {
  id: string;
  originalUrl: string;
  normalizedUrl: string;
  finalUrl: string;
  slug?: string;
  httpStatus: number;
  contentType: string;
  isIndexable: boolean;
  metaRobots: string;
  xRobotsTag: string;
  isRobotsBlocked: boolean;
  canonicalUrl?: string;
  canonicalStatus: CanonicalStatus;
  pageTitle?: string;
  h1?: string;
  crawlDepth: number;
  inboundInternalLinksCount: number;
  outboundInternalLinksCount: number;
  inSitemap: boolean;
  sitemapNames: string[];
  discoverySources: DiscoverySource[];
  firstDiscoveredFrom?: string;
  pageType: string;
  pageGroup?: string;
  pageLevel?: string;
  rulePriority?: number;
  redirectChain: string[];
  lastCheckedDate: string;
  isPotentiallyMissing: boolean;
  missingReason?: string;
  suggestedSitemap?: string;
  priority: IssueSeverity;
  technicalEligibility?: TechnicalEligibility;
  eligibilityReason?: string;
  evidence?: AuditEvidence[];
  evidenceConfidence?: EvidenceConfidence;
}

export interface PageTypeRule {
  id: string;
  name: string;
  pageGroup?: string;
  pageLevel?: string;
  rulePriority?: number;
  pattern: string; // regex or glob
  expectedSitemap: string;
  isIndexableDefault: boolean;
  priority: IssueSeverity;
  description?: string;
  exampleUrl?: string;
}

export interface DuplicateUrlItem {
  id: string;
  normalizedUrl: string;
  sitemaps: string[];
  occurrences: number;
  pageType?: string;
  overlapReason?: string;
  httpStatus?: number;
  isIndexable?: boolean;
}

export interface OrphanUrlItem {
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
}

export interface UrlTaxonomyClassification {
  url: string;
  slug: string;
  rulePriority: number;
  pageGroup: string;
  pageLevel: string;
  pageType: string;
  matchedCondition: string;
  expectedSitemap: string;
}

export interface PageTypeCoverageStats {
  pageType: string;
  ruleId: string;
  discoveredValidUrls: number;
  inSitemapCount: number;
  potentiallyMissingCount: number;
  validSitemapUrlsCount: number;
  invalidSitemapUrlsCount: number;
  coveragePercentage: number;
  redirectCount: number;
  canonicalMismatchCount: number;
  notDiscoveredThroughCrawlCount: number;
  expectedSitemap: string;
  severity: IssueSeverity;
  recommendedAction: string;
}

export interface IssueItem {
  id: string;
  type: IssueType;
  severity: IssueSeverity;
  title: string;
  description: string;
  affectedUrl: string;
  affectedSitemap?: string;
  details?: Record<string, any>;
  suggestedAction: string;
  pageType?: string;
  ruleId?: string;
  evidence?: AuditEvidence[];
  confidence?: EvidenceConfidence;
  observedAt?: string;
}

export interface CriticalPageItem {
  id: string;
  name: string;
  url: string;
  pattern?: string;
  expectedSitemap: string;
  priority: IssueSeverity;
  notes?: string;
  // Live verification status
  isInternallyLinked: boolean;
  inSitemap: boolean;
  httpStatus: number;
  isIndexable: boolean;
  hasValidCanonical: boolean;
  isRedirecting: boolean;
  isBlocked: boolean;
  foundUrl?: string;
  lastChecked?: string;
}

export interface AuditRecommendation {
  summary: string;
  importantFindings: {
    title: string;
    impact: 'critical' | 'high' | 'medium';
    description: string;
    affectedCount: number;
    exampleUrls: string[];
    likelyRule: string;
  }[];
  patternProblems: {
    pattern: string;
    pageType: string;
    issue: string;
    evidence: string;
    suggestedFix: string;
  }[];
  prioritizedActions: {
    priority: number;
    action: string;
    scope: string;
    impactDescription: string;
  }[];
  generatedAt: string;
}

export interface DeveloperTicket {
  id: string;
  title: string;
  objective: string;
  problem: string;
  evidence: string;
  affectedPageType: string;
  affectedUrlCount: number;
  exampleUrls: string[];
  expectedBehaviour: string;
  actualBehaviour: string;
  recommendedInvestigation: string;
  acceptanceCriteria: string[];
  qaSteps: string[];
}

export interface AuditSummaryStats {
  totalDiscoveredInternalUrls: number;
  totalProcessedSitemapUrls: number;
  potentiallyMissingUrlsCount: number;
  validSitemapUrlsCount: number;
  invalidSitemapUrlsCount: number;
  sitemapCoveragePercentage: number;
  criticalIssuesCount: number;
  highPriorityCount: number;
  mediumPriorityCount: number;
  reviewRequiredCount: number;
  orphanInSitemapCount: number;
  canonicalMismatchCount: number;
  sitemapRedirectCount: number;
  sitemapBrokenCount: number;
  unreferencedSitemapsCount: number;
  duplicateAcrossSitemapsCount: number;
  totalSitemapFiles: number;
}

export interface AuditProject {
  id: string;
  name: string;
  domain: string;
  homepageUrl: string;
  createdAt: string;
  updatedAt: string;
  isDemo: boolean;
  dataProvenance?: {
    sourceLabel: string;
    scope: 'illustrative_sample' | 'live_crawl' | 'imported_evidence';
    recordsComplete: boolean;
    note: string;
  };
  status: AuditStatus;
  crawlConfig: CrawlConfig;
  stats: AuditSummaryStats;
  crawlProgress?: {
    currentUrl: string;
    urlsProcessed: number;
    urlsQueued: number;
    sitemapsProcessed: number;
    elapsedSeconds: number;
    startTime: string;
    endTime?: string;
  };
  recommendation?: AuditRecommendation;
  tickets?: DeveloperTicket[];
}
