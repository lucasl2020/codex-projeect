import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parsePrice } from '../src/parsers/price.js';
import { parseWarranty, extractWarrantySnippet } from '../src/parsers/warranty.js';
import { sortProducts } from '../src/parsers/sort.js';
import { productDedupKey } from '../src/parsers/dedup.js';
import { normalizeUrl } from '../src/utils/url.js';

describe('parsePrice', () => {
  it('parses yuan symbols', () => {
    assert.equal(parsePrice('¥12.5'), 12.5);
    assert.equal(parsePrice('￥99元'), 99);
    assert.equal(parsePrice('价格: 3.2'), 3.2);
    assert.equal(parsePrice('20.00 CNY'), 20);
    assert.equal(parsePrice('PRICE 2.7 CNY'), 2.7);
  });
  it('returns null for garbage', () => {
    assert.equal(parsePrice('面议'), null);
    assert.equal(parsePrice(''), null);
  });
});

describe('parseWarranty', () => {
  it('parses days months years and permanent', () => {
    assert.equal(parseWarranty('质保30天').days, 30);
    assert.equal(parseWarranty('保修3个月').days, 90);
    assert.equal(parseWarranty('售后1年').days, 365);
    assert.equal(parseWarranty('永久质保').days, 36500);
  });
  it('extracts snippet', () => {
    const s = extractWarrantySnippet('ChatGPT Plus 账号 质保7天 自动发货');
    assert.ok(s && s.includes('质保'));
  });
});

describe('sortProducts', () => {
  it('sorts price asc then warranty desc', () => {
    const list = sortProducts([
      { name: 'b', price: 10, warranty_days: 7 },
      { name: 'a', price: 5, warranty_days: 7 },
      { name: 'c', price: 5, warranty_days: 30 },
      { name: 'd', price: null, warranty_days: 100 },
    ]);
    assert.deepEqual(
      list.map((x) => x.name),
      ['c', 'a', 'b', 'd']
    );
  });
});

describe('productDedupKey', () => {
  it('prefers external_id', () => {
    assert.equal(productDedupKey({ external_id: 'x1', name: 'n' }), 'id:x1');
  });
});

describe('normalizeUrl', () => {
  it('strips tracking params and www', () => {
    const u = normalizeUrl('https://www.example.com/shop/a?_refluxos=a10&utm_source=x#frag');
    assert.equal(u, 'https://example.com/shop/a');
  });
  it('adds https when missing', () => {
    assert.equal(normalizeUrl('example.com/path'), 'https://example.com/path');
  });
});
