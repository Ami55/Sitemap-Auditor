import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  FileCode,
  Copy,
  Check,
  Download,
  AlertTriangle,
  Flame,
  Info,
  CheckCircle2,
  Edit3,
  Layers,
  ChevronRight,
  Plus,
} from 'lucide-react';
import {
  AuditRecommendation,
  DeveloperTicket,
  PageTypeCoverageStats,
  IssueItem,
} from '../../types/audit.js';

interface RecommendationsViewProps {
  auditId: string;
  domain: string;
  recommendation?: AuditRecommendation;
  savedTickets?: DeveloperTicket[];
  pageTypeCoverage: PageTypeCoverageStats[];
  issues: IssueItem[];
  onRefreshRecommendations: () => void;
  onTicketGenerated: (ticket: DeveloperTicket) => void;
}

export const RecommendationsView: React.FC<RecommendationsViewProps> = ({
  auditId,
  domain,
  recommendation,
  savedTickets = [],
  pageTypeCoverage,
  issues,
  onRefreshRecommendations,
  onTicketGenerated,
}) => {
  const [isGeneratingRecs, setIsGeneratingRecs] = useState(false);
  const [isGeneratingTicket, setIsGeneratingTicket] = useState(false);

  // Ticket Generator Form State
  const [ticketIssueCategory, setTicketIssueCategory] = useState('Missing from XML Sitemaps');
  const [ticketPageType, setTicketPageType] = useState('Tour Detail Pages');
  const [ticketAffectedCount, setTicketAffectedCount] = useState(4320);
  const [ticketExampleUrls, setTicketExampleUrls] = useState(
    'https://www.globetrotter-expeditions.com/tours/classic-italy-10-days\nhttps://www.globetrotter-expeditions.com/tours/peru-machu-picchu-explorer\nhttps://www.globetrotter-expeditions.com/tours/japan-cherry-blossom-trail'
  );

  // Active / Editable ticket
  const [currentTicket, setCurrentTicket] = useState<DeveloperTicket | null>(
    savedTickets[0] || null
  );
  const [copiedFormat, setCopiedFormat] = useState<'jira' | 'markdown' | null>(null);

  const handleGenerateRecommendations = async () => {
    setIsGeneratingRecs(true);
    try {
      const res = await fetch(`/api/audits/${auditId}/recommendations`, {
        method: 'POST',
      });
      if (res.ok) {
        onRefreshRecommendations();
      }
    } catch (e) {
      console.error('Failed to generate recommendations:', e);
    } finally {
      setIsGeneratingRecs(false);
    }
  };

  const handleGenerateTicket = async () => {
    setIsGeneratingTicket(true);
    try {
      const examples = ticketExampleUrls
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch(`/api/audits/${auditId}/generate-ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueCategory: ticketIssueCategory,
          affectedCount: ticketAffectedCount,
          exampleUrls: examples,
          pageType: ticketPageType,
        }),
      });

      if (res.ok) {
        const ticket: DeveloperTicket = await res.json();
        setCurrentTicket(ticket);
        onTicketGenerated(ticket);
      }
    } catch (e) {
      console.error('Failed to generate developer ticket:', e);
    } finally {
      setIsGeneratingTicket(false);
    }
  };

  const formatTicketMarkdown = (ticket: DeveloperTicket): string => {
    return `# [SEO] ${ticket.title}

## Objective
${ticket.objective}

## Problem Statement
${ticket.problem}

## Evidence & Affected Scale
- **Affected Page Type:** ${ticket.affectedPageType}
- **Number of Affected URLs:** ${ticket.affectedUrlCount.toLocaleString()}
- **Discovered Evidence:** ${ticket.evidence}

### Example URLs:
${ticket.exampleUrls.map((u) => `- \`${u}\``).join('\n')}

## Expected Behaviour
${ticket.expectedBehaviour}

## Actual Behaviour
${ticket.actualBehaviour}

## Recommended Investigation
${ticket.recommendedInvestigation}

## Acceptance Criteria
${ticket.acceptanceCriteria.map((c) => `- [ ] ${c}`).join('\n')}

## QA Verification Steps
${ticket.qaSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}
`;
  };

  const formatTicketJira = (ticket: DeveloperTicket): string => {
    return `h1. [SEO] ${ticket.title}

*Objective:*
${ticket.objective}

*Problem Statement:*
${ticket.problem}

*Evidence & Affected Scale:*
* Affected Page Type: ${ticket.affectedPageType}
* Number of Affected URLs: ${ticket.affectedUrlCount.toLocaleString()}
* Discovered Evidence: ${ticket.evidence}

*Example URLs:*
${ticket.exampleUrls.map((u) => `# {{${u}}}`).join('\n')}

*Expected Behaviour:*
${ticket.expectedBehaviour}

*Actual Behaviour:*
${ticket.actualBehaviour}

*Recommended Investigation:*
${ticket.recommendedInvestigation}

*Acceptance Criteria:*
${ticket.acceptanceCriteria.map((c) => `* (/) ${c}`).join('\n')}

*QA Steps:*
${ticket.qaSteps.map((s, i) => `# ${s}`).join('\n')}
`;
  };

  const handleCopy = (format: 'jira' | 'markdown') => {
    if (!currentTicket) return;
    const text = format === 'jira' ? formatTicketJira(currentTicket) : formatTicketMarkdown(currentTicket);
    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  return (
    <div id="recommendations-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span>AI Executive Insights & Ticket Generator</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gemini analysis strictly grounded in deterministic audit counts, pattern detection, and engineering tickets.
          </p>
        </div>

        <button
          onClick={handleGenerateRecommendations}
          disabled={isGeneratingRecs}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingRecs ? 'animate-spin' : ''}`} />
          <span>{isGeneratingRecs ? 'Analyzing Audit Data...' : 'Refresh AI Analysis'}</span>
        </button>
      </div>

      {/* Grounded AI Analysis Findings */}
      {recommendation ? (
        <div className="space-y-4">
          {/* Executive Summary Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-900 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Grounded Executive Summary</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              {recommendation.summary}
            </p>
          </div>

          {/* Important Findings Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendation.importantFindings.map((finding, idx) => (
              <div
                key={idx}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
                        finding.impact === 'critical'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : finding.impact === 'high'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-blue-100 text-blue-800 border-blue-200'
                      }`}
                    >
                      {finding.impact}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-700">
                      {finding.affectedCount.toLocaleString()} Affected
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 mt-2">
                    {finding.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {finding.description}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[11px]">
                  <div className="text-slate-500">
                    <strong className="text-slate-700">Likely Sitemap Rule: </strong>
                    <span className="italic">{finding.likelyRule}</span>
                  </div>
                  {finding.exampleUrls && finding.exampleUrls.length > 0 && (
                    <div className="font-mono text-[10px] text-slate-600 truncate bg-slate-50 p-1.5 rounded border border-slate-200">
                      {finding.exampleUrls[0]}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pattern Problems */}
          {recommendation.patternProblems && recommendation.patternProblems.length > 0 && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Detected URL Pattern & Template Omission Problems</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recommendation.patternProblems.map((pat, i) => (
                  <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                    <div className="font-bold text-slate-900">{pat.pattern} ({pat.pageType})</div>
                    <div className="text-slate-600 text-[11px]">{pat.issue}</div>
                    <div className="text-slate-500 text-[10px] italic">Evidence: {pat.evidence}</div>
                    <div className="text-blue-700 text-[11px] font-medium pt-1">Fix: {pat.suggestedFix}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-8 text-center rounded-xl border border-slate-200 space-y-3">
          <Sparkles className="w-8 h-8 text-blue-600 mx-auto" />
          <div className="text-xs font-semibold text-slate-800">
            Generate AI Insights & Root-Cause Hypotheses
          </div>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Gemini synthesizes the deterministic crawl data to identify repeated pattern omissions and prioritize engineering fixes.
          </p>
          <button
            onClick={handleGenerateRecommendations}
            disabled={isGeneratingRecs}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
          >
            {isGeneratingRecs ? 'Processing...' : 'Run Grounded AI Analysis'}
          </button>
        </div>
      )}

      {/* Developer Ticket Generator Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-600" />
              <span>Engineering Developer Ticket Generator</span>
            </h3>
            <p className="text-xs text-slate-500">
              Create structured Jira or GitHub tickets with objectives, exact counts, evidence, and QA acceptance steps.
            </p>
          </div>
        </div>

        {/* Generator Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Issue Category
            </label>
            <input
              type="text"
              value={ticketIssueCategory}
              onChange={(e) => setTicketIssueCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Affected Page Type
            </label>
            <select
              value={ticketPageType}
              onChange={(e) => setTicketPageType(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
            >
              {pageTypeCoverage.map((p) => (
                <option key={p.pageType} value={p.pageType}>
                  {p.pageType} ({p.potentiallyMissingCount} missing)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Affected URL Count
            </label>
            <input
              type="number"
              value={ticketAffectedCount}
              onChange={(e) => setTicketAffectedCount(parseInt(e.target.value, 10) || 1)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block font-semibold text-slate-700 mb-1">
              Example Discovered URLs (One per line)
            </label>
            <textarea
              rows={2}
              value={ticketExampleUrls}
              onChange={(e) => setTicketExampleUrls(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono text-[11px]"
            />
          </div>

          <div className="md:col-span-3 flex justify-end">
            <button
              onClick={handleGenerateTicket}
              disabled={isGeneratingTicket}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGeneratingTicket ? 'Generating Ticket with Gemini...' : 'Generate Ticket'}</span>
            </button>
          </div>
        </div>

        {/* Editable Ticket Output */}
        {currentTicket && (
          <div className="p-5 bg-slate-900 text-slate-100 rounded-xl space-y-4 text-xs font-sans border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="font-bold text-white text-sm flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-400" />
                <span>Ticket: {currentTicket.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy('markdown')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedFormat === 'markdown' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Markdown</span>
                </button>
                <button
                  onClick={() => handleCopy('jira')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedFormat === 'jira' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Jira Markup</span>
                </button>
              </div>
            </div>

            {/* Editable Fields */}
            <div className="space-y-3">
              <div>
                <label className="text-slate-400 text-[11px] font-semibold block mb-1">Ticket Title</label>
                <input
                  type="text"
                  value={currentTicket.title}
                  onChange={(e) => setCurrentTicket({ ...currentTicket, title: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-[11px] font-semibold block mb-1">Objective</label>
                  <textarea
                    rows={2}
                    value={currentTicket.objective}
                    onChange={(e) => setCurrentTicket({ ...currentTicket, objective: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[11px] font-semibold block mb-1">Problem Statement</label>
                  <textarea
                    rows={2}
                    value={currentTicket.problem}
                    onChange={(e) => setCurrentTicket({ ...currentTicket, problem: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-[11px] font-semibold block mb-1">Recommended Investigation</label>
                <textarea
                  rows={2}
                  value={currentTicket.recommendedInvestigation}
                  onChange={(e) => setCurrentTicket({ ...currentTicket, recommendedInvestigation: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[11px] font-semibold block mb-1">Acceptance Criteria</label>
                <ul className="space-y-1">
                  {currentTicket.acceptanceCriteria.map((crit, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <input
                        type="text"
                        value={crit}
                        onChange={(e) => {
                          const updated = [...currentTicket.acceptanceCriteria];
                          updated[idx] = e.target.value;
                          setCurrentTicket({ ...currentTicket, acceptanceCriteria: updated });
                        }}
                        className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 text-xs"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
