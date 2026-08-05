import { Router } from 'express';
import { startCrawlJob, getCrawlStatus } from '../crawler/queue.js';

const router = Router();

router.get('/crawl/status', (_req, res) => {
  res.json(getCrawlStatus());
});

router.post('/crawl', async (req, res) => {
  try {
    const siteId = req.body?.siteId != null ? Number(req.body.siteId) : undefined;
    const status = await startCrawlJob({
      siteId: Number.isFinite(siteId) ? siteId : undefined,
      trigger: 'manual',
    });
    res.json(status);
  } catch (e) {
    if (e.code === 'CRAWL_BUSY') {
      return res.status(409).json({ error: e.message, code: e.code });
    }
    if (e.code === 'NOT_FOUND') {
      return res.status(404).json({ error: e.message, code: e.code });
    }
    res.status(500).json({ error: e.message });
  }
});

export default router;
