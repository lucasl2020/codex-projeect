import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sitesRouter from './routes/sites.js';
import importRouter from './routes/import.js';
import crawlRouter from './routes/crawl.js';
import settingsRouter from './routes/settings.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, '../public');

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));
  app.use(express.text({ type: ['text/plain', 'text/*'], limit: '2mb' }));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api', sitesRouter);
  app.use('/api', importRouter);
  app.use('/api', crawlRouter);
  app.use('/api', settingsRouter);

  app.use(express.static(PUBLIC));
  // SPA fallback for non-api routes
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(PUBLIC, 'index.html'));
  });

  return app;
}
