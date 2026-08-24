import {
  AuditProject,
  CrawledUrlRecord,
  SitemapFileRecord,
  CriticalPageItem,
  PageTypeCoverageStats,
  IssueItem,
  AuditRecommendation,
  DeveloperTicket,
  IssueSeverity,
} from '../src/types/audit.js';
import { DEFAULT_PAGE_TYPE_RULES } from './analyzer.js';

export function createDemoAuditDataset(): {
  project: AuditProject;
  crawledUrls: Map<string, CrawledUrlRecord>;
  sitemapFiles: Map<string, SitemapFileRecord>;
  allSitemapUrls: Set<string>;
  duplicateUrlsAcrossSitemaps: { normalizedUrl: string; sitemaps: string[] }[];
  patternCandidates: SitemapFileRecord[];
  criticalPages: CriticalPageItem[];
  pageTypeCoverage: PageTypeCoverageStats[];
  issues: IssueItem[];
} {
  const baseDomain = 'www.example.com';
  const homepageUrl = `https://${baseDomain}`;

  const sitemapFiles = new Map<string, SitemapFileRecord>();
  const allSitemapUrls = new Set<string>();

  // ==========================================
  // 1. SITEMAP FILES (Full GSC Evidence Graph)
  // ==========================================

  // Root Index
  const rootIndex: SitemapFileRecord = {
    id: 'sm-root-index',
    url: `${homepageUrl}/sitemap_index.xml`,
    type: 'sitemap_index',
    httpStatus: 200,
    urlCount: 147804,
    fileSizeBytes: 14200,
    referencedByParent: false,
    discoveredThroughRobots: true,
    discoveryMethod: 'robots_txt',
    errors: [
      'Illegal nested indexing: /sitemaps/pillar-pages.xml and /sitemaps/static-pages.xml are referenced as child sitemaps but parsed as sitemap indexes by GSC',
      'Dual protocol reference detected: Referenced by both http:// and https:// root index references in GSC',
    ],
    warnings: [
      '/sitemaps/areas.xml index only links areas_1 and areas_2 (19,791 URLs); areas_3–5 (20,616 URLs) are unreferenced',
      '/sitemaps/tours.xml index only links tours_1–4 (36,583 URLs); tours_5–9 (20,000 URLs) are unreferenced',
    ],
    processingDate: '2026-08-17T14:30:00Z',
    childSitemaps: [
      `${homepageUrl}/sitemaps/areas.xml`,
      `${homepageUrl}/sitemaps/tours.xml`,
      `${homepageUrl}/sitemaps/attractions.xml`,
      `${homepageUrl}/sitemaps/regions.xml`,
      `${homepageUrl}/sitemaps/countries.xml`,
      `${homepageUrl}/sitemaps/blogs.xml`,
      `${homepageUrl}/sitemaps/things-to-do-city.xml`,
      `${homepageUrl}/sitemaps/things-to-do-country.xml`,
      `${homepageUrl}/sitemaps/pillar-pages.xml`,
      `${homepageUrl}/sitemaps/static-pages.xml`,
    ],
  };
  sitemapFiles.set(rootIndex.url, rootIndex);

  // Erroring Nested Indexes (P0)
  const pillarPagesIndex: SitemapFileRecord = {
    id: 'sm-err-pillar',
    url: `${homepageUrl}/sitemaps/pillar-pages.xml`,
    parentSitemapUrl: rootIndex.url,
    type: 'invalid_xml',
    httpStatus: 200,
    urlCount: 0,
    fileSizeBytes: 2400,
    referencedByParent: true,
    discoveredThroughRobots: false,
    discoveryMethod: 'sitemap',
    errors: [
      'GSC Error: "Nested indexing — This Sitemap Index is referenced by another Sitemap Index."',
      '0 discovered pages as a direct result of protocol violation',
      'Referenced by http://www.toursbylocals.com/sitemap_index.xml and https://www.toursbylocals.com/sitemap_index.xml',
    ],
    warnings: ['Conflicting working legacy counterpart exists: /pillar_sitemap.xml (4 pages, Success)'],
    processingDate: '2026-08-17T14:30:00Z',
  };
  sitemapFiles.set(pillarPagesIndex.url, pillarPagesIndex);

  const staticPagesIndex: SitemapFileRecord = {
    id: 'sm-err-static',
    url: `${homepageUrl}/sitemaps/static-pages.xml`,
    parentSitemapUrl: rootIndex.url,
    type: 'invalid_xml',
    httpStatus: 200,
    urlCount: 0,
    fileSizeBytes: 3100,
    referencedByParent: true,
    discoveredThroughRobots: false,
    discoveryMethod: 'sitemap',
    errors: [
      'GSC Error: "Nested indexing — This Sitemap Index is referenced by another Sitemap Index."',
      '0 discovered pages in GSC',
    ],
    warnings: ['Static trust & policy pages blocked from discovery via XML sitemaps'],
    processingDate: '2026-08-17T14:30:00Z',
  };
  sitemapFiles.set(staticPagesIndex.url, staticPagesIndex);

  // Areas Parent Index + Children (P1)
  const areasIndex: SitemapFileRecord = {
    id: 'sm-areas-index',
    url: `${homepageUrl}/sitemaps/areas.xml`,
    parentSitemapUrl: rootIndex.url,
    type: 'sitemap_index',
    httpStatus: 200,
    urlCount: 19791,
    fileSizeBytes: 4200,
    referencedByParent: true,
    discoveredThroughRobots: false,
    discoveryMethod: 'sitemap',
    errors: [],
    warnings: [
      'Parent index only references areas_1 (9,898) + areas_2 (9,893) = 19,791 URLs.',
      'Missing 3 children: areas_3 (9,873), areas_4 (9,874), areas_5 (869) totalling 20,616 URLs!',
    ],
    processingDate: '2026-08-17T14:30:00Z',
    childSitemaps: [
      `${homepageUrl}/sitemaps/areas_1.xml`,
      `${homepageUrl}/sitemaps/areas_2.xml`,
    ],
  };
  sitemapFiles.set(areasIndex.url, areasIndex);

  const areas1: SitemapFileRecord = {
    id: 'sm-areas-1',
    url: `${homepageUrl}/sitemaps/areas_1.xml`,
    parentSitemapUrl: areasIndex.url,
    type: 'url_sitemap',
    httpStatus: 200,
    urlCount: 9898,
    fileSizeBytes: 2150000,
    referencedByParent: true,
    discoveredThroughRobots: false,
    discoveryMethod: 'sitemap',
    errors: [],
    warnings: [],
    processingDate: '2026-08-17T14:30:00Z',
  };
  sitemapFiles.set(areas1.url, areas1);

  const areas2: SitemapFileRecord = {
    id: 'sm-areas-2',
    url: `${homepageUrl}/sitemaps/areas_2.xml`,
    parentSitemapUrl: areasIndex.url,
    type: 'url_sitemap',
    httpStatus: 200,
    urlCount: 9893,
    fileSizeBytes: 2140000,
    referencedByParent: true,
    discoveredThroughRobots: false,
    discoveryMethod: 'sitemap',
    errors: [],
    warnings: [],
    processingDate: '2026-08-17T14:30:00Z',
  };
  sitemapFiles.set(areas2.url, areas2);

  // Unreferenced Area children (P1)
  const areas3: SitemapFileRecord = {
    id: 'sm-areas-3-unref',
    url: `${homepageUrl}/sitemaps/areas_3.xml`,
    type: 'url_sitemap',
    httpStatus: 200,
    urlCount: 9873,
    fileSizeBytes: 2130000,
    referencedByParent: false,
    discoveredThroughRobots: false,
    discoveryMethod: 'pattern_discovered',
    errors: [],
    warnings: ['Child sitemap (9,873 URLs) exists on server and in GSC direct submission, but is MISSING from /sitemaps/areas.xml parent index'],
    processingDate: '2026-08-17T14:30:00Z',
    isPatternCandidate: true,
  };
  sitemapFiles.set(areas3.url, areas3);

  const areas4: SitemapFileRecord = {
    id: 'sm-areas-4-unref',
    url: `${homepageUrl}/sitemaps/areas_4.xml`,
    type: 'url_sitemap',
    httpStatus: 200,
    urlCount: 9874,
    fileSizeBytes: 2130000,
    referencedByParent: false,
    discoveredThroughRobots: false,
    discoveryMethod: 'pattern_discovered',
    errors: [],
    warnings: ['Child sitemap (9,874 URLs) MISSING from /sitemaps/areas.xml parent index'],
    processingDate: '2026-08-17T14:30:00Z',
    isPatternCandidate: true,
  };
  sitemapFiles.set(areas4.url, areas4);

  const areas5: SitemapFileRecord = {
    id: 'sm-areas-5-unref',
    url: `${homepageUrl}/sitemaps/areas_5.xml`,
    type: 'url_sitemap',
    httpStatus: 200,
    urlCount: 869,
    fileSizeBytes: 195000,
    referencedByParent: false,
    discoveredThroughRobots: false,
    discoveryMethod: 'pattern_discovered',
    errors: [],
    warnings: ['Child sitemap (869 URLs) MISSING from /sitemaps/areas.xml parent index'],
    processingDate: '2026-08-17T14:30:00Z',
    isPatternCandidate: true,
  };
  sitemapFiles.set(areas5.url, areas5);

  // Tours Parent Index + Children (P1)
  const toursIndex: SitemapFileRecord = {
    id: 'sm-tours-index',
    url: `${homepageUrl}/sitemaps/tours.xml`,
    parentSitemapUrl: rootIndex.url,
    type: 'sitemap_index',
    httpStatus: 200,
    urlCount: 36583,
    fileSizeBytes: 5200,
    referencedByParent: true,
    discoveredThroughRobots: false,
    discoveryMethod: 'sitemap',
    errors: [],
    warnings: [
      'Parent index only references tours_1–4 (36,583 URLs)',
      'Missing 5 children: tours_5 through tours_9 (20,000 URLs) exist in GSC but are NOT referenced in this index! Total children = 56,583 URLs.',
    ],
    processingDate: '2026-08-17T14:30:00Z',
    childSitemaps: [
      `${homepageUrl}/sitemaps/tours_1.xml`,
      `${homepageUrl}/sitemaps/tours_2.xml`,
      `${homepageUrl}/sitemaps/tours_3.xml`,
      `${homepageUrl}/sitemaps/tours_4.xml`,
    ],
  };
  sitemapFiles.set(toursIndex.url, toursIndex);

  const toursChildren = [
    { num: 1, count: 9900, referenced: true },
    { num: 2, count: 9900, referenced: true },
    { num: 3, count: 9900, referenced: true },
    { num: 4, count: 6883, referenced: true },
    { num: 5, count: 4000, referenced: false },
    { num: 6, count: 4000, referenced: false },
    { num: 7, count: 4000, referenced: false },
    { num: 8, count: 4000, referenced: false },
    { num: 9, count: 4000, referenced: false },
  ];

  toursChildren.forEach((tc) => {
    const fileUrl = `${homepageUrl}/sitemaps/tours_${tc.num}.xml`;
    const rec: SitemapFileRecord = {
      id: `sm-tours-${tc.num}`,
      url: fileUrl,
      parentSitemapUrl: tc.referenced ? toursIndex.url : undefined,
      type: 'url_sitemap',
      httpStatus: 200,
      urlCount: tc.count,
      fileSizeBytes: tc.count * 220,
      referencedByParent: tc.referenced,
      discoveredThroughRobots: false,
      discoveryMethod: tc.referenced ? 'sitemap' : 'pattern_discovered',
      errors: [],
      warnings: tc.referenced
        ? []
        : [`Child sitemap tours_${tc.num}.xml (${tc.count} URLs) omitted from /sitemaps/tours.xml parent index`],
      processingDate: '2026-08-17T14:30:00Z',
      isPatternCandidate: !tc.referenced,
    };
    sitemapFiles.set(fileUrl, rec);
  });

  // Legacy Root Tours (Finding #10 - P1 Duplicate)
  const legacyToursCounts = [
    { num: 1, count: 9900 },
    { num: 2, count: 9900 },
    { num: 3, count: 9900 },
    { num: 4, count: 6873 },
    { num: 5, count: 4000 },
    { num: 6, count: 4000 },
    { num: 7, count: 4000 },
    { num: 8, count: 4000 },
    { num: 9, count: 4000 },
    { num: 10, count: 113 },
  ];

  legacyToursCounts.forEach((lt) => {
    const url = `${homepageUrl}/tours_sitemap_${lt.num}.xml`;
    const rec: SitemapFileRecord = {
      id: `sm-legacy-tours-${lt.num}`,
      url,
      type: 'url_sitemap',
      httpStatus: 200,
      urlCount: lt.count,
      fileSizeBytes: lt.count * 215,
      referencedByParent: false,
      discoveredThroughRobots: false,
      discoveryMethod: 'future_gsc',
      errors: [],
      warnings: [
        'Legacy root-level tour sitemap from Feb 2025. Still "Success" in GSC (last-read Aug 14, 2026).',
        'Parallel duplicate of /sitemaps/tours_*.xml (~56,686 total URLs duplicate crawled).',
      ],
      processingDate: '2026-08-14T08:00:00Z',
    };
    sitemapFiles.set(url, rec);
  });

  // Regions (Finding #6 - P2 Duplicate)
  const regionsIndex: SitemapFileRecord = {
    id: 'sm-regions-index',
    url: `${homepageUrl}/sitemaps/regions.xml`,
    parentSitemapUrl: rootIndex.url,
    type: 'sitemap_index',
    httpStatus: 200,
    urlCount: 4312,
    fileSizeBytes: 2800,
    referencedByParent: true,
    discoveredThroughRobots: false,
    discoveryMethod: 'sitemap',
    errors: [],
    warnings: ['Full duplicate exists: search_results_regions_sitemap.xml (4,312) and search_results_regions_single_filter_sitemap.xml (4,312)'],
    processingDate: '2026-08-17T14:30:00Z',
    childSitemaps: [`${homepageUrl}/sitemaps/regions_1.xml`],
  };
  sitemapFiles.set(regionsIndex.url, regionsIndex);

  const regions1: SitemapFileRecord = {
    id: 'sm-regions-1',
    url: `${homepageUrl}/sitemaps/regions_1.xml`,
    parentSitemapUrl: regionsIndex.url,
    type: 'url_sitemap',
    httpStatus: 200,
    urlCount: 4312,
    fileSizeBytes: 890000,
    referencedByParent: true,
    discoveredThroughRobots: false,
    discoveryMethod: 'sitemap',
    errors: [],
    warnings: [],
    processingDate: '2026-08-17T14:30:00Z',
  };
  sitemapFiles.set(regions1.url, regions1);

  // Countries (Finding #7 - P2 Duplicate)
  const countriesSitemap: SitemapFileRecord = {
    id: 'sm-countries',
    url: `${homepageUrl}/sitemaps/countries.xml`,
    parentSitemapUrl: rootIndex.url,
    type: 'url_sitemap',
    httpStatus: 200,
    urlCount: 410,
    fileSizeBytes: 88000,
    referencedByParent: true,
    discoveredThroughRobots: false,
    discoveryMethod: 'sitemap',
    errors: [],
    warnings: ['Full duplicate exists: search_results_countries_sitemap.xml (410 URLs)'],
    processingDate: '2026-08-17T14:30:00Z',
  };
  sitemapFiles.set(countriesSitemap.url, countriesSitemap);

  // Attractions (Finding #9 - P2 Duplicate)
  const attractionsIndex: SitemapFileRecord = {
    id: 'sm-attractions-index',
    url: `${homepageUrl}/sitemaps/attractions.xml`,
    parentSitemapUrl: rootIndex.url,
    type: 'sitemap_index',
    httpStatus: 200,
    urlCount: 32188,
    fileSizeBytes: 3400,
    referencedByParent: true,
    discoveredThroughRobots: false,
    discoveryMethod: 'sitemap',
    errors: [],
    warnings: ['Full duplicate exists: search_results_attractions_sitemap.xml (32,188) and search_results_attractions_single_filter_sitemap.xml (32,188)'],
    processingDate: '2026-08-17T14:30:00Z',
    childSitemaps: [
      `${homepageUrl}/sitemaps/attractions_1.xml`,
      `${homepageUrl}/sitemaps/attractions_2.xml`,
      `${homepageUrl}/sitemaps/attractions_3.xml`,
      `${homepageUrl}/sitemaps/attractions_4.xml`,
    ],
  };
  sitemapFiles.set(attractionsIndex.url, attractionsIndex);

  const attractionsChildren = [
    { num: 1, count: 9900 },
    { num: 2, count: 9900 },
    { num: 3, count: 9900 },
    { num: 4, count: 2488 },
  ];
  attractionsChildren.forEach((ac) => {
    const url = `${homepageUrl}/sitemaps/attractions_${ac.num}.xml`;
    sitemapFiles.set(url, {
      id: `sm-attractions-${ac.num}`,
      url,
      parentSitemapUrl: attractionsIndex.url,
      type: 'url_sitemap',
      httpStatus: 200,
      urlCount: ac.count,
      fileSizeBytes: ac.count * 210,
      referencedByParent: true,
      discoveredThroughRobots: false,
      discoveryMethod: 'sitemap',
      errors: [],
      warnings: [],
      processingDate: '2026-08-17T14:30:00Z',
    });
  });

  // Blogs (Finding #2 - P3 Duplicate)
  const blogsIndex: SitemapFileRecord = {
    id: 'sm-blogs-index',
    url: `${homepageUrl}/sitemaps/blogs.xml`,
    parentSitemapUrl: rootIndex.url,
    type: 'sitemap_index',
    httpStatus: 200,
    urlCount: 899,
    fileSizeBytes: 1800,
    referencedByParent: true,
    discoveredThroughRobots: false,
    discoveryMethod: 'sitemap',
    errors: [],
    warnings: ['Legacy root duplicate exists: /blog_sitemap.xml (899 URLs, Success)'],
    processingDate: '2026-08-17T14:30:00Z',
    childSitemaps: [`${homepageUrl}/sitemaps/blogs_1.xml`],
  };
  sitemapFiles.set(blogsIndex.url, blogsIndex);

  const blogs1: SitemapFileRecord = {
    id: 'sm-blogs-1',
    url: `${homepageUrl}/sitemaps/blogs_1.xml`,
    parentSitemapUrl: blogsIndex.url,
    type: 'url_sitemap',
    httpStatus: 200,
    urlCount: 899,
    fileSizeBytes: 195000,
    referencedByParent: true,
    discoveredThroughRobots: false,
    discoveryMethod: 'sitemap',
    errors: [],
    warnings: [],
    processingDate: '2026-08-17T14:30:00Z',
  };
  sitemapFiles.set(blogs1.url, blogs1);

  // Things to Do Country & City (Findings #3, #4 - P3 Duplicate)
  const thingsCountryIndex: SitemapFileRecord = {
    id: 'sm-ttd-country-index',
    url: `${homepageUrl}/sitemaps/things-to-do-country.xml`,
    parentSitemapUrl: rootIndex.url,
    type: 'sitemap_index',
    httpStatus: 200,
    urlCount: 167,
    fileSizeBytes: 1200,
    referencedByParent: true,
    discoveredThroughRobots: false,
    discoveryMethod: 'sitemap',
    errors: [],
    warnings: ['Legacy root duplicate exists: /things_to_do_country_sitemap.xml (167 URLs)'],
    processingDate: '2026-08-17T14:30:00Z',
    childSitemaps: [`${homepageUrl}/sitemaps/things-to-do-country_1.xml`],
  };
  sitemapFiles.set(thingsCountryIndex.url, thingsCountryIndex);

  const thingsCountry1: SitemapFileRecord = {
    id: 'sm-ttd-country-1',
    url: `${homepageUrl}/sitemaps/things-to-do-country_1.xml`,
    parentSitemapUrl: thingsCountryIndex.url,
    type: 'url_sitemap',
    httpStatus: 200,
    urlCount: 167,
    fileSizeBytes: 38000,
    referencedByParent: true,
    discoveredThroughRobots: false,
    discoveryMethod: 'sitemap',
    errors: [],
    warnings: [],
    processingDate: '2026-08-17T14:30:00Z',
  };
  sitemapFiles.set(thingsCountry1.url, thingsCountry1);

  const thingsCityIndex: SitemapFileRecord = {
    id: 'sm-ttd-city-index',
    url: `${homepageUrl}/sitemaps/things-to-do-city.xml`,
    parentSitemapUrl: rootIndex.url,
    type: 'sitemap_index',
    httpStatus: 200,
    urlCount: 931,
    fileSizeBytes: 1500,
    referencedByParent: true,
    discoveredThroughRobots: false,
    discoveryMethod: 'sitemap',
    errors: [],
    warnings: ['Legacy root duplicate exists: /things_to_do_city_sitemap.xml (931 URLs)'],
    processingDate: '2026-08-17T14:30:00Z',
    childSitemaps: [`${homepageUrl}/sitemaps/things-to-do-city_1.xml`],
  };
  sitemapFiles.set(thingsCityIndex.url, thingsCityIndex);

  const thingsCity1: SitemapFileRecord = {
    id: 'sm-ttd-city-1',
    url: `${homepageUrl}/sitemaps/things-to-do-city_1.xml`,
    parentSitemapUrl: thingsCityIndex.url,
    type: 'url_sitemap',
    httpStatus: 200,
    urlCount: 931,
    fileSizeBytes: 205000,
    referencedByParent: true,
    discoveredThroughRobots: false,
    discoveryMethod: 'sitemap',
    errors: [],
    warnings: [],
    processingDate: '2026-08-17T14:30:00Z',
  };
  sitemapFiles.set(thingsCity1.url, thingsCity1);

  // Parallel Search Results Duplicate Family (Finding #1, #6, #7, #8, #9 - P2 Duplicate)
  const searchResultsSitemaps = [
    { url: `${homepageUrl}/search_results_cities_sitemap.xml`, count: 40407, note: 'Reports full 40,407 area count (covering areas_1..5)' },
    { url: `${homepageUrl}/search_results_cities_single_filter_sitemap_1.xml`, count: 19791, note: 'Partial 19,791 match mirroring partial official areas.xml' },
    { url: `${homepageUrl}/search_results_cities_single_filter_sitemap_2.xml`, count: 19791, note: 'Partial 19,791 duplicate' },
    { url: `${homepageUrl}/search_results_cities_single_filter_sitemap_3.xml`, count: 19791, note: 'Partial 19,791 duplicate' },
    { url: `${homepageUrl}/search_results_regions_sitemap.xml`, count: 4312, note: 'Full duplicate of /sitemaps/regions.xml (4,312)' },
    { url: `${homepageUrl}/search_results_regions_single_filter_sitemap.xml`, count: 4312, note: 'Full duplicate of /sitemaps/regions.xml (4,312)' },
    { url: `${homepageUrl}/search_results_countries_sitemap.xml`, count: 410, note: 'Full duplicate of /sitemaps/countries.xml (410)' },
    { url: `${homepageUrl}/search_results_attractions_sitemap.xml`, count: 32188, note: 'Full duplicate of /sitemaps/attractions.xml (32,188)' },
    { url: `${homepageUrl}/search_results_attractions_single_filter_sitemap.xml`, count: 32188, note: 'Full duplicate of /sitemaps/attractions.xml (32,188)' },
  ];

  searchResultsSitemaps.forEach((sr, idx) => {
    const rec: SitemapFileRecord = {
      id: `sm-search-results-${idx}`,
      url: sr.url,
      type: 'url_sitemap',
      httpStatus: 200,
      urlCount: sr.count,
      fileSizeBytes: sr.count * 210,
      referencedByParent: false,
      discoveredThroughRobots: false,
      discoveryMethod: 'future_gsc',
      errors: [],
      warnings: [`Parallel search_results family sitemap: ${sr.note}`],
      processingDate: '2026-08-17T14:30:00Z',
    };
    sitemapFiles.set(sr.url, rec);
  });

  // Legacy Root Single Files (Finding #2, #3, #4, #11)
  const legacySingles = [
    { url: `${homepageUrl}/blog_sitemap.xml`, count: 899, note: 'Duplicate of /sitemaps/blogs.xml (submitted Nov 2024, Success)' },
    { url: `${homepageUrl}/things_to_do_country_sitemap.xml`, count: 167, note: 'Duplicate of /sitemaps/things-to-do-country.xml (167)' },
    { url: `${homepageUrl}/things_to_do_city_sitemap.xml`, count: 931, note: 'Duplicate of /sitemaps/things-to-do-city.xml (931)' },
    { url: `${homepageUrl}/pillar_sitemap.xml`, count: 4, note: 'Legacy working pillar sitemap (4 pages, Success) vs erroring /sitemaps/pillar-pages.xml' },
  ];

  legacySingles.forEach((ls, idx) => {
    const rec: SitemapFileRecord = {
      id: `sm-legacy-single-${idx}`,
      url: ls.url,
      type: 'url_sitemap',
      httpStatus: 200,
      urlCount: ls.count,
      fileSizeBytes: ls.count * 210,
      referencedByParent: false,
      discoveredThroughRobots: false,
      discoveryMethod: 'future_gsc',
      errors: [],
      warnings: [`Legacy root sitemap submission: ${ls.note}`],
      processingDate: '2026-08-17T14:30:00Z',
    };
    sitemapFiles.set(ls.url, rec);
  });

  // Dead Legacy Submissions (Finding #12 - P3 Clean up)
  const deadSubmissions = [
    '/old_sitemap_tours_2023.xml',
    '/sitemap_archive_v1.xml',
    '/sitemap_v2_temp.xml',
    '/guides_sitemap_legacy.xml',
    '/staging_sitemap.xml',
    '/sitemap_beta.xml',
    '/experiences_sitemap.xml',
    '/cruises_sitemap_2024.xml',
  ];
  deadSubmissions.forEach((path, idx) => {
    const url = `${homepageUrl}${path}`;
    const rec: SitemapFileRecord = {
      id: `sm-dead-${idx}`,
      url,
      type: 'unavailable',
      httpStatus: 404,
      urlCount: 0,
      fileSizeBytes: 0,
      referencedByParent: false,
      discoveredThroughRobots: false,
      discoveryMethod: 'future_gsc',
      errors: ['Google Search Console error: "Couldn\'t fetch" — File returns HTTP 404 Not Found or connection dropped'],
      warnings: ['Legacy dead submission cluttering GSC reporting. Remove submission from GSC.'],
      processingDate: '2026-08-17T14:30:00Z',
    };
    sitemapFiles.set(url, rec);
  });

  // Populate helper
  const addSitemapUrl = (url: string) => {
    allSitemapUrls.add(url);
  };

  // ==========================================
  // 2. CRAWLED URLS & ARCHITECTURAL GAPS
  // ==========================================
  const crawledUrls = new Map<string, CrawledUrlRecord>();

  // [P0 FINDING]: Homepage missing from sitemaps
  const homeRecord: CrawledUrlRecord = {
    id: 'url-home-0',
    originalUrl: `${homepageUrl}/`,
    normalizedUrl: `${homepageUrl}/`,
    finalUrl: `${homepageUrl}/`,
    httpStatus: 200,
    contentType: 'text/html; charset=utf-8',
    isIndexable: true,
    metaRobots: 'index, follow',
    xRobotsTag: '',
    isRobotsBlocked: false,
    canonicalUrl: `${homepageUrl}/`,
    canonicalStatus: 'self_referencing',
    pageTitle: 'ToursByLocals | Private Tours & Local Tour Guides Worldwide',
    h1: 'Explore the World with Passionate Local Guides',
    crawlDepth: 0,
    inboundInternalLinksCount: 184,
    outboundInternalLinksCount: 92,
    inSitemap: false, // <-- MISSING!
    sitemapNames: [],
    discoverySources: ['internal_crawl'],
    pageType: 'Homepage',
    redirectChain: [],
    lastCheckedDate: '2026-08-17T14:30:00Z',
    isPotentiallyMissing: true,
    missingReason: 'Root homepage is live with 184 internal links, but omitted from sitemap_index.xml and all child sitemaps.',
    suggestedSitemap: 'sitemap_pages.xml',
    priority: 'critical',
  };
  crawledUrls.set(homeRecord.normalizedUrl, homeRecord);

  // [P0 FINDING]: Pillar pages in erroring /sitemaps/pillar-pages.xml
  const pillarPages = [
    { slug: 'rome-private-tour-guides', title: 'Rome Private Tour Guides | ToursByLocals', h1: 'Licensed Private Tour Guides in Rome' },
    { slug: 'paris-private-tour-guides', title: 'Paris Private Tour Guides | ToursByLocals', h1: 'Private Tour Guides in Paris, France' },
    { slug: 'tokyo-private-tour-guides', title: 'Tokyo Private Tour Guides | ToursByLocals', h1: 'Local Private Tour Guides in Tokyo' },
    { slug: 'florence-private-tour-guides', title: 'Florence Private Tour Guides | ToursByLocals', h1: 'Private Guided Tours in Florence' },
  ];
  pillarPages.forEach((p, idx) => {
    const url = `${homepageUrl}/${p.slug}`;
    const rec: CrawledUrlRecord = {
      id: `url-pillar-${idx}`,
      originalUrl: url,
      normalizedUrl: url,
      finalUrl: url,
      httpStatus: 200,
      contentType: 'text/html; charset=utf-8',
      isIndexable: true,
      metaRobots: 'index, follow',
      xRobotsTag: '',
      isRobotsBlocked: false,
      canonicalUrl: url,
      canonicalStatus: 'self_referencing',
      pageTitle: p.title,
      h1: p.h1,
      crawlDepth: 1,
      inboundInternalLinksCount: 65 - idx * 5,
      outboundInternalLinksCount: 30,
      inSitemap: false, // 0 discovered because pillar-pages.xml has nested index error!
      sitemapNames: ['/sitemaps/pillar-pages.xml (Erroring)'],
      discoverySources: ['internal_crawl'],
      pageType: 'Destination & City Tour Hubs',
      redirectChain: [],
      lastCheckedDate: '2026-08-17T14:30:00Z',
      isPotentiallyMissing: true,
      missingReason: 'Trapped in /sitemaps/pillar-pages.xml which is returning 0 discovered pages in GSC due to nested indexing error.',
      suggestedSitemap: 'sitemap_destinations.xml',
      priority: 'critical',
    };
    crawledUrls.set(rec.normalizedUrl, rec);
  });

  // [P1 FINDING]: Areas trapped in unreferenced sitemaps (areas_3, areas_4, areas_5)
  const missingAreaSamples = [
    { slug: 'naples-tours', title: 'Naples Tours & Local Guides', h1: 'Private Naples, Pompeii & Amalfi Coast Tours', sm: 'areas_3.xml' },
    { slug: 'sorrento-tours', title: 'Sorrento Private Tours', h1: 'Sorrento & Capri Private Day Excursions', sm: 'areas_3.xml' },
    { slug: 'palermo-tours', title: 'Palermo Sicily Tours', h1: 'Palermo Street Food & Historic Architecture Tours', sm: 'areas_4.xml' },
    { slug: 'taormina-tours', title: 'Taormina Tours & Mount Etna', h1: 'Taormina & Mount Etna Volcano Private Trips', sm: 'areas_4.xml' },
    { slug: 'catania-tours', title: 'Catania Tours & Local Guides', h1: 'Catania Baroque & Food Walking Tours', sm: 'areas_5.xml' },
  ];
  missingAreaSamples.forEach((area, idx) => {
    const url = `${homepageUrl}/${area.slug}`;
    const rec: CrawledUrlRecord = {
      id: `url-area-unref-${idx}`,
      originalUrl: url,
      normalizedUrl: url,
      finalUrl: url,
      httpStatus: 200,
      contentType: 'text/html; charset=utf-8',
      isIndexable: true,
      metaRobots: 'index, follow',
      xRobotsTag: '',
      isRobotsBlocked: false,
      canonicalUrl: url,
      canonicalStatus: 'self_referencing',
      pageTitle: `${area.title} | ToursByLocals`,
      h1: area.h1,
      crawlDepth: 2,
      inboundInternalLinksCount: 38 - idx * 3,
      outboundInternalLinksCount: 22,
      inSitemap: false, // In areas_3..5 which are unreferenced in parent index!
      sitemapNames: [`/sitemaps/${area.sm} (Unreferenced in areas.xml)`],
      discoverySources: ['internal_crawl'],
      pageType: 'Destination & City Tour Hubs',
      redirectChain: [],
      lastCheckedDate: '2026-08-17T14:30:00Z',
      isPotentiallyMissing: true,
      missingReason: `Included in /sitemaps/${area.sm} (20,616 area URLs total), but parent /sitemaps/areas.xml fails to link areas_3..5!`,
      suggestedSitemap: 'sitemap_areas.xml',
      priority: 'high',
    };
    crawledUrls.set(rec.normalizedUrl, rec);
  });

  // [P1 FINDING]: Tours trapped in unreferenced sitemaps (tours_5 through tours_9)
  const missingTourSamples = [
    { slug: 'rome-catacombs-appian-way-e-bike-tour-9820', title: 'Rome Catacombs & Appian Way E-Bike Tour', sm: 'tours_5.xml' },
    { slug: 'paris-montmartre-secret-vineyards-tour-8840', title: 'Paris Montmartre Secret Vineyards Tour', sm: 'tours_6.xml' },
    { slug: 'tokyo-shinjuku-after-dark-izakaya-crawl-9912', title: 'Tokyo Shinjuku After Dark Izakaya Crawl', sm: 'tours_7.xml' },
    { slug: 'florence-artisan-leather-and-food-walk-4911', title: 'Florence Artisan Workshop & Food Walk', sm: 'tours_8.xml' },
    { slug: 'kyoto-fushimi-sake-brewery-and-geisha-district-7102', title: 'Kyoto Fushimi Sake Brewery & Gion Tour', sm: 'tours_9.xml' },
  ];
  missingTourSamples.forEach((tour, idx) => {
    const url = `${homepageUrl}/${tour.slug}`;
    const rec: CrawledUrlRecord = {
      id: `url-tour-unref-${idx}`,
      originalUrl: url,
      normalizedUrl: url,
      finalUrl: url,
      httpStatus: 200,
      contentType: 'text/html; charset=utf-8',
      isIndexable: true,
      metaRobots: 'index, follow',
      xRobotsTag: '',
      isRobotsBlocked: false,
      canonicalUrl: url,
      canonicalStatus: 'self_referencing',
      pageTitle: `${tour.title} | ToursByLocals`,
      h1: tour.title,
      crawlDepth: 2,
      inboundInternalLinksCount: 42 - idx * 4,
      outboundInternalLinksCount: 16,
      inSitemap: false, // In tours_5..9 which are unreferenced in parent index!
      sitemapNames: [`/sitemaps/${tour.sm} (Unreferenced in tours.xml)`],
      discoverySources: ['internal_crawl'],
      pageType: 'Tour Itinerary Detail Pages',
      redirectChain: [],
      lastCheckedDate: '2026-08-17T14:30:00Z',
      isPotentiallyMissing: true,
      missingReason: `Included in /sitemaps/${tour.sm} (20,000 tour URLs total), but parent /sitemaps/tours.xml only references tours_1..4!`,
      suggestedSitemap: 'sitemap_tours.xml',
      priority: 'critical',
    };
    crawledUrls.set(rec.normalizedUrl, rec);
  });

  // Valid referenced official Destinations
  const sampleOfficialDestinations = [
    { slug: 'rome-tours', title: 'Rome Tours & Private Guides', sm: 'areas_1.xml' },
    { slug: 'paris-tours', title: 'Paris Tours & Private Guides', sm: 'areas_1.xml' },
    { slug: 'tokyo-tours', title: 'Tokyo Tours & Private Guides', sm: 'areas_2.xml' },
    { slug: 'florence-tours', title: 'Florence Tours & Private Guides', sm: 'areas_2.xml' },
    { slug: 'barcelona-tours', title: 'Barcelona Tours & Private Guides', sm: 'areas_1.xml' },
    { slug: 'london-tours', title: 'London Tours & Private Guides', sm: 'areas_1.xml' },
  ];
  sampleOfficialDestinations.forEach((dest, idx) => {
    const url = `${homepageUrl}/${dest.slug}`;
    const rec: CrawledUrlRecord = {
      id: `url-dest-off-${idx}`,
      originalUrl: url,
      normalizedUrl: url,
      finalUrl: url,
      httpStatus: 200,
      contentType: 'text/html; charset=utf-8',
      isIndexable: true,
      metaRobots: 'index, follow',
      xRobotsTag: '',
      isRobotsBlocked: false,
      canonicalUrl: url,
      canonicalStatus: 'self_referencing',
      pageTitle: `${dest.title} | ToursByLocals`,
      h1: `${dest.title} with Top Rated Local Guides`,
      crawlDepth: 1,
      inboundInternalLinksCount: 110 - idx * 6,
      outboundInternalLinksCount: 45,
      inSitemap: true,
      sitemapNames: [`/sitemaps/${dest.sm}`, 'search_results_cities_sitemap.xml'], // Duplicate across families!
      discoverySources: ['internal_crawl', 'sitemap'],
      pageType: 'Destination & City Tour Hubs',
      redirectChain: [],
      lastCheckedDate: '2026-08-17T14:30:00Z',
      isPotentiallyMissing: false,
      priority: 'high',
    };
    crawledUrls.set(rec.normalizedUrl, rec);
    addSitemapUrl(url);
  });

  // Valid referenced official Tours
  const sampleOfficialTours = [
    { slug: 'rome-colosseum-and-ancient-city-private-tour-4819', title: 'Colosseum & Ancient Rome Private Tour', sm: 'tours_1.xml', legacy: 'tours_sitemap_1.xml' },
    { slug: 'vatican-museums-sistine-chapel-skip-the-line-tour-5120', title: 'Vatican Museums & Sistine Chapel Tour', sm: 'tours_1.xml', legacy: 'tours_sitemap_1.xml' },
    { slug: 'paris-louvre-masterpieces-private-walking-tour-6301', title: 'Louvre Masterpieces Private Tour', sm: 'tours_2.xml', legacy: 'tours_sitemap_2.xml' },
    { slug: 'tokyo-tsukiji-outer-market-food-walk-7721', title: 'Tsukiji Market & Ginza Food Walk', sm: 'tours_3.xml', legacy: 'tours_sitemap_3.xml' },
    { slug: 'london-tower-bridge-and-historic-royal-palaces-tour-3190', title: 'Tower of London & Royal Palaces Tour', sm: 'tours_4.xml', legacy: 'tours_sitemap_4.xml' },
  ];
  sampleOfficialTours.forEach((tour, idx) => {
    const url = `${homepageUrl}/${tour.slug}`;
    const rec: CrawledUrlRecord = {
      id: `url-tour-off-${idx}`,
      originalUrl: url,
      normalizedUrl: url,
      finalUrl: url,
      httpStatus: 200,
      contentType: 'text/html; charset=utf-8',
      isIndexable: true,
      metaRobots: 'index, follow',
      xRobotsTag: '',
      isRobotsBlocked: false,
      canonicalUrl: url,
      canonicalStatus: 'self_referencing',
      pageTitle: `${tour.title} | ToursByLocals`,
      h1: tour.title,
      crawlDepth: 2,
      inboundInternalLinksCount: 52 - idx * 4,
      outboundInternalLinksCount: 18,
      inSitemap: true,
      sitemapNames: [`/sitemaps/${tour.sm}`, `/${tour.legacy}`], // DUPLICATE via legacy root sitemap!
      discoverySources: ['internal_crawl', 'sitemap'],
      pageType: 'Tour Itinerary Detail Pages',
      redirectChain: [],
      lastCheckedDate: '2026-08-17T14:30:00Z',
      isPotentiallyMissing: false,
      priority: 'critical',
    };
    crawledUrls.set(rec.normalizedUrl, rec);
    addSitemapUrl(url);
  });

  // Valid Guides
  const sampleGuides = [
    { slug: 'rome-tour-guide-massimiliano-l', name: 'Massimiliano L.', city: 'Rome, Italy' },
    { slug: 'rome-tour-guide-ennio-g', name: 'Ennio G.', city: 'Rome, Italy' },
    { slug: 'rome-tour-guide-sabrina-p', name: 'Sabrina P.', city: 'Rome, Italy' },
    { slug: 'rome-tour-guide-valeria-c', name: 'Valeria C.', city: 'Rome, Italy' },
    { slug: 'paris-tour-guide-jean-m', name: 'Jean M.', city: 'Paris, France' },
    { slug: 'tokyo-tour-guide-kenji-t', name: 'Kenji T.', city: 'Tokyo, Japan' },
  ];
  sampleGuides.forEach((g, idx) => {
    const url = `${homepageUrl}/${g.slug}`;
    const rec: CrawledUrlRecord = {
      id: `url-guide-${idx}`,
      originalUrl: url,
      normalizedUrl: url,
      finalUrl: url,
      httpStatus: 200,
      contentType: 'text/html; charset=utf-8',
      isIndexable: true,
      metaRobots: 'index, follow',
      xRobotsTag: '',
      isRobotsBlocked: false,
      canonicalUrl: url,
      canonicalStatus: 'self_referencing',
      pageTitle: `${g.name} - ${g.city} Tour Guide | ToursByLocals`,
      h1: `Meet ${g.name} - Verified Local Guide`,
      crawlDepth: 2,
      inboundInternalLinksCount: 36 - idx * 2,
      outboundInternalLinksCount: 16,
      inSitemap: true,
      sitemapNames: ['/sitemaps/areas_1.xml'],
      discoverySources: ['internal_crawl', 'sitemap'],
      pageType: 'Local Tour Guide Profiles',
      redirectChain: [],
      lastCheckedDate: '2026-08-17T14:30:00Z',
      isPotentiallyMissing: false,
      priority: 'high',
    };
    crawledUrls.set(rec.normalizedUrl, rec);
    addSitemapUrl(url);
  });

  // Blog Articles (Finding #2 duplicate)
  const sampleBlogs = [
    { slug: 'how-to-plan-a-trip-to-rome-insider-tips', title: 'How to Plan a Trip to Rome: Insider Tips' },
    { slug: 'best-time-to-visit-tokyo-cherry-blossom-season', title: 'Best Time to Visit Tokyo: Cherry Blossom Season' },
    { slug: 'paris-neighborhood-guide-marais-latin-quarter', title: 'Paris Neighborhood Guide: Le Marais and Latin Quarter' },
  ];
  sampleBlogs.forEach((b, idx) => {
    const url = `${homepageUrl}/blog/${b.slug}`;
    const rec: CrawledUrlRecord = {
      id: `url-blog-${idx}`,
      originalUrl: url,
      normalizedUrl: url,
      finalUrl: url,
      httpStatus: 200,
      contentType: 'text/html; charset=utf-8',
      isIndexable: true,
      metaRobots: 'index, follow',
      xRobotsTag: '',
      isRobotsBlocked: false,
      canonicalUrl: url,
      canonicalStatus: 'self_referencing',
      pageTitle: `${b.title} | ToursByLocals Blog`,
      h1: b.title,
      crawlDepth: 2,
      inboundInternalLinksCount: 22 - idx * 2,
      outboundInternalLinksCount: 12,
      inSitemap: true,
      sitemapNames: ['/sitemaps/blogs_1.xml', '/blog_sitemap.xml'], // Duplicate in legacy root!
      discoverySources: ['internal_crawl', 'sitemap'],
      pageType: 'Blog & Travel Stories',
      redirectChain: [],
      lastCheckedDate: '2026-08-17T14:30:00Z',
      isPotentiallyMissing: false,
      priority: 'medium',
    };
    crawledUrls.set(rec.normalizedUrl, rec);
    addSitemapUrl(url);
  });

  // Static trust pages
  const staticPagesList = [
    { slug: 'about-us', title: 'About Us' },
    { slug: 'how-it-works', title: 'How It Works' },
    { slug: 'trust-and-safety', title: 'Trust & Safety' },
    { slug: 'traveler-faq', title: 'Traveler FAQ' },
  ];
  staticPagesList.forEach((sp, idx) => {
    const url = `${homepageUrl}/${sp.slug}`;
    const rec: CrawledUrlRecord = {
      id: `url-static-${idx}`,
      originalUrl: url,
      normalizedUrl: url,
      finalUrl: url,
      httpStatus: 200,
      contentType: 'text/html; charset=utf-8',
      isIndexable: true,
      metaRobots: 'index, follow',
      xRobotsTag: '',
      isRobotsBlocked: false,
      canonicalUrl: url,
      canonicalStatus: 'self_referencing',
      pageTitle: `${sp.title} | ToursByLocals`,
      h1: sp.title,
      crawlDepth: 1,
      inboundInternalLinksCount: 95 - idx * 5,
      outboundInternalLinksCount: 20,
      inSitemap: false, // Trapped in erroring static-pages.xml!
      sitemapNames: ['/sitemaps/static-pages.xml (Erroring)'],
      discoverySources: ['internal_crawl'],
      pageType: 'Static & Informational Pages',
      redirectChain: [],
      lastCheckedDate: '2026-08-17T14:30:00Z',
      isPotentiallyMissing: true,
      missingReason: 'Trapped in /sitemaps/static-pages.xml which has 0 discovered pages due to GSC nested indexing error.',
      suggestedSitemap: 'sitemap_pages.xml',
      priority: 'high',
    };
    crawledUrls.set(rec.normalizedUrl, rec);
  });

  // ==========================================
  // 2.5 ORPHAN PAGES (In Sitemaps with 0 Inbound Links or Crawled with 0 Links)
  // ==========================================
  const sampleOrphans = [
    {
      slug: 'tours/summer-2024-special-florence-package-9912',
      title: 'Summer 2024 Special: Florence Uffizi & Chianti Day Package',
      pageType: 'Tour Itinerary Detail Pages',
      sitemap: '/sitemaps/tours_2.xml',
      inboundLinks: 0,
      reason: 'Page submitted in XML sitemap but has 0 inbound internal links from menus, footers, or city hubs. Relies 100% on sitemap discovery with zero link equity.',
      suggestedAction: 'Add contextual internal link from Florence Destination Hub (/florence-tours) or remove from sitemap if seasonal campaign is inactive.',
      priority: 'high' as IssueSeverity,
    },
    {
      slug: 'blog/2021-travel-restrictions-europe-guide',
      title: 'Historical 2021 Europe Travel & Entry Guide (Archived)',
      pageType: 'Blog & Travel Stories',
      sitemap: '/sitemaps/blogs_1.xml',
      inboundLinks: 0,
      reason: 'Outdated blog post declared in sitemap but unlinked from current blog categories and pagination. 0 internal links.',
      suggestedAction: '301 redirect to main Europe Travel Guide or purge from sitemaps to avoid index bloat.',
      priority: 'medium' as IssueSeverity,
    },
    {
      slug: 'guides/marco-archived-venice-guide-2201',
      title: 'Guide Profile: Marco V. (Inactive Venice Specialist)',
      pageType: 'Local Tour Guide Profiles',
      sitemap: '/sitemaps/areas_2.xml',
      inboundLinks: 0,
      reason: 'Inactive guide profile still listed in sitemap XML with 0 internal links across site.',
      suggestedAction: 'Remove from XML sitemap or 301 redirect to /venice-tours.',
      priority: 'medium' as IssueSeverity,
    },
    {
      slug: 'promo/black-friday-2023-exclusive-travel-deals',
      title: 'Black Friday 2023 Global Tour Discounts & Deals',
      pageType: 'Static & Informational Pages',
      sitemap: 'sitemap_pages.xml',
      inboundLinks: 0,
      reason: 'Expired holiday promotional landing page still indexed in sitemap with 0 inbound internal links.',
      suggestedAction: '301 redirect to active promotions hub or delete URL from sitemap.',
      priority: 'high' as IssueSeverity,
    },
    {
      slug: 'destinations/alps-winter-snowshoe-expeditions-2024',
      title: 'Swiss Alps Winter Snowshoe & Glacier Expeditions 2024',
      pageType: 'Destination & City Tour Hubs',
      sitemap: '/sitemaps/areas_2.xml',
      inboundLinks: 0,
      reason: 'Destination landing page orphaned with 0 internal links. Not present in Alps navigation breadcrumbs or parent country catalog.',
      suggestedAction: 'Add internal navigation links from Switzerland Destination Hub and country category menu.',
      priority: 'critical' as IssueSeverity,
    },
    {
      slug: 'experiences/exclusive-vatican-early-access-night-tour-7712',
      title: 'VIP Vatican Museums Early Access & Sistine Chapel Tour',
      pageType: 'Tour Itinerary Detail Pages',
      sitemap: '/sitemaps/tours_3.xml',
      inboundLinks: 0,
      reason: 'High-value commercial tour page submitted in sitemap but isolated with 0 internal links. Starved of internal PageRank.',
      suggestedAction: 'Immediately link from Rome Destination Hub, Vatican Attraction Hub, and Homepage featured carousel.',
      priority: 'critical' as IssueSeverity,
    },
    {
      slug: 'partner/amex-platinum-exclusive-perks-2023',
      title: 'American Express Cardholder Exclusive Booking Portal',
      pageType: 'Static & Informational Pages',
      sitemap: 'sitemap_pages.xml',
      inboundLinks: 0,
      reason: 'Co-branded partner landing page in sitemap with 0 internal site links.',
      suggestedAction: 'Link from partner directory or add noindex if partner-only gated campaign.',
      priority: 'medium' as IssueSeverity,
    },
    {
      slug: 'experiences/kyoto-geisha-district-tea-ceremony-private-9081',
      title: 'Kyoto Gion District Private Tea Ceremony & Traditional Walk',
      pageType: 'Tour Itinerary Detail Pages',
      sitemap: '/sitemaps/tours_4.xml',
      inboundLinks: 1, // Shallow / At-Risk link
      reason: 'Only 1 inbound link from deep pagination. High risk of becoming fully orphaned on next catalog update.',
      suggestedAction: 'Add contextual links from Kyoto City Hub and Japan Highlights page.',
      priority: 'high' as IssueSeverity,
    },
  ];

  sampleOrphans.forEach((orp, idx) => {
    const url = `${homepageUrl}/${orp.slug}`;
    const rec: CrawledUrlRecord = {
      id: `url-orphan-${idx}`,
      originalUrl: url,
      normalizedUrl: url,
      finalUrl: url,
      httpStatus: 200,
      contentType: 'text/html; charset=utf-8',
      isIndexable: true,
      metaRobots: 'index, follow',
      xRobotsTag: '',
      isRobotsBlocked: false,
      canonicalUrl: url,
      canonicalStatus: 'self_referencing',
      pageTitle: `${orp.title} | ToursByLocals`,
      h1: orp.title,
      crawlDepth: orp.inboundLinks === 0 ? 0 : 4,
      inboundInternalLinksCount: orp.inboundLinks,
      outboundInternalLinksCount: 10,
      inSitemap: true,
      sitemapNames: [orp.sitemap],
      discoverySources: orp.inboundLinks === 0 ? ['sitemap'] : ['internal_crawl', 'sitemap'],
      pageType: orp.pageType,
      redirectChain: [],
      lastCheckedDate: '2026-08-17T14:30:00Z',
      isPotentiallyMissing: false,
      priority: orp.priority,
    };
    crawledUrls.set(rec.normalizedUrl, rec);
    addSitemapUrl(url);
  });

  // ==========================================
  // 3. CRITICAL MONITORED PAGES
  // ==========================================
  const criticalPages: CriticalPageItem[] = [
    {
      id: 'crit-home',
      name: 'Homepage Root (https://www.toursbylocals.com/)',
      url: `${homepageUrl}/`,
      expectedSitemap: 'sitemap_pages.xml',
      priority: 'critical',
      notes: 'Root entry point and #1 internal link equity node (184 inlinks) omitted from all sitemaps in sitemap_index.xml.',
      isInternallyLinked: true,
      inSitemap: false, // <-- Critical Alert!
      httpStatus: 200,
      isIndexable: true,
      hasValidCanonical: true,
      isRedirecting: false,
      isBlocked: false,
      foundUrl: `${homepageUrl}/`,
      lastChecked: '2026-08-17T14:30:00Z',
    },
    {
      id: 'crit-areas-parent',
      name: 'Areas / Cities Catalog Hub (Rome)',
      url: `${homepageUrl}/rome-tours`,
      expectedSitemap: 'sitemap_areas.xml',
      priority: 'critical',
      notes: 'Commercial destination hub page linked in areas_1.xml.',
      isInternallyLinked: true,
      inSitemap: true,
      httpStatus: 200,
      isIndexable: true,
      hasValidCanonical: true,
      isRedirecting: false,
      isBlocked: false,
      foundUrl: `${homepageUrl}/rome-tours`,
      lastChecked: '2026-08-17T14:30:00Z',
    },
    {
      id: 'crit-area-missing',
      name: 'Naples Destination Hub (areas_3.xml)',
      url: `${homepageUrl}/naples-tours`,
      expectedSitemap: 'sitemap_areas.xml',
      priority: 'critical',
      notes: 'Part of 20,616 Area URLs in areas_3..5 that are NOT linked in parent /sitemaps/areas.xml.',
      isInternallyLinked: true,
      inSitemap: false, // Missing from parent index!
      httpStatus: 200,
      isIndexable: true,
      hasValidCanonical: true,
      isRedirecting: false,
      isBlocked: false,
      foundUrl: `${homepageUrl}/naples-tours`,
      lastChecked: '2026-08-17T14:30:00Z',
    },
    {
      id: 'crit-tour-missing',
      name: 'Appian Way Tour (tours_5.xml)',
      url: `${homepageUrl}/rome-catacombs-appian-way-e-bike-tour-9820`,
      expectedSitemap: 'sitemap_tours.xml',
      priority: 'critical',
      notes: 'Part of 20,000 Tour URLs in tours_5..9 that are NOT linked in parent /sitemaps/tours.xml.',
      isInternallyLinked: true,
      inSitemap: false, // Missing from parent index!
      httpStatus: 200,
      isIndexable: true,
      hasValidCanonical: true,
      isRedirecting: false,
      isBlocked: false,
      foundUrl: `${homepageUrl}/rome-catacombs-appian-way-e-bike-tour-9820`,
      lastChecked: '2026-08-17T14:30:00Z',
    },
    {
      id: 'crit-pillar-rome',
      name: 'Rome Guide Pillar Hub (/sitemaps/pillar-pages.xml)',
      url: `${homepageUrl}/rome-private-tour-guides`,
      expectedSitemap: 'sitemap_pillar-pages.xml',
      priority: 'critical',
      notes: 'Trapped in /sitemaps/pillar-pages.xml with 0 discovered pages due to GSC nested indexing error.',
      isInternallyLinked: true,
      inSitemap: false,
      httpStatus: 200,
      isIndexable: true,
      hasValidCanonical: true,
      isRedirecting: false,
      isBlocked: false,
      foundUrl: `${homepageUrl}/rome-private-tour-guides`,
      lastChecked: '2026-08-17T14:30:00Z',
    },
    {
      id: 'crit-trust',
      name: 'Trust & Safety Core Page (/sitemaps/static-pages.xml)',
      url: `${homepageUrl}/trust-and-safety`,
      expectedSitemap: 'sitemap_static-pages.xml',
      priority: 'high',
      notes: 'Trapped in /sitemaps/static-pages.xml with 0 discovered pages due to GSC nested indexing error.',
      isInternallyLinked: true,
      inSitemap: false,
      httpStatus: 200,
      isIndexable: true,
      hasValidCanonical: true,
      isRedirecting: false,
      isBlocked: false,
      foundUrl: `${homepageUrl}/trust-and-safety`,
      lastChecked: '2026-08-17T14:30:00Z',
    },
  ];

  // ==========================================
  // 4. DUPLICATES ACROSS SITEMAPS
  // ==========================================
  const duplicateUrlsAcrossSitemaps = [
    {
      normalizedUrl: `${homepageUrl}/rome-colosseum-and-ancient-city-private-tour-4819`,
      sitemaps: ['/sitemaps/tours_1.xml', '/tours_sitemap_1.xml (Legacy Root)'],
    },
    {
      normalizedUrl: `${homepageUrl}/rome-tours`,
      sitemaps: ['/sitemaps/areas_1.xml', 'search_results_cities_sitemap.xml', 'search_results_cities_single_filter_sitemap_1.xml'],
    },
    {
      normalizedUrl: `${homepageUrl}/blog/how-to-plan-a-trip-to-rome-insider-tips`,
      sitemaps: ['/sitemaps/blogs_1.xml', '/blog_sitemap.xml (Legacy Root)'],
    },
    {
      normalizedUrl: `${homepageUrl}/paris-private-walking-tour-highlights-8491`,
      sitemaps: ['/sitemaps/tours_1.xml', '/tours_sitemap_1.xml (Legacy Root)'],
    },
    {
      normalizedUrl: `${homepageUrl}/tokyo-highlights-and-hidden-gems-tour-7210`,
      sitemaps: ['/sitemaps/tours_1.xml', '/tours_sitemap_2.xml (Legacy Root)'],
    },
    {
      normalizedUrl: `${homepageUrl}/london-tours`,
      sitemaps: ['/sitemaps/areas_1.xml', 'search_results_cities_sitemap.xml'],
    },
    {
      normalizedUrl: `${homepageUrl}/paris-tours`,
      sitemaps: ['/sitemaps/areas_1.xml', 'search_results_cities_sitemap.xml', 'search_results_cities_single_filter_sitemap_2.xml'],
    },
    {
      normalizedUrl: `${homepageUrl}/florence-tours`,
      sitemaps: ['/sitemaps/areas_2.xml', 'search_results_cities_sitemap.xml'],
    },
    {
      normalizedUrl: `${homepageUrl}/blog/best-time-to-visit-tokyo-cherry-blossom-season`,
      sitemaps: ['/sitemaps/blogs_1.xml', '/blog_sitemap.xml (Legacy Root)'],
    },
    {
      normalizedUrl: `${homepageUrl}/blog/paris-neighborhood-guide-marais-latin-quarter`,
      sitemaps: ['/sitemaps/blogs_1.xml', '/blog_sitemap.xml (Legacy Root)'],
    },
    {
      normalizedUrl: `${homepageUrl}/barcelona-sagrada-familia-and-gaudi-private-tour-3310`,
      sitemaps: ['/sitemaps/tours_2.xml', '/tours_sitemap_2.xml (Legacy Root)'],
    },
    {
      normalizedUrl: `${homepageUrl}/new-york-city-central-park-and-manhattan-highlights-1029`,
      sitemaps: ['/sitemaps/tours_2.xml', '/tours_sitemap_3.xml (Legacy Root)'],
    },
    {
      normalizedUrl: `${homepageUrl}/amsterdam-canal-ring-and-jordaan-walk-5521`,
      sitemaps: ['/sitemaps/tours_3.xml', '/tours_sitemap_3.xml (Legacy Root)'],
    },
  ];

  // Unreferenced pattern candidates
  const patternCandidates = [areas3, areas4, areas5, toursChildren[4] && sitemapFiles.get(`${homepageUrl}/sitemaps/tours_5.xml`)!].filter(Boolean);

  // ==========================================
  // 5. DETERMINISTIC ISSUES (GSC Audit Report)
  // ==========================================
  const issues: IssueItem[] = [
    {
      id: 'issue-tbl-nested-error',
      type: 'invalid_sitemap_xml',
      severity: 'critical',
      title: 'P0 Error: Nested Sitemap Indexing Error on pillar-pages.xml & static-pages.xml',
      description: 'Google Search Console explicitly errors on /sitemaps/pillar-pages.xml and /sitemaps/static-pages.xml ("Sitemap index can be read, but has errors: Nested indexing — This Sitemap Index is referenced by another Sitemap Index"). Both return 0 discovered pages. Referenced by both http:// and https:// root index references.',
      affectedUrl: `${homepageUrl}/sitemaps/pillar-pages.xml`,
      affectedSitemap: `${homepageUrl}/sitemap_index.xml`,
      suggestedAction: 'Restructure /sitemap_index.xml to reference plain urlset sitemaps directly rather than child indexes. Consolidate to a single https-only root index.',
    },
    {
      id: 'issue-tbl-tours-missing-children',
      type: 'unreferenced_sitemap_candidate',
      severity: 'critical',
      title: 'P1 Structural Gap: /sitemaps/tours.xml parent index missing 5 child sitemaps (20,000 URLs)',
      description: 'Live parent /sitemaps/tours.xml index only reports 36,583 URLs (tours_1–4). Child files tours_5.xml through tours_9.xml (4,000 URLs each = 20,000 URLs) exist in GSC but are NOT linked in the parent index! Total inventory across 9 children is 56,583 URLs.',
      affectedUrl: `${homepageUrl}/sitemaps/tours.xml`,
      affectedSitemap: `${homepageUrl}/sitemaps/tours.xml`,
      suggestedAction: 'Add <sitemap><loc> entries for tours_5.xml through tours_9.xml to the live /sitemaps/tours.xml index file.',
      pageType: 'Tour Itinerary Detail Pages',
    },
    {
      id: 'issue-tbl-areas-missing-children',
      type: 'unreferenced_sitemap_candidate',
      severity: 'critical',
      title: 'P1 Structural Gap: /sitemaps/areas.xml parent index missing 3 child sitemaps (20,616 URLs)',
      description: 'Live /sitemaps/areas.xml index only reports 19,791 discovered URLs (areas_1 [9,898] + areas_2 [9,893]). Child files areas_3.xml (9,873), areas_4.xml (9,874), and areas_5.xml (869) exist in GSC totalling 20,616 URLs that are omitted from the parent index! Total area inventory = 40,407 URLs.',
      affectedUrl: `${homepageUrl}/sitemaps/areas.xml`,
      affectedSitemap: `${homepageUrl}/sitemaps/areas.xml`,
      suggestedAction: 'Add <sitemap><loc> entries for areas_3.xml, areas_4.xml, and areas_5.xml into the live /sitemaps/areas.xml index.',
      pageType: 'Destination & City Tour Hubs',
    },
    {
      id: 'issue-tbl-home-missing',
      type: 'missing_critical_page',
      severity: 'critical',
      title: 'P0 Omission: Root Homepage (/) omitted from all XML sitemaps',
      description: 'The root homepage (https://www.toursbylocals.com/) is live and crawlable with 184 inbound internal links and 200 OK status, but is absent from all XML sitemaps in sitemap_index.xml.',
      affectedUrl: `${homepageUrl}/`,
      affectedSitemap: 'sitemap_pages.xml',
      suggestedAction: 'Add the root homepage URL to the main pages sitemap with priority 1.0.',
      pageType: 'Homepage',
    },
    {
      id: 'issue-tbl-tours-legacy-root-dup',
      type: 'duplicate_across_sitemaps',
      severity: 'high',
      title: 'P1 High Volume Duplication: Legacy root-level /tours_sitemap_1–10.xml (~56,686 URLs)',
      description: 'A full parallel generation of tour sitemaps exists at the root level (/tours_sitemap_1..10.xml, submitted Feb 2025, still "Success" on Aug 14, 2026). Near-exact match to current /sitemaps/tours_1–9.xml (56,583 URLs), resulting in ~56,000+ tour URLs being crawled twice.',
      affectedUrl: `${homepageUrl}/tours_sitemap_1.xml`,
      affectedSitemap: `${homepageUrl}/tours_sitemap_1–10.xml`,
      suggestedAction: 'Execute URL-level diff to verify full overlap, then 301 redirect or remove legacy root submissions and de-register from GSC.',
      pageType: 'Tour Itinerary Detail Pages',
    },
    {
      id: 'issue-tbl-areas-search-results-dup',
      type: 'duplicate_across_sitemaps',
      severity: 'high',
      title: 'P2 Duplication: search_results_cities_sitemap.xml (40,407) & single_filter variants',
      description: 'search_results_cities_sitemap.xml independently surfaces all 40,407 area URLs, while search_results_cities_single_filter_sitemap_1..3 each report 19,791 URLs mirroring the partial parent index. Relying on an undocumented legacy sitemap to surface areas_3..5 is highly fragile.',
      affectedUrl: `${homepageUrl}/search_results_cities_sitemap.xml`,
      affectedSitemap: `${homepageUrl}/search_results_cities_sitemap.xml`,
      suggestedAction: 'Fix the official /sitemaps/areas.xml index first, verify re-crawl in GSC, then retire and de-register the search_results_cities_* family.',
      pageType: 'Destination & City Tour Hubs',
    },
    {
      id: 'issue-tbl-regions-dup',
      type: 'duplicate_across_sitemaps',
      severity: 'medium',
      title: 'P2 Full Match Duplication: Regions sitemaps (4,312 URLs duplicated 3x)',
      description: '/sitemaps/regions.xml (4,312) is identically duplicated by search_results_regions_sitemap.xml (4,312) and search_results_regions_single_filter_sitemap.xml (4,312).',
      affectedUrl: `${homepageUrl}/search_results_regions_sitemap.xml`,
      suggestedAction: 'Confirm XML <loc> alignment and retire both search_results_regions_* submissions.',
      pageType: 'Destination & City Tour Hubs',
    },
    {
      id: 'issue-tbl-countries-dup',
      type: 'duplicate_across_sitemaps',
      severity: 'medium',
      title: 'P2 Full Match Duplication: Countries sitemap (410 URLs duplicated)',
      description: '/sitemaps/countries.xml (410) is duplicated by search_results_countries_sitemap.xml (410).',
      affectedUrl: `${homepageUrl}/search_results_countries_sitemap.xml`,
      suggestedAction: 'Confirm XML <loc> alignment and retire search_results_countries_sitemap.xml.',
    },
    {
      id: 'issue-tbl-attractions-dup',
      type: 'duplicate_across_sitemaps',
      severity: 'medium',
      title: 'P2 Full Match Duplication: Attractions sitemaps (32,188 URLs duplicated 3x)',
      description: '/sitemaps/attractions.xml (32,188) is duplicated by search_results_attractions_sitemap.xml (32,188) and search_results_attractions_single_filter_sitemap.xml (32,188).',
      affectedUrl: `${homepageUrl}/search_results_attractions_sitemap.xml`,
      suggestedAction: 'Confirm XML <loc> alignment and retire both search_results_attractions_* submissions.',
    },
    {
      id: 'issue-tbl-blog-dup',
      type: 'duplicate_across_sitemaps',
      severity: 'medium',
      title: 'P3 Duplication: /blog_sitemap.xml legacy duplicate (899 URLs)',
      description: 'Current /sitemaps/blogs.xml (899) is duplicated by legacy root /blog_sitemap.xml (899, submitted Nov 2024, still "Success").',
      affectedUrl: `${homepageUrl}/blog_sitemap.xml`,
      suggestedAction: 'Confirm /blog_sitemap.xml is not referenced in robots.txt or code, then remove submission from GSC.',
      pageType: 'Blog & Travel Stories',
    },
    {
      id: 'issue-tbl-things-dup',
      type: 'duplicate_across_sitemaps',
      severity: 'medium',
      title: 'P3 Duplication: Things to Do Country (167) & City (931) legacy duplicates',
      description: 'Legacy root /things_to_do_country_sitemap.xml (167) and /things_to_do_city_sitemap.xml (931) duplicate current /sitemaps/ equivalents exactly.',
      affectedUrl: `${homepageUrl}/things_to_do_country_sitemap.xml`,
      suggestedAction: 'Remove legacy root submissions from GSC once confirmed unused.',
    },
    {
      id: 'issue-tbl-dead-gsc',
      type: 'sitemap_broken',
      severity: 'medium',
      title: 'P3 Cleanup: ~18 Dead "Couldn\'t fetch" legacy sitemap submissions in GSC',
      description: 'Old decommissioned sitemap files (e.g. /old_sitemap_tours_2023.xml, /staging_sitemap.xml) remain registered in GSC returning 404 / Couldn\'t fetch errors.',
      affectedUrl: `${homepageUrl}/old_sitemap_tours_2023.xml`,
      suggestedAction: 'Purge dead sitemap registrations from Google Search Console to establish a clean reporting baseline.',
    },
    {
      id: 'issue-tbl-pillar-naming',
      type: 'sitemap_broken',
      severity: 'medium',
      title: 'P3 Inconsistency: /pillar_sitemap.xml (working) vs /sitemaps/pillar-pages.xml (erroring)',
      description: 'Legacy root /pillar_sitemap.xml (4 pages, Success) vs new /sitemaps/pillar-pages.xml (0 pages, Error) represent conflicting implementations of the same concept.',
      affectedUrl: `${homepageUrl}/sitemaps/pillar-pages.xml`,
      suggestedAction: 'Clarify intended production architecture with development and consolidate into a single clean sitemap.',
    },
  ];

  // ==========================================
  // 6. PAGE TYPE COVERAGE STATS
  // ==========================================
  const pageTypeCoverage: PageTypeCoverageStats[] = [
    {
      pageType: 'Destination & City Tour Hubs',
      ruleId: 'pt-city',
      discoveredValidUrls: 40407,
      inSitemapCount: 19791,
      potentiallyMissingCount: 20616, // areas_3..5 missing from parent index
      validSitemapUrlsCount: 19791,
      invalidSitemapUrlsCount: 0,
      coveragePercentage: 49,
      redirectCount: 0,
      canonicalMismatchCount: 0,
      notDiscoveredThroughCrawlCount: 0,
      expectedSitemap: 'sitemap_areas.xml',
      severity: 'critical',
      recommendedAction: 'Add areas_3.xml, areas_4.xml, and areas_5.xml to /sitemaps/areas.xml parent index to restore coverage for 20,616 city & area pages.',
    },
    {
      pageType: 'Tour Itinerary Detail Pages',
      ruleId: 'pt-tour-detail',
      discoveredValidUrls: 56583,
      inSitemapCount: 36583,
      potentiallyMissingCount: 20000, // tours_5..9 missing from parent index
      validSitemapUrlsCount: 36583,
      invalidSitemapUrlsCount: 0,
      coveragePercentage: 65,
      redirectCount: 0,
      canonicalMismatchCount: 0,
      notDiscoveredThroughCrawlCount: 0,
      expectedSitemap: 'sitemap_tours.xml',
      severity: 'critical',
      recommendedAction: 'Add tours_5.xml through tours_9.xml to /sitemaps/tours.xml parent index to restore coverage for 20,000 tour itinerary pages.',
    },
    {
      pageType: 'Local Tour Guide Profiles',
      ruleId: 'pt-guide',
      discoveredValidUrls: 18500,
      inSitemapCount: 18500,
      potentiallyMissingCount: 0,
      validSitemapUrlsCount: 18500,
      invalidSitemapUrlsCount: 0,
      coveragePercentage: 100,
      redirectCount: 0,
      canonicalMismatchCount: 0,
      notDiscoveredThroughCrawlCount: 0,
      expectedSitemap: 'sitemap_areas.xml',
      severity: 'medium',
      recommendedAction: 'Guide profiles are currently represented in areas sitemaps; maintain automated sync with guide database.',
    },
    {
      pageType: 'Blog & Travel Stories',
      ruleId: 'pt-blog',
      discoveredValidUrls: 899,
      inSitemapCount: 899,
      potentiallyMissingCount: 0,
      validSitemapUrlsCount: 899,
      invalidSitemapUrlsCount: 0,
      coveragePercentage: 100,
      redirectCount: 0,
      canonicalMismatchCount: 0,
      notDiscoveredThroughCrawlCount: 0,
      expectedSitemap: 'sitemap_blogs.xml',
      severity: 'medium',
      recommendedAction: 'De-register duplicate legacy /blog_sitemap.xml submission from GSC.',
    },
    {
      pageType: 'Homepage',
      ruleId: 'pt-home',
      discoveredValidUrls: 1,
      inSitemapCount: 0,
      potentiallyMissingCount: 1,
      validSitemapUrlsCount: 0,
      invalidSitemapUrlsCount: 0,
      coveragePercentage: 0,
      redirectCount: 0,
      canonicalMismatchCount: 0,
      notDiscoveredThroughCrawlCount: 0,
      expectedSitemap: 'sitemap_pages.xml',
      severity: 'critical',
      recommendedAction: 'Add root homepage https://www.toursbylocals.com/ to primary pages sitemap with priority 1.0.',
    },
    {
      pageType: 'Static & Informational Pages',
      ruleId: 'pt-static',
      discoveredValidUrls: 65,
      inSitemapCount: 0,
      potentiallyMissingCount: 65, // Trapped in erroring static-pages.xml
      validSitemapUrlsCount: 0,
      invalidSitemapUrlsCount: 0,
      coveragePercentage: 0,
      redirectCount: 0,
      canonicalMismatchCount: 0,
      notDiscoveredThroughCrawlCount: 0,
      expectedSitemap: 'sitemap_static-pages.xml',
      severity: 'critical',
      recommendedAction: 'Fix nested indexing error on /sitemaps/static-pages.xml to unblock 65 static trust & policy pages.',
    },
  ];

  // ==========================================
  // 7. DEVELOPER TICKETS & RECOMMENDATIONS
  // ==========================================
  const recommendation: AuditRecommendation = {
    summary: 'ToursByLocals sitemap architecture exhibits 3 distinct overlapping generations: active /sitemaps/ directory, legacy root-level /tours_sitemap_1–10.xml (Feb 2025), and parallel search_results_* families. Immediate remediation is required for P0 nested indexing errors and P1 missing child sitemap references in /sitemaps/areas.xml and /sitemaps/tours.xml.',
    importantFindings: [
      {
        title: 'P0: Nested Indexing Error on /sitemaps/pillar-pages.xml & static-pages.xml',
        impact: 'critical',
        description: 'Google Search Console cannot parse child sitemaps that contain sitemap indexes. Returning 0 discovered URLs.',
        affectedCount: 69,
        exampleUrls: [
          `${homepageUrl}/rome-private-tour-guides`,
          `${homepageUrl}/paris-private-tour-guides`,
          `${homepageUrl}/trust-and-safety`,
        ],
        likelyRule: 'Sitemap XML Schema Protocol',
      },
      {
        title: 'P1: /sitemaps/areas.xml parent index missing areas_3–5 (20,616 URLs)',
        impact: 'critical',
        description: 'areas.xml parent index only links areas_1 and areas_2 (19,791 URLs). Missing 3 child files totalling 20,616 URLs.',
        affectedCount: 20616,
        exampleUrls: [
          `${homepageUrl}/naples-tours`,
          `${homepageUrl}/sorrento-tours`,
          `${homepageUrl}/palermo-tours`,
        ],
        likelyRule: 'Parent Sitemap Index Reference',
      },
      {
        title: 'P1: /sitemaps/tours.xml parent index missing tours_5–9 (20,000 URLs)',
        impact: 'critical',
        description: 'tours.xml parent index only links tours_1–4 (36,583 URLs). Missing 5 child files totalling 20,000 URLs.',
        affectedCount: 20000,
        exampleUrls: [
          `${homepageUrl}/rome-catacombs-appian-way-e-bike-tour-9820`,
          `${homepageUrl}/paris-montmartre-secret-vineyards-tour-8840`,
        ],
        likelyRule: 'Parent Sitemap Index Reference',
      },
      {
        title: 'P1: Massive Parallel Duplication from Legacy Root /tours_sitemap_1–10.xml',
        impact: 'high',
        description: '56,686 legacy tour URLs are actively crawled in parallel with modern /sitemaps/tours_1–9.xml.',
        affectedCount: 56686,
        exampleUrls: [
          `${homepageUrl}/tours_sitemap_1.xml`,
          `${homepageUrl}/tours_sitemap_2.xml`,
        ],
        likelyRule: 'Legacy Migration Cleanup',
      },
    ],
    patternProblems: [
      {
        pattern: '/sitemaps/pillar-pages.xml',
        pageType: 'Destination & City Tour Hubs',
        issue: 'Nested sitemapindex element inside child sitemap',
        evidence: 'GSC error: Nested indexing — This Sitemap Index is referenced by another Sitemap Index',
        suggestedFix: 'Flatten structure so /sitemap_index.xml references urlset files directly.',
      },
      {
        pattern: '/sitemaps/areas.xml -> areas_[1-2].xml',
        pageType: 'Destination & City Tour Hubs',
        issue: 'Trunctated child list omitting areas_3.xml, areas_4.xml, areas_5.xml',
        evidence: 'Parent index URL count = 19,791 vs full GSC area count = 40,407',
        suggestedFix: 'Add areas_3.xml, areas_4.xml, and areas_5.xml loc tags to /sitemaps/areas.xml.',
      },
    ],
    prioritizedActions: [
      {
        priority: 1,
        action: 'Resolve Nested Indexing Protocol Violations',
        scope: '/sitemaps/pillar-pages.xml, /sitemaps/static-pages.xml',
        impactDescription: 'Instantly restore discovery for 69 critical pillar and static pages in GSC.',
      },
      {
        priority: 2,
        action: 'Link All Missing Child Sitemaps in Parent Indexes',
        scope: '/sitemaps/areas.xml (add areas_3..5) & /sitemaps/tours.xml (add tours_5..9)',
        impactDescription: 'Directly surface 40,616 missing URLs into the official sitemap graph.',
      },
      {
        priority: 3,
        action: 'Add Root Homepage to Sitemaps',
        scope: 'https://www.toursbylocals.com/ -> sitemap_pages.xml',
        impactDescription: 'Ensure the top equity page is explicitly present in sitemaps.',
      },
      {
        priority: 4,
        action: 'Decommission Legacy Root Sitemaps & Search Results Variants',
        scope: '/tours_sitemap_1..10.xml, search_results_* sitemaps',
        impactDescription: 'Eliminate ~100k redundant crawl requests and avoid crawl budget waste.',
      },
    ],
    generatedAt: '2026-08-17T14:30:00Z',
  };

  const tickets: DeveloperTicket[] = [
    {
      id: 'DEV-TBL-001',
      title: 'P0: Fix nested indexing error on pillar-pages.xml & static-pages.xml',
      objective: 'Eliminate GSC nested indexing error and enable discovery of pillar & static URLs.',
      problem: 'Google Search Console does not allow a sitemap_index to contain child sitemap_index references. Current XML outputs nested indexes, resulting in 0 discovered URLs.',
      evidence: 'GSC shows: "Sitemap index can be read, but has errors: Nested indexing — This Sitemap Index is referenced by another Sitemap Index." Discovered pages: 0.',
      affectedPageType: 'Destination & City Tour Hubs / Static Pages',
      affectedUrlCount: 69,
      exampleUrls: [
        `${homepageUrl}/sitemaps/pillar-pages.xml`,
        `${homepageUrl}/sitemaps/static-pages.xml`,
      ],
      expectedBehaviour: 'Child sitemaps referenced in /sitemap_index.xml must be standard <urlset> files containing <url><loc> elements.',
      actualBehaviour: 'Child sitemaps contain <sitemapindex> blocks which GSC rejects.',
      recommendedInvestigation: 'Check the sitemap generation script for pillar and static page routes; ensure serializer outputs urlset schema instead of sitemapindex.',
      acceptanceCriteria: [
        'sitemaps/pillar-pages.xml validates against http://www.sitemaps.org/schemas/sitemap/0.9 as a urlset.',
        'sitemaps/static-pages.xml validates against http://www.sitemaps.org/schemas/sitemap/0.9 as a urlset.',
        'GSC resubmission processes without errors and reports >0 discovered URLs.',
      ],
      qaSteps: [
        '1. Fetch https://www.toursbylocals.com/sitemaps/pillar-pages.xml using curl.',
        '2. Verify root element is <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">.',
        '3. Validate in Google Search Console URL Inspection.',
      ],
    },
    {
      id: 'DEV-TBL-002',
      title: 'P1: Reference areas_3.xml, areas_4.xml, and areas_5.xml in /sitemaps/areas.xml',
      objective: 'Restore 20,616 missing city and destination area URLs to the primary sitemap graph.',
      problem: 'Parent sitemap /sitemaps/areas.xml only contains <sitemap> entries for areas_1.xml and areas_2.xml (19,791 URLs). 20,616 URLs in areas_3..5 are omitted.',
      evidence: 'Parent index lists 2 children (19,791 URLs) while GSC and server hold 5 files (40,407 URLs).',
      affectedPageType: 'Destination & City Tour Hubs',
      affectedUrlCount: 20616,
      exampleUrls: [
        `${homepageUrl}/naples-tours`,
        `${homepageUrl}/sorrento-tours`,
        `${homepageUrl}/palermo-tours`,
      ],
      expectedBehaviour: '/sitemaps/areas.xml includes <loc> entries for all 5 generated child files (areas_1.xml through areas_5.xml).',
      actualBehaviour: 'Only areas_1.xml and areas_2.xml are listed.',
      recommendedInvestigation: 'Inspect the sitemap index generator pagination loop to ensure child index generation does not truncate at 2 files.',
      acceptanceCriteria: [
        '/sitemaps/areas.xml contains all 5 child references.',
        'Total discovered URLs on /sitemaps/areas.xml in GSC increases from 19,791 to 40,407.',
      ],
      qaSteps: [
        '1. Fetch /sitemaps/areas.xml.',
        '2. Confirm presence of areas_1.xml, areas_2.xml, areas_3.xml, areas_4.xml, and areas_5.xml.',
      ],
    },
    {
      id: 'DEV-TBL-003',
      title: 'P1: Reference tours_5.xml through tours_9.xml in /sitemaps/tours.xml',
      objective: 'Restore 20,000 missing tour itinerary detail URLs to the official /sitemaps/tours.xml index.',
      problem: '/sitemaps/tours.xml only links tours_1–4 (36,583 URLs). Files tours_5.xml through tours_9.xml (20,000 URLs) exist but are not referenced.',
      evidence: 'Parent index lists 4 children (36,583 URLs) vs total 9 files (56,583 URLs).',
      affectedPageType: 'Tour Itinerary Detail Pages',
      affectedUrlCount: 20000,
      exampleUrls: [
        `${homepageUrl}/rome-catacombs-appian-way-e-bike-tour-9820`,
        `${homepageUrl}/paris-montmartre-secret-vineyards-tour-8840`,
      ],
      expectedBehaviour: '/sitemaps/tours.xml links all 9 child files (tours_1.xml to tours_9.xml).',
      actualBehaviour: 'tours_5.xml through tours_9.xml are omitted from the parent index.',
      recommendedInvestigation: 'Check pagination logic in tour sitemap index builder.',
      acceptanceCriteria: [
        '/sitemaps/tours.xml contains 9 child <sitemap> entries.',
        'GSC reports 56,583 discovered URLs for /sitemaps/tours.xml.',
      ],
      qaSteps: [
        '1. Verify /sitemaps/tours.xml links tours_1 through tours_9.',
      ],
    },
    {
      id: 'DEV-TBL-004',
      title: 'P1: Deprecate legacy root /tours_sitemap_1–10.xml and search_results duplicates',
      objective: 'Eliminate duplicate crawling of ~96,000 URLs to save crawl budget.',
      problem: 'Legacy root-level sitemaps and parallel search_results_* families cause Googlebot to crawl identical URLs multiple times.',
      evidence: 'GSC shows active success status on /tours_sitemap_1..10.xml duplicating /sitemaps/tours_1..9.xml.',
      affectedPageType: 'All Types',
      affectedUrlCount: 96328,
      exampleUrls: [
        `${homepageUrl}/tours_sitemap_1.xml`,
        `${homepageUrl}/search_results_cities_sitemap.xml`,
      ],
      expectedBehaviour: 'Only official /sitemaps/ hierarchy is submitted to GSC and referenced in robots.txt.',
      actualBehaviour: 'Legacy root and search_results sitemaps are still registered and processed.',
      recommendedInvestigation: 'Perform a diff check to verify 100% overlap, then delete legacy files or configure 301 redirects to /sitemaps/ equivalents.',
      acceptanceCriteria: [
        'Legacy sitemaps removed from GSC.',
        'Only https://www.toursbylocals.com/sitemap_index.xml is declared in robots.txt.',
      ],
      qaSteps: [
        '1. Verify legacy files return 410 or 301 to canonical sitemap index.',
        '2. Confirm GSC sitemap list contains only active sitemaps.',
      ],
    },
  ];

  // ==========================================
  // 8. AUDIT PROJECT METADATA
  // ==========================================
  const project: AuditProject = {
    id: 'audit-enterprise-demo',
    name: 'Enterprise Sitemap Architecture & Taxonomy Audit',
    domain: baseDomain,
    homepageUrl,
    createdAt: '2026-08-17T12:00:00Z',
    updatedAt: '2026-08-17T14:30:00Z',
    isDemo: false,
    status: 'completed',
    stats: {
      totalDiscoveredInternalUrls: 198420,
      totalProcessedSitemapUrls: 147804,
      potentiallyMissingUrlsCount: 40682,
      validSitemapUrlsCount: 147804,
      invalidSitemapUrlsCount: 2,
      sitemapCoveragePercentage: 74,
      criticalIssuesCount: 4,
      highPriorityCount: 2,
      mediumPriorityCount: 7,
      reviewRequiredCount: 0,
      orphanInSitemapCount: 0,
      canonicalMismatchCount: 0,
      sitemapRedirectCount: 0,
      sitemapBrokenCount: 2,
      unreferencedSitemapsCount: 8,
      duplicateAcrossSitemapsCount: 96328,
      totalSitemapFiles: sitemapFiles.size,
    },
    crawlConfig: {
      maxUrls: 250000,
      crawlDepth: 4,
      crawlSpeed: 'moderate',
      includeSubdomains: false,
      respectRobotsTxt: true,
      userAgent: 'SitemapCoverageAuditor/1.0 (+https://example.com/bot)',
      excludeQueryPatterns: ['sessionid', 'gclid', 'fbclid', 'utm_'],
      excludeDirectoryPatterns: ['/cdn-cgi/', '/wp-admin/', '/checkout/'],
      excludeFileExtensions: ['.jpg', '.png', '.gif', '.pdf', '.svg', '.webp'],
      customSitemapUrls: [`${homepageUrl}/sitemap_index.xml`],
      retryCount: 3,
    },
    recommendation,
    tickets,
  };

  return {
    project,
    crawledUrls,
    sitemapFiles,
    allSitemapUrls,
    duplicateUrlsAcrossSitemaps,
    patternCandidates,
    criticalPages,
    pageTypeCoverage,
    issues,
  };
}
