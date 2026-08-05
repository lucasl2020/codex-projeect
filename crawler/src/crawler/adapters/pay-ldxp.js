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

function stripHtml(value) {
  return decodeEntities(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
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

function firstHtmlImage(value, baseUrl) {
  const html = decodeEntities(value);
  const match = html.match(/<img\b[^>]*?\b(?:src|data-src|data-original)\s*=\s*["']([^"']+)["']/i);
  return absoluteUrl(match?.[1], baseUrl);
}

function httpUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return /^https?:$/.test(url.protocol) ? url : null;
  } catch {
    return null;
  }
}

/** Map one LDXP API product into the local product shape. */
export function mapPayLdxpProduct(item, baseUrl) {
  if (!item || typeof item !== 'object') return null;
  const name = stripHtml(item.name || item.title);
  if (!name) return null;

  const description = stripHtml(item.description);
  const warrantyText = [name, description].filter(Boolean).join(' ');
  const warranty = parseWarranty(extractWarrantySnippet(warrantyText));
  const priceValue = item.price ?? item.user_price ?? item.sale_price;
  const price = parsePrice(priceValue);
  const extend = item.extend && typeof item.extend === 'object' ? item.extend : {};
  const stockValue = item.stock ?? item.stock_count ?? extend.stock_count;
  const stock = Number(stockValue);
  let inStock = null;
  if (Number.isFinite(stock)) {
    inStock = stock > 0;
    // A hidden stock count should not be treated as sold out.
    if (stock <= 0 && Number(extend.show_stock_type) === 1) inStock = null;
  }
  if (item.status != null && Number(item.status) === 0) inStock = false;

  const externalId = item.goods_key ?? item.id ?? null;
  const productUrl = item.link || (externalId ? '/item/' + externalId : null);
  const imageUrl =
    absoluteUrl(item.image || item.cover || item.img, baseUrl) ||
    firstHtmlImage(item.description, baseUrl);
  return {
    external_id: externalId == null ? null : String(externalId),
    name,
    price,
    price_raw: priceValue == null ? null : String(priceValue) + ' CNY',
    image_url: imageUrl,
    product_url: absoluteUrl(productUrl, baseUrl),
    warranty_days: warranty.days,
    warranty_raw: warranty.raw,
    in_stock: inStock,
    raw_json: {
      goods_type: item.goods_type || null,
      category: item.category || null,
      stock_count: Number.isFinite(stock) ? stock : null,
      show_stock_type: extend.show_stock_type ?? null,
      market_price: item.market_price ?? null,
    },
  };
}

function apiSucceeded(payload) {
  if (!payload || typeof payload !== 'object') return false;
  if (payload.code == null) return true;
  return Number(payload.code) === 1 || Number(payload.code) === 200;
}

async function postApi(_page, url, data, referer) {
  let lastError = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await globalThis.fetch(url, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          referer,
        },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(15000),
      });
      const body = await response.text();
      if (!response.ok) throw new Error('pay shop API returned HTTP ' + response.status);

      let payload;
      try {
        payload = JSON.parse(body);
      } catch {
        const contentType = response.headers.get('content-type') || 'unknown content type';
        throw new Error(
          `pay shop API returned non-JSON response (HTTP ${response.status}, ${contentType})`
        );
      }
      if (!apiSucceeded(payload)) {
        throw new Error('pay shop API error: ' + (payload.msg || payload.code || 'unknown'));
      }
      return payload;
    } catch (error) {
      lastError = error;
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  throw lastError;
}

function listFromGoodsPayload(payload) {
  const data = payload?.data;
  if (Array.isArray(data)) return { total: data.length, list: data };
  if (!data || typeof data !== 'object') return { total: 0, list: [] };
  return {
    total: Number(data.total) || 0,
    list: Array.isArray(data.list) ? data.list : [],
  };
}

/** Fetch all products for one platform goods type. */
async function fetchGoods(page, apiBase, referer, token, goodsType, categoryId = '') {
  const pageSize = 300;
  const result = [];
  let current = 1;
  let total = 0;

  do {
    const payload = await postApi(
      page,
      apiBase + '/Shop/goodsList',
      {
        token,
        keywords: '',
        category_id: categoryId,
        goods_type: goodsType,
        current,
        pageSize,
      },
      referer
    );
    const part = listFromGoodsPayload(payload);
    total = Math.max(total, part.total);
    result.push(...part.list);
    if (!part.list.length || result.length >= Math.max(total, 1) || current >= 10) break;
    current += 1;
  } while (result.length < 1000);

  return result;
}

