import { getDb } from './client.js';
import { productDedupKey } from '../parsers/dedup.js';
import { sortProducts } from '../parsers/sort.js';
import { normalizeUrl, domainFromUrl } from '../utils/url.js';

function nowIso() {
  return new Date().toISOString();
}

export function getSettings() {
  const rows = getDb().prepare('SELECT key, value FROM settings').all();
  /** @type {Record<string, string>} */
  const out = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}

export function getSetting(key, fallback = null) {
  const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : fallback;
}

export function setSettings(partial) {
  const stmt = getDb().prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  );
  const tx = getDb().transaction((obj) => {
    for (const [k, v] of Object.entries(obj)) {
      stmt.run(k, String(v));
    }
  });
  tx(partial);
  return getSettings();
}

export function listSites({ type, enabled } = {}) {
  let sql = 'SELECT * FROM sites WHERE 1=1';
  const params = [];
  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }
  if (enabled !== undefined && enabled !== null) {
    sql += ' AND enabled = ?';
    params.push(enabled ? 1 : 0);
  }
  sql += ' ORDER BY sort_hint ASC, id ASC';
  return getDb().prepare(sql).all(...params);
}

export function getSite(id) {
  return getDb().prepare('SELECT * FROM sites WHERE id = ?').get(id) || null;
}

export function getSiteByUrl(url) {
  return getDb().prepare('SELECT * FROM sites WHERE url = ?').get(url) || null;
}

/**
 * @param {string} url
 * @param {{ name?: string, type?: string }} [opts]
 */
export function createSite(url, opts = {}) {
  const cleaned = normalizeUrl(url);
  const t = nowIso();
  const domain = domainFromUrl(cleaned);
  const info = getDb()
    .prepare(
      `INSERT INTO sites (url, name, type, domain, enabled, fail_count, sort_hint, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, 0, 0, ?, ?)`
    )
    .run(
      cleaned,
      opts.name || domain || cleaned,
      opts.type || 'unknown',
      domain,
      t,
      t
    );
  return getSite(info.lastInsertRowid);
}

/**
 * @param {string[]} urls
 * @returns {{ imported: number, skipped: number, errors: string[], sites: object[] }}
 */
export function importUrls(urls) {
  const result = { imported: 0, skipped: 0, errors: [], sites: [] };
  const seen = new Set();
  for (const raw of urls) {
    const line = String(raw || '').trim();
    if (!line || line.startsWith('#')) continue;
    try {
      const url = normalizeUrl(line);
      if (seen.has(url)) {
        result.skipped += 1;
        continue;
      }
      seen.add(url);
      const existing = getSiteByUrl(url);
      if (existing) {
        result.skipped += 1;
        result.sites.push(existing);
        continue;
      }
      const site = createSite(url);
      result.imported += 1;
      result.sites.push(site);
    } catch (e) {
      result.errors.push(`${line}: ${e.message}`);
    }
  }
  return result;
}

export function updateSite(id, patch) {
  const site = getSite(id);
  if (!site) return null;
  const allowed = [
    'name',
    'type',
    'enabled',
    'last_crawl_at',
    'last_status',
    'last_error',
    'fail_count',
    'sort_hint',
    'domain',
  ];
  const sets = [];
  const params = [];
  for (const k of allowed) {
    if (Object.prototype.hasOwnProperty.call(patch, k)) {
      let v = patch[k];
      if (k === 'enabled') v = v ? 1 : 0;
      sets.push(`${k} = ?`);
      params.push(v);
    }
  }
  if (!sets.length) return site;
  sets.push('updated_at = ?');
  params.push(nowIso());
  params.push(id);
  getDb()
    .prepare(`UPDATE sites SET ${sets.join(', ')} WHERE id = ?`)
    .run(...params);
  return getSite(id);
}

export function deleteSite(id) {
  const info = getDb().prepare('DELETE FROM sites WHERE id = ?').run(id);
  return info.changes > 0;
}

/**
 * Replace products for a site (only call on successful extraction with items).
 * @param {number} siteId
 * @param {object[]} products
 */
