import assert from 'node:assert/strict';
import test from 'node:test';
import { createDemoAuditDataset } from './sampleData.js';

test('bundled dataset is explicitly marked as an incomplete illustrative demo', () => {
  const { project } = createDemoAuditDataset();

  assert.equal(project.isDemo, true);
  assert.equal(project.dataProvenance?.scope, 'illustrative_sample');
  assert.equal(project.dataProvenance?.recordsComplete, false);
});

test('demo coverage KPIs reconcile with the page-type matrix', () => {
  const { project, pageTypeCoverage } = createDemoAuditDataset();
  const discovered = pageTypeCoverage.reduce((sum, row) => sum + row.discoveredValidUrls, 0);
  const included = pageTypeCoverage.reduce((sum, row) => sum + row.validSitemapUrlsCount, 0);
  const candidates = pageTypeCoverage.reduce((sum, row) => sum + row.potentiallyMissingCount, 0);
  const coverage = discovered > 0 ? Math.round((included / discovered) * 100) : 100;

  assert.equal(project.stats.totalDiscoveredInternalUrls, discovered);
  assert.equal(project.stats.validSitemapUrlsCount, included);
  assert.equal(project.stats.potentiallyMissingUrlsCount, candidates);
  assert.equal(project.stats.sitemapCoveragePercentage, coverage);
  assert.equal(included + candidates, discovered);
});

test('demo badges use the available evidence records rather than fallback values', () => {
  const { project, duplicateUrlsAcrossSitemaps, patternCandidates } = createDemoAuditDataset();

  assert.equal(project.stats.duplicateAcrossSitemapsCount, duplicateUrlsAcrossSitemaps.length);
  assert.equal(project.stats.unreferencedSitemapsCount, patternCandidates.length);
});
