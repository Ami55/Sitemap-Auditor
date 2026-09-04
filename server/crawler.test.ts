import assert from 'node:assert/strict';
import test from 'node:test';
import { PoliteCrawler } from './crawler.js';
import { CrawlConfig } from '../src/types/audit.js';

const config: CrawlConfig = {
  maxUrls: 10,
  crawlDepth: 2,
  crawlSpeed: 'fast',
  concurrency: 3,
  includeSubdomains: false,
  respectRobotsTxt: true,
  userAgent: 'SitemapCoverageAuditor/1.0',
  excludeQueryPatterns: [],
  excludeDirectoryPatterns: [],
  excludeFileExtensions: [],
  customSitemapUrls: [],
  retryCount: 0,
};

test('crawler processes newly discovered URLs concurrently within the configured limit', async () => {
  const originalFetch = globalThis.fetch;
  let active = 0;
  let maxActive = 0;

  globalThis.fetch = async (input) => {
    const url = String(input);
    active++;
    maxActive = Math.max(maxActive, active);
    await new Promise((resolve) => setTimeout(resolve, 15));
    active--;
    const links = url === 'https://example.com/'
      ? '<a href="/a">A</a><a href="/b">B</a><a href="/c">C</a>'
      : '';
    return new Response(`<html><head><link rel="canonical" href="${url}"></head><body>${links}</body></html>`, {
      status: 200,
      headers: { 'content-type': 'text/html' },
    });
  };

  try {
    const result = await new PoliteCrawler('https://example.com/', config).runCrawl();
    assert.equal(result.size, 4);
    assert.ok(maxActive >= 2, `expected concurrent requests, saw ${maxActive}`);
    assert.ok(maxActive <= config.concurrency!);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('multiple canonical declarations are classified for review', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(
    '<html><head><link rel="canonical" href="https://example.com/a"><link rel="canonical" href="https://example.com/b"></head></html>',
    { status: 200, headers: { 'content-type': 'text/html' } },
  );

  try {
    const crawler = new PoliteCrawler('https://example.com/', config);
    const result = await crawler.inspectPage('https://example.com/', 0);
    assert.equal(result.canonicalStatus, 'multiple_found');
    assert.equal(result.technicalEligibility, 'review');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
