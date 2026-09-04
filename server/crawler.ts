import * as cheerio from 'cheerio';
import { CrawledUrlRecord, CrawlConfig, CanonicalStatus, DiscoverySource } from '../src/types/audit.js';
import { normalizeUrl, isSameHost } from './normalizer.js';
import { RobotsPolicy } from './robotsPolicy.js';

export interface CrawlProgressCallback {
  (progress: {
    currentUrl: string;
    urlsProcessed: number;
    urlsQueued: number;
    depthDistribution: Record<number, number>;
    statusText: string;
  }): void;
}

export class PoliteCrawler {
  private baseHost: string;
  private origin: string;
  private config: CrawlConfig;
  private robotsPolicy?: RobotsPolicy;
  private visitedUrls: Map<string, CrawledUrlRecord> = new Map();
  private queue: { url: string; depth: number; discoveredFrom?: string; source: DiscoverySource }[] = [];
  private enqueuedSet: Set<string> = new Set();
  private inboundLinksCount: Map<string, number> = new Map();
  private isPaused: boolean = false;
  private isStopped: boolean = false;

  private assetExtensions = new Set([
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'bmp', 'tiff',
    'css', 'js', 'mjs', 'map',
    'woff', 'woff2', 'ttf', 'eot', 'otf',
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'tar', 'gz', 'rar', '7z',
    'mp3', 'mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'ogg', 'wav',
    'xml', 'rss', 'atom', 'json'
  ]);

  constructor(homepageUrl: string, config: CrawlConfig, robotsContent: string = '') {
    const norm = normalizeUrl(homepageUrl);
    const parsed = new URL(norm);
    this.origin = `${parsed.protocol}//${parsed.host}`;
    this.baseHost = parsed.hostname;
    this.config = config;
    this.robotsPolicy = robotsContent ? new RobotsPolicy(robotsContent, config.userAgent) : undefined;

    // Seed queue with homepage
    this.enqueue(norm, 0, undefined, 'internal_crawl');
  }

  private enqueue(url: string, depth: number, discoveredFrom?: string, source: DiscoverySource = 'internal_crawl') {
    const norm = normalizeUrl(url);
    if (!norm) return;

    // Check same host
    if (!isSameHost(norm, this.baseHost, this.config.includeSubdomains)) {
      return;
    }

    // Check depth
    if (this.config.crawlDepth > 0 && depth > this.config.crawlDepth) {
      return;
    }

    // Check exclusions
    if (this.isExcluded(norm)) {
      return;
    }

    // Increment in-link count
    const currentInLinks = this.inboundLinksCount.get(norm) || 0;
    this.inboundLinksCount.set(norm, currentInLinks + 1);

    if (this.enqueuedSet.has(norm) || this.visitedUrls.has(norm)) {
      return;
    }

    if (this.enqueuedSet.size >= this.config.maxUrls) {
      return;
    }

    this.enqueuedSet.add(norm);
    this.queue.push({ url: norm, depth, discoveredFrom, source });
  }

  private isExcluded(urlStr: string): boolean {
    try {
      const parsed = new URL(urlStr);
      const pathname = parsed.pathname.toLowerCase();

      // Check asset extension
      const lastDot = pathname.lastIndexOf('.');
      if (lastDot > 0) {
        const ext = pathname.substring(lastDot + 1);
        if (this.assetExtensions.has(ext) || this.config.excludeFileExtensions.includes(ext)) {
          return true;
        }
      }

      // Check directory exclusions
      for (const dir of this.config.excludeDirectoryPatterns) {
        if (dir && pathname.includes(dir.toLowerCase())) {
          return true;
        }
      }

      // Check query exclusions
      if (parsed.search && this.config.excludeQueryPatterns.length > 0) {
        for (const q of this.config.excludeQueryPatterns) {
          if (q && parsed.search.toLowerCase().includes(q.toLowerCase())) {
            return true;
          }
        }
      }

      if (this.config.respectRobotsTxt && this.robotsPolicy && !this.robotsPolicy.isAllowed(urlStr)) {
        return true;
      }

      // Crawl trap heuristics (repeating segments: /a/b/a/b/)
      const segments = pathname.split('/').filter(Boolean);
      if (segments.length > 10) return true;
      const seenSegments = new Set<string>();
      let repeatCount = 0;
      for (const seg of segments) {
        if (seenSegments.has(seg)) {
          repeatCount++;
          if (repeatCount >= 2) return true;
        }
        seenSegments.add(seg);
      }

      return false;
    } catch {
      return true;
    }
  }

