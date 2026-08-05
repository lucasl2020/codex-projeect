import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isIncompleteApiResult } from '../src/crawler/worker.js';

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
