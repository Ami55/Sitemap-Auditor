import {
  CrawledUrlRecord,
  SitemapFileRecord,
  PageTypeRule,
  PageTypeCoverageStats,
  IssueItem,
  IssueSeverity,
  AuditSummaryStats,
  CriticalPageItem,
} from '../src/types/audit.js';
import { normalizeUrl } from './normalizer.js';
import {
  DEFAULT_PAGE_TYPE_RULES,
  classifyUrlByTaxonomy,
  extractUrlSlug,
} from '../src/utils/urlClassifier.js';

export { DEFAULT_PAGE_TYPE_RULES };

export class AuditAnalyzer {
  /**
   * Classify page type using priority rules and fallback regex rules
   */
  static detectPageType(urlStr: string, rules: PageTypeRule[] = DEFAULT_PAGE_TYPE_RULES): {
    pageType: string;
    pageGroup: string;
    pageLevel: string;
    rulePriority: number;
    slug: string;
    expectedSitemap: string;
  } {
    const slug = extractUrlSlug(urlStr);
    const classification = classifyUrlByTaxonomy(urlStr);

    // If custom rules provided, check them as well
    for (const rule of rules) {
      try {
        const regex = new RegExp(rule.pattern, 'i');
        if (regex.test(slug) || regex.test(urlStr)) {
          return {
            pageType: rule.name,
            pageGroup: rule.pageGroup || classification.pageGroup,
            pageLevel: rule.pageLevel || classification.pageLevel,
            rulePriority: rule.rulePriority || classification.rulePriority,
            slug,
            expectedSitemap: rule.expectedSitemap || classification.expectedSitemap,
          };
        }
      } catch {
        if (urlStr.includes(rule.pattern) || slug.includes(rule.pattern)) {
          return {
            pageType: rule.name,
            pageGroup: rule.pageGroup || classification.pageGroup,
            pageLevel: rule.pageLevel || classification.pageLevel,
            rulePriority: rule.rulePriority || classification.rulePriority,
            slug,
            expectedSitemap: rule.expectedSitemap || classification.expectedSitemap,
          };
        }
      }
    }

    return {
      pageType: classification.pageType,
      pageGroup: classification.pageGroup,
      pageLevel: classification.pageLevel,
      rulePriority: classification.rulePriority,
      slug,
      expectedSitemap: classification.expectedSitemap,
    };
  }

