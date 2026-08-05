import { parsePrice } from '../../parsers/price.js';
import { parseWarranty, extractWarrantySnippet } from '../../parsers/warranty.js';

function decodeEntities(value) {
  return String(value || '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      try {
        return String.fromCodePoint(Number.parseInt(hex, 16));
      } catch {
        return _;
      }
    })
    .replace(/&#(\d+);/g, (_, code) => {
      try {
        return String.fromCodePoint(Number(code));
      } catch {
        return _;
      }
    });
}
function absoluteUrl(value, baseUrl) {
  if (!value) return null;
  try {
    return new URL(String(value), baseUrl).href;
  } catch {
    return null;
  }
}

/** Map one C2 shop commodity into the local product shape. */
export function mapC2Product(item, baseUrl) {
  if (!item || typeof item !== 'object') return null;
  const name = decodeEntities(item.name).trim();
  if (!name) return null;
  const price = parsePrice(item.price);
  const warranty = parseWarranty(extractWarrantySnippet(name));
  const stock = Number(item.stock);
  const inStock = Number.isFinite(stock)
    ? Number(item.status ?? 1) !== 0 && stock > 0
    : item.status == null
      ? null
      : Number(item.status) !== 0;

  return {
    external_id: item.id == null ? null : String(item.id),
    name,
    price,
    price_raw: price == null ? null : '¥' + price,
    image_url: absoluteUrl(item.cover, baseUrl),
    product_url: item.id == null ? null : absoluteUrl('/item/' + item.id, baseUrl),
    warranty_days: warranty.days,
    warranty_raw: warranty.raw,
    in_stock: inStock,
    raw_json: {
      stock: Number.isFinite(stock) ? stock : null,
      status: item.status ?? null,
      category: item.category || null,
      delivery_way: item.delivery_way ?? null,
      recommend: item.recommend ?? null,
    },
  };
}

/** Extract products through the C2 shop public API. */
export async function extractC2Shop(page, pageUrl) {
  const pageTitle = await page.title().catch(() => null);
  const currentUrl = page.url();
  const baseUrl = currentUrl || pageUrl;
  const sourceUrl = new URL(baseUrl);
  const apiUrl = new URL('/user/api/index/commodity', sourceUrl);
  const pathParts = sourceUrl.pathname.split('/');
  const categoryId =
    pathParts[1]?.toLowerCase() === 'cat' && pathParts[2] && Number.isInteger(Number(pathParts[2]))
      ? pathParts[2]
      : null;
  if (categoryId) apiUrl.searchParams.set('categoryId', categoryId);

  const response = await page.context().request.get(apiUrl.href, {
    headers: { accept: 'application/json' },
    timeout: 15000,
  });
  if (!response.ok()) throw new Error('C2 shop API returned HTTP ' + response.status());

  const payload = await response.json();
  if (payload?.code != null && Number(payload.code) !== 200) {
    throw new Error('C2 shop API error: ' + (payload.msg || payload.code));
  }
  const items = Array.isArray(payload?.data) ? payload.data : [];
  const products = items.map((item) => mapC2Product(item, baseUrl)).filter(Boolean);

  return {
    products: products.slice(0, 300),
    pageTitle,
    suggestedType: 'shop',
    adapter: 'c2-shop',
    currentUrl,
  };
}
