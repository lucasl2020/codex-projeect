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

/** Map one PriceAI explorer product into the local product shape. */
export function mapPriceAiProduct(item, baseUrl) {
  if (!item || typeof item !== 'object') return null;
  const name = String(item.displayName || item.name || '').trim();
  if (!name) return null;

  const price = parsePrice(item.lowestPrice);
  const offer = item.lowestOffer || {};
  const warrantySnippet = extractWarrantySnippet(
    [name, offer.sourceName, offer.sourceTitle].filter(Boolean).join(' ')
  );
  const warranty = parseWarranty(warrantySnippet);
  const fallbackUrl = item.slug ? `/products/${encodeURIComponent(String(item.slug))}` : null;

  return {
    external_id: item.id == null ? null : String(item.id),
    name,
    price,
    price_raw: price == null ? null : `¥${price}`,
    image_url: absoluteUrl(item.image || item.imageUrl, baseUrl),
    product_url: absoluteUrl(offer.url, baseUrl) || absoluteUrl(fallbackUrl, baseUrl),
    warranty_days: warranty.days,
    warranty_raw: warranty.raw,
    in_stock: item.inStockCount == null ? null : Number(item.inStockCount) > 0,
    raw_json: {
      platform: item.platform || null,
      product_type: item.productType || null,
      source_name: offer.sourceName || null,
      source_title: offer.sourceTitle || null,
      offer_status: offer.status || null,
      in_stock_count: item.inStockCount ?? null,
      out_of_stock_count: item.outOfStockCount ?? null,
      warranty_lowest_price: item.warrantyLowestPrice ?? null,
    },
  };
}

/** Extract PriceAI's normalized products through its explorer API. */
export async function extractPriceAi(page, pageUrl) {
  const pageTitle = await page.title().catch(() => null);
  const currentUrl = page.url();
  const baseUrl = currentUrl || pageUrl;
  const apiUrl = new URL('/api/explorer', baseUrl);
  const response = await page.context().request.get(apiUrl.href, {
    headers: { accept: 'application/json' },
    timeout: 15000,
  });
  if (!response.ok()) throw new Error(`PriceAI API returned HTTP ${response.status()}`);

  const payload = await response.json();
  const items = Array.isArray(payload?.products)
    ? payload.products
    : Array.isArray(payload?.data?.products)
      ? payload.data.products
      : [];
  const products = items.map((item) => mapPriceAiProduct(item, baseUrl)).filter(Boolean);

  return {
    products: products.slice(0, 300),
    pageTitle,
    suggestedType: 'shop',
    adapter: 'priceai',
    currentUrl,
  };
}
