import React, { useState } from 'react';
import {
  X,
  Globe,
  Sliders,
  ShieldCheck,
  Zap,
  Info,
  AlertTriangle,
  Play,
  Sparkles,
} from 'lucide-react';
import { CrawlConfig } from '../../types/audit.js';

interface NewAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: {
    name: string;
    homepageUrl: string;
    customSitemapUrl?: string;
    additionalSitemaps?: string[];
    config: Partial<CrawlConfig>;
    isDemo?: boolean;
  }) => void;
}

export const NewAuditModal: React.FC<NewAuditModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [activePreset, setActivePreset] = useState<'live' | 'demo'>('live');
  const [name, setName] = useState('');
  const [homepageUrl, setHomepageUrl] = useState('https://');
  const [customSitemapUrl, setCustomSitemapUrl] = useState('');
  const [additionalSitemaps, setAdditionalSitemaps] = useState('');
  const [maxUrls, setMaxUrls] = useState(250000);
  const [crawlDepth, setCrawlDepth] = useState(0); // 0 = unlimited within host
  const [crawlSpeed, setCrawlSpeed] = useState<'conservative' | 'moderate' | 'fast'>('conservative');
  const [includeSubdomains, setIncludeSubdomains] = useState(false);
  const [respectRobotsTxt, setRespectRobotsTxt] = useState(true);
  const [userAgent, setUserAgent] = useState('SitemapCoverageAuditor/1.0 (+https://example.com/bot)');
  const [excludeDirs, setExcludeDirs] = useState('/cdn-cgi/, /wp-admin/, /checkout/');
  const [excludeParams, setExcludeParams] = useState('sessionid, gclid, fbclid, utm_');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (activePreset === 'demo') {
      onSubmit({
        name: 'Globetrotter Expeditions (Large Website Demo)',
        homepageUrl: 'https://www.globetrotter-expeditions.com',
        config: {},
        isDemo: true,
      });
      onClose();
      return;
    }

    if (!homepageUrl || homepageUrl.trim() === 'https://' || homepageUrl.trim() === 'http://') {
      setError('Please enter a valid website homepage URL.');
      return;
    }

    try {
      const parsed = new URL(homepageUrl.trim());
      if (!parsed.protocol.startsWith('http')) {
        setError('URL must start with http:// or https://');
        return;
      }
    } catch {
      setError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    const additionalList = additionalSitemaps
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const excludeDirList = excludeDirs
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const excludeParamList = excludeParams
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    onSubmit({
      name: name.trim() || `${new URL(homepageUrl).hostname} Sitemap Audit`,
      homepageUrl: homepageUrl.trim(),
      customSitemapUrl: customSitemapUrl.trim() || undefined,
      additionalSitemaps: additionalList,
      config: {
        maxUrls,
        crawlDepth,
        crawlSpeed,
        includeSubdomains,
        respectRobotsTxt,
        userAgent,
        excludeDirectoryPatterns: excludeDirList,
        excludeQueryPatterns: excludeParamList,
      },
      isDemo: false,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div
        id="modal-new-audit"
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Create New Sitemap Coverage Audit
            </h2>
            <p className="text-xs text-slate-600">
              Discovers internal crawlable URLs and compares them with all XML sitemap files.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audit Mode Selector */}
        <div className="p-6 pb-2 border-b border-slate-100">
          <label className="text-xs font-semibold text-slate-700 block mb-2">
            Select Audit Mode:
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setActivePreset('live')}
              className={`p-3 rounded-lg border text-left flex items-start gap-3 transition-all cursor-pointer ${
                activePreset === 'live'
                  ? 'border-blue-600 bg-blue-50/60 text-blue-950 ring-1 ring-blue-600'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
              }`}
            >
              <Zap className={`w-5 h-5 mt-0.5 ${activePreset === 'live' ? 'text-blue-600' : 'text-slate-400'}`} />
              <div>
                <div className="text-xs font-bold">Live Website Crawl</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Fetch robots.txt, parse XML sitemaps, and run polite internal crawl.
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActivePreset('demo')}
              className={`p-3 rounded-lg border text-left flex items-start gap-3 transition-all cursor-pointer ${
                activePreset === 'demo'
                  ? 'border-blue-600 bg-blue-50/60 text-blue-950 ring-1 ring-blue-600'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
              }`}
            >
              <Sparkles className={`w-5 h-5 mt-0.5 ${activePreset === 'demo' ? 'text-blue-600' : 'text-slate-400'}`} />
              <div>
                <div className="text-xs font-bold">Load 240k Scale Demo Dataset</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Globetrotter Expeditions with 8 sitemaps, homepage omission & 7 core issues.
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {activePreset === 'demo' ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 space-y-2">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-600" />
                <span>Enterprise Sample Audit Details:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                <li><strong>Website:</strong> Globetrotter Expeditions (www.globetrotter-expeditions.com)</li>
                <li><strong>Scale:</strong> 248,190 discovered URLs / 231,450 sitemap URLs across 8 sitemap files.</li>
                <li><strong>Archetype Issues:</strong> Root homepage omitted from sitemaps, valid tour detail pages missing, unreferenced child sitemaps (tours_archive_2025.xml), redirecting sitemap entries, noindex checkout URLs, and cross-sitemap duplicate URLs.</li>
              </ul>
            </div>
          ) : (
            <>
              {/* Target Website */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Website Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Travel Corp"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Homepage URL <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={homepageUrl}
                    onChange={(e) => setHomepageUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono text-xs"
                  />
                </div>
              </div>

              {/* Sitemap Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Optional Direct Sitemap URL
                  </label>
                  <input
                    type="url"
                    value={customSitemapUrl}
                    onChange={(e) => setCustomSitemapUrl(e.target.value)}
                    placeholder="https://example.com/sitemap_index.xml"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono text-xs"
                  />
                  <span className="text-[11px] text-slate-500">
                    If blank, /robots.txt and standard locations are probed.
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Additional Sitemap URLs (One per line)
                  </label>
                  <textarea
                    rows={2}
                    value={additionalSitemaps}
                    onChange={(e) => setAdditionalSitemaps(e.target.value)}
                    placeholder="https://example.com/sitemaps/tours.xml&#10;https://example.com/sitemaps/blog.xml"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono text-xs"
                  />
                </div>
              </div>

              {/* Crawl Limits & Concurrency */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Max URL Limit
                  </label>
                  <select
                    value={maxUrls}
                    onChange={(e) => setMaxUrls(parseInt(e.target.value, 10))}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  >
                    <option value={200}>200 URLs (Quick Test)</option>
                    <option value={1000}>1,000 URLs (Standard)</option>
                    <option value={10000}>10,000 URLs (Deep)</option>
                    <option value={250000}>250,000 URLs (Default Enterprise)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Crawl Depth
                  </label>
                  <select
                    value={crawlDepth}
                    onChange={(e) => setCrawlDepth(parseInt(e.target.value, 10))}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  >
                    <option value={0}>Unlimited (Same host)</option>
                    <option value={2}>Depth 2 (Top levels only)</option>
                    <option value={4}>Depth 4</option>
                    <option value={8}>Depth 8</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Crawl Speed
                  </label>
                  <select
                    value={crawlSpeed}
                    onChange={(e) => setCrawlSpeed(e.target.value as any)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="conservative">Conservative (Polite)</option>
                    <option value="moderate">Moderate</option>
                    <option value="fast">Fast (Higher Concurrency)</option>
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2 p-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={respectRobotsTxt}
                    onChange={(e) => setRespectRobotsTxt(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 block">Respect robots.txt</span>
                    <span className="text-[11px] text-slate-500">Honor Disallow rules</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeSubdomains}
                    onChange={(e) => setIncludeSubdomains(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 block">Include Subdomains</span>
                    <span className="text-[11px] text-slate-500">Crawl *.domain.com</span>
                  </div>
                </label>
              </div>

              {/* User Agent */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Crawler User-Agent
                </label>
                <input
                  type="text"
                  value={userAgent}
                  onChange={(e) => setUserAgent(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 font-mono text-xs text-slate-700"
                />
              </div>
            </>
          )}

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>{activePreset === 'demo' ? 'Load Demo Audit' : 'Start Live Audit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
