import { extractGeneric } from './generic.js';
import { extractPayLdxp } from './pay-ldxp.js';
import { extractDujiaoNext } from './dujiao-next.js';
import { extractPriceAi } from './priceai.js';
import { extractAibijia } from './aibijia.js';
import { extractC2Shop } from './c2-shop.js';

const DUJIAO_HOSTS = new Set(['shop.hailizi.de', 'icowpen.com', 'buy.aixou.top']);
const C2_SHOP_HOSTS = new Set(['xiangzili.xyz', 'chirou.ai', 'faka.oapi.vip']);

async function looksLikeDujiaoNext(domain, page) {
  const host = String(domain || '').toLowerCase().replace(/^www\./, '').split(':')[0];
  if (DUJIAO_HOSTS.has(host)) return true;
  return page
    .evaluate(() => {
      if ((document.documentElement?.innerHTML || '').includes('Dujiao-Next')) return true;
      return performance
        .getEntriesByType('resource')
        .some((entry) => /\/api\/v1\/public\/(?:config|categories|products)/.test(entry.name));
    })
    .catch(() => false);
}

/**
 * Route domain → adapter. Falls back to generic.
 * @param {string} domain
 * @param {import('playwright').Page} page
 * @param {string} url
 */
export async function runAdapter(domain, page, url) {
  const d = (domain || '').toLowerCase();
  const u = String(url || '').toLowerCase();
  const host = d.replace(/^www\./, '').split(':')[0];

  const isPayApiHost = ['ldxp.cn', 'jeejia.cn', 'catfk.com'].some(
    (suffix) => host === suffix || host.endsWith('.' + suffix)
  );
  if (isPayApiHost) {
    return extractPayLdxp(page, url);
  }

  if (host === 'priceai.cc') {
    try {
      const r = await extractPriceAi(page, url);
      if (r.products?.length) return r;
    } catch {
      /* generic fallback */
    }
  }

  if (host === 'aibijia.org') {
    try {
      const r = await extractAibijia(page, url);
      if (r.products?.length) return r;
    } catch {
      /* generic fallback */
    }
  }

  if (C2_SHOP_HOSTS.has(host)) {
    try {
      const r = await extractC2Shop(page, url);
      if (r.products?.length) return r;
    } catch {
      /* generic fallback */
    }
  }

  if (await looksLikeDujiaoNext(host, page)) {
    try {
      const r = await extractDujiaoNext(page, url);
      if (r.products?.length) return r;
    } catch {
      /* generic fallback */
    }
  }


  if (/faka|\/shop\//.test(u)) {
    try {
      const r = await extractPayLdxp(page, url);
      if (r.products?.length) return r;
    } catch {
      /* generic fallback for unknown shop systems */
    }
  }

  return extractGeneric(page, url);
}
