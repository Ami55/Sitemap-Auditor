# Sitemap Auditor

Compare sitemap inclusion with crawl observations and technical eligibility, while keeping evidence and uncertainty visible.

Built by [Ami Saeednia](https://www.seogirl.ca), SEO / GEO Strategist.

[Live app](https://seogirl-sitemap-auditor.vercel.app/) · [Research and studies](https://www.seogirl.ca/research) · [All tools](https://www.seogirl.ca/apps)

![Sitemap Auditor interface; landing view and any example data are illustrative](docs/screenshot.png)

## The problem

Compare sitemap inclusion with crawl observations and technical eligibility, while keeping evidence and uncertainty visible.

## Who it is for

Technical SEOs reviewing sitemap coverage and prioritizing URLs for further investigation.

## Workflow and methodology

Start a live audit with a site, optional sitemap and crawl limits, or deliberately open the separate sample demo. Compare parsed sitemap URLs, internal discovery, robots and canonical observations, then inspect evidence and candidate reasons.

## Evidence and limitations

Crawl coverage depends on the configured scope and limits. Not discovered is not proof of no internal links. A sitemap inclusion candidate is a review recommendation, not a guarantee of indexation. Google index status is unknown without appropriate Search Console evidence. Sample results are illustrative.

The screenshot documents the interface, not an independently validated result. This repository is a practical research tool; its outputs require human review.

## Local setup

Run `npm install`, then `npm run dev`. Use `npm run test` for the backend trust tests, `npm run lint` for TypeScript checking, and `npm run build` for bundling. `npm start` runs the production server. Keep any optional model credentials in the server environment, never committed. Use a bounded crawl on sites you are authorized to inspect and review crawl completeness before drawing conclusions.

Review `package.json` for the exact scripts and dependencies. Do not put secrets in frontend code or commit local environment files.

## Background

I build tools to make entity strategy, technical SEO and AI-search research easier to inspect and apply. Explore my [independent studies](https://www.seogirl.ca/research), [workbooks](https://www.seogirl.ca/workbooks) and [project case studies](https://www.seogirl.ca/case-studies).

## Implementation and trust notes

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
