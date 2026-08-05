import { parsePrice } from '../../parsers/price.js';
import { parseWarranty, extractWarrantySnippet } from '../../parsers/warranty.js';

/**
 * Extract products from a Playwright page using heuristics.
 * @param {import('playwright').Page} page
 * @param {string} pageUrl
 * @returns {Promise<{ products: object[], pageTitle: string|null, suggestedType: 'shop'|'nav'|'unknown', adapter: string, currentUrl: string }>}
 */
export async function extractGeneric(page, pageUrl) {
  const pageTitle = await page.title().catch(() => null);
  const currentUrl = page.url();

  const raw = await page.evaluate(() => {
    const abs = (u) => {
      if (!u) return null;
      try {
        return new URL(u, location.href).href;
      } catch {
        return null;
      }
    };

    const priceRe = /(?:价格|售价|price)\s*[:：]?\s*[￥¥$€£]?\s*\d+(?:,\d{3})*(?:\.\d+)?\s*(?:元|CNY|RMB|USD|USDT)?|[￥¥$€£]\s*\d+(?:,\d{3})*(?:\.\d+)?|\d+(?:,\d{3})*(?:\.\d+)?\s*(?:元|CNY|RMB|USD|USDT)/i;
    const warrantyRe = /质保|保修|售后|warranty|永久|终身/i;
    const candidates = [];
    const seen = new Set();

    const pushCard = (el, scoreBoost = 0) => {
      const text = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
      if (text.length < 4 || text.length > 800) return;
      if (!priceRe.test(text) && !warrantyRe.test(text)) return;

      const img =
        abs(el.querySelector('img')?.getAttribute('src')) ||
        abs(el.querySelector('img')?.getAttribute('data-src')) ||
        abs(el.querySelector('img')?.getAttribute('data-original'));

      let link = null;
      const a = el.closest('a') || el.querySelector('a[href]');
      if (a) link = abs(a.getAttribute('href'));

      // Prefer a short title-like line
      let name = '';
      const titleEl =
        el.querySelector('h1,h2,h3,h4,.title,.name,.goods-name,.product-name,strong,b') || null;
      if (titleEl) name = (titleEl.innerText || '').replace(/\s+/g, ' ').trim();
      if (!name) {
        const lines = text.split(/(?<=[。！？!?]|\s{2,})/).map((s) => s.trim()).filter(Boolean);
        name = (lines[0] || text).slice(0, 120);
      }
      name = name.replace(priceRe, '').replace(/\s+/g, ' ').trim().slice(0, 160);
      if (!name || name.length < 2) return;

      const priceMatch = text.match(priceRe);
      const priceRaw = priceMatch ? priceMatch[0] : null;
      const key = `${name}|${priceRaw || ''}|${link || ''}`;
      if (seen.has(key)) return;
      seen.add(key);

      let score = scoreBoost;
      if (priceRaw) score += 3;
      if (warrantyRe.test(text)) score += 2;
      if (img) score += 1;
      if (link) score += 1;
      if (/登录|注册|首页|导航|关于|联系|copyright|备案/i.test(name)) score -= 4;

      candidates.push({
        name,
        price_raw: priceRaw,
        image_url: img,
        product_url: link,
        text,
        score,
      });
    };

    const selectors = [
      '.goods-item',
      '.goods',
      '.product',
      '.product-item',
      '.card',
      '.shop-item',
      '.list-item',
      '.item',
      'li',
      'article',
      '.col',
      '[class*="goods"]',
      '[class*="product"]',
      '[class*="card"]',
    ];

    for (const sel of selectors) {
      for (const el of Array.from(document.querySelectorAll(sel)).slice(0, 400)) {
        pushCard(el, sel.includes('goods') || sel.includes('product') ? 2 : 0);
      }
    }

    // Fallback: any block with price-looking text
    if (candidates.length < 3) {
      for (const el of Array.from(document.querySelectorAll('div,section,li')).slice(0, 800)) {
        const t = (el.innerText || '').replace(/\s+/g, ' ').trim();
        if (t.length > 20 && t.length < 400 && priceRe.test(t)) pushCard(el, 0);
      }
    }

    // Nav heuristic signals
    const anchors = Array.from(document.querySelectorAll('a[href]')).slice(0, 500);
    const externalish = anchors.filter((a) => {
      try {
        const u = new URL(a.href, location.href);
        return u.hostname && u.hostname !== location.hostname;
      } catch {
        return false;
      }
    }).length;
    const bodyText = (document.body?.innerText || '').slice(0, 5000);
    const priceHits = (bodyText.match(priceRe) || []).length;

    return {
      candidates,
      stats: {
        externalish,
        anchorCount: anchors.length,
        priceHits,
      },
    };
  });

  const products = [];
  for (const c of raw.candidates || []) {
    if ((c.score || 0) < 3) continue;
    if (!c.price_raw && !c.product_url) continue;
    if (
      !c.product_url &&
      /\u5e97\u94fa\u516c\u544a|\u52a0\u8f7d\u66f4\u591a|\u4fdd\u8bc1\u91d1|\u7fa4\u804a|\u9891\u9053[:\uff1a]/i.test(c.name || '')
    ) {
      continue;
    }
    const price = parsePrice(c.price_raw);
    const warrantySnippet = extractWarrantySnippet(c.text) || ( /永久|终身|质保|保修/.test(c.text) ? c.text.slice(0, 40) : null );
    const w = parseWarranty(warrantySnippet);
    products.push({
      name: c.name,
      price,
      price_raw: c.price_raw,
      image_url: c.image_url,
      product_url: c.product_url,
      warranty_days: w.days,
      warranty_raw: w.raw,
      raw_json: { score: c.score },
    });
  }

  // de-dupe by name+price
  const uniq = [];
  const keys = new Set();
  for (const p of products) {
    const k = `${p.name}|${p.price_raw || p.price || ''}`;
    if (keys.has(k)) continue;
    keys.add(k);
    uniq.push(p);
  }

  let suggestedType = 'unknown';
  const stats = raw.stats || {};
  if (uniq.length >= 2) suggestedType = 'shop';
  else if (
    (stats.externalish || 0) >= 12 &&
    (stats.priceHits || 0) < 2 &&
    uniq.length === 0
  ) {
    suggestedType = 'nav';
  } else if (uniq.length === 1) {
    suggestedType = 'shop';
  }

  // Confidence gate: drop weak single low-score leftovers already filtered
  return {
    products: uniq.slice(0, 200),
    pageTitle,
    suggestedType,
    adapter: 'generic',
    currentUrl,
  };
}
