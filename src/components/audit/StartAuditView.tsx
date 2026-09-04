import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Database, Globe2, Loader2, Search, ShieldCheck } from 'lucide-react';
import { AuditProject, CrawlConfig } from '../../types/audit.js';

export interface CreateAuditParams {
  name: string;
  homepageUrl: string;
  customSitemapUrl?: string;
  additionalSitemaps?: string[];
  config: Partial<CrawlConfig>;
  isDemo?: boolean;
}

interface StartAuditViewProps {
  projects: AuditProject[];
  onStart: (params: CreateAuditParams) => Promise<boolean>;
  onOpenDemo: () => void;
  onOpenExisting: (id: string) => void;
  isSubmitting: boolean;
  error: string | null;
}

export const StartAuditView: React.FC<StartAuditViewProps> = ({
  projects,
  onStart,
  onOpenDemo,
  onOpenExisting,
  isSubmitting,
  error,
}) => {
  const [homepageUrl, setHomepageUrl] = useState('');
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [maxUrls, setMaxUrls] = useState(1000);
  const [crawlSpeed, setCrawlSpeed] = useState<'conservative' | 'moderate' | 'fast'>('conservative');
  const [localError, setLocalError] = useState<string | null>(null);

  const liveProjects = projects.filter((project) => !project.isDemo);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null);
    let parsed: URL;
    try {
      parsed = new URL(homepageUrl.trim());
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('invalid protocol');
      if (sitemapUrl.trim()) new URL(sitemapUrl.trim());
    } catch {
      setLocalError('Enter a complete URL, including https://');
      return;
    }

    await onStart({
      name: `${parsed.hostname} Sitemap Audit`,
      homepageUrl: parsed.toString(),
      customSitemapUrl: sitemapUrl.trim() || undefined,
      config: {
        maxUrls,
        crawlDepth: 0,
        crawlSpeed,
        includeSubdomains: false,
        respectRobotsTxt: true,
      },
      isDemo: false,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-5 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center"><Globe2 className="w-5 h-5" /></div>
          <div>
            <div className="font-bold">SemanticMapper</div>
            <div className="text-xs text-slate-400">Sitemap Coverage Auditor</div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-12 lg:py-20 grid lg:grid-cols-[1fr_440px] gap-12 items-start">
        <section className="pt-3">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-300 bg-blue-500/10 border border-blue-400/20 rounded-full px-3 py-1.5 mb-6">
            <Search className="w-3.5 h-3.5" /> Evidence-based sitemap coverage
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
            Start with your website.<br /><span className="text-blue-400">See the dashboard after the audit begins.</span>
          </h1>
          <p className="mt-6 text-lg text-slate-300 max-w-2xl leading-relaxed">
            The auditor discovers internal URLs, parses XML sitemaps, and compares both sets to identify technical coverage gaps.
          </p>

          <div className="mt-9 grid sm:grid-cols-3 gap-4 text-sm">
            {[
              ['1', 'Discover', 'Crawl internal links and sitemap files'],
              ['2', 'Verify', 'Check status, robots, canonical and indexability signals'],
              ['3', 'Compare', 'Report evidence-backed sitemap gaps'],
            ].map(([number, title, text]) => (
              <div key={number} className="border border-white/10 bg-white/5 rounded-xl p-4">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold mb-3">{number}</div>
                <div className="font-semibold">{title}</div>
                <div className="text-xs text-slate-400 mt-1 leading-relaxed">{text}</div>
              </div>
            ))}
          </div>

          <div className="mt-7 flex items-start gap-3 text-sm text-amber-100 bg-amber-400/10 border border-amber-300/20 rounded-xl p-4 max-w-2xl">
            <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-amber-300" />
            <p><strong>Important:</strong> this measures sitemap and technical eligibility signals. It does not prove that Google indexed—or did not index—a URL. Connect Search Console data before making an indexation claim.</p>
          </div>
        </section>

        <section className="bg-white text-slate-900 rounded-2xl shadow-2xl shadow-blue-950/30 border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold">Create a live audit</h2>
            <p className="text-sm text-slate-500 mt-1">Enter the site first. No sample report is presented as your result.</p>
          </div>
          <form onSubmit={submit} className="p-6 space-y-5">
            {(localError || error) && <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">{localError || error}</div>}
            <label className="block">
              <span className="text-sm font-semibold">Website homepage <span className="text-rose-600">*</span></span>
              <input type="url" required value={homepageUrl} onChange={(e) => setHomepageUrl(e.target.value)} placeholder="https://example.com" className="mt-2 w-full px-3.5 py-3 border border-slate-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Sitemap URL <span className="font-normal text-slate-500">(optional)</span></span>
              <input type="url" value={sitemapUrl} onChange={(e) => setSitemapUrl(e.target.value)} placeholder="https://example.com/sitemap.xml" className="mt-2 w-full px-3.5 py-3 border border-slate-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              <span className="block text-xs text-slate-500 mt-1.5">Leave blank to discover it through robots.txt and standard locations.</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="text-sm font-semibold">URL limit</span><select value={maxUrls} onChange={(e) => setMaxUrls(Number(e.target.value))} className="mt-2 w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm"><option value="200">200 · quick test</option><option value="1000">1,000 · standard</option><option value="10000">10,000 · deep</option><option value="250000">250,000 · enterprise</option></select></label>
              <label className="block"><span className="text-sm font-semibold">Crawl speed</span><select value={crawlSpeed} onChange={(e) => setCrawlSpeed(e.target.value as typeof crawlSpeed)} className="mt-2 w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm"><option value="conservative">Conservative</option><option value="moderate">Moderate</option><option value="fast">Fast</option></select></label>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600"><CheckCircle2 className="w-4 h-4 text-emerald-600" />robots.txt respected by default</div>
            <button disabled={isSubmitting} type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold flex items-center justify-center gap-2">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />} Start live audit
            </button>
            <div className="relative py-1"><div className="border-t border-slate-200" /><span className="absolute left-1/2 -translate-x-1/2 -top-2 bg-white px-2 text-xs text-slate-400">or</span></div>
            <button type="button" onClick={onOpenDemo} className="w-full py-2.5 border border-slate-300 hover:bg-slate-50 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"><Database className="w-4 h-4 text-amber-600" /> Explore illustrative sample data</button>
            <p className="text-center text-[11px] text-slate-500">Demo numbers are fictional and clearly labelled. They are not results for your website.</p>
          </form>

          {liveProjects.length > 0 && <div className="px-6 pb-6"><div className="border-t border-slate-200 pt-5"><div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Audits in this session</div>{liveProjects.slice(0, 3).map((project) => <button key={project.id} onClick={() => onOpenExisting(project.id)} className="w-full text-left text-sm p-3 rounded-lg hover:bg-slate-50 border border-slate-200 mb-2"><span className="font-semibold block">{project.name}</span><span className="text-xs text-slate-500">{project.domain} · {project.status}</span></button>)}</div></div>}
        </section>
      </main>
    </div>
  );
};