/** Extract all categories and product types through the public API. */
async function extractPayLdxpApi(page, pageUrl) {
  const current = httpUrl(page.url());
  const source = current || httpUrl(pageUrl);
  if (!source || !/^\/shop\//i.test(source.pathname)) return null;

  const token = decodeURIComponent(source.pathname.split('/').filter(Boolean).at(-1) || '');
  if (!token) return null;
  const apiBase = source.origin + '/shopApi';
  const infoPayload = await postApi(
    page,
    apiBase + '/Shop/info',
    { token, category_key: '' },
    source.href
  );
  const info = infoPayload?.data;
  if (!info || typeof info !== 'object') return null;

  const counts = {
    card: Number(info.card_count) || 0,
    resource: Number(info.resource_count) || 0,
    equity: Number(info.equity_count) || 0,
    article: Number(info.article_count) || 0,
  };
  const configured = Array.isArray(info.goods_type_sort) ? info.goods_type_sort : [];
  const types = [...new Set([...configured, ...Object.keys(counts)])].filter((type) => counts[type] > 0 || configured.includes(type));
  const items = [];

  for (const goodsType of types) {
    let list = await fetchGoods(page, apiBase, source.href, token, goodsType);

    // Some older themes require querying each category explicitly.
    if (!list.length && counts[goodsType] > 0) {
      const categoryPayload = await postApi(
        page,
        apiBase + '/Shop/categoryList',
        { token, goods_type: goodsType, category_key: '' },
        source.href
      );
      const categories = Array.isArray(categoryPayload?.data) ? categoryPayload.data : [];
      for (const category of categories) {
        if (category?.id == null) continue;
        list.push(...(await fetchGoods(page, apiBase, source.href, token, goodsType, category.id)));
      }
    }
    items.push(...list);
  }

  const products = [];
  const seen = new Set();
  for (const item of items) {
    const product = mapPayLdxpProduct(item, source.href);
    if (!product) continue;
    const key = product.external_id || product.product_url || product.name;
    if (seen.has(key)) continue;
    seen.add(key);
    products.push(product);
  }

  return {
    products,
    pageTitle: await page.title().catch(() => null),
    suggestedType: 'shop',
    adapter: 'pay-ldxp-api',
    currentUrl: source.href,
    sourceTotal: Object.values(counts).reduce((sum, count) => sum + count, 0),
  };
}

/**
 * Specialized extractor for pay.ldxp.cn/catfk.com style faka shops.
 * Public API is preferred; the DOM extractor remains as a fallback for older themes.
 * @param {import('playwright').Page} page
 * @param {string} pageUrl
 */
export async function extractPayLdxp(page, pageUrl) {
  const source = httpUrl(page.url()) || httpUrl(pageUrl);
  const strictApiHost =
    source && /(^|\.)(?:ldxp\.cn|jeejia\.cn|catfk\.com)$/i.test(source.hostname);

  try {
    const apiResult = await extractPayLdxpApi(page, pageUrl);
    if (apiResult) return apiResult;
  } catch (error) {
    // Known public-API shops must not fall back to DOM: doing so can overwrite
    // hundreds of complete products with one announcement or category block.
    if (strictApiHost) throw error;
  }

  const pageTitle = await page.title().catch(() => null);
  const currentUrl = page.url();

  await page.waitForTimeout(500);

  const raw = await page.evaluate(() => {
    const abs = (u) => {
      if (!u) return null;
      try {
        return new URL(u, location.href).href;
      } catch {
        return null;
      }
    };

    const items = [];
    const seen = new Set();
    const cardSels = [
      '.goods-item',
      '.good-item',
      '.goods',
      '.product-item',
      '.list-item',
      '.shop-item',
      '[class*="goods"]',
      '.el-card',
      '.van-card',
    ];
    const priceRe = /(?:\u4ef7\u683c|\u552e\u4ef7|price)\s*[:\uff1a]?\s*[\uffe5\u00a5\$]?\s*\d+(?:,\d{3})*(?:\.\d+)?\s*(?:\u5143|CNY|RMB|USD|USDT)?|[\uffe5\u00a5\$]\s*\d+(?:,\d{3})*(?:\.\d+)?|\d+(?:,\d{3})*(?:\.\d+)?\s*(?:\u5143|CNY|RMB|USD|USDT)/i;

    for (const sel of cardSels) {
      for (const el of Array.from(document.querySelectorAll(sel)).slice(0, 300)) {
        const text = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
        if (text.length < 4 || text.length > 1000) continue;
        if (!priceRe.test(text) && !/\u8d28\u4fdd|\u4fdd\u4fee|\u552e\u540e/.test(text)) continue;

        const titleEl = el.querySelector(
          '.title,.name,.goods-name,.good-name,.product-name,h1,h2,h3,h4,strong'
        );
        let name = (titleEl?.innerText || '').replace(/\s+/g, ' ').trim();
        if (!name) name = text.split(/\s{2,}|\n/)[0]?.slice(0, 120) || text.slice(0, 80);
        name = name.replace(priceRe, '').trim();
        if (!name) continue;

        const priceMatch = text.match(priceRe);
        const priceRaw = priceMatch ? priceMatch[0] : null;
        const img =
          abs(el.querySelector('img')?.getAttribute('src')) ||
          abs(el.querySelector('img')?.getAttribute('data-src'));
        const a = el.closest('a') || el.querySelector('a[href]');
        const product_url = a ? abs(a.getAttribute('href')) : null;
        const id =
          el.getAttribute('data-id') ||
          el.getAttribute('data-good-id') ||
          el.getAttribute('data-goods-id') ||
          null;

        const key = id + '|' + name + '|' + (priceRaw || '');
        if (seen.has(key)) continue;
        seen.add(key);
        items.push({ external_id: id, name, price_raw: priceRaw, image_url: img, product_url, text });
      }
    }

    const scripts = Array.from(document.querySelectorAll('script'))
      .map((s) => s.textContent || '')
      .filter((t) => t.length > 50 && t.length < 500000);
    for (const sc of scripts.slice(0, 30)) {
      const m = sc.match(/"goods(?:List)?"\s*:\s*(\[[\s\S]{0,200000}?\])/);
      if (!m) continue;
      try {
        const arr = JSON.parse(m[1]);
        if (Array.isArray(arr)) {
          for (const g of arr.slice(0, 200)) {
            const name = g.name || g.title || g.goods_name || g.good_name;
            if (!name) continue;
            const priceRaw =
              g.price != null ? String(g.price) : g.money != null ? String(g.money) : g.sale_price != null ? String(g.sale_price) : null;
            items.push({
              external_id: g.id != null ? String(g.id) : null,
              name: String(name),
              price_raw: priceRaw,
              image_url: g.image || g.img || g.cover || g.pic || null,
              product_url: g.url || g.link || null,
              text: JSON.stringify(g).slice(0, 500),
            });
          }
        }
      } catch {
        /* ignore */
      }
    }

    return { items, bodySample: (document.body?.innerText || '').slice(0, 2000) };
  });

  const products = [];
  const seen = new Set();
  for (const it of raw.items || []) {
    const price = parsePrice(it.price_raw);
    const wsnip = extractWarrantySnippet(it.text) || extractWarrantySnippet(raw.bodySample || '');
    const w = parseWarranty(wsnip);
    const name = String(it.name || '').trim();
    if (!name) continue;
    if (!it.price_raw && !it.image_url && !it.product_url && !it.external_id) continue;
    if (!it.product_url && !it.external_id && /\u5e97\u94fa\u516c\u544a|\u52a0\u8f7d\u66f4\u591a|\u4fdd\u8bc1\u91d1|\u7fa4\u804a|\u9891\u9053[:\uff1a]/i.test(name)) {
      continue;
    }
    const key = (it.external_id || '') + '|' + name + '|' + (it.price_raw || price || '');
    if (seen.has(key)) continue;
    seen.add(key);
    products.push({
      external_id: it.external_id || null,
      name,
      price,
      price_raw: it.price_raw,
      image_url: it.image_url,
      product_url: it.product_url,
      warranty_days: w.days,
      warranty_raw: w.raw,
    });
  }

  return {
    products: products.slice(0, 300),
    pageTitle,
    suggestedType: products.length ? 'shop' : 'unknown',
    adapter: 'pay-ldxp',
    currentUrl,
  };
}
