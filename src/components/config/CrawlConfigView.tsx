import React, { useState } from 'react';
import {
  Sliders,
  ShieldCheck,
  Zap,
  Info,
  AlertTriangle,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { CrawlConfig } from '../../types/audit.js';

interface CrawlConfigViewProps {
  config: CrawlConfig;
  onSaveConfig?: (config: CrawlConfig) => void;
}

export const CrawlConfigView: React.FC<CrawlConfigViewProps> = ({ config }) => {
  const [maxUrls, setMaxUrls] = useState(config.maxUrls);
  const [crawlDepth, setCrawlDepth] = useState(config.crawlDepth);
  const [crawlSpeed, setCrawlSpeed] = useState(config.crawlSpeed);
  const [respectRobotsTxt, setRespectRobotsTxt] = useState(config.respectRobotsTxt);
  const [includeSubdomains, setIncludeSubdomains] = useState(config.includeSubdomains);
  const [userAgent, setUserAgent] = useState(config.userAgent);
  const [excludeDirs, setExcludeDirs] = useState(config.excludeDirectoryPatterns.join(', '));
  const [excludeParams, setExcludeParams] = useState(config.excludeQueryPatterns.join(', '));
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div id="crawl-config-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600" />
            <span>Crawl & Discovery Engine Configuration</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage polite crawling limits, concurrency rate, parameter stripping, and regex exclusion filters.
          </p>
        </div>

        {savedNotice && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings Saved!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Speed & Politeness */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Crawler Speed & Concurrency Profile
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => setCrawlSpeed('conservative')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                crawlSpeed === 'conservative'
                  ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-xs text-slate-900">
                <span>Conservative (Recommended)</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                2 concurrent connections with 250ms polite delay. Zero server impact on production servers.
              </p>
            </div>

            <div
              onClick={() => setCrawlSpeed('moderate')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                crawlSpeed === 'moderate'
                  ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-xs text-slate-900">
                <span>Moderate</span>
                <Zap className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                5 concurrent requests with 100ms delay. Ideal for cloud-hosted staging or dedicated CDN caches.
              </p>
            </div>

            <div
              onClick={() => setCrawlSpeed('fast')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                crawlSpeed === 'fast'
                  ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-xs text-slate-900">
                <span>Fast</span>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                12 concurrent requests with 20ms delay. For high-capacity enterprise clusters during off-peak hours.
              </p>
            </div>
          </div>
        </div>

        {/* Crawl Scope & Limits */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Scope Limits & Boundary Rules
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Maximum URL Crawl Ceiling
              </label>
              <select
                value={maxUrls}
                onChange={(e) => setMaxUrls(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value={200}>200 URLs</option>
                <option value={1000}>1,000 URLs</option>
                <option value={10000}>10,000 URLs</option>
                <option value={250000}>250,000 URLs (High Scale)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Maximum Crawl Depth Limit
              </label>
              <select
                value={crawlDepth}
                onChange={(e) => setCrawlDepth(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value={0}>Unlimited (Full discovery within domain)</option>
                <option value={2}>Depth 2 (Top levels)</option>
                <option value={4}>Depth 4</option>
                <option value={8}>Depth 8</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <label className="flex items-center gap-2.5 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={respectRobotsTxt}
                onChange={(e) => setRespectRobotsTxt(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-semibold text-slate-900 block">Respect robots.txt Disallow Rules</span>
                <span className="text-[11px] text-slate-500">Do not crawl paths forbidden to Googlebot or user-agent</span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSubdomains}
                onChange={(e) => setIncludeSubdomains(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-semibold text-slate-900 block">Include Cross-Subdomains</span>
                <span className="text-[11px] text-slate-500">Allow traversing across blog.domain.com and app.domain.com</span>
              </div>
            </label>
          </div>
        </div>

        {/* URL Normalization & Filter Patterns */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Exclusion Patterns & URL Normalizer
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Directory Path Exclusions (Comma-separated)
              </label>
              <input
                type="text"
                value={excludeDirs}
                onChange={(e) => setExcludeDirs(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                URLs matching these path prefixes will not be queued for crawling.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Query Parameter Stripping List (Comma-separated)
              </label>
              <input
                type="text"
                value={excludeParams}
                onChange={(e) => setExcludeParams(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Tracking and session parameters stripped during canonical normalization.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                HTTP User-Agent Header
              </label>
              <input
                type="text"
                value={userAgent}
                onChange={(e) => setUserAgent(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration Preset</span>
          </button>
        </div>
      </form>
    </div>
  );
};
