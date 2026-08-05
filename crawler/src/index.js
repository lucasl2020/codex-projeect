import { createApp } from './server.js';
import { getDb, closeDb } from './db/client.js';
import { getSetting } from './db/repositories.js';
import { startCrawlJob, getCrawlStatus, shutdownCrawler } from './crawler/queue.js';
import { setSettingsChangeHandler } from './routes/settings.js';
import { listenWithFallback } from './utils/port.js';

getDb();

const preferredPort = Number(process.env.PORT || getSetting('port', '3780')) || 3780;
const maxTries = Math.max(1, Number(process.env.PORT_MAX_TRIES || 50) || 50);
const app = createApp();

/** @type {import('node:http').Server | null} */
let server = null;
/** @type {number} */
let boundPort = preferredPort;
/** @type {NodeJS.Timeout | null} */
let scheduleTimer = null;

try {
  const listened = await listenWithFallback(app, preferredPort, maxTries);
  server = listened.server;
  boundPort = listened.port;
} catch (e) {
  console.error(e.message || e);
  closeDb();
  process.exit(1);
}

console.log(`Card Shop Manager http://127.0.0.1:${boundPort}`);
if (boundPort !== preferredPort) {
  console.log(`[port] ${preferredPort} 被占用，已自动切换到 ${boundPort}`);
}
if (process.env.CARD_SHOP_OPEN === '1') {
  console.log(`[open] http://127.0.0.1:${boundPort}`);
}

function maybeStartupCrawl() {
  const on = String(getSetting('crawl_on_startup', 'true')) !== 'false';
  if (!on) {
    console.log('[crawl] startup crawl disabled');
    return;
  }
  setTimeout(() => {
    startCrawlJob({ trigger: 'startup' })
      .then(() => console.log('[crawl] startup job queued'))
      .catch((e) => {
        if (e.code === 'CRAWL_BUSY') console.log('[crawl] already running');
        else console.error('[crawl] startup failed', e.message);
      });
  }, 800);
}

function setupSchedule() {
  if (scheduleTimer) {
    clearInterval(scheduleTimer);
    scheduleTimer = null;
  }
  const enabled = String(getSetting('schedule_enabled', 'true')) !== 'false';
  const hours = Math.max(1, Number(getSetting('schedule_interval_hours', '6')) || 6);
  if (!enabled) {
    console.log('[crawl] schedule disabled');
    return;
  }
  const ms = hours * 60 * 60 * 1000;
  console.log(`[crawl] schedule every ${hours}h`);
  scheduleTimer = setInterval(() => {
    if (getCrawlStatus().running) {
      console.log('[crawl] skip schedule — busy');
      return;
    }
    startCrawlJob({ trigger: 'schedule' })
      .then(() => console.log('[crawl] schedule job queued'))
      .catch((e) => console.error('[crawl] schedule error', e.message));
  }, ms);
  if (typeof scheduleTimer.unref === 'function') scheduleTimer.unref();
}

setSettingsChangeHandler(() => {
  console.log('[settings] reloading schedule');
  setupSchedule();
});

maybeStartupCrawl();
setupSchedule();

async function shutdown() {
  console.log('shutting down...');
  if (scheduleTimer) clearInterval(scheduleTimer);
  await shutdownCrawler().catch(() => {});
  closeDb();
  if (server) {
    server.close(() => process.exit(0));
  } else {
    process.exit(0);
  }
  setTimeout(() => process.exit(0), 3000).unref?.();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
