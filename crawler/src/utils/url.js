import { createHash } from 'node:crypto';

/**
 * Normalize shop/nav URL: trim, force https when possible, drop tracking params, strip hash.
 * @param {string} raw
 * @returns {string}
 */
export function normalizeUrl(raw) {
  const cleaned = String(raw || '').trim();
  if (!cleaned) throw new Error('url required');

  // Reject bare words without a domain-looking host
  let href = cleaned;
  if (!/^https?:\/\//i.test(href)) {
    // require at least one dot in host-ish form, or localhost
    const hostPart = href.split(/[/?#]/)[0];
    if (!hostPart.includes('.') && hostPart.toLowerCase() !== 'localhost') {
      throw new Error(`invalid url: ${cleaned}`);
    }
    href = `https://${href}`;
  }

  let u;
  try {
    u = new URL(href);
  } catch {
    throw new Error(`invalid url: ${cleaned}`);
  }

  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error(`invalid protocol: ${u.protocol}`);
  }

  if (!u.hostname || (!u.hostname.includes('.') && u.hostname !== 'localhost')) {
    throw new Error(`invalid host: ${u.hostname}`);
  }

  const drop = [
    '_refluxos',
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'fbclid',
    'gclid',
    'ref',
    'from',
  ];
  for (const k of drop) u.searchParams.delete(k);

  u.hash = '';
  u.hostname = u.hostname.toLowerCase().replace(/^www\./, '');

  if (u.pathname.length > 1 && u.pathname.endsWith('/')) {
    u.pathname = u.pathname.replace(/\/+$/, '');
  }

  return u.toString();
}

export function domainFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

export function stableHash(input) {
  return createHash('sha1').update(String(input)).digest('hex').slice(0, 16);
}