  /**
   * Run the crawl loop
   */
  async runCrawl(onProgress?: CrawlProgressCallback): Promise<Map<string, CrawledUrlRecord>> {
    const delayMs = this.config.crawlSpeed === 'conservative' ? 250 : this.config.crawlSpeed === 'moderate' ? 100 : 20;
    const concurrency = Math.max(1, Math.min(this.config.concurrency || (
      this.config.crawlSpeed === 'conservative' ? 2 : this.config.crawlSpeed === 'moderate' ? 5 : 12
    ), 25));

    let processedCount = 0;
    const depthDistribution: Record<number, number> = {};

    while (this.queue.length > 0 && !this.isStopped && processedCount < this.config.maxUrls) {
      if (this.isPaused) {
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }

      const remaining = this.config.maxUrls - processedCount;
      const batch = this.queue.splice(0, Math.min(concurrency, remaining));
      if (batch.length === 0) break;
      const results = await Promise.all(batch.map(async (item) => ({
        item,
        norm: normalizeUrl(item.url),
        record: await this.inspectPage(item.url, item.depth, item.discoveredFrom, item.source),
      })));

      for (const { item, norm, record } of results) {
        if (this.visitedUrls.has(norm)) continue;
        processedCount++;
        depthDistribution[item.depth] = (depthDistribution[item.depth] || 0) + 1;
        record.inboundInternalLinksCount = this.inboundLinksCount.get(norm) || 1;
        this.visitedUrls.set(norm, record);
        if (record.httpStatus === 200 && record.contentType.includes('text/html') && record.extractedLinks) {
          for (const extracted of record.extractedLinks) this.enqueue(extracted.url, item.depth + 1, norm, extracted.source);
        }
        if (onProgress && (processedCount % 5 === 0 || processedCount === this.config.maxUrls)) {
          onProgress({ currentUrl: norm, urlsProcessed: processedCount, urlsQueued: this.queue.length, depthDistribution,
            statusText: `Crawling [${processedCount}/${this.enqueuedSet.size}]: ${norm.substring(0, 60)}...` });
        }
      }

      // Polite rate limit sleep
      if (delayMs > 0) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }

    return this.visitedUrls;
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  stop() {
    this.isStopped = true;
  }

  getCompletionSummary() {
    const failedUrls = Array.from(this.visitedUrls.values()).filter((record) => record.httpStatus === 0).length;
    return {
      processedUrls: this.visitedUrls.size,
      queuedUrlsRemaining: this.queue.length,
      failedUrls,
      stopped: this.isStopped,
      reachedLimit: this.visitedUrls.size >= this.config.maxUrls && this.queue.length > 0,
      complete: !this.isStopped && this.queue.length === 0,
    };
  }

  /**
   * Inspect a single page by fetching and parsing HTML
   */
  async inspectPage(
    targetUrl: string,
    crawlDepth: number,
    firstDiscoveredFrom?: string,
    source: DiscoverySource = 'internal_crawl'
  ): Promise<CrawledUrlRecord & { extractedLinks?: { url: string; source: DiscoverySource }[] }> {
    const norm = normalizeUrl(targetUrl);
    const redirectChain: string[] = [];

    const record: CrawledUrlRecord & { extractedLinks?: { url: string; source: DiscoverySource }[] } = {
      id: 'url-' + Math.random().toString(36).substring(2, 9),
      originalUrl: targetUrl,
      normalizedUrl: norm,
      finalUrl: norm,
      httpStatus: 0,
      contentType: '',
      isIndexable: false,
      metaRobots: '',
      xRobotsTag: '',
      isRobotsBlocked: false,
      canonicalUrl: undefined,
      canonicalStatus: 'missing',
      pageTitle: undefined,
      h1: undefined,
      crawlDepth,
      inboundInternalLinksCount: 1,
      outboundInternalLinksCount: 0,
      inSitemap: false,
      sitemapNames: [],
      discoverySources: [source],
      firstDiscoveredFrom,
      pageType: 'unknown',
      redirectChain: [],
      lastCheckedDate: new Date().toISOString(),
      isPotentiallyMissing: false,
      priority: 'medium',
      technicalEligibility: 'unchecked',
      evidence: [],
      evidenceConfidence: 'low',
    };

    try {
      let resp: Response | undefined;
      let lastError: unknown;
      for (let attempt = 0; attempt <= this.config.retryCount; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        try {
          resp = await fetch(targetUrl, { headers: { 'User-Agent': this.config.userAgent, 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' }, signal: controller.signal, redirect: 'follow' });
          clearTimeout(timeoutId);
          if (resp.status !== 429 && resp.status < 500) break;
        } catch (error) {
          clearTimeout(timeoutId);
          lastError = error;
        }
        if (attempt < this.config.retryCount) await new Promise((resolve) => setTimeout(resolve, 200 * 2 ** attempt));
      }
      if (!resp) throw lastError || new Error('Request failed');

      record.httpStatus = resp.status;
      record.finalUrl = normalizeUrl(resp.url || targetUrl);
      record.contentType = (resp.headers.get('content-type') || '').toLowerCase();
      record.xRobotsTag = resp.headers.get('x-robots-tag') || '';
      record.evidence = [
        { check: 'http_status', value: record.httpStatus, source: 'http_response' },
        { check: 'content_type', value: record.contentType, source: 'http_response' },
      ];

      if (record.finalUrl !== norm) {
        redirectChain.push(norm, record.finalUrl);
        record.redirectChain = redirectChain;
      }

      if (!resp.ok) {
        record.technicalEligibility = 'ineligible';
        record.eligibilityReason = `HTTP ${record.httpStatus} response.`;
        record.evidenceConfidence = 'high';
        return record;
      }

      if (!record.contentType.includes('text/html')) {
        record.technicalEligibility = 'ineligible';
        record.eligibilityReason = `Non-HTML content type: ${record.contentType || 'unknown'}.`;
        record.evidenceConfidence = 'high';
        return record;
      }

      const html = await resp.text();
      const $ = cheerio.load(html);

      record.pageTitle = $('title').first().text().trim() || undefined;
      record.h1 = $('h1').first().text().trim() || undefined;

      // Meta robots
      const metaRobots = $('meta[name="robots" i]').attr('content') || $('meta[name="googlebot" i]').attr('content') || '';
      record.metaRobots = metaRobots.toLowerCase();
      record.evidence.push({ check: 'meta_robots', value: record.metaRobots || 'not_declared', source: 'html' });

      // Canonical tag
      const canonicalTags = $('link[rel="canonical" i]');
      const canonicalTag = canonicalTags.first().attr('href');
      if (canonicalTags.length > 1) {
        record.canonicalStatus = 'multiple_found';
      } else if (canonicalTag) {
        try {
          const resolvedCanonical = new URL(canonicalTag, record.finalUrl).href;
          record.canonicalUrl = normalizeUrl(resolvedCanonical);

          if (record.canonicalUrl === record.finalUrl) {
            record.canonicalStatus = 'self_referencing';
          } else if (isSameHost(record.canonicalUrl, this.baseHost, this.config.includeSubdomains)) {
            record.canonicalStatus = 'points_to_other_internal';
          } else {
            record.canonicalStatus = 'points_to_external';
          }
        } catch {
          record.canonicalStatus = 'review_required';
        }
      } else {
        record.canonicalStatus = 'missing';
      }

      // Check Indexability
      const hasNoindex = record.metaRobots.includes('noindex') || record.xRobotsTag.toLowerCase().includes('noindex');
      record.isIndexable =
        record.httpStatus === 200 &&
        !hasNoindex &&
        !record.isRobotsBlocked &&
        record.contentType.includes('text/html');
      record.evidence.push({ check: 'canonical_status', value: record.canonicalStatus, source: 'html' });
      record.evidence.push({ check: 'noindex', value: hasNoindex, source: 'rule_engine' });
      if (!record.isIndexable || record.canonicalStatus === 'points_to_other_internal' || record.canonicalStatus === 'points_to_external') {
        record.technicalEligibility = 'ineligible';
        record.eligibilityReason = !record.isIndexable ? 'Failed HTTP, HTML, robots, or noindex checks.' : 'Canonical points to another URL.';
        record.evidenceConfidence = 'high';
      } else if (record.canonicalStatus === 'missing' || record.canonicalStatus === 'review_required' || record.canonicalStatus === 'multiple_found') {
        record.technicalEligibility = 'review';
        record.eligibilityReason = 'Canonical declaration is missing or ambiguous.';
        record.evidenceConfidence = 'medium';
      } else {
        record.technicalEligibility = 'eligible';
        record.eligibilityReason = 'Passed HTTP, HTML, noindex, robots, and self-canonical checks.';
        record.evidenceConfidence = 'high';
      }

      // Extract links
      const extractedLinks: { url: string; source: DiscoverySource }[] = [];
      let outboundCount = 0;

      // 1. <a> tags
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        if (href && !href.startsWith('#') && !href.startsWith('javascript:') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
          try {
            const absolute = new URL(href, record.finalUrl).href;
            const normLink = normalizeUrl(absolute);
            if (isSameHost(normLink, this.baseHost, this.config.includeSubdomains)) {
              extractedLinks.push({ url: normLink, source: 'internal_crawl' });
              outboundCount++;
            }
          } catch {
            // ignore
          }
        }
      });

      // 2. Pagination <link rel="next" / "prev">
      $('link[rel="next" i], link[rel="prev" i]').each((_, el) => {
        const href = $(el).attr('href');
        if (href) {
          try {
            const absolute = new URL(href, record.finalUrl).href;
            extractedLinks.push({ url: normalizeUrl(absolute), source: 'internal_crawl' });
          } catch {}
        }
      });

      // 3. hreflang
      $('link[rel="alternate" i][hreflang]').each((_, el) => {
        const href = $(el).attr('href');
        if (href) {
          try {
            const absolute = new URL(href, record.finalUrl).href;
            if (isSameHost(normalizeUrl(absolute), this.baseHost, this.config.includeSubdomains)) {
              extractedLinks.push({ url: normalizeUrl(absolute), source: 'internal_crawl' });
            }
          } catch {}
        }
      });

      // 4. Structured Data URLs (JSON-LD)
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const jsonText = $(el).html();
          if (jsonText) {
            const parsed = JSON.parse(jsonText);
            const urlsFromLd = this.extractUrlsFromStructuredData(parsed);
            for (const ldUrl of urlsFromLd) {
              const normLd = normalizeUrl(ldUrl);
              if (isSameHost(normLd, this.baseHost, this.config.includeSubdomains)) {
                extractedLinks.push({ url: normLd, source: 'structured_data' });
              }
            }
          }
        } catch {}
      });

      record.outboundInternalLinksCount = outboundCount;
      record.extractedLinks = extractedLinks;

      return record;
    } catch (err: any) {
      record.httpStatus = 0;
      record.isIndexable = false;
      record.technicalEligibility = 'unchecked';
      record.eligibilityReason = `Fetch failed: ${err?.name === 'AbortError' ? 'timeout' : 'request error'}.`;
      record.evidenceConfidence = 'low';
      return record;
    }
  }

  private extractUrlsFromStructuredData(obj: any): string[] {
    const urls: string[] = [];
    if (!obj || typeof obj !== 'object') return urls;

    const find = (current: any) => {
      if (!current) return;
      if (typeof current === 'string' && (current.startsWith('http://') || current.startsWith('https://'))) {
        urls.push(current);
      } else if (Array.isArray(current)) {
        for (const item of current) find(item);
      } else if (typeof current === 'object') {
        for (const key of Object.keys(current)) {
          if (key === 'url' || key === 'item' || key === 'sameAs' || key === 'hasPart' || key === 'itemListElement') {
            find(current[key]);
          }
        }
      }
    };

    find(obj);
    return urls;
  }
}
