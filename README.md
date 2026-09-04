<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/14d3e57e-31eb-4189-ba6d-8a18961a2ed0

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
# Sitemap Auditor

The application opens on a dedicated audit setup screen. A user must enter a website (and optionally a sitemap URL and crawl settings) before a live dashboard is shown. Illustrative sample data is available through a separate, explicitly labelled demo action and is never presented as a live result.

## Trust baseline (Sprint 1)

The bundled enterprise dataset is an illustrative, incomplete demo. It is now
explicitly labelled as sample data and must not be presented as a live crawl or
as proof of Google indexation.

Dashboard coverage totals are derived from the page-type aggregate matrix so
the displayed eligible, included, and candidate counts reconcile. Record-level
badges no longer fall back to invented values when evidence is unavailable.

Terminology distinguishes crawler observations from stronger claims:

- `Sitemap Inclusion Candidate` means the URL passed the current technical
  checks and was absent from parsed sitemaps; it still requires page-family
  policy review.
- `Not Discovered in Internal Crawl` does not prove that a URL has no internal
  links unless the crawl is complete.
- Google index status remains unknown without a connected Search Console data
  source.

Run the trust invariant tests with `pnpm test`, type-check with `pnpm lint`, and
create a production frontend build with `pnpm build`.

## Batched reliability improvements

- Live crawler records now carry technical eligibility, evidence, confidence,
  and a human-readable decision reason.
- Missing or multiple canonical declarations are review-only and are excluded
  from sitemap inclusion candidate totals.
- XML sitemap responses support real gzip decompression with compressed and
  uncompressed safety limits.
- Robots rules are evaluated by matching user-agent group, longest path match,
  `Allow`, `Disallow`, `*`, and `$` behaviour.
- Crawl batches run with bounded concurrency (2 conservative, 5 moderate, 12
  fast by default, capped at 25) and retry transient failures with backoff.
- Live audit provenance reports whether the configured crawl scope completed or
  remained partial.