export function replaceProducts(siteId, products) {
  const db = getDb();
  const del = db.prepare('DELETE FROM products WHERE site_id = ?');
  const ins = db.prepare(
    `INSERT INTO products (
      site_id, external_id, product_url, name, price, price_raw, image_url,
      warranty_days, warranty_raw, in_stock, raw_json, crawled_at, dedup_key
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const t = nowIso();
  const tx = db.transaction((list) => {
    del.run(siteId);
    const seen = new Set();
    for (const p of list) {
      if (!p || !p.name) continue;
      const key = productDedupKey(p);
      if (seen.has(key)) continue;
      seen.add(key);
      ins.run(
        siteId,
        p.external_id || null,
        p.product_url || null,
        String(p.name).slice(0, 300),
        p.price ?? null,
        p.price_raw ?? null,
        p.image_url || null,
        p.warranty_days ?? null,
        p.warranty_raw ?? null,
        p.in_stock == null ? null : p.in_stock ? 1 : 0,
        p.raw_json ? JSON.stringify(p.raw_json).slice(0, 4000) : null,
        t,
        key
      );
    }
  });
  tx(products || []);
  return listProductsBySite(siteId);
}

export function listProductsBySite(siteId) {
  const rows = getDb()
    .prepare('SELECT * FROM products WHERE site_id = ?')
    .all(siteId);
  return sortProducts(rows);
}

export function listProductsBySiteIds(siteIds) {
  if (!siteIds.length) return new Map();
  const placeholders = siteIds.map(() => '?').join(',');
  const rows = getDb()
    .prepare(`SELECT * FROM products WHERE site_id IN (${placeholders})`)
    .all(...siteIds);
  /** @type {Map<number, object[]>} */
  const map = new Map();
  for (const id of siteIds) map.set(id, []);
  for (const r of rows) {
    const arr = map.get(r.site_id);
    if (arr) arr.push(r);
  }
  for (const [id, arr] of map) {
    map.set(id, sortProducts(arr));
  }
  return map;
}

export function createCrawlRun({ siteId = null, trigger, status = 'running' }) {
  const info = getDb()
    .prepare(
      `INSERT INTO crawl_runs (site_id, trigger, status, started_at, items_found)
       VALUES (?, ?, ?, ?, 0)`
    )
    .run(siteId, trigger, status, nowIso());
  return getDb().prepare('SELECT * FROM crawl_runs WHERE id = ?').get(info.lastInsertRowid);
}

export function finishCrawlRun(id, { status, items_found = 0, error = null }) {
  getDb()
    .prepare(
      `UPDATE crawl_runs SET status = ?, finished_at = ?, items_found = ?, error = ? WHERE id = ?`
    )
    .run(status, nowIso(), items_found, error, id);
  return getDb().prepare('SELECT * FROM crawl_runs WHERE id = ?').get(id);
}

export function getOverview() {
  const sites = listSites();
  const shops = [];
  const nav = [];
  const unknown = [];
  const shopSites = sites.filter((s) => s.type === 'shop');
  const productMap = listProductsBySiteIds(shopSites.map((s) => s.id));
  for (const s of sites) {
    if (s.type === 'shop') {
      shops.push({ ...s, products: productMap.get(s.id) || [] });
    } else if (s.type === 'nav') {
      nav.push(s);
    } else {
      unknown.push(s);
    }
  }
  return { shops, nav, unknown };
}

/**
 * Search products across shops.
 * @param {{ q?: string, minPrice?: number, maxPrice?: number, limit?: number }} opts
 */
export function searchProducts(opts = {}) {
  const q = String(opts.q || '').trim().toLowerCase();
  const minPrice = opts.minPrice != null && opts.minPrice !== '' ? Number(opts.minPrice) : null;
  const maxPrice = opts.maxPrice != null && opts.maxPrice !== '' ? Number(opts.maxPrice) : null;
  const limit = Math.min(500, Math.max(1, Number(opts.limit) || 200));

  let sql = `
    SELECT p.*, s.name AS site_name, s.url AS site_url, s.domain AS site_domain
    FROM products p
    JOIN sites s ON s.id = p.site_id
    WHERE 1=1
  `;
  const params = [];
  if (q) {
    sql += ' AND (LOWER(p.name) LIKE ? OR LOWER(s.name) LIKE ? OR LOWER(s.domain) LIKE ?)';
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  if (minPrice != null && Number.isFinite(minPrice)) {
    sql += ' AND p.price IS NOT NULL AND p.price >= ?';
    params.push(minPrice);
  }
  if (maxPrice != null && Number.isFinite(maxPrice)) {
    sql += ' AND p.price IS NOT NULL AND p.price <= ?';
    params.push(maxPrice);
  }
  sql += ' LIMIT ?';
  params.push(limit);
  const rows = getDb().prepare(sql).all(...params);
  return sortProducts(rows);
}
