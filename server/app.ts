import express from 'express';
import { auditStore } from './auditStore.js';
import { GeminiAuditAdvisor } from './geminiService.js';
import { AuditAnalyzer } from './analyzer.js';

export const app = express();

app.use(express.json());

// --- API Endpoints ---

// Health check with environment configuration status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    time: new Date().toISOString(),
    geminiConfigured: Boolean(
      process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY.trim() !== '' &&
      process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
    ),
  });
});

// List all audits
app.get('/api/audits', (req, res) => {
  try {
    const projects = auditStore.getAllProjects();
    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to list audit projects' });
  }
});

// Create new audit
app.post('/api/audits', async (req, res) => {
  try {
    const { name, homepageUrl, customSitemapUrl, additionalSitemaps, config, isDemo } = req.body;
    if (!homepageUrl && !isDemo) {
      return res.status(400).json({ error: 'Homepage URL is required to start an audit.' });
    }
    const project = await auditStore.createAudit({
      name,
      homepageUrl,
      customSitemapUrl,
      additionalSitemaps,
      config,
      isDemo,
    });
    res.status(201).json(project);
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'Failed to create audit' });
  }
});

// Get audit summary & stats
app.get('/api/audits/:id', (req, res) => {
  try {
    const session = auditStore.getAudit(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Audit not found' });
    }
    res.json({
      project: session.project,
      stats: session.project.stats,
      crawlProgress: session.project.crawlProgress,
      recommendation: session.project.recommendation,
      tickets: session.project.tickets,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Internal server error' });
  }
});

// Pause crawl
app.post('/api/audits/:id/pause', (req, res) => {
  const ok = auditStore.pauseAudit(req.params.id);
  res.json({ success: ok });
});

// Resume crawl
app.post('/api/audits/:id/resume', (req, res) => {
  const ok = auditStore.resumeAudit(req.params.id);
  res.json({ success: ok });
});

// Stop crawl
app.post('/api/audits/:id/stop', (req, res) => {
  const ok = auditStore.stopAudit(req.params.id);
  res.json({ success: ok });
});

// Get paginated/filtered URLs
app.get('/api/audits/:id/urls', (req, res) => {
  try {
    const { page, limit, onlyMissing, pageType, priority, search, httpStatus, canonicalStatus, suggestedSitemap } = req.query;

    const result = auditStore.getCrawledUrls(req.params.id, {
      page: page ? parseInt(String(page), 10) : 1,
      limit: limit ? parseInt(String(limit), 10) : 50,
      onlyMissing: onlyMissing === 'true',
      pageType: pageType ? String(pageType) : undefined,
      priority: priority ? String(priority) : undefined,
      search: search ? String(search) : undefined,
      httpStatus: httpStatus ? parseInt(String(httpStatus), 10) : undefined,
      canonicalStatus: canonicalStatus ? String(canonicalStatus) : undefined,
      suggestedSitemap: suggestedSitemap ? String(suggestedSitemap) : undefined,
    });

    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to fetch audit URLs' });
  }
});

// Get Sitemap Explorer tree & records
app.get('/api/audits/:id/sitemaps', (req, res) => {
  try {
    const session = auditStore.getAudit(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    const sitemapList = Array.from(session.sitemapFiles.values());
    res.json({
      sitemaps: sitemapList,
      duplicateUrls: session.duplicateUrlsAcrossSitemaps,
      patternCandidates: session.patternCandidates,
      totalCount: sitemapList.length,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to fetch sitemaps' });
  }
});

// Get multi-sitemap duplicate URLs with filters & pagination
app.get('/api/audits/:id/duplicates', (req, res) => {
  try {
    const { search, sitemap, page, limit } = req.query;
    const result = auditStore.getDuplicateUrls(req.params.id, {
      search: search ? String(search) : undefined,
      sitemap: sitemap ? String(sitemap) : undefined,
      page: page ? parseInt(String(page), 10) : 1,
      limit: limit ? parseInt(String(limit), 10) : 50,
    });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to fetch duplicate URLs' });
  }
});

// Get orphan URLs (in sitemaps with 0 inbound internal links) with filters & pagination
app.get('/api/audits/:id/orphans', (req, res) => {
  try {
    const { search, pageType, maxLinks, page, limit } = req.query;
    const result = auditStore.getOrphanUrls(req.params.id, {
      search: search ? String(search) : undefined,
      pageType: pageType ? String(pageType) : undefined,
      maxLinks: maxLinks !== undefined ? parseInt(String(maxLinks), 10) : 1,
      page: page ? parseInt(String(page), 10) : 1,
      limit: limit ? parseInt(String(limit), 10) : 50,
    });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to fetch orphan URLs' });
  }
});

// Get categorized problems
app.get('/api/audits/:id/problems', (req, res) => {
  try {
    const session = auditStore.getAudit(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    const issues = session.issues;
    const grouped = {
      redirects: issues.filter((i) => i.type === 'sitemap_redirect'),
      broken: issues.filter((i) => i.type === 'sitemap_broken'),
      noindex: issues.filter((i) => i.type === 'sitemap_noindex'),
      robotsBlocked: issues.filter((i) => i.type === 'sitemap_robots_blocked'),
      canonicalMismatch: issues.filter((i) => i.type === 'canonical_mismatch'),
      duplicates: issues.filter((i) => i.type === 'duplicate_across_sitemaps'),
      unreferenced: issues.filter((i) => i.type === 'unreferenced_sitemap_candidate'),
      invalidXml: issues.filter((i) => i.type === 'invalid_sitemap_xml'),
      missingCritical: issues.filter((i) => i.type === 'missing_critical_page'),
    };

    res.json({
      allIssues: issues,
      grouped,
      counts: {
        total: issues.length,
        critical: issues.filter((i) => i.severity === 'critical').length,
        high: issues.filter((i) => i.severity === 'high').length,
        medium: issues.filter((i) => i.severity === 'medium').length,
        review: issues.filter((i) => i.severity === 'review').length,
      },
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to fetch problems' });
  }
});

// Get page-type coverage matrix
app.get('/api/audits/:id/page-types', (req, res) => {
  try {
    const session = auditStore.getAudit(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Audit not found' });
    }
    res.json({
      rules: session.pageTypeRules,
      coverage: session.pageTypeCoverage,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to fetch page-types' });
  }
});

// Update page-type rules and re-calculate
app.put('/api/audits/:id/page-types', (req, res) => {
  try {
    const session = auditStore.getAudit(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    const newRules = req.body.rules;
    if (Array.isArray(newRules)) {
      session.pageTypeRules = newRules;
      // Re-run analysis
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
    }

    res.json({
      rules: session.pageTypeRules,
      coverage: session.pageTypeCoverage,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to update page-types' });
  }
});

// Get critical pages checklist
app.get('/api/audits/:id/critical-pages', (req, res) => {
  try {
    const session = auditStore.getAudit(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Audit not found' });
    }
    res.json(session.criticalPages);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to fetch critical pages' });
  }
});

// Add critical page
app.post('/api/audits/:id/critical-pages', (req, res) => {
  try {
    const { name, url, expectedSitemap, priority, notes } = req.body;
    const added = auditStore.addCriticalPage(req.params.id, {
      name,
      url,
      expectedSitemap: expectedSitemap || 'sitemap.xml',
      priority: priority || 'high',
      notes,
    });
    if (!added) {
      return res.status(404).json({ error: 'Audit not found' });
    }
    res.status(201).json(added);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to add critical page' });
  }
});

// Generate AI Recommendations
app.post('/api/audits/:id/recommendations', async (req, res) => {
  try {
    const session = auditStore.getAudit(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    const sampleMissing = Array.from(session.crawledUrls.values()).filter((u) => u.isPotentiallyMissing);
    const recommendation = await GeminiAuditAdvisor.generateAuditRecommendations(
      session.project.domain,
      session.project.stats,
      session.pageTypeCoverage,
      session.issues,
      sampleMissing
    );
    session.project.recommendation = recommendation;
    res.json(recommendation);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to generate recommendations' });
  }
});

// Generate Developer Ticket with Gemini
app.post('/api/audits/:id/generate-ticket', async (req, res) => {
  try {
    const session = auditStore.getAudit(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    const { issueCategory, affectedCount, exampleUrls, pageType } = req.body;
    const ticket = await GeminiAuditAdvisor.generateDeveloperTicket(
      session.project.domain,
      issueCategory || 'Missing from XML Sitemap',
      affectedCount || 1,
      exampleUrls || [session.project.homepageUrl],
      pageType || 'Tour Detail Pages'
    );

    if (!session.project.tickets) {
      session.project.tickets = [];
    }
    session.project.tickets.unshift(ticket);

    res.json(ticket);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to generate developer ticket' });
  }
});

// Export CSV or JSON
app.get('/api/audits/:id/export/:type', (req, res) => {
  try {
    const { id, type } = req.params;
    const session = auditStore.getAudit(id);
    if (!session) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    if (type === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${session.project.domain}-audit-report.json"`);
      return res.json({
        project: session.project,
        stats: session.project.stats,
        sitemaps: Array.from(session.sitemapFiles.values()),
        pageTypeCoverage: session.pageTypeCoverage,
        criticalPages: session.criticalPages,
        issues: session.issues,
        recommendation: session.project.recommendation,
        tickets: session.project.tickets,
        sampleCrawledUrls: Array.from(session.crawledUrls.values()).slice(0, 1000),
      });
    }

    const csvContent = auditStore.exportCsv(id, type as any);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${session.project.domain}-${type}-urls.csv"`);
    res.send(csvContent);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to generate export file' });
  }
});

export default app;
