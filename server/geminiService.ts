import { GoogleGenAI, Type } from '@google/genai';
import {
  AuditRecommendation,
  DeveloperTicket,
  AuditSummaryStats,
  PageTypeCoverageStats,
  IssueItem,
  CrawledUrlRecord,
} from '../src/types/audit.js';

let geminiClient: GoogleGenAI | null = null;

function getGemini(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: apiKey.trim(),
    });
  }
  return geminiClient;
}

const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

export class GeminiAuditAdvisor {
  /**
   * Generate grounded AI recommendations using deterministic audit data
   */
  static async generateAuditRecommendations(
    domain: string,
    summaryStats: AuditSummaryStats,
    pageTypeCoverage: PageTypeCoverageStats[],
    issues: IssueItem[],
    sampleMissingUrls: CrawledUrlRecord[]
  ): Promise<AuditRecommendation> {
    const ai = getGemini();
    if (!ai) {
      console.info('[GeminiAuditAdvisor] Server running without GEMINI_API_KEY. Using deterministic rule-based analysis.');
      return this.getFallbackRecommendations(domain, summaryStats, pageTypeCoverage, issues, sampleMissingUrls);
    }

    try {
      // Aggregate high-priority facts to ground Gemini
      const missingByPageType = pageTypeCoverage
        .filter((p) => p.potentiallyMissingCount > 0)
        .map((p) => `${p.pageType}: ${p.potentiallyMissingCount} missing (coverage: ${p.coveragePercentage}%, expected: ${p.expectedSitemap})`);

      const topIssues = issues.slice(0, 15).map((i) => ({
        type: i.type,
        severity: i.severity,
        title: i.title,
        url: i.affectedUrl,
        pageType: i.pageType,
        sitemap: i.affectedSitemap,
      }));

      const examples = sampleMissingUrls.slice(0, 8).map((u) => ({
        url: u.normalizedUrl,
        pageType: u.pageType,
        status: u.httpStatus,
        inlinks: u.inboundInternalLinksCount,
      }));

      const prompt = `You are a Technical SEO Principal Architect auditing sitemap coverage for domain: "${domain}".
Analyze this deterministic audit data strictly. Do NOT hallucinate or invent URLs, page types, or numbers.

Deterministic Audit Context:
- Discovered URLs via internal crawl: ${summaryStats.totalDiscoveredInternalUrls}
- Sitemap URLs processed: ${summaryStats.totalProcessedSitemapUrls}
- Potentially missing URLs count: ${summaryStats.potentiallyMissingUrlsCount}
- Overall Sitemap Coverage: ${summaryStats.sitemapCoveragePercentage}%
- Critical issues count: ${summaryStats.criticalIssuesCount}
- Sitemap redirects count: ${summaryStats.sitemapRedirectCount}
- Noindex/blocked in sitemap count: ${summaryStats.invalidSitemapUrlsCount}
- Unreferenced sitemaps detected: ${summaryStats.unreferencedSitemapsCount}
- Duplicate URLs across sitemaps: ${summaryStats.duplicateAcrossSitemapsCount}

Page-type coverage breakdown:
${missingByPageType.join('\n') || 'All page types have 100% coverage.'}

Sample Top Issues:
${JSON.stringify(topIssues, null, 2)}

Sample Missing URLs:
${JSON.stringify(examples, null, 2)}

Requirements:
1. Summarize the most important findings with professional SEO restraint.
2. Identify repeated URL-pattern problems vs isolated issues.
3. Suggest the likely sitemap-generation rule or query that needs investigation.
4. Prioritize fixes by scale and SEO impact.
5. Use cautious phrasing: "The evidence suggests...", "This may indicate...", "Confirm the sitemap generation rule for...". Do not present inferred causes as absolute facts.
6. Every recommendation must cite exact supporting counts and example URLs provided above.`;

      const response = await ai.models.generateContent({
        model: DEFAULT_GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction:
            'You are an expert Technical SEO auditor. Produce clear, highly structured, evidence-grounded recommendations without generic fluff.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: 'Executive summary citing overall coverage percentage and core problem areas.',
              },
              importantFindings: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    impact: { type: Type.STRING, enum: ['critical', 'high', 'medium'] },
                    description: { type: Type.STRING },
                    affectedCount: { type: Type.NUMBER },
                    exampleUrls: { type: Type.ARRAY, items: { type: Type.STRING } },
                    likelyRule: { type: Type.STRING },
                  },
                  required: ['title', 'impact', 'description', 'affectedCount', 'exampleUrls', 'likelyRule'],
                },
              },
              patternProblems: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    pattern: { type: Type.STRING },
                    pageType: { type: Type.STRING },
                    issue: { type: Type.STRING },
                    evidence: { type: Type.STRING },
                    suggestedFix: { type: Type.STRING },
                  },
                  required: ['pattern', 'pageType', 'issue', 'evidence', 'suggestedFix'],
                },
              },
              prioritizedActions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    priority: { type: Type.NUMBER },
                    action: { type: Type.STRING },
                    scope: { type: Type.STRING },
                    impactDescription: { type: Type.STRING },
                  },
                  required: ['priority', 'action', 'scope', 'impactDescription'],
                },
              },
            },
            required: ['summary', 'importantFindings', 'patternProblems', 'prioritizedActions'],
          },
        },
      });

      const parsed: any = JSON.parse(response.text || '{}');
      return {
        ...parsed,
        generatedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      console.warn('[GeminiAuditAdvisor] Gemini recommendation API error, using deterministic fallback:', error.message);
      return this.getFallbackRecommendations(domain, summaryStats, pageTypeCoverage, issues, sampleMissingUrls);
    }
  }

  static getFallbackRecommendations(
    domain: string,
    summaryStats: AuditSummaryStats,
    pageTypeCoverage: PageTypeCoverageStats[],
    issues: IssueItem[],
    sampleMissingUrls: CrawledUrlRecord[]
  ): AuditRecommendation {
    const missingHigh = sampleMissingUrls.filter((u) => u.priority === 'high' || u.isPotentiallyMissing);
    return {
      summary: `Deterministic audit analysis for ${domain}: Sitemap coverage is calculated at ${summaryStats.sitemapCoveragePercentage}%. Found ${summaryStats.potentiallyMissingUrlsCount} live, indexable canonical URLs missing from submitted XML sitemaps along with ${summaryStats.invalidSitemapUrlsCount} invalid sitemap URLs.`,
      importantFindings: [
        {
          title: 'Valid Discovered URLs Missing from Sitemaps',
          impact: 'critical',
          description: `The internal crawl discovered ${summaryStats.potentiallyMissingUrlsCount} live, indexable canonical URLs that are currently missing from all processed XML sitemaps.`,
          affectedCount: summaryStats.potentiallyMissingUrlsCount,
          exampleUrls: missingHigh.slice(0, 3).map((u) => u.normalizedUrl),
          likelyRule: 'Confirm the sitemap generation query or export script handles all active published entity records.',
        },
        {
          title: 'Sitemap Non-200 and Conflicting Directives',
          impact: 'high',
          description: `Sitemaps contain ${summaryStats.sitemapRedirectCount} redirecting URLs and ${summaryStats.invalidSitemapUrlsCount} non-indexable or broken entries.`,
          affectedCount: summaryStats.sitemapRedirectCount + summaryStats.invalidSitemapUrlsCount,
          exampleUrls: sampleMissingUrls.filter((u) => u.httpStatus >= 300).slice(0, 3).map((u) => u.normalizedUrl),
          likelyRule: 'Confirm sitemap generator script purges redirected, 404, or noindexed URLs.',
        },
      ],
      patternProblems: [
        {
          pattern: 'Systematic template exclusion',
          pageType: 'Multiple',
          issue: 'Template-level omission of newly created or updated directory paths.',
          evidence: 'Multiple child URLs under specific path trees share identical omission symptoms.',
          suggestedFix: 'Review CMS sitemap cron export triggers and route matchers.',
        },
      ],
      prioritizedActions: [
        {
          priority: 1,
          action: 'Add high-value missing URLs and Homepage to corresponding XML sitemaps',
          scope: `${summaryStats.potentiallyMissingUrlsCount} URLs`,
          impactDescription: 'Directly ensures Google discovers and crawls preferred canonical revenue pages.',
        },
        {
          priority: 2,
          action: 'Clean up redirects and noindex URLs in sitemaps',
          scope: `${summaryStats.sitemapRedirectCount + summaryStats.invalidSitemapUrlsCount} URLs`,
          impactDescription: 'Prevents search bot crawl budget wastage and conflicting indexation signals.',
        },
      ],
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate an editable Jira / Engineering developer ticket
   */
  static async generateDeveloperTicket(
    domain: string,
    issueCategory: string,
    affectedCount: number,
    exampleUrls: string[],
    pageType: string
  ): Promise<DeveloperTicket> {
    const ai = getGemini();
    if (!ai) {
      console.info('[GeminiAuditAdvisor] Server running without GEMINI_API_KEY. Using deterministic ticket template.');
      return this.getFallbackTicket(domain, issueCategory, affectedCount, exampleUrls, pageType);
    }

    try {
      const prompt = `Generate a precise, actionable engineering developer ticket for domain "${domain}" addressing this SEO issue:
Category: "${issueCategory}"
Affected Page Type: "${pageType}"
Number of Affected URLs: ${affectedCount}
Example URLs:
${exampleUrls.join('\n')}

Format requirements:
- Grounded and realistic
- Includes objective, problem, exact evidence, expected vs actual behavior, recommended engineering investigation, acceptance criteria, and QA verification steps.`;

      const response = await ai.models.generateContent({
        model: DEFAULT_GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction: 'You are a Lead SEO Technical Project Manager writing Jira tickets for backend software engineers.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              objective: { type: Type.STRING },
              problem: { type: Type.STRING },
              evidence: { type: Type.STRING },
              expectedBehaviour: { type: Type.STRING },
              actualBehaviour: { type: Type.STRING },
              recommendedInvestigation: { type: Type.STRING },
              acceptanceCriteria: { type: Type.ARRAY, items: { type: Type.STRING } },
              qaSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: [
              'title',
              'objective',
              'problem',
              'evidence',
              'expectedBehaviour',
              'actualBehaviour',
              'recommendedInvestigation',
              'acceptanceCriteria',
              'qaSteps',
            ],
          },
        },
      });

      const parsed: any = JSON.parse(response.text || '{}');
      return {
        id: 'ticket-' + Math.random().toString(36).substring(2, 9),
        title: parsed.title || `Fix ${issueCategory} for ${pageType}`,
        objective: parsed.objective || `Ensure all ${pageType} URLs are properly synchronized in XML sitemaps.`,
        problem: parsed.problem || `${affectedCount} ${pageType} URLs are experiencing ${issueCategory}.`,
        evidence: parsed.evidence || `Discovered during internal crawl across ${affectedCount} URLs including ${exampleUrls[0] || ''}.`,
        affectedPageType: pageType,
        affectedUrlCount: affectedCount,
        exampleUrls,
        expectedBehaviour: parsed.expectedBehaviour || 'All published live 200 OK canonical URLs must be included in XML sitemaps.',
        actualBehaviour: parsed.actualBehaviour || `${affectedCount} URLs are omitted from automated sitemap feeds.`,
        recommendedInvestigation: parsed.recommendedInvestigation || 'Inspect sitemap generator SQL query and filtering logic.',
        acceptanceCriteria: parsed.acceptanceCriteria || [
          'Affected URLs appear in target XML sitemap with valid lastmod dates.',
          'Sitemap passes W3C XML validation.',
        ],
        qaSteps: parsed.qaSteps || [
          'Trigger sitemap build in staging environment.',
          'Verify affected sample URLs are present in output XML.',
        ],
      };
    } catch (e: any) {
      console.warn('[GeminiAuditAdvisor] Gemini ticket generation error, using fallback ticket:', e.message);
      return this.getFallbackTicket(domain, issueCategory, affectedCount, exampleUrls, pageType);
    }
  }

  static getFallbackTicket(
    domain: string,
    issueCategory: string,
    affectedCount: number,
    exampleUrls: string[],
    pageType: string
  ): DeveloperTicket {
    return {
      id: 'ticket-' + Math.random().toString(36).substring(2, 9),
      title: `SEO Fix: Sync ${affectedCount} ${pageType} URLs in XML Sitemaps (${issueCategory})`,
      objective: `Ensure all published live canonical ${pageType} URLs are indexed and represented in automated XML sitemap feeds.`,
      problem: `Internal crawl discovered ${affectedCount} valid 200 OK ${pageType} pages that are affected by ${issueCategory}.`,
      evidence: `Audit found ${affectedCount} affected URLs. Examples: ${exampleUrls.slice(0, 3).join(', ')}`,
      affectedPageType: pageType,
      affectedUrlCount: affectedCount,
      exampleUrls,
      expectedBehaviour: 'All active public canonical URLs must be automatically included in XML sitemaps on build.',
      actualBehaviour: 'Sitemap export script skips newly created or re-categorized entities.',
      recommendedInvestigation: 'Inspect the sitemap generation job and database query filters for published status flags.',
      acceptanceCriteria: [
        'All active URLs are included in target sitemap files.',
        'No 301 redirects, 404s, or noindexed pages are included in sitemaps.',
      ],
      qaSteps: [
        'Run sitemap generation task in staging.',
        'Verify sample URLs exist in generated sitemap.',
        'Check Search Console sitemap submission response.',
      ],
    };
  }
}
