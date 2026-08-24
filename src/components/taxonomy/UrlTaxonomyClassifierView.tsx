import React, { useState } from 'react';
import {
  Compass,
  Search,
  CheckCircle2,
  ExternalLink,
  Layers,
  Sparkles,
  Copy,
  Check,
  Folder,
  Globe,
  Tag,
  ArrowRight,
  Filter,
  FileCode,
  ListTree,
} from 'lucide-react';
import {
  classifyUrlByTaxonomy,
  extractUrlSlug,
  TAXONOMY_PRIORITY_RULES,
  PriorityTaxonomyRule,
} from '../../utils/urlClassifier.js';
import { CrawledUrlRecord } from '../../types/audit.js';

interface UrlTaxonomyClassifierViewProps {
  auditId: string;
  crawledUrls?: CrawledUrlRecord[];
  onSelectUrl?: (url: string) => void;
}

export const UrlTaxonomyClassifierView: React.FC<UrlTaxonomyClassifierViewProps> = ({
  auditId,
  crawledUrls = [],
  onSelectUrl,
}) => {
  const [testInput, setTestInput] = useState('/tours/france/paris');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const currentResult = classifyUrlByTaxonomy(testInput);

  const samplePresets = [
    { label: 'Homepage', url: '/' },
    { label: 'Tours Directory', url: '/tours' },
    { label: 'Tours Country', url: '/tours/france' },
    { label: 'Tours City', url: '/tours/france/paris' },
    { label: 'Tour Guides Directory', url: '/tour-guides' },
    { label: 'Tour Guides City', url: '/tour-guides/france/paris' },
    { label: 'Tour Details', url: '/tours/italy/tour-details/ancient-rome-private-walking-guided-tour' },
    { label: 'Attraction Page', url: '/tours/canada/vancouver/attractions/grouse-mountain' },
    { label: 'Attraction Guide', url: '/tour-guides/canada/vancouver/attractions/granville-island-market' },
    { label: 'Shore Excursions Root', url: '/shore-excursions' },
    { label: 'Cruise Line', url: '/shore-excursions/riverside-luxury-cruises' },
    { label: 'Cruise Port / Shore Ex', url: '/tours/south-korea/seoul/shore-ex-tours' },
    { label: 'Safari Port / Shore Ex', url: '/safaris/south-africa/cape-town/shore-ex-tours' },
    { label: 'Safari Country', url: '/safaris/south-africa' },
    { label: 'Safari City', url: '/safaris/south-africa/cape-town' },
    { label: 'Essential Tours (Global)', url: '/tours/essentials-tours' },
    { label: 'Essential Tours (City)', url: '/tours/canada/vancouver/essentials-tours' },
    { label: 'Travel Blog Article', url: '/travel-blog/how-to-book-tour' },
    { label: 'Things to Do Country', url: '/things-to-do/united-states' },
    { label: 'Things to Do City', url: '/things-to-do/united-states/kansas-city' },
  ];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSlug(text);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 2:
        return 'bg-rose-100 text-rose-900 border-rose-300';
      case 3:
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 4:
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 5:
        return 'bg-indigo-100 text-indigo-900 border-indigo-300';
      case 6:
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 7:
        return 'bg-teal-100 text-teal-900 border-teal-300';
      case 8:
        return 'bg-cyan-100 text-cyan-900 border-cyan-300';
      case 9:
        return 'bg-violet-100 text-violet-900 border-violet-300';
      case 10:
        return 'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300';
      case 11:
        return 'bg-slate-100 text-slate-900 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Filter sample or crawled URLs
  const filteredUrls = samplePresets.filter((item) => {
    const classification = classifyUrlByTaxonomy(item.url);
    if (selectedGroupFilter !== 'all' && classification.pageGroup !== selectedGroupFilter) {
      return false;
    }
    if (selectedPriorityFilter !== 'all' && classification.rulePriority !== parseInt(selectedPriorityFilter, 10)) {
      return false;
    }
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      return (
        item.url.toLowerCase().includes(q) ||
        item.label.toLowerCase().includes(q) ||
        classification.pageLevel.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div id="url-taxonomy-classifier-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-600" />
            <span>URL Taxonomy & Priority Classification Engine</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict 11-priority deterministic classifier mapping relative URL slugs to page groups, page levels, and expected sitemaps.
          </p>
        </div>
      </div>

      {/* 1. Interactive Slug & URL Tester */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Live URL Slug Classifier & Tester</h3>
          </div>
          <span className="text-xs text-slate-500">Evaluates Priority Rules 1 through 11 in order</span>
        </div>

        {/* Input bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              id="input-test-slug"
              type="text"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="e.g. /tours/france/paris or https://example.com/safaris/south-africa/cape-town"
              className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
            {testInput && (
              <button
                onClick={() => setTestInput('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={() => handleCopy(currentResult.slug)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition-colors"
          >
            {copiedSlug === currentResult.slug ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Slug</span>
          </button>
        </div>

        {/* Quick Presets Pills */}
        <div className="mt-3">
          <div className="text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
            <span>Quick Test Examples:</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {samplePresets.map((preset) => (
              <button
                key={preset.url}
                onClick={() => setTestInput(preset.url)}
                className={`px-2 py-1 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
                  testInput === preset.url
                    ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                {preset.label}: <span className="opacity-75">{preset.url}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Live Evaluation Card */}
        <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Slug */}
            <div>
              <span className="text-[11px] uppercase font-bold text-slate-500 block mb-1">Normalized Slug</span>
              <div className="font-mono text-xs font-semibold text-slate-900 bg-white p-2 rounded border border-slate-200 break-all flex items-center justify-between">
                <span>{currentResult.slug}</span>
              </div>
            </div>

            {/* Priority & Condition */}
            <div>
              <span className="text-[11px] uppercase font-bold text-slate-500 block mb-1">Matched Rule</span>
              <div className="space-y-1">
                <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded-full border ${getPriorityColor(currentResult.rulePriority)}`}>
                  Priority #{currentResult.rulePriority}
                </span>
                <p className="text-[11px] text-slate-600 font-medium leading-tight">
                  {currentResult.matchedCondition}
                </p>
              </div>
            </div>

            {/* Page Group & Level */}
            <div>
              <span className="text-[11px] uppercase font-bold text-slate-500 block mb-1">Taxonomy Assignment</span>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-blue-700 flex items-center gap-1">
                  <Folder className="w-3.5 h-3.5" />
                  <span>Group: {currentResult.pageGroup}</span>
                </div>
                <div className="text-xs text-slate-700 font-medium flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span>Level: {currentResult.pageLevel}</span>
                </div>
              </div>
            </div>

            {/* Expected Sitemap */}
            <div>
              <span className="text-[11px] uppercase font-bold text-slate-500 block mb-1">Expected XML Sitemap</span>
              <div className="font-mono text-xs font-medium text-emerald-800 bg-emerald-50 px-2 py-1.5 rounded border border-emerald-200">
                {currentResult.expectedSitemap}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Full 11-Priority Classification Rules Reference Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ListTree className="w-4 h-4 text-blue-600" />
              <span>Deterministic 11-Priority Rule Taxonomy Engine</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluated strictly in priority order (1 to 11). The first condition that matches determines the classification.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/75 text-slate-700 border-b border-slate-200">
                <th className="py-2.5 px-3 font-bold text-center w-16">Priority</th>
                <th className="py-2.5 px-3 font-bold">URL Condition</th>
                <th className="py-2.5 px-3 font-bold">Page Group</th>
                <th className="py-2.5 px-3 font-bold">Page Level</th>
                <th className="py-2.5 px-3 font-bold">Canonical Slug Example</th>
                <th className="py-2.5 px-3 font-bold">Target Sitemap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {TAXONOMY_PRIORITY_RULES.map((rule) => {
                const isCurrentMatch = currentResult.rulePriority === rule.priority;
                return (
                  <tr
                    key={rule.priority}
                    className={`transition-colors ${
                      isCurrentMatch
                        ? 'bg-blue-50/80 font-medium'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded-full border ${getPriorityColor(rule.priority)}`}>
                        #{rule.priority}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-900 font-semibold">
                      {rule.conditionDescription}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {rule.pageGroup}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {rule.pageLevel}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-blue-700">
                      <button
                        onClick={() => setTestInput(rule.exampleUrl)}
                        className="hover:underline text-left cursor-pointer flex items-center gap-1"
                        title="Click to test this example"
                      >
                        <span>{rule.exampleUrl}</span>
                        <ArrowRight className="w-3 h-3 opacity-60" />
                      </button>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                      {rule.expectedSitemap}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Taxonomy Directory Tree Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Core Direct Directories */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Folder className="w-4 h-4 text-blue-600" />
            <span>Direct Directories & Structural Roots</span>
          </h4>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-mono font-bold text-slate-900">/tours/</span>
                <p className="text-[11px] text-slate-500">Tours directory root, country and city hubs</p>
              </div>
              <span className="text-[11px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Tours</span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-mono font-bold text-slate-900">/tour-guides/</span>
                <p className="text-[11px] text-slate-500">Guide directory root, country and city guide rosters</p>
              </div>
              <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">Tour Guides</span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-mono font-bold text-slate-900">/safaris/</span>
                <p className="text-[11px] text-slate-500">Safari directory root, country and regional hubs</p>
              </div>
              <span className="text-[11px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Safaris</span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-mono font-bold text-slate-900">/shore-excursions</span>
                <p className="text-[11px] text-slate-500">Cruise port excursions and cruise line itineraries</p>
              </div>
              <span className="text-[11px] font-semibold bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded">Shore Excursions</span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-mono font-bold text-slate-900">/travel-blog/</span>
                <p className="text-[11px] text-slate-500">Blog post index and individual article slugs</p>
              </div>
              <span className="text-[11px] font-semibold bg-purple-100 text-purple-800 px-2 py-0.5 rounded">Travel Blog</span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-mono font-bold text-slate-900">/things-to-do/</span>
                <p className="text-[11px] text-slate-500">Country and city destination activity guides</p>
              </div>
              <span className="text-[11px] font-semibold bg-teal-100 text-teal-800 px-2 py-0.5 rounded">Things to Do</span>
            </div>
          </div>
        </div>

        {/* Specialized Sub-Features */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Specialized Landing & Product Taxonomies</span>
          </h4>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-900">/tour-details/</span>
                <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">Priority #2</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5 font-mono">/tours/italy/tour-details/ancient-rome-private-walking-guided-tour</p>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-900">/attractions/</span>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">Priority #3</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5 font-mono">/tours/canada/vancouver/attractions/grouse-mountain</p>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-900">/shore-ex-tours</span>
                <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">Priority #4</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5 font-mono">/tours/south-korea/seoul/shore-ex-tours</p>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-900">/essentials-tours</span>
                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">Priority #5</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5 font-mono">/tours/essentials-tours or /tours/canada/vancouver/essentials-tours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
