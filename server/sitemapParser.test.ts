import assert from 'node:assert/strict';
import test from 'node:test';
import { gzipSync } from 'node:zlib';
import { SitemapDiscoveryEngine } from './sitemapParser.js';

test('sitemap parser decompresses gzip payloads before parsing XML', async () => {
  const originalFetch = globalThis.fetch;
  const xml = '<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://example.com/a</loc></url></urlset>';
  globalThis.fetch = async () => new Response(gzipSync(Buffer.from(xml)), {
    status: 200,
    headers: { 'content-type': 'application/gzip' },
  });

  try {
    const parsed = await new SitemapDiscoveryEngine().fetchAndParseSitemapFile('https://example.com/sitemap.xml.gz');
    assert.equal(parsed.type, 'url_sitemap');
    assert.equal(parsed.urlCount, 1);
    assert.equal(parsed.rawUrls?.[0]?.loc, 'https://example.com/a');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
