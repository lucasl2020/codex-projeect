import { stableHash } from '../utils/url.js';

/**
 * @param {{ external_id?: string|null, product_url?: string|null, name?: string, price_raw?: string|null, price?: number|null }} p
 */
export function productDedupKey(p) {
  if (p.external_id) return `id:${p.external_id}`;
  if (p.product_url) return `url:${p.product_url}`;
  const name = String(p.name || '').trim().toLowerCase();
  const pricePart = p.price_raw != null ? String(p.price_raw) : String(p.price ?? '');
  return `h:${stableHash(`${name}|${pricePart}`)}`;
}
