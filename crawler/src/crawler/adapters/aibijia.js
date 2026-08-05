import { parsePrice } from '../../parsers/price.js';
import { parseWarranty, extractWarrantySnippet } from '../../parsers/warranty.js';

function absoluteUrl(value, baseUrl) {
  if (!value) return null;
  try {
    return new URL(String(value), baseUrl).href;
  } catch {
    return null;
  }
}

/** Map one Aibijia offer into the local product shape. */
export function mapAibijiaOffer(group, offer, baseUrl) {
  if (!offer || typeof offer !== 'object') return null;
  const name = String(offer.source_title || '').trim();
  if (!name) return null;
  const price = parsePrice(offer.price);
  const currency = String(offer.currency || 'CNY').trim();
  const warrantySnippet = extractWarrantySnippet(
    [name, ...(Array.isArray(offer.display_tags) ? offer.display_tags : [])].join(' ')
  );
  const warranty = parseWarranty(warrantySnippet);
  const status = String(offer.status || '').toLowerCase();
  const externalId = [
    group?.slug || group?.name || 'offer',
    offer.url || '',
    name,
    offer.platform_name || '',
    offer.source_store_name || '',
  ]
    .join('|')
    .slice(0, 500);

  return {
    external_id: externalId,
    name,
    price,
    price_raw: price == null ? null : String(offer.price) + ' ' + currency,
    image_url: null,
    product_url: absoluteUrl(offer.url, baseUrl),
    warranty_days: warranty.days,
    warranty_raw: warranty.raw,
    in_stock: status ? status !== 'out_of_stock' : null,
    raw_json: {
      group: group?.name || null,
      group_slug: group?.slug || null,
      platform: offer.platform_name || null,
      store: offer.source_store_name || null,
      status: offer.status || null,
      tags: Array.isArray(offer.display_tags) ? offer.display_tags : [],
    },
  };
}

/** Extract Aibijia's normalized offer feed. */
export async function extractAibijia(page, pageUrl) {
  const pageTitle = await page.title().catch(() => null);
  const currentUrl = page.url();
  const response = await page.context().request.get('https://data.aibijia.org/products.json', {
    headers: { accept: 'application/json' },
    timeout: 15000,
  });
  if (!response.ok()) throw new Error('Aibijia API returned HTTP ' + response.status());

  const payload = await response.json();
  const groups = Array.isArray(payload?.products) ? payload.products : [];
  const products = [];
  for (const group of groups) {
    const offers = Array.isArray(group?.offers) ? group.offers : [];
    for (let index = 0; index < offers.length && products.length < 300; index++) {
      const product = mapAibijiaOffer(group, offers[index], currentUrl || pageUrl);
      if (product) products.push(product);
    }
    if (products.length >= 300) break;
  }

  return {
    products,
    pageTitle: pageTitle || payload?.site?.name || null,
    suggestedType: 'shop',
    adapter: 'aibijia',
    currentUrl,
  };
}
