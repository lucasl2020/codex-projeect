/**
 * Parse a price string into a number (CNY yuan).
 * @param {string|null|undefined} raw
 * @returns {number|null}
 */
export function parsePrice(raw) {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (!s) return null;

  s = s
    .replace(/[￥¥$€£]/g, '')
    .replace(/元|RMB|CNY|usd|USD/gi, '')
    .replace(/,/g, '')
    .replace(/\s+/g, '')
    .trim();

  const m = s.match(/-?\d+(?:\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0]);
  if (!Number.isFinite(n) || n < 0) return null;
  // Guard against clearly non-price huge numbers from version strings etc.
  if (n > 1_000_000) return null;
  return Math.round(n * 100) / 100;
}
