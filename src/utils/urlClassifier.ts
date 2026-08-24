import { PageTypeRule, UrlTaxonomyClassification } from '../types/audit.js';

export interface PriorityTaxonomyRule {
  priority: number;
  conditionDescription: string;
  pageGroup: string;
  pageLevel: string;
  exampleUrl: string;
  expectedSitemap: string;
  match: (path: string, segments: string[]) => boolean;
}

/**
 * Extracts the clean relative slug from any full URL or relative path string.
 * Example: "https://www.example.com/tours/france/paris" -> "/tours/france/paris"
 */
export function extractUrlSlug(rawUrl: string): string {
  if (!rawUrl) return '/';
  let path = rawUrl.trim();
  // Strip protocol and domain if present
  try {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      const parsed = new URL(path);
      path = parsed.pathname;
    }
  } catch {
    // If URL parsing fails, strip manually
    path = path.replace(/^https?:\/\/[^\/]+/, '');
  }

  // Ensure leading slash
  if (!path.startsWith('/')) {
    path = '/' + path;
  }

  // Remove query params or hashes
  path = path.split('?')[0].split('#')[0];

  // If path is empty, return root
  return path || '/';
}

/**
 * Helper to get clean directory display name
 */
export function getDirectoryPageGroup(dirSlug: string): string {
  const normalized = dirSlug.toLowerCase().replace(/^\//, '').replace(/\/$/, '');
  switch (normalized) {
    case 'tours':
      return 'Tours';
    case 'tour-guides':
    case 'tourguides':
    case 'guides':
      return 'Tour Guides';
    case 'safaris':
    case 'safari':
      return 'Safaris';
    case 'shore-excursions':
    case 'shore-excursion':
      return 'Shore Excursions';
    case 'travel-blog':
    case 'blog':
      return 'Travel Blog';
    case 'things-to-do':
      return 'Things to Do';
    default:
      return normalized
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
  }
}

/**
 * Exact 11-rule priority engine definition according to taxonomy specification
 */
export const TAXONOMY_PRIORITY_RULES: PriorityTaxonomyRule[] = [
  {
    priority: 1,
    conditionDescription: 'Path equals /',
    pageGroup: 'Homepage',
    pageLevel: 'Site Root',
    exampleUrl: '/',
    expectedSitemap: 'sitemap_pages.xml',
    match: (path, segments) => path === '/' || segments.length === 0,
  },
  {
    priority: 2,
    conditionDescription: 'Contains /tour-details/',
    pageGroup: 'Tour Details',
    pageLevel: 'Tour Detail Page',
    exampleUrl: '/tours/italy/tour-details/ancient-rome-private-walking-guided-tour',
    expectedSitemap: 'sitemap_tours.xml',
    match: (path) => path.includes('/tour-details/'),
  },
  {
    priority: 3,
    conditionDescription: 'Contains /attractions/',
    pageGroup: 'Attractions',
    pageLevel: 'Attraction Page',
    exampleUrl: '/tours/canada/vancouver/attractions/grouse-mountain',
    expectedSitemap: 'sitemap_attractions.xml',
    match: (path) => path.includes('/attractions/'),
  },
  {
    priority: 4,
    conditionDescription: 'Ends with /shore-ex-tours',
    pageGroup: 'Shore Excursions',
    pageLevel: 'Cruise Destination / Port Page',
    exampleUrl: '/tours/south-korea/seoul/shore-ex-tours',
    expectedSitemap: 'sitemap_shore_excursions.xml',
    match: (path) => path.endsWith('/shore-ex-tours') || path.includes('/shore-ex-tours'),
  },
  {
    priority: 5,
    conditionDescription: 'Ends with /essentials-tours',
    pageGroup: 'Essential Tours',
    pageLevel: 'Global or City Landing Page',
    exampleUrl: '/tours/essentials-tours',
    expectedSitemap: 'sitemap_essential_tours.xml',
    match: (path) => path.endsWith('/essentials-tours') || path.includes('/essentials-tours'),
  },
  {
    priority: 6,
    conditionDescription: 'Starts with /travel-blog/ and has another segment',
    pageGroup: 'Travel Blog',
    pageLevel: 'Blog Post',
    exampleUrl: '/travel-blog/how-to-book-tour',
    expectedSitemap: 'sitemap_blogs.xml',
    match: (path, segments) => {
      const isBlog = path.startsWith('/travel-blog/') || path.startsWith('/blog/');
      return isBlog && segments.length >= 2;
    },
  },
  {
    priority: 7,
    conditionDescription: 'Matches /things-to-do/{country}/{city}',
    pageGroup: 'Things to Do',
    pageLevel: 'City Page',
    exampleUrl: '/things-to-do/united-states/kansas-city',
    expectedSitemap: 'sitemap_things_to_do_city.xml',
    match: (path, segments) => {
      return segments[0] === 'things-to-do' && segments.length === 3;
    },
  },
  {
    priority: 8,
    conditionDescription: 'Matches /things-to-do/{country}',
    pageGroup: 'Things to Do',
    pageLevel: 'Country Page',
    exampleUrl: '/things-to-do/united-states',
    expectedSitemap: 'sitemap_things_to_do_country.xml',
    match: (path, segments) => {
      return segments[0] === 'things-to-do' && segments.length === 2;
    },
  },
  {
    priority: 9,
    conditionDescription: 'Matches /{directory}/{country}/{city}',
    pageGroup: 'Relevant directory',
    pageLevel: 'City Page',
    exampleUrl: '/tours/france/paris',
    expectedSitemap: 'sitemap_areas.xml',
    match: (path, segments) => {
      const knownDirs = ['tours', 'tour-guides', 'safaris', 'shore-excursions', 'guides'];
      return knownDirs.includes(segments[0]) && segments.length === 3;
    },
  },
  {
    priority: 10,
    conditionDescription: 'Matches /{directory}/{country}',
    pageGroup: 'Relevant directory',
    pageLevel: 'Country Page',
    exampleUrl: '/tours/france',
    expectedSitemap: 'sitemap_countries.xml',
    match: (path, segments) => {
      const knownDirs = ['tours', 'tour-guides', 'safaris', 'shore-excursions', 'guides'];
      return knownDirs.includes(segments[0]) && segments.length === 2;
    },
  },
  {
    priority: 11,
    conditionDescription: 'Matches an exact directory root',
    pageGroup: 'Relevant directory',
    pageLevel: 'Directory Root',
    exampleUrl: '/tours',
    expectedSitemap: 'sitemap_pages.xml',
    match: (path, segments) => {
      const knownDirs = ['tours', 'tour-guides', 'safaris', 'shore-excursions', 'travel-blog', 'things-to-do', 'guides', 'blog'];
      return knownDirs.includes(segments[0]) && segments.length === 1;
    },
  },
];

/**
 * Classifies any URL or slug using the exact 11-priority taxonomy rules
 */
export function classifyUrlByTaxonomy(rawUrl: string): UrlTaxonomyClassification {
  const slug = extractUrlSlug(rawUrl);
  const cleanPath = slug.toLowerCase().replace(/\/+$/, '') || '/';
  const segments = cleanPath.split('/').filter(Boolean);

  // Priority 1: Path equals /
  if (cleanPath === '/' || segments.length === 0) {
    return {
      url: rawUrl,
      slug: '/',
      rulePriority: 1,
      pageGroup: 'Homepage',
      pageLevel: 'Site Root',
      pageType: 'Homepage (Site Root)',
      matchedCondition: 'Path equals /',
      expectedSitemap: 'sitemap_pages.xml',
    };
  }

  // Priority 2: Contains /tour-details/
  if (cleanPath.includes('/tour-details/')) {
    return {
      url: rawUrl,
      slug,
      rulePriority: 2,
      pageGroup: 'Tour Details',
      pageLevel: 'Tour Detail Page',
      pageType: 'Tour Details (Tour Detail Page)',
      matchedCondition: 'Contains /tour-details/',
      expectedSitemap: 'sitemap_tours.xml',
    };
  }

  // Priority 3: Contains /attractions/
  if (cleanPath.includes('/attractions/')) {
    const isGuideAttraction = cleanPath.startsWith('/tour-guides/') || cleanPath.includes('guide');
    const level = isGuideAttraction ? 'Attraction Guide Page' : 'Attraction Page';
    return {
      url: rawUrl,
      slug,
      rulePriority: 3,
      pageGroup: 'Attractions',
      pageLevel: level,
      pageType: `Attractions (${level})`,
      matchedCondition: 'Contains /attractions/',
      expectedSitemap: 'sitemap_attractions.xml',
    };
  }

  // Priority 4: Ends with /shore-ex-tours
  if (cleanPath.endsWith('/shore-ex-tours') || cleanPath.includes('/shore-ex-tours')) {
    return {
      url: rawUrl,
      slug,
      rulePriority: 4,
      pageGroup: 'Shore Excursions',
      pageLevel: 'Cruise Destination / Port Page',
      pageType: 'Shore Excursions (Cruise Destination / Port Page)',
      matchedCondition: 'Ends with /shore-ex-tours',
      expectedSitemap: 'sitemap_shore_excursions.xml',
    };
  }

  // Priority 5: Ends with /essentials-tours
  if (cleanPath.endsWith('/essentials-tours') || cleanPath.includes('/essentials-tours')) {
    const isGlobal = segments.length <= 2 && segments[0] === 'tours';
    const level = isGlobal ? 'Global Landing Page' : 'City Landing Page';
    return {
      url: rawUrl,
      slug,
      rulePriority: 5,
      pageGroup: 'Essential Tours',
      pageLevel: level,
      pageType: `Essential Tours (${level})`,
      matchedCondition: 'Ends with /essentials-tours',
      expectedSitemap: 'sitemap_essential_tours.xml',
    };
  }

  // Priority 6: Starts with /travel-blog/ and has another segment
  if ((cleanPath.startsWith('/travel-blog/') || cleanPath.startsWith('/blog/')) && segments.length >= 2) {
    return {
      url: rawUrl,
      slug,
      rulePriority: 6,
      pageGroup: 'Travel Blog',
      pageLevel: 'Blog Post',
      pageType: 'Travel Blog (Blog Post)',
      matchedCondition: 'Starts with /travel-blog/ and has another segment',
      expectedSitemap: 'sitemap_blogs.xml',
    };
  }

  // Priority 7: Matches /things-to-do/{country}/{city}
  if (segments[0] === 'things-to-do' && segments.length === 3) {
    return {
      url: rawUrl,
      slug,
      rulePriority: 7,
      pageGroup: 'Things to Do',
      pageLevel: 'City Page',
      pageType: 'Things to Do (City Page)',
      matchedCondition: 'Matches /things-to-do/{country}/{city}',
      expectedSitemap: 'sitemap_things_to_do_city.xml',
    };
  }

  // Priority 8: Matches /things-to-do/{country}
  if (segments[0] === 'things-to-do' && segments.length === 2) {
    return {
      url: rawUrl,
      slug,
      rulePriority: 8,
      pageGroup: 'Things to Do',
      pageLevel: 'Country Page',
      pageType: 'Things to Do (Country Page)',
      matchedCondition: 'Matches /things-to-do/{country}',
      expectedSitemap: 'sitemap_things_to_do_country.xml',
    };
  }

  // Priority 9: Matches /{directory}/{country}/{city}
  if (segments.length === 3) {
    const group = getDirectoryPageGroup(segments[0]);
    return {
      url: rawUrl,
      slug,
      rulePriority: 9,
      pageGroup: group,
      pageLevel: 'City Page',
      pageType: `${group} (City Page)`,
      matchedCondition: 'Matches /{directory}/{country}/{city}',
      expectedSitemap: `sitemap_${segments[0].replace(/-/g, '_')}_cities.xml`,
    };
  }

  // Priority 10: Matches /{directory}/{country} or /{directory}/{cruise-line}
  if (segments.length === 2) {
    const group = getDirectoryPageGroup(segments[0]);
    const level = segments[0] === 'shore-excursions' ? 'Cruise Line Page' : 'Country Page';
    return {
      url: rawUrl,
      slug,
      rulePriority: 10,
      pageGroup: group,
      pageLevel: level,
      pageType: `${group} (${level})`,
      matchedCondition: 'Matches /{directory}/{country}',
      expectedSitemap: `sitemap_${segments[0].replace(/-/g, '_')}_countries.xml`,
    };
  }

  // Priority 11: Matches an exact directory root
  if (segments.length === 1) {
    const group = getDirectoryPageGroup(segments[0]);
    return {
      url: rawUrl,
      slug,
      rulePriority: 11,
      pageGroup: group,
      pageLevel: 'Directory Root',
      pageType: `${group} (Directory Root)`,
      matchedCondition: 'Matches an exact directory root',
      expectedSitemap: 'sitemap_pages.xml',
    };
  }

  // Fallback for deep or custom nested paths
  const rootDir = segments[0] || 'custom';
  const group = getDirectoryPageGroup(rootDir);
  return {
    url: rawUrl,
    slug,
    rulePriority: 12,
    pageGroup: group,
    pageLevel: 'Custom Page',
    pageType: `${group} (Custom Page)`,
    matchedCondition: 'Custom Path Structure',
    expectedSitemap: 'sitemap_pages.xml',
  };
}

/**
 * Standard page type rules array derived from the 11-rule priority taxonomy
 */
export const DEFAULT_PAGE_TYPE_RULES: PageTypeRule[] = [
  {
    id: 'pt-p1-home',
    name: 'Homepage (Site Root)',
    pageGroup: 'Homepage',
    pageLevel: 'Site Root',
    rulePriority: 1,
    pattern: '^https?:\\/\\/[^\\/]+(\\/?|\\/index\\.(html|php))?$',
    expectedSitemap: 'sitemap_pages.xml',
    isIndexableDefault: true,
    priority: 'critical',
    description: 'Priority 1: Root entry point (Path equals /)',
    exampleUrl: '/',
  },
  {
    id: 'pt-p2-tour-details',
    name: 'Tour Details (Tour Detail Page)',
    pageGroup: 'Tour Details',
    pageLevel: 'Tour Detail Page',
    rulePriority: 2,
    pattern: '\\/tour-details\\/',
    expectedSitemap: 'sitemap_tours.xml',
    isIndexableDefault: true,
    priority: 'critical',
    description: 'Priority 2: Tour product itinerary pages (Contains /tour-details/)',
    exampleUrl: '/tours/italy/tour-details/ancient-rome-private-walking-guided-tour',
  },
  {
    id: 'pt-p3-attractions',
    name: 'Attractions (Attraction Page)',
    pageGroup: 'Attractions',
    pageLevel: 'Attraction Page',
    rulePriority: 3,
    pattern: '\\/attractions\\/',
    expectedSitemap: 'sitemap_attractions.xml',
    isIndexableDefault: true,
    priority: 'high',
    description: 'Priority 3: Destination attraction hubs and guides (Contains /attractions/)',
    exampleUrl: '/tours/canada/vancouver/attractions/grouse-mountain',
  },
  {
    id: 'pt-p4-shore-ex',
    name: 'Shore Excursions (Cruise Destination / Port Page)',
    pageGroup: 'Shore Excursions',
    pageLevel: 'Cruise Destination / Port Page',
    rulePriority: 4,
    pattern: '(\\/shore-ex-tours|shore-ex-tours$)',
    expectedSitemap: 'sitemap_shore_excursions.xml',
    isIndexableDefault: true,
    priority: 'high',
    description: 'Priority 4: Cruise port excursions (Ends with /shore-ex-tours)',
    exampleUrl: '/tours/south-korea/seoul/shore-ex-tours',
  },
  {
    id: 'pt-p5-essentials',
    name: 'Essential Tours (Global or City Landing Page)',
    pageGroup: 'Essential Tours',
    pageLevel: 'Global or City Landing Page',
    rulePriority: 5,
    pattern: '(\\/essentials-tours|essentials-tours$)',
    expectedSitemap: 'sitemap_essential_tours.xml',
    isIndexableDefault: true,
    priority: 'high',
    description: 'Priority 5: Essential curated tour collections (Ends with /essentials-tours)',
    exampleUrl: '/tours/essentials-tours',
  },
  {
    id: 'pt-p6-blog',
    name: 'Travel Blog (Blog Post)',
    pageGroup: 'Travel Blog',
    pageLevel: 'Blog Post',
    rulePriority: 6,
    pattern: '^(\\/(travel-blog|blog)\\/.+)',
    expectedSitemap: 'sitemap_blogs.xml',
    isIndexableDefault: true,
    priority: 'medium',
    description: 'Priority 6: Travel articles and advice (Starts with /travel-blog/ and has another segment)',
    exampleUrl: '/travel-blog/how-to-book-tour',
  },
  {
    id: 'pt-p7-ttd-city',
    name: 'Things to Do (City Page)',
    pageGroup: 'Things to Do',
    pageLevel: 'City Page',
    rulePriority: 7,
    pattern: '^\\/things-to-do\\/[^\\/]+\\/[^\\/]+$',
    expectedSitemap: 'sitemap_things_to_do_city.xml',
    isIndexableDefault: true,
    priority: 'high',
    description: 'Priority 7: Things to do in cities (Matches /things-to-do/{country}/{city})',
    exampleUrl: '/things-to-do/united-states/kansas-city',
  },
  {
    id: 'pt-p8-ttd-country',
    name: 'Things to Do (Country Page)',
    pageGroup: 'Things to Do',
    pageLevel: 'Country Page',
    rulePriority: 8,
    pattern: '^\\/things-to-do\\/[^\\/]+$',
    expectedSitemap: 'sitemap_things_to_do_country.xml',
    isIndexableDefault: true,
    priority: 'medium',
    description: 'Priority 8: Things to do in countries (Matches /things-to-do/{country})',
    exampleUrl: '/things-to-do/united-states',
  },
  {
    id: 'pt-p9-directory-city',
    name: 'Directory (City Page)',
    pageGroup: 'Tours / Tour Guides / Safaris',
    pageLevel: 'City Page',
    rulePriority: 9,
    pattern: '^\\/(tours|tour-guides|safaris|shore-excursions)\\/[^\\/]+\\/[^\\/]+$',
    expectedSitemap: 'sitemap_areas.xml',
    isIndexableDefault: true,
    priority: 'critical',
    description: 'Priority 9: City-level directories (Matches /{directory}/{country}/{city})',
    exampleUrl: '/tours/france/paris',
  },
  {
    id: 'pt-p10-directory-country',
    name: 'Directory (Country Page)',
    pageGroup: 'Tours / Tour Guides / Safaris',
    pageLevel: 'Country Page',
    rulePriority: 10,
    pattern: '^\\/(tours|tour-guides|safaris|shore-excursions)\\/[^\\/]+$',
    expectedSitemap: 'sitemap_countries.xml',
    isIndexableDefault: true,
    priority: 'high',
    description: 'Priority 10: Country-level directories / Cruise lines (Matches /{directory}/{country})',
    exampleUrl: '/tours/france',
  },
  {
    id: 'pt-p11-directory-root',
    name: 'Directory (Directory Root)',
    pageGroup: 'Directory Roots',
    pageLevel: 'Directory Root',
    rulePriority: 11,
    pattern: '^\\/(tours|tour-guides|safaris|shore-excursions|travel-blog|things-to-do)$',
    expectedSitemap: 'sitemap_pages.xml',
    isIndexableDefault: true,
    priority: 'high',
    description: 'Priority 11: Top-level section roots (Matches an exact directory root)',
    exampleUrl: '/tours',
  },
];
