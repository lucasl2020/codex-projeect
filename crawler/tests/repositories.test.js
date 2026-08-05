import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { getDb, closeDb } from '../src/db/client.js';
import {
  createSite,
  importUrls,
  replaceProducts,
  listProductsBySite,
  getOverview,
  searchProducts,
  updateSite,
} from '../src/db/repositories.js';

const tmp = path.join(os.tmpdir(), `csm-test-${Date.now()}.db`);

describe('repositories', () => {
  before(() => {
    getDb(tmp);
  });
  after(() => {
    closeDb();
    try {
      fs.unlinkSync(tmp);
    } catch {
      /* ignore */
    }
  });

  it('imports with normalize and sorts products', () => {
    const r = importUrls([
      'https://www.example.com/shop/a?_refluxos=a10',
      'https://example.com/shop/a',
      'not-a-url',
    ]);
    assert.equal(r.imported, 1);
    assert.equal(r.skipped, 1);
    assert.ok(r.errors.length >= 1);

    const site = createSite('https://pay.ldxp.cn/shop/demo');
    replaceProducts(site.id, [
      { name: 'B', price: 20, price_raw: '20', warranty_days: 7 },
      { name: 'A', price: 10, price_raw: '10', warranty_days: 3 },
      { name: 'A2', price: 10, price_raw: '10', warranty_days: 30 },
    ]);
    const products = listProductsBySite(site.id);
    assert.equal(products[0].name, 'A2');
    assert.equal(products[1].name, 'A');

    updateSite(site.id, { type: 'shop' });
    const ov = getOverview();
    assert.ok(ov.shops.some((s) => s.id === site.id));
    assert.equal(ov.shops.find((s) => s.id === site.id).products[0].name, 'A2');

    const hits = searchProducts({ q: 'A2' });
    assert.ok(hits.some((h) => h.name === 'A2'));
  });

  it('does not require products wipe path here — replace only on success', () => {
    const site = createSite('https://example.org/shop/b');
    replaceProducts(site.id, [{ name: 'Keep', price: 1, price_raw: '1', warranty_days: 7 }]);
    assert.equal(listProductsBySite(site.id).length, 1);
    // empty replace would wipe — worker must not call replaceProducts on failure
    replaceProducts(site.id, []);
    assert.equal(listProductsBySite(site.id).length, 0);
  });
});
