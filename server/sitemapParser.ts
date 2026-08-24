import { XMLParser } from 'fast-xml-parser';
import { SitemapFileRecord, DiscoverySource, SitemapFileType } from '../src/types/audit.js';
import { normalizeUrl, isSameHost } from './normalizer.js';

export interface ParsedSitemapResult {
  sitemapFiles: Map<string, SitemapFileRecord>;
  sitemapUrls: Map<string, { url: string; sitemapUrl: string; lastmod?: string; changefreq?: string; priority?: number }[]>;
  allSitemapUrls: Set<string>;
  duplicateUrlsAcrossSitemaps: { normalizedUrl: string; sitemaps: string[] }[];
  patternCandidates: SitemapFileRecord[];
  warnings: string[];
}

export class SitemapDiscoveryEngine {
  private parser: XMLParser;
  private visitedSitemaps: Set<string> = new Set();
  private userAgent: string;
  private maxSitemapsToFetch: number = 200;

  constructor(userAgent: string = 'SitemapCoverageAuditor/1.0 (+https://example.com/bot)') {
    this.userAgent = userAgent;
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      trimValues: true,
    });
  }

  /**
   * Fetch robots.txt and find sitemap directives
   */
  async fetchRobotsTxtSitemaps(baseUrl: string): Promise<{ sitemaps: string[]; robotsContent: string; status: number }> {
    try {
      const parsed = new URL(baseUrl);
      const robotsUrl = `${parsed.protocol}//${parsed.host}/robots.txt`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const resp = await fetch(robotsUrl, {
        headers: { 'User-Agent': this.userAgent, 'Accept': 'text/plain,*/*' },
        signal: controller.signal,
        redirect: 'follow',
      });
      clearTimeout(timeoutId);

      if (!resp.ok) {
        return { sitemaps: [], robotsContent: '', status: resp.status };
      }

      const text = await resp.text();
      const sitemaps: string[] = [];
      const lines = text.split(/\r?\n/);

      for (const line of lines) {
        const trimmed = line.trim();
        if (/^sitemap:\s*/i.test(trimmed)) {
          const rawSitemap = trimmed.replace(/^sitemap:\s*/i, '').trim();
          if (rawSitemap) {
            sitemaps.push(rawSitemap);
          }
        }
      }

      return { sitemaps, robotsContent: text, status: resp.status };
    } catch (e: any) {
      return { sitemaps: [], robotsContent: '', status: 0 };
    }
  }

  /**
   * Main discovery entry point
   */
  async discoverAndParseAll(
    homepageUrl: string,
    customSitemaps: string[] = []
  ): Promise<ParsedSitemapResult> {
    const sitemapFiles = new Map<string, SitemapFileRecord>();
    const sitemapUrls = new Map<string, { url: string; sitemapUrl: string; lastmod?: string; changefreq?: string; priority?: number }[]>();
    const allNormalizedSitemapUrls = new Set<string>();
    const urlToSitemapsMap = new Map<string, Set<string>>();
    const warnings: string[] = [];
    const patternCandidates: SitemapFileRecord[] = [];

    const homepageNormalized = normalizeUrl(homepageUrl);
    const parsedHome = new URL(homepageNormalized);
    const origin = `${parsedHome.protocol}//${parsedHome.host}`;

    // 1. Fetch robots.txt
    const robotsResult = await this.fetchRobotsTxtSitemaps(homepageNormalized);
    const robotsSitemaps = robotsResult.sitemaps;

    // 2. Common candidate locations
    const candidateLocations = [
      `${origin}/sitemap.xml`,
      `${origin}/sitemap_index.xml`,
      `${origin}/sitemap-index.xml`,
      `${origin}/sitemaps.xml`,
    ];

    // Seed queue
    const queue: { url: string; parentUrl?: string; discoveryMethod: DiscoverySource }[] = [];

    // Add robots sitemaps
    for (const s of robotsSitemaps) {
      queue.push({ url: s, discoveryMethod: 'robots_txt' });
    }

    // Add custom sitemaps
    for (const s of customSitemaps) {
      if (s.trim()) {
        queue.push({ url: s.trim(), discoveryMethod: 'manual_input' });
      }
    }

    // Add candidates if queue is empty or as fallbacks
    for (const c of candidateLocations) {
      if (!queue.some((q) => q.url.toLowerCase() === c.toLowerCase())) {
        queue.push({ url: c, discoveryMethod: 'robots_txt' });
      }
    }

    // Process queue
    while (queue.length > 0 && sitemapFiles.size < this.maxSitemapsToFetch) {
      const current = queue.shift()!;
      const normSitemapUrl = normalizeUrl(current.url);

      if (this.visitedSitemaps.has(normSitemapUrl)) {
        continue;
      }
      this.visitedSitemaps.add(normSitemapUrl);

      const parsedFile = await this.fetchAndParseSitemapFile(
        current.url,
        current.parentUrl,
        current.discoveryMethod
      );

      sitemapFiles.set(parsedFile.url, parsedFile);

      // If child sitemaps found, enqueue them
      if (parsedFile.childSitemaps && parsedFile.childSitemaps.length > 0) {
        for (const childUrl of parsedFile.childSitemaps) {
          const normChild = normalizeUrl(childUrl);
          if (!this.visitedSitemaps.has(normChild)) {
            queue.push({
              url: childUrl,
              parentUrl: parsedFile.url,
              discoveryMethod: 'sitemap',
            });
          }
        }
      }

      // Check pattern discovery candidates for naming sequences
      const adjacentCandidates = this.detectAdjacentPatternCandidates(parsedFile.url);
      for (const cand of adjacentCandidates) {
        const normCand = normalizeUrl(cand);
        if (!this.visitedSitemaps.has(normCand) && !queue.some((q) => normalizeUrl(q.url) === normCand)) {
          // Probe the candidate gently
          const probe = await this.fetchAndParseSitemapFile(cand, undefined, 'pattern_discovered');
          if (probe.httpStatus === 200 && (probe.type === 'url_sitemap' || probe.type === 'sitemap_index')) {
            probe.isPatternCandidate = true;
            probe.warnings.push('Pattern-discovered sitemap candidate not referenced in parent index or robots.txt');
            sitemapFiles.set(probe.url, probe);
            patternCandidates.push(probe);
          }
        }
      }

      // Extract URLs from urlset
      if (parsedFile.type === 'url_sitemap' && parsedFile.rawUrls) {
        const fileUrls: { url: string; sitemapUrl: string; lastmod?: string; changefreq?: string; priority?: number }[] = [];
        for (const item of parsedFile.rawUrls) {
          const norm = normalizeUrl(item.loc);
          if (norm) {
            allNormalizedSitemapUrls.add(norm);
            fileUrls.push({
              url: item.loc,
              sitemapUrl: parsedFile.url,
              lastmod: item.lastmod,
              changefreq: item.changefreq,
              priority: item.priority ? parseFloat(item.priority) : undefined,
            });

            if (!urlToSitemapsMap.has(norm)) {
              urlToSitemapsMap.set(norm, new Set());
            }
            urlToSitemapsMap.get(norm)!.add(parsedFile.url);
          }
        }
        sitemapUrls.set(parsedFile.url, fileUrls);
      }
    }

    // Detect duplicate URLs across multiple sitemaps
    const duplicateUrlsAcrossSitemaps: { normalizedUrl: string; sitemaps: string[] }[] = [];
    urlToSitemapsMap.forEach((sitemapsSet, normalizedUrl) => {
      if (sitemapsSet.size > 1) {
        duplicateUrlsAcrossSitemaps.push({
          normalizedUrl,
          sitemaps: Array.from(sitemapsSet),
        });
      }
    });

    return {
      sitemapFiles,
      sitemapUrls,
      allSitemapUrls: allNormalizedSitemapUrls,
      duplicateUrlsAcrossSitemaps,
      patternCandidates,
      warnings,
    };
  }

  /**
   * Fetch single sitemap and inspect type / XML structure
   */
  async fetchAndParseSitemapFile(
    sitemapUrl: string,
    parentUrl?: string,
    discoveryMethod: DiscoverySource = 'robots_txt'
  ): Promise<SitemapFileRecord & { rawUrls?: any[] }> {
    const fileRecord: SitemapFileRecord & { rawUrls?: any[] } = {
      id: 'sm-' + Math.random().toString(36).substring(2, 9),
      url: sitemapUrl,
      parentSitemapUrl: parentUrl,
      type: 'unavailable',
      httpStatus: 0,
      urlCount: 0,
      referencedByParent: Boolean(parentUrl),
      discoveredThroughRobots: discoveryMethod === 'robots_txt',
      discoveryMethod,
      errors: [],
      warnings: [],
      processingDate: new Date().toISOString(),
      childSitemaps: [],
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const resp = await fetch(sitemapUrl, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/xml,text/xml,application/xhtml+xml,text/html;q=0.9,*/*;q=0.8',
        },
        signal: controller.signal,
        redirect: 'manual', // Check redirects explicitly
      });
      clearTimeout(timeoutId);

      fileRecord.httpStatus = resp.status;

      // Handle Redirects
      if (resp.status >= 300 && resp.status < 400) {
        const location = resp.headers.get('location') || '';
        fileRecord.type = 'redirect';
        fileRecord.warnings.push(`Sitemap redirects to ${location}`);
        return fileRecord;
      }

      if (!resp.ok) {
        fileRecord.type = resp.status === 404 ? 'unavailable' : 'unavailable';
        fileRecord.errors.push(`HTTP ${resp.status} ${resp.statusText}`);
        return fileRecord;
      }

      const contentType = resp.headers.get('content-type') || '';
      const text = await resp.text();
      fileRecord.fileSizeBytes = Buffer.byteLength(text, 'utf8');

      // Check for size limits (50MB / 50k URLs)
      if (fileRecord.fileSizeBytes > 50 * 1024 * 1024) {
        fileRecord.warnings.push('Sitemap file exceeds standard 50MB uncompressed limit');
      }

      // Check if returned HTML instead of XML
      if (/<!DOCTYPE\s+html/i.test(text) || contentType.includes('text/html')) {
        fileRecord.type = 'html_page';
        fileRecord.errors.push('Endpoint returned HTML document instead of XML sitemap');
        return fileRecord;
      }

      // Parse XML
      let parsedXml: any;
      try {
        parsedXml = this.parser.parse(text);
      } catch (err: any) {
        fileRecord.type = 'invalid_xml';
        fileRecord.errors.push(`Malformed XML: ${err.message}`);
        return fileRecord;
      }

      if (!parsedXml || typeof parsedXml !== 'object') {
        fileRecord.type = 'invalid_xml';
        fileRecord.errors.push('Empty or unparseable XML root');
        return fileRecord;
      }

      // Check <sitemapindex>
      if (parsedXml.sitemapindex) {
        fileRecord.type = 'sitemap_index';
        const sitemaps = parsedXml.sitemapindex.sitemap;
        const list = Array.isArray(sitemaps) ? sitemaps : sitemaps ? [sitemaps] : [];
        const childUrls: string[] = [];

        for (const item of list) {
          if (item && item.loc) {
            childUrls.push(typeof item.loc === 'string' ? item.loc.trim() : String(item.loc));
          }
        }

        fileRecord.childSitemaps = childUrls;
        fileRecord.urlCount = childUrls.length;
        if (childUrls.length === 0) {
          fileRecord.warnings.push('Sitemap index contains 0 child sitemaps');
        }
        return fileRecord;
      }

      // Check <urlset>
      if (parsedXml.urlset) {
        fileRecord.type = 'url_sitemap';
        const urls = parsedXml.urlset.url;
        const list = Array.isArray(urls) ? urls : urls ? [urls] : [];

        fileRecord.urlCount = list.length;
        fileRecord.rawUrls = list;

        if (list.length === 0) {
          fileRecord.warnings.push('URL sitemap contains 0 URLs');
        } else if (list.length > 50000) {
          fileRecord.warnings.push(`Sitemap contains ${list.length} URLs (exceeds Google 50,000 limit)`);
        }

        // Check if any url item is mistakenly a sitemapindex
        for (const u of list.slice(0, 10)) {
          if (u.loc && typeof u.loc === 'string' && u.loc.includes('sitemap') && u.loc.endsWith('.xml')) {
            fileRecord.warnings.push('Sitemap entries appear to contain child XML sitemap URLs rather than content pages');
            break;
          }
        }

        return fileRecord;
      }

      fileRecord.type = 'invalid_xml';
      fileRecord.errors.push('Missing expected <urlset> or <sitemapindex> root tags');
      return fileRecord;
    } catch (e: any) {
      fileRecord.type = 'unavailable';
      fileRecord.errors.push(`Fetch failed: ${e.message}`);
      return fileRecord;
    }
  }

  /**
   * Detect safe adjacent filename patterns (e.g., tours_1.xml -> check tours_2.xml, tours_3.xml)
   */
  detectAdjacentPatternCandidates(sitemapUrl: string): string[] {
    const candidates: string[] = [];
    try {
      const parsed = new URL(sitemapUrl);
      const pathname = parsed.pathname;

      // Regex matching ending numeric sequence like _1.xml or -02.xml or sitemap1.xml
      const match = pathname.match(/(.*?)([_-]?)(\d+)(\.xml(?:\.gz)?)$/i);
      if (match) {
        const prefix = match[1];
        const separator = match[2];
        const numStr = match[3];
        const ext = match[4];
        const currentNum = parseInt(numStr, 10);

        // Safe limited check: next 2 numbers
        for (let nextNum = currentNum + 1; nextNum <= currentNum + 2; nextNum++) {
          const padded = numStr.length > 1 ? String(nextNum).padStart(numStr.length, '0') : String(nextNum);
          const candidatePath = `${prefix}${separator}${padded}${ext}`;
          candidates.push(`${parsed.protocol}//${parsed.host}${candidatePath}`);
        }
      }
    } catch {
      // ignore
    }
    return candidates;
  }
}
