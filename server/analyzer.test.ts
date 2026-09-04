import assert from 'node:assert/strict';
import test from 'node:test';
import { AuditAnalyzer } from './analyzer.js';
import { CrawledUrlRecord } from '../src/types/audit.js';

const record = (url: string, canonicalStatus: CrawledUrlRecord['canonicalStatus']): CrawledUrlRecord => ({
  id: url, originalUrl: url, normalizedUrl: url, finalUrl: url, httpStatus: 200,
  contentType: 'text/html', isIndexable: true, metaRobots: 'index,follow', xRobotsTag: '',
  isRobotsBlocked: false, canonicalUrl: canonicalStatus === 'self_referencing' ? url : undefined,
  canonicalStatus, crawlDepth: 1, inboundInternalLinksCount: 2, outboundInternalLinksCount: 1,
  inSitemap: false, sitemapNames: [], discoverySources: ['internal_crawl'], pageType: 'unknown',
  redirectChain: [], lastCheckedDate: '2026-09-03T00:00:00Z', isPotentiallyMissing: false,
  priority: 'medium', evidence: [{ check: 'http_status', value: 200, source: 'http_response' }],
});

test('missing canonical is review-only and excluded from sitemap candidates', () => {
  const selfUrl = 'https://example.com/tours/italy/rome';
  const missingUrl = 'https://example.com/tours/france/paris';
  const result = AuditAnalyzer.analyzeAudit(
    new Map([[selfUrl, record(selfUrl, 'self_referencing')], [missingUrl, record(missingUrl, 'missing')]]),
    new Map(), new Set(), [], [], undefined, []
  );

  assert.equal(result.summaryStats.potentiallyMissingUrlsCount, 1);
  assert.equal(result.classifiedUrls.get(missingUrl)?.technicalEligibility, 'review');
  assert.equal(result.issues.some((issue) => issue.ruleId === 'SM-CANONICAL-REVIEW-001'), true);
  assert.equal(result.issues.some((issue) => issue.affectedUrl === selfUrl && issue.ruleId === 'SM-INCLUSION-001'), true);
});
