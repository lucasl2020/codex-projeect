import {
  getSetting,
  updateSite,
  replaceProducts,
  createCrawlRun,
  finishCrawlRun,
  getSite,
} from '../db/repositories.js';
import { runAdapter } from './adapters/index.js';
import { newContext } from './browser.js';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function isIncompleteApiResult(result) {
  if (result?.adapter !== 'pay-ldxp-api') return false;
  const sourceTotal = Number(result.sourceTotal);
  if (!Number.isFinite(sourceTotal) || sourceTotal <= 0) return false;
  const itemCount = Array.isArray(result.products) ? result.products.length : 0;
  return itemCount < Math.ceil(sourceTotal / 2);
}

export function shouldReplaceProducts(result, products) {
  return !isIncompleteApiResult({ ...result, products });
}

/**
 * Crawl a single site row using a shared browser pool.
 * @param {object} site
 * @param {{ trigger?: string }} [opts]
 */
export async function crawlSite(site, opts = {}) {
  const trigger = opts.trigger || 'manual';
  const run = createCrawlRun({ siteId: site.id, trigger, status: 'running' });
  const timeout = Number(getSetting('request_timeout_ms', '45000')) || 45000;
  const delay = Math.max(0, Number(getSetting('crawl_delay_ms', '800')) || 0);
  const autoDisable = Math.max(0, Number(getSetting('auto_disable_after_fails', '5')) || 0);

  let context;
  try {
    if (delay) await sleep(delay + Math.floor(Math.random() * 400));

    context = await newContext(timeout);
    const page = await context.newPage();

    let lastError = null;
    let result = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const attemptStartedAt = Date.now();
        await page.goto(site.url, { waitUntil: 'commit', timeout });
        await page.waitForTimeout(800 + Math.floor(Math.random() * 400));
        result = await runAdapter(site.domain, page, site.url);
        if (!(result.products || []).length && result.suggestedType === 'unknown') {
          const remaining = Math.max(0, 8000 - (Date.now() - attemptStartedAt));
          if (remaining) await page.waitForTimeout(remaining);
          try {
            result = await runAdapter(site.domain, page, site.url);
          } catch {
            // Keep the first valid empty result if the delayed retry itself fails.
          }
        }
        lastError = null;
        break;
      } catch (e) {
        lastError = e;
        if (attempt === 0) await page.waitForTimeout(600);
      }
    }

    if (lastError && !result) {
      const errMsg = String(lastError.message || lastError);
      finishCrawlRun(run.id, {
        status: 'failed',
        items_found: 0,
        error: errMsg,
      });
      const failCount = Number(site.fail_count || 0) + 1;
      const patch = {
        last_crawl_at: new Date().toISOString(),
        last_status: 'failed',
        last_error: errMsg.slice(0, 1000),
        fail_count: failCount,
      };
      if (autoDisable > 0 && failCount >= autoDisable) {
        patch.enabled = false;
        patch.last_error = `${patch.last_error} (auto-disabled after ${failCount} fails)`;
      }
      updateSite(site.id, patch);
      return { ok: false, siteId: site.id, error: errMsg, failCount };
    }

    const products = (result.products || []).filter((p) => p && p.name);
    const replaceSnapshot = shouldReplaceProducts(result, products);
    const patch = {
      last_crawl_at: new Date().toISOString(),
      last_error: null,
      fail_count: 0,
    };

    if (result.pageTitle && (!site.name || site.name === site.domain || site.name === site.url)) {
      patch.name = result.pageTitle.slice(0, 120);
    }

    if (site.type === 'unknown' && result.suggestedType && result.suggestedType !== 'unknown') {
      patch.type = result.suggestedType;
    }

    if (replaceSnapshot) {
      replaceProducts(site.id, products);
    }

    if (products.length > 0 && replaceSnapshot) {
      if (site.type === 'unknown' || site.type === 'nav') {
        patch.type = 'shop';
      }
      patch.last_status = 'ok';
      finishCrawlRun(run.id, { status: 'ok', items_found: products.length });
    } else if (!replaceSnapshot) {
      patch.last_status = 'partial';
      patch.last_error = `incomplete API result: ${products.length}/${result.sourceTotal}`;
      finishCrawlRun(run.id, {
        status: 'partial',
        items_found: products.length,
        error: patch.last_error,
      });
    } else {
      const status = site.type === 'nav' || result.suggestedType === 'nav' ? 'ok' : 'partial';
      if (result.suggestedType === 'nav' && site.type === 'unknown') {
        patch.type = 'nav';
      }
      patch.last_status = status;
      patch.last_error = status === 'partial' ? 'no products extracted' : null;
      finishCrawlRun(run.id, {
        status,
        items_found: 0,
        error: patch.last_error,
      });
    }

    updateSite(site.id, patch);
    return {
      ok: true,
      siteId: site.id,
      items: replaceSnapshot ? products.length : 0,
      type: getSite(site.id)?.type,
      adapter: result.adapter,
      currentUrl: result.currentUrl || site.url,
    };
  } catch (e) {
    const errMsg = String(e.message || e);
    finishCrawlRun(run.id, {
      status: 'failed',
      items_found: 0,
      error: errMsg,
    });
    const failCount = Number(site.fail_count || 0) + 1;
    const patch = {
      last_crawl_at: new Date().toISOString(),
      last_status: 'failed',
      last_error: errMsg.slice(0, 1000),
      fail_count: failCount,
    };
    if (autoDisable > 0 && failCount >= autoDisable) {
      patch.enabled = false;
      patch.last_error = `${patch.last_error} (auto-disabled after ${failCount} fails)`;
    }
    updateSite(site.id, patch);
    return { ok: false, siteId: site.id, error: errMsg, failCount };
  } finally {
    if (context) await context.close().catch(() => {});
  }
}
