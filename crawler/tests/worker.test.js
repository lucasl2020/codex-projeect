import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isIncompleteApiResult, shouldReplaceProducts } from '../src/crawler/worker.js';

describe('isIncompleteApiResult', () => {
  it('flags a suspiciously short LDXP API list', () => {
    assert.equal(
      isIncompleteApiResult({
        adapter: 'pay-ldxp-api',
        sourceTotal: 140,
        products: [{ name: 'Only one item' }],
      }),
      true
    );
  });

  it('accepts a complete-enough API list and ignores other adapters', () => {
    assert.equal(
      isIncompleteApiResult({
        adapter: 'pay-ldxp-api',
        sourceTotal: 140,
        products: Array.from({ length: 140 }, (_, index) => ({ name: String(index) })),
      }),
      false
    );
    assert.equal(
      isIncompleteApiResult({ adapter: 'generic', sourceTotal: 140, products: [] }),
      false
    );
  });
});

describe('shouldReplaceProducts', () => {
  it('replaces a complete empty crawl so delisted products are removed', () => {
    assert.equal(
      shouldReplaceProducts({ adapter: 'generic', products: [] }, []),
      true
    );
  });

  it('keeps the previous snapshot when the crawl result is incomplete', () => {
    const products = [{ name: 'Only one item' }];
    assert.equal(
      shouldReplaceProducts(
        { adapter: 'pay-ldxp-api', sourceTotal: 140, products },
        products
      ),
      false
    );
  });
});
