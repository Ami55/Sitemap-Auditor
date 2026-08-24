export interface NormalizationOptions {
  stripTrackingParams?: boolean;
  normalizeTrailingSlash?: boolean; // Default removes trailing slash except for root path
  forceHttps?: boolean;
  stripWww?: boolean;
  sortQueryParams?: boolean;
}

const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'gclid',
  'fbclid',
  'msclkid',
  'yclid',
  'mc_eid',
  '_ga',
  '_gl',
  '_hsenc',
  '_hsmi',
  'hsCtaTracking',
]);

/**
 * Robust URL Normalizer for Technical SEO
 */
export function normalizeUrl(rawUrl: string, options: NormalizationOptions = {}): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';

  const {
    stripTrackingParams = true,
    normalizeTrailingSlash = true,
    sortQueryParams = true,
  } = options;

  let urlStr = rawUrl.trim();

  // Ensure scheme
  if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
    if (urlStr.startsWith('//')) {
      urlStr = 'https:' + urlStr;
    } else {
      urlStr = 'https://' + urlStr;
    }
  }

  try {
    const parsed = new URL(urlStr);

    // Protocol lowercase
    let protocol = parsed.protocol.toLowerCase();
    // Default to https if requested
    if (options.forceHttps) {
      protocol = 'https:';
    }

    // Hostname lowercase
    let hostname = parsed.hostname.toLowerCase();
    if (options.stripWww && hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }

    // Port handling (remove standard ports 80/443)
    let port = parsed.port;
    if ((protocol === 'http:' && port === '80') || (protocol === 'https:' && port === '443')) {
      port = '';
    }

    // Pathname handling: deduplicate slashes
    let pathname = parsed.pathname.replace(/\/+/g, '/');

    // Decode safe URI characters
    try {
      pathname = decodeURI(pathname);
    } catch {
      // ignore malformed URI
    }

    // Re-encode safely
    pathname = encodeURI(pathname);

    // Trailing slash normalization: remove trailing slash unless it's just root "/"
    if (normalizeTrailingSlash && pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    } else if (pathname === '') {
      pathname = '/';
    }

    // Query parameters processing
    const searchParams = new URLSearchParams(parsed.search);
    if (stripTrackingParams) {
      const keysToDelete: string[] = [];
      searchParams.forEach((_, key) => {
        const lowerKey = key.toLowerCase();
        if (TRACKING_PARAMS.has(lowerKey) || lowerKey.startsWith('utm_')) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach((key) => searchParams.delete(key));
    }

    let searchString = '';
    if (searchParams.toString().length > 0) {
      if (sortQueryParams) {
        searchParams.sort();
      }
      searchString = '?' + searchParams.toString();
    }

    // Fragments are removed in SEO normalization
    const portString = port ? `:${port}` : '';
    return `${protocol}//${hostname}${portString}${pathname}${searchString}`;
  } catch (e) {
    // If parsing failed, return cleaned raw string
    return urlStr.split('#')[0].trim();
  }
}

/**
 * Checks if target URL belongs to the base host/domain
 */
export function isSameHost(targetUrl: string, baseHost: string, includeSubdomains: boolean = false): boolean {
  try {
    const targetParsed = new URL(normalizeUrl(targetUrl));
    const baseClean = baseHost.replace(/^https?:\/\//, '').split('/')[0].toLowerCase().replace(/^www\./, '');
    const targetClean = targetParsed.hostname.toLowerCase().replace(/^www\./, '');

    if (includeSubdomains) {
      return targetClean === baseClean || targetClean.endsWith('.' + baseClean);
    }
    return targetClean === baseClean;
  } catch {
    return false;
  }
}

/**
 * Get domain/host from URL
 */
export function getDomain(urlStr: string): string {
  try {
    const parsed = new URL(normalizeUrl(urlStr));
    return parsed.hostname.toLowerCase();
  } catch {
    return urlStr;
  }
}
