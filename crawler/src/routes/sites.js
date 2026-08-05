import { Router } from 'express';
import {
  listSites,
  getSite,
  createSite,
  updateSite,
  deleteSite,
  listProductsBySite,
  getOverview,
  searchProducts,
} from '../db/repositories.js';

const router = Router();

router.get('/overview', (_req, res) => {
  res.json(getOverview());
});

router.get('/search', (req, res) => {
  res.json(
    searchProducts({
      q: req.query.q,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
      limit: req.query.limit,
    })
  );
});

router.get('/sites', (req, res) => {
  const type = req.query.type ? String(req.query.type) : undefined;
  const enabled =
    req.query.enabled === undefined
      ? undefined
      : req.query.enabled === '1' || req.query.enabled === 'true';
  res.json(listSites({ type, enabled }));
});

router.post('/sites', (req, res) => {
  try {
    const { url, name, type } = req.body || {};
    const site = createSite(url, { name, type });
    res.status(201).json(site);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.patch('/sites/:id', (req, res) => {
  const id = Number(req.params.id);
  const body = req.body || {};
  const patch = { ...body };
  if (Object.prototype.hasOwnProperty.call(body, 'enabled')) {
    patch.enabled = Boolean(body.enabled);
  }
  const site = updateSite(id, patch);
  if (!site) return res.status(404).json({ error: 'not found' });
  res.json(site);
});

router.delete('/sites/:id', (req, res) => {
  const ok = deleteSite(Number(req.params.id));
  if (!ok) return res.status(404).json({ error: 'not found' });
  res.json({ ok: true });
});

router.get('/sites/:id/products', (req, res) => {
  const site = getSite(Number(req.params.id));
  if (!site) return res.status(404).json({ error: 'not found' });
  res.json(listProductsBySite(site.id));
});

export default router;
