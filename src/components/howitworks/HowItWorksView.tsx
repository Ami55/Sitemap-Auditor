import React, { useState } from 'react';
import {
  HelpCircle,
  Compass,
  FileCode2,
  Workflow,
  Search,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ListTree,
  Terminal,
  Database,
  ExternalLink,
} from 'lucide-react';
import { TAXONOMY_PRIORITY_RULES } from '../../utils/urlClassifier.js';

interface HowItWorksViewProps {
  onNavigateToTab?: (tab: string) => void;
}

export const HowItWorksView: React.FC<HowItWorksViewProps> = ({ onNavigateToTab }) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'taxonomy' | 'pipeline' | 'sitemaps' | 'tickets'>('overview');

  return (
    <div id="how-it-works-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-sm">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SemanticMapper Architecture Guide</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            How SemanticMapper Audits & Classifies URLs
          </h2>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            SemanticMapper conducts deterministic comparison between internally crawled URLs, XML sitemap declarations, and a 11-priority hierarchical URL taxonomy engine to discover coverage gaps, nested indexing bugs, and orphan sitemap files at enterprise scale.
          </p>

          <div className="flex flex-wrap items-center gap-2.5 mt-5">
            <button
              onClick={() => setActiveSection('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeSection === 'overview'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-white/10 hover:bg-white/20 text-slate-200'
              }`}
            >
              System Pipeline
            </button>
            <button
              onClick={() => setActiveSection('taxonomy')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeSection === 'taxonomy'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-white/10 hover:bg-white/20 text-slate-200'
              }`}
            >
              11-Rule Priority Taxonomy
            </button>
            <button
              onClick={() => setActiveSection('sitemaps')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeSection === 'sitemaps'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-white/10 hover:bg-white/20 text-slate-200'
              }`}
            >
              Sitemap Tree & GSC Diagnosis
            </button>
            <button
              onClick={() => setActiveSection('tickets')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeSection === 'tickets'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-white/10 hover:bg-white/20 text-slate-200'
              }`}
            >
              Actionable Dev Tickets
            </button>
          </div>
        </div>
      </div>

      {/* Section 1: Overview & Pipeline */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm mb-3">
                1
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Crawl & Indexability Check</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                The crawler traverses the domain internal link graph up to 250,000 URLs, capturing HTTP status codes, meta robots, x-robots tags, canonical declarations, and inbound link counts.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm mb-3">
                2
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">XML Sitemap Parsing</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Fetches sitemap indexes, uncompresses .xml/.gz files, validates parent-child relationships, detects nested index schema errors, and checks for GSC submission anomalies.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm mb-3">
                3
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Deterministic Gap Intersection</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cross-references crawlable 200 OK indexable canonical URLs against all parsed sitemaps. Identifies omitted pages, classifies them by slug taxonomy, and generates ready-to-file Jira tickets.
              </p>
            </div>
          </div>

          {/* Flow Visualizer Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Workflow className="w-4 h-4 text-blue-600" />
              <span>Core Audit Decision Engine</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">A. URL Normalization</span>
                <p className="text-slate-600 text-[11px]">
                  Extracts clean relative slug, removes tracking parameters, normalizes trailing slashes, and resolves redirects.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">B. Indexability Gate</span>
                <p className="text-slate-600 text-[11px]">
                  Requires HTTP 200, noindex=false, robots.txt=allowed, and self-referencing canonical tag.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">C. Priority Taxonomy</span>
                <p className="text-slate-600 text-[11px]">
                  Executes 11-rule priority matching in strict numerical order to tag Page Group, Page Level, and Target Sitemap.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">D. Sitemap Verification</span>
                <p className="text-slate-600 text-[11px]">
                  Checks presence in active sitemap files. If missing, assigns severity and attaches remediation instructions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Taxonomy Engine */}
      {activeSection === 'taxonomy' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-600" />
              <span>Hierarchical 11-Rule Priority Order</span>
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              When classifying any URL or slug, SemanticMapper checks rules in strict ascending order (Priority 1 through 11). The first condition satisfied halts further evaluation:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/75 text-slate-700 border-b border-slate-200">
                    <th className="py-2.5 px-3 font-bold text-center w-16">Priority</th>
                    <th className="py-2.5 px-3 font-bold">Rule Condition</th>
                    <th className="py-2.5 px-3 font-bold">Page Group</th>
                    <th className="py-2.5 px-3 font-bold">Page Level</th>
                    <th className="py-2.5 px-3 font-bold">Example Slug</th>
                    <th className="py-2.5 px-3 font-bold">Target Sitemap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                  {TAXONOMY_PRIORITY_RULES.map((rule) => (
                    <tr key={rule.priority} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-center font-sans font-bold">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs">
                          #{rule.priority}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">
                        {rule.conditionDescription}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-800 font-medium">
                        {rule.pageGroup}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-600">
                        {rule.pageLevel}
                      </td>
                      <td className="py-2.5 px-3 text-blue-700 break-all">
                        {rule.exampleUrl}
                      </td>
                      <td className="py-2.5 px-3 text-emerald-800 font-sans font-medium">
                        {rule.expectedSitemap}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200 flex justify-end">
              {onNavigateToTab && (
                <button
                  onClick={() => onNavigateToTab('taxonomy')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span>Open Interactive URL Classifier</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Section 3: Sitemaps & GSC */}
      {activeSection === 'sitemaps' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>P0 Nested Sitemap Index Flaw</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Google Search Console adheres to standard sitemap XML protocol where a <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-700">&lt;sitemapindex&gt;</code> file can only reference <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700">&lt;urlset&gt;</code> sitemaps. Nesting a sitemap index within another child index causes GSC to reject the child and record 0 discovered pages.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-600" />
                <span>P1 Missing Child Sitemaps</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                When generating segmented sitemap files (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded">areas_1.xml</code> through <code className="bg-slate-100 px-1 py-0.5 rounded">areas_5.xml</code>), the parent index must reference all 5 files. Any omitted child files become orphan sitemaps that Googlebot will not discover naturally.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Section 4: Developer Tickets */}
      {activeSection === 'tickets' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-600" />
            <span>Automated Developer Ticket Generation</span>
          </h3>
          <p className="text-xs text-slate-600">
            For every discovered architectural fault, SemanticMapper compiles engineer-ready tickets formatted with problem statements, affected URL count, exact slug examples, XML schema requirements, and verification steps.
          </p>

          <div className="p-4 bg-slate-900 text-slate-200 rounded-lg font-mono text-xs space-y-2 border border-slate-800">
            <div className="text-blue-400 font-bold">// Ticket Output Format</div>
            <div><span className="text-slate-400">Title:</span> Fix Nested Sitemap Index Schema on /sitemaps/pillar-pages.xml</div>
            <div><span className="text-slate-400">Component:</span> SEO / Sitemap Architecture / XML Generator</div>
            <div><span className="text-slate-400">Severity:</span> P0 - Critical Indexing Blocker</div>
            <div><span className="text-slate-400">Acceptance Criteria:</span> Parent sitemap_index.xml must link directly to standard urlset schemas containing valid 200 OK URLs with self-referencing canonical tags.</div>
          </div>
        </div>
      )}
    </div>
  );
};
