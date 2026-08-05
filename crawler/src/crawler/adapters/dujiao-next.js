import { parsePrice } from '../../parsers/price.js';
import { parseWarranty, extractWarrantySnippet } from '../../parsers/warranty.js';

function localizedText(value) {
  if (typeof value === 'string') return value.trim();
  if (!value || typeof value !== 'object') return '';
  for (const key of ['zh-CN', 'zh_CN', 'zh', 'en-US', 'en']) {
    if (typeof value[key] === 'string' && value[key].trim()) return value[key].trim();
  }
  return Object.values(value).find((v) => typeof v === 'string' && v.trim())?.trim() || '';
}

function stripHtml(value) {
  return String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function absoluteUrl(value, baseUrl) {
  if (!value) return null;
  try {
    return new URL(String(value), baseUrl).href;
  } catch {
    return null;
  }
}

/** Map one Dujiao-Next API product into the local product shape. */
export function mapDujiaoProduct(item, baseUrl) {
  if (!item || typeof item !== 'object') return null;
  const name = localizedText(item.title);
  if (!name) return null;

  const description = localizedText(item.description);
  const content = stripHtml(localizedText(item.content));
  const warrantyText = [name, description, content].filter(Boolean).join(' ');
  const warrantySnippet = extractWarrantySnippet(warrantyText);
  const warranty = parseWarranty(warrantySnippet);
  const image = Array.isArray(item.images) ? item.images[0] : item.image;
  const imagePath =
    (typeof image === 'string' ? image : image?.url || image?.path) || item.category?.icon;
  const priceRaw = item.price_amount == null ? null : `${item.price_amount} CNY`;
  const slug = item.slug == null ? null : String(item.slug);

  return {
    external_id: item.id == null ? null : String(item.id),
    name,
    price: parsePrice(item.price_amount),
    price_raw: priceRaw,
    image_url: absoluteUrl(imagePath, baseUrl),
    product_url: slug ? absoluteUrl(`/products/${encodeURIComponent(slug)}`, baseUrl) : null,
    warranty_days: warranty.days,
    warranty_raw: warranty.raw,
    in_stock: !item.is_sold_out && item.stock_status !== 'out_of_stock',
    raw_json: {
      slug,
      stock_status: item.stock_status || null,
      category: item.category || null,
      sku_count: Array.isArray(item.skus) ? item.skus.length : 0,
    },
  };
}

/** Extract products through Dujiao-Next's public JSON API. */
export async function extractDujiaoNext(page, pageUrl) {
  const pageTitle = await page.title().catch(() => null);
  const currentUrl = page.url();
  const baseUrl = currentUrl || pageUrl;
  const products = [];
  const seen = new Set();

  for (let pageNumber = 1; pageNumber <= 3 && products.length < 300; pageNumber++) {
    const apiUrl = new URL('/api/v1/public/products', baseUrl);
    apiUrl.searchParams.set('page', String(pageNumber));
    apiUrl.searchParams.set('page_size', '100');

    const response = await page.context().request.get(apiUrl.href, {
      headers: { accept: 'application/json' },
      timeout: 15000,
    });
    if (!response.ok()) {
      throw new Error(`Dujiao-Next API returned HTTP ${response.status()}`);
    }

    const payload = await response.json();
    if (payload?.status_code != null && Number(payload.status_code) !== 0) {
      throw new Error(`Dujiao-Next API error: ${payload.msg || payload.status_code}`);
    }

    const items = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.data?.items)
        ? payload.data.items
        : [];
    for (const item of items) {
      const product = mapDujiaoProduct(item, baseUrl);
      if (!product) continue;
      const key = product.external_id || `${product.name}|${product.price_raw || ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      products.push(product);
      if (products.length >= 300) break;
    }

    const totalPages = Number(payload?.pagination?.total_page) || 1;
    if (pageNumber >= totalPages || items.length === 0) break;
  }

  return {
    products,
    pageTitle,
    suggestedType: 'shop',
    adapter: 'dujiao-next',
    currentUrl,
  };
}
