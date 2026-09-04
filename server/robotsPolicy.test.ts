import assert from 'node:assert/strict';
import test from 'node:test';
import { RobotsPolicy } from './robotsPolicy.js';

test('robots policy selects the most specific user-agent group', () => {
  const policy = new RobotsPolicy(`
    User-agent: *
    Disallow: /private/

    User-agent: SitemapCoverageAuditor
    Disallow: /audit-blocked/
  `, 'SitemapCoverageAuditor/1.0');

  assert.equal(policy.isAllowed('https://example.com/private/page'), true);
  assert.equal(policy.isAllowed('https://example.com/audit-blocked/page'), false);
});

test('robots policy applies longest matching rule and Allow wins ties', () => {
  const policy = new RobotsPolicy(`
    User-agent: *
    Disallow: /catalog/
    Allow: /catalog/public/
    Disallow: /*?session=*$
  `, 'OtherBot/1.0');

  assert.equal(policy.isAllowed('https://example.com/catalog/private/item'), false);
  assert.equal(policy.isAllowed('https://example.com/catalog/public/item'), true);
  assert.equal(policy.isAllowed('https://example.com/page?session=abc'), false);
});
