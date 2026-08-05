export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL UNIQUE,
  name TEXT,
  type TEXT NOT NULL DEFAULT 'unknown',
  domain TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  last_crawl_at TEXT,
  last_status TEXT,
  last_error TEXT,
  fail_count INTEGER NOT NULL DEFAULT 0,
  sort_hint INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER NOT NULL,
  external_id TEXT,
  product_url TEXT,
  name TEXT NOT NULL,
  price REAL,
  price_raw TEXT,
  image_url TEXT,
  warranty_days INTEGER,
  warranty_raw TEXT,
  in_stock INTEGER,
  raw_json TEXT,
  crawled_at TEXT NOT NULL,
  dedup_key TEXT NOT NULL,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_products_site ON products(site_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_site_dedup ON products(site_id, dedup_key);

CREATE TABLE IF NOT EXISTS crawl_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER,
  trigger TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  items_found INTEGER DEFAULT 0,
  error TEXT,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_crawl_runs_started ON crawl_runs(started_at);
`;

export const DEFAULT_SETTINGS = {
  crawl_on_startup: 'true',
  schedule_enabled: 'true',
  schedule_interval_hours: '6',
  playwright_headless: 'true',
  crawl_concurrency: '2',
  request_timeout_ms: '45000',
  crawl_delay_ms: '800',
  auto_disable_after_fails: '5',
  port: '3780',
};
