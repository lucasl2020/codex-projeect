import { listSites, getSite, getSetting } from '../db/repositories.js';
import { crawlSite } from './worker.js';
import { closeBrowser } from './browser.js';

/** @type {null | { trigger: string, startedAt: string, total: number, done: number, currentUrl: string|null, results: object[] }} */
let activeJob = null;

export function getCrawlStatus() {
  return {
    running: Boolean(activeJob),
    job: activeJob
      ? {
          trigger: activeJob.trigger,
          startedAt: activeJob.startedAt,
          total: activeJob.total,
          done: activeJob.done,
          currentUrl: activeJob.currentUrl,
          results: activeJob.results.slice(-40),
        }
      : null,
  };
}

/**
 * @param {{ siteId?: number, trigger?: string }} opts
 */
export async function startCrawlJob(opts = {}) {
  if (activeJob) {
    const err = new Error('crawl already running');
    err.code = 'CRAWL_BUSY';
    throw err;
  }

  const trigger = opts.trigger || 'manual';
  let sites;
  if (opts.siteId) {
    const s = getSite(opts.siteId);
    if (!s) {
      const err = new Error('site not found');
      err.code = 'NOT_FOUND';
      throw err;
    }
    sites = [s];
  } else {
    sites = listSites({ enabled: true });
  }

  activeJob = {
    trigger,
    startedAt: new Date().toISOString(),
    total: sites.length,
    done: 0,
    currentUrl: null,
    results: [],
  };

  const concurrency = Math.max(
    1,
    Math.min(5, Number(getSetting('crawl_concurrency', '2')) || 2)
  );

  void runPool(sites, concurrency, trigger)
    .catch((e) => console.error('[crawl] pool error', e))
    .finally(async () => {
      activeJob = null;
      // keep browser warm for schedule; only close if idle long — keep open for reuse
    });

  return getCrawlStatus();
}

/**
 * @param {object[]} sites
 * @param {number} concurrency
 * @param {string} trigger
 */
async function runPool(sites, concurrency, trigger) {
  let idx = 0;
  async function worker() {
    while (idx < sites.length) {
      const i = idx++;
      const site = sites[i];
      if (activeJob) activeJob.currentUrl = site.url;
      try {
        const r = await crawlSite(site, { trigger });
        if (activeJob) {
          activeJob.results.push(r);
          activeJob.done += 1;
        }
      } catch (e) {
        if (activeJob) {
          activeJob.results.push({
            ok: false,
            siteId: site.id,
            error: String(e.message || e),
          });
          activeJob.done += 1;
        }
      }
    }
  }
  const n = Math.min(concurrency, Math.max(1, sites.length));
  await Promise.all(Array.from({ length: n }, () => worker()));
  if (activeJob) activeJob.currentUrl = null;
}

/** Awaitable full crawl for tests/scripts */
export async function crawlAndWait(opts = {}) {
  if (activeJob) {
    const err = new Error('crawl already running');
    err.code = 'CRAWL_BUSY';
    throw err;
  }
  const trigger = opts.trigger || 'manual';
  let sites;
  if (opts.siteId) {
    const s = getSite(opts.siteId);
    if (!s) throw Object.assign(new Error('site not found'), { code: 'NOT_FOUND' });
    sites = [s];
  } else {
    sites = listSites({ enabled: true });
  }
  activeJob = {
    trigger,
    startedAt: new Date().toISOString(),
    total: sites.length,
    done: 0,
    currentUrl: null,
    results: [],
  };
  try {
    const concurrency = Math.max(
      1,
      Math.min(5, Number(getSetting('crawl_concurrency', '2')) || 2)
    );
    await runPool(sites, concurrency, trigger);
    return { running: false, results: activeJob?.results || [] };
  } finally {
    const results = activeJob?.results || [];
    activeJob = null;
    await closeBrowser().catch(() => {});
    return { running: false, results };
  }
}

export async function shutdownCrawler() {
  activeJob = null;
  await closeBrowser();
}
