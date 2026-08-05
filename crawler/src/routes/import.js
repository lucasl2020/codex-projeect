import { Router } from 'express';
import { importUrls } from '../db/repositories.js';

const router = Router();

function parseBodyUrls(req) {
  if (typeof req.body === 'string') {
    return req.body.split(/\r?\n/);
  }
  if (req.body && Array.isArray(req.body.urls)) return req.body.urls;
  if (req.body && typeof req.body.text === 'string') return req.body.text.split(/\r?\n/);
  return [];
}

router.post('/import', (req, res) => {
  const urls = parseBodyUrls(req);
  if (!urls.length) {
    return res.status(400).json({ error: 'no urls provided' });
  }
  const result = importUrls(urls);
  res.json(result);
});

export default router;
