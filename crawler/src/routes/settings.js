import { Router } from 'express';
import { getSettings, setSettings } from '../db/repositories.js';

const router = Router();

/** @type {null | (() => void)} */
let onSettingsChanged = null;

export function setSettingsChangeHandler(fn) {
  onSettingsChanged = fn;
}

router.get('/settings', (_req, res) => {
  res.json(getSettings());
});

router.put('/settings', (req, res) => {
  const body = req.body || {};
  const allowed = [
    'crawl_on_startup',
    'schedule_enabled',
    'schedule_interval_hours',
    'playwright_headless',
    'crawl_concurrency',
    'request_timeout_ms',
    'crawl_delay_ms',
    'auto_disable_after_fails',
    'port',
  ];
  /** @type {Record<string, string|boolean|number>} */
  const patch = {};
  for (const k of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, k)) {
      const v = body[k];
      if (typeof v === 'boolean') patch[k] = v ? 'true' : 'false';
      else patch[k] = v;
    }
  }
  const settings = setSettings(patch);
  try {
    onSettingsChanged?.(settings);
  } catch (e) {
    console.error('[settings] change handler error', e);
  }
  res.json(settings);
});

export default router;