  /**
   * Run comprehensive deterministic analysis
   */
  static analyzeAudit(
    crawledUrls: Map<string, CrawledUrlRecord>,
    sitemapFiles: Map<string, SitemapFileRecord>,
    allSitemapUrls: Set<string>,
    duplicateSitemapUrls: { normalizedUrl: string; sitemaps: string[] }[],
    patternCandidates: SitemapFileRecord[],
    pageTypeRules: PageTypeRule[] = DEFAULT_PAGE_TYPE_RULES,
    criticalPages: CriticalPageItem[] = []
  ): {
    classifiedUrls: Map<string, CrawledUrlRecord>;
    pageTypeCoverage: PageTypeCoverageStats[];
    issues: IssueItem[];
    summaryStats: AuditSummaryStats;
    evaluatedCriticalPages: CriticalPageItem[];
  } {
    const issues: IssueItem[] = [];
    const classifiedUrls = new Map<string, CrawledUrlRecord>();

    let potentiallyMissingCount = 0;
    let validSitemapUrlsCount = 0;
    let invalidSitemapUrlsCount = 0;
    let orphanInSitemapCount = 0;
    let canonicalMismatchCount = 0;
    let sitemapRedirectCount = 0;
    let sitemapBrokenCount = 0;

    // 1. Process crawled URLs
    crawledUrls.forEach((record, normUrl) => {
      const updated = { ...record };
      const inSitemap = allSitemapUrls.has(normUrl);
      updated.inSitemap = inSitemap;

      // Extract slug and priority taxonomy classification
      const detected = this.detectPageType(normUrl, pageTypeRules);
      updated.slug = detected.slug;
      updated.pageType = detected.pageType;
      updated.pageGroup = detected.pageGroup;
      updated.pageLevel = detected.pageLevel;
      updated.rulePriority = detected.rulePriority;

      // Check if candidate for sitemap inclusion
      // Candidate: HTTP 200, HTML, Indexable (no noindex, not blocked), preferred canonical
      const isCandidateForSitemap =
        updated.httpStatus === 200 &&
        updated.contentType.includes('text/html') &&
        updated.isIndexable &&
        !updated.isRobotsBlocked &&
        (updated.canonicalStatus === 'self_referencing' || updated.canonicalStatus === 'missing');

      if (isCandidateForSitemap && !inSitemap) {
        updated.isPotentiallyMissing = true;
        updated.missingReason =
          'Discovered via internal crawl with HTTP 200 and indexable canonical configuration, but absent from all parsed sitemaps.';
        updated.priority =
          updated.rulePriority <= 2 ? 'critical' :
          updated.rulePriority <= 5 || updated.pageLevel.includes('Landing') || updated.pageLevel.includes('Country') ? 'high' : 'medium';

        // Suggest sitemap based on rule
        const matchedRule = pageTypeRules.find((r) => r.name === updated.pageType);
        updated.suggestedSitemap = matchedRule?.expectedSitemap || detected.expectedSitemap || 'sitemap.xml';

        potentiallyMissingCount++;

        issues.push({
          id: 'issue-' + Math.random().toString(36).substring(2, 9),
          type: 'potentially_missing_from_sitemap',
          severity: updated.priority,
          title: `Indexable ${updated.pageType} missing from XML sitemap`,
          description: `URL (${updated.slug}) is live (200 OK), internally linked (${updated.inboundInternalLinksCount} links), and indexable, but is omitted from ${updated.suggestedSitemap}.`,
          affectedUrl: normUrl,
          affectedSitemap: updated.suggestedSitemap,
          suggestedAction: `Add to ${updated.suggestedSitemap} with appropriate changefreq and priority.`,
          pageType: updated.pageType,
        });
      } else if (inSitemap && isCandidateForSitemap) {
        validSitemapUrlsCount++;
      }

      // Check Canonical Mismatch for crawled URLs in sitemap
      if (inSitemap && updated.canonicalStatus === 'points_to_other_internal') {
        canonicalMismatchCount++;
        issues.push({
          id: 'issue-' + Math.random().toString(36).substring(2, 9),
          type: 'canonical_mismatch',
          severity: 'high',
          title: 'Sitemap URL has non-self-referencing canonical',
          description: `The URL is listed in an XML sitemap, but specifies a canonical tag pointing to ${updated.canonicalUrl}. Sitemaps should only contain canonical targets.`,
          affectedUrl: normUrl,
          suggestedAction: `Update sitemap to list the preferred canonical URL (${updated.canonicalUrl}) or fix the page's canonical tag.`,
          pageType: updated.pageType,
        });
      }

      // Check Noindex in sitemap
      if (inSitemap && !updated.isIndexable && (updated.metaRobots.includes('noindex') || updated.xRobotsTag.includes('noindex'))) {
        invalidSitemapUrlsCount++;
        issues.push({
          id: 'issue-' + Math.random().toString(36).substring(2, 9),
          type: 'sitemap_noindex',
          severity: 'critical',
          title: 'Noindex URL submitted in XML sitemap',
          description: `Sitemap submitted URL contains a noindex directive in meta robots or X-Robots-Tag (${updated.metaRobots || updated.xRobotsTag}). This sends conflicting signals to search engine crawlers.`,
          affectedUrl: normUrl,
          suggestedAction: 'Remove noindex directive if page should rank, or purge this URL from the XML sitemap immediately.',
          pageType: updated.pageType,
        });
      }

      // Check redirects
      if (inSitemap && (updated.httpStatus === 301 || updated.httpStatus === 302 || updated.redirectChain.length > 0)) {
        sitemapRedirectCount++;
        invalidSitemapUrlsCount++;
        issues.push({
          id: 'issue-' + Math.random().toString(36).substring(2, 9),
          type: 'sitemap_redirect',
          severity: 'high',
          title: `Redirecting URL in sitemap (${updated.httpStatus || 301})`,
          description: `Sitemap contains a URL that redirects to ${updated.finalUrl}. Sitemaps must contain only direct 200 OK URLs.`,
          affectedUrl: normUrl,
          suggestedAction: `Update sitemap entry to point directly to destination: ${updated.finalUrl}`,
          pageType: updated.pageType,
        });
      }

      // Check 4xx / 5xx broken
      if (inSitemap && updated.httpStatus >= 400) {
        sitemapBrokenCount++;
        invalidSitemapUrlsCount++;
        issues.push({
          id: 'issue-' + Math.random().toString(36).substring(2, 9),
          type: 'sitemap_broken',
          severity: 'critical',
          title: `Broken URL in sitemap (HTTP ${updated.httpStatus})`,
          description: `Sitemap contains a URL returning HTTP ${updated.httpStatus}. Submitting broken links wastes crawl budget.`,
          affectedUrl: normUrl,
          suggestedAction: 'Fix the broken page or remove this URL from the XML sitemap.',
          pageType: updated.pageType,
        });
      }

      classifiedUrls.set(normUrl, updated);
    });

    // 2. Check Orphans: Sitemap URLs not discovered through internal crawl
    allSitemapUrls.forEach((sitemapUrl) => {
      if (!crawledUrls.has(sitemapUrl)) {
        orphanInSitemapCount++;
        // Note: strictly label "Not discovered through internal crawl" as per instructions
      }
    });

    // 3. Check Duplicate URLs across sitemaps
    duplicateSitemapUrls.forEach((dup) => {
      issues.push({
        id: 'issue-' + Math.random().toString(36).substring(2, 9),
        type: 'duplicate_across_sitemaps',
        severity: 'medium',
        title: 'URL duplicated across multiple sitemaps',
        description: `URL is submitted across ${dup.sitemaps.length} separate sitemap files: ${dup.sitemaps.join(', ')}.`,
        affectedUrl: dup.normalizedUrl,
        suggestedAction: 'Deduplicate sitemap generation logic so each URL belongs to exactly one canonical sitemap file.',
      });
    });

    // 4. Check Pattern Candidates (Unreferenced sitemaps)
    patternCandidates.forEach((sitemap) => {
      issues.push({
        id: 'issue-' + Math.random().toString(36).substring(2, 9),
        type: 'unreferenced_sitemap_candidate',
        severity: 'high',
        title: 'Unreferenced child sitemap candidate discovered',
        description: `Sitemap file (${sitemap.url}) is accessible and contains ${sitemap.urlCount} URLs, but is NOT referenced in robots.txt or parent sitemap index.`,
        affectedUrl: sitemap.url,
        affectedSitemap: sitemap.url,
        suggestedAction: 'Add this sitemap file to the primary sitemap index or link it in robots.txt.',
      });
    });

    // 5. Sitemap file level issues
    sitemapFiles.forEach((file) => {
      for (const err of file.errors) {
        issues.push({
          id: 'issue-' + Math.random().toString(36).substring(2, 9),
          type: 'invalid_sitemap_xml',
          severity: 'critical',
          title: `Sitemap file error: ${file.url}`,
          description: err,
          affectedUrl: file.url,
          affectedSitemap: file.url,
          suggestedAction: 'Inspect server logs and validate XML syntax against sitemaps.org schema.',
        });
      }
      for (const warn of file.warnings) {
        issues.push({
          id: 'issue-' + Math.random().toString(36).substring(2, 9),
          type: 'invalid_sitemap_xml',
          severity: 'medium',
          title: `Sitemap file warning: ${file.url}`,
          description: warn,
          affectedUrl: file.url,
          affectedSitemap: file.url,
          suggestedAction: 'Review sitemap size, child references, and content type header.',
        });
      }
    });

    // 6. Page Type Coverage Matrix Calculation
    const pageTypeCoverage: PageTypeCoverageStats[] = pageTypeRules.map((rule) => {
      const matchingUrls = Array.from(classifiedUrls.values()).filter((u) => u.pageType === rule.name);

      const discoveredValidUrls = matchingUrls.filter(
        (u) => u.httpStatus === 200 && u.isIndexable && (u.canonicalStatus === 'self_referencing' || u.canonicalStatus === 'missing')
      ).length;

      const inSitemapCount = matchingUrls.filter((u) => u.inSitemap).length;
      const potentiallyMissing = matchingUrls.filter((u) => u.isPotentiallyMissing).length;
      const redirects = matchingUrls.filter((u) => u.httpStatus === 301 || u.httpStatus === 302).length;
      const canonicalMismatches = matchingUrls.filter((u) => u.canonicalStatus === 'points_to_other_internal').length;

      // Formula: Valid discovered canonical URLs found in sitemap ÷ All valid discovered canonical URLs × 100
      const validFoundInSitemap = matchingUrls.filter(
        (u) => u.inSitemap && u.httpStatus === 200 && u.isIndexable && (u.canonicalStatus === 'self_referencing' || u.canonicalStatus === 'missing')
      ).length;

      const coveragePercentage = discoveredValidUrls > 0 ? Math.round((validFoundInSitemap / discoveredValidUrls) * 100) : 100;

      const severity: IssueSeverity =
        coveragePercentage < 50 || potentiallyMissing > 20 ? 'critical' :
        coveragePercentage < 80 || potentiallyMissing > 5 ? 'high' :
        coveragePercentage < 98 ? 'medium' : 'review';

      let recommendedAction = 'Maintain sitemap generator synchronization.';
      if (potentiallyMissing > 0) {
        recommendedAction = `Inspect generator query for ${rule.name}; include missing ${potentiallyMissing} live pages in ${rule.expectedSitemap}.`;
      }

      return {
        pageType: rule.name,
        ruleId: rule.id,
        discoveredValidUrls,
        inSitemapCount,
        potentiallyMissingCount: potentiallyMissing,
        validSitemapUrlsCount: validFoundInSitemap,
        invalidSitemapUrlsCount: matchingUrls.filter((u) => u.inSitemap && !u.isIndexable).length,
        coveragePercentage,
        redirectCount: redirects,
        canonicalMismatchCount: canonicalMismatches,
        notDiscoveredThroughCrawlCount: 0, // Calculated globally
        expectedSitemap: rule.expectedSitemap,
        severity,
        recommendedAction,
      };
    });

    // 7. Evaluate Critical Pages
    const evaluatedCriticalPages = criticalPages.map((crit) => {
      const norm = normalizeUrl(crit.url);
      const crawled = classifiedUrls.get(norm);
      const inSitemap = allSitemapUrls.has(norm);

      const evaluated: CriticalPageItem = {
        ...crit,
        isInternallyLinked: Boolean(crawled && crawled.inboundInternalLinksCount > 0),
        inSitemap,
        httpStatus: crawled ? crawled.httpStatus : inSitemap ? 200 : 0,
        isIndexable: crawled ? crawled.isIndexable : inSitemap,
        hasValidCanonical: crawled ? crawled.canonicalStatus === 'self_referencing' || crawled.canonicalStatus === 'missing' : true,
        isRedirecting: Boolean(crawled && (crawled.httpStatus === 301 || crawled.httpStatus === 302)),
        isBlocked: Boolean(crawled?.isRobotsBlocked),
        foundUrl: norm,
        lastChecked: new Date().toISOString(),
      };

      if (!evaluated.inSitemap || !evaluated.isInternallyLinked || !evaluated.isIndexable) {
        issues.push({
          id: 'issue-crit-' + Math.random().toString(36).substring(2, 9),
          type: 'missing_critical_page',
          severity: crit.priority,
          title: `Critical Page Issue: ${crit.name}`,
          description: `Key page (${crit.url}) has health issues: ${!evaluated.inSitemap ? 'Missing from sitemap; ' : ''}${!evaluated.isInternallyLinked ? 'No internal links found; ' : ''}${!evaluated.isIndexable ? 'Non-indexable configuration.' : ''}`,
          affectedUrl: crit.url,
          affectedSitemap: crit.expectedSitemap,
          suggestedAction: `Ensure ${crit.url} is linked in site navigation and included in ${crit.expectedSitemap}.`,
        });
      }

      return evaluated;
    });

    // 8. Overall Summary Stats Calculation
    const validDiscoveredTotal = Array.from(classifiedUrls.values()).filter(
      (u) => u.httpStatus === 200 && u.isIndexable && (u.canonicalStatus === 'self_referencing' || u.canonicalStatus === 'missing')
    ).length;

    const validDiscoveredInSitemapTotal = Array.from(classifiedUrls.values()).filter(
      (u) => u.inSitemap && u.httpStatus === 200 && u.isIndexable && (u.canonicalStatus === 'self_referencing' || u.canonicalStatus === 'missing')
    ).length;

    const sitemapCoveragePercentage = validDiscoveredTotal > 0 ? Math.round((validDiscoveredInSitemapTotal / validDiscoveredTotal) * 100) : 100;

    const criticalIssuesCount = issues.filter((i) => i.severity === 'critical').length;
    const highPriorityCount = issues.filter((i) => i.severity === 'high').length;
    const mediumPriorityCount = issues.filter((i) => i.severity === 'medium').length;
    const reviewRequiredCount = issues.filter((i) => i.severity === 'review').length;

    const summaryStats: AuditSummaryStats = {
      totalDiscoveredInternalUrls: classifiedUrls.size,
      totalProcessedSitemapUrls: allSitemapUrls.size,
      potentiallyMissingUrlsCount: potentiallyMissingCount,
      validSitemapUrlsCount,
      invalidSitemapUrlsCount,
      sitemapCoveragePercentage,
      criticalIssuesCount,
      highPriorityCount,
      mediumPriorityCount,
      reviewRequiredCount,
      orphanInSitemapCount,
      canonicalMismatchCount,
      sitemapRedirectCount,
      sitemapBrokenCount,
      unreferencedSitemapsCount: patternCandidates.length,
      duplicateAcrossSitemapsCount: duplicateSitemapUrls.length,
      totalSitemapFiles: sitemapFiles.size,
    };

    return {
      classifiedUrls,
      pageTypeCoverage,
      issues,
      summaryStats,
      evaluatedCriticalPages,
    };
  }
}
