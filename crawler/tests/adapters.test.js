import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mapDujiaoProduct } from '../src/crawler/adapters/dujiao-next.js';
import { mapPriceAiProduct } from '../src/crawler/adapters/priceai.js';
import { mapAibijiaOffer } from '../src/crawler/adapters/aibijia.js';
import { mapC2Product } from '../src/crawler/adapters/c2-shop.js';
import { extractPayLdxp, mapPayLdxpProduct } from '../src/crawler/adapters/pay-ldxp.js';
import { extractGeneric } from '../src/crawler/adapters/generic.js';
import { runAdapter } from '../src/crawler/adapters/index.js';

describe('mapDujiaoProduct', () => {
  it('maps localized fields, relative URLs, stock and warranty', () => {
    const product = mapDujiaoProduct(
      {
        id: 12,
        slug: 'chatgpt-plus',
        title: { 'zh-CN': 'ChatGPT Plus' },
        description: { 'zh-CN': '自动发货，质保30天' },
        content: { 'zh-CN': '<p>售后说明</p>' },
        price_amount: '20.00',
        images: ['/uploads/chatgpt.png'],
        stock_status: 'in_stock',
        is_sold_out: false,
        skus: [{ id: 1 }],
      },
      'https://shop.example.com/'
    );

    assert.equal(product.external_id, '12');
    assert.equal(product.name, 'ChatGPT Plus');
    assert.equal(product.price, 20);
    assert.equal(product.price_raw, '20.00 CNY');
    assert.equal(product.image_url, 'https://shop.example.com/uploads/chatgpt.png');
    assert.equal(product.product_url, 'https://shop.example.com/products/chatgpt-plus');
    assert.equal(product.warranty_days, 30);
    assert.equal(product.in_stock, true);
  });

  it('marks sold-out products out of stock', () => {
    const product = mapDujiaoProduct(
      {
        id: 13,
        slug: 'sold-out',
        title: { en: 'Sold out item' },
        price_amount: '9.9',
        stock_status: 'out_of_stock',
      },
      'https://shop.example.com/'
    );
    assert.equal(product.in_stock, false);
  });

  it('uses the category icon when a product image is not provided', () => {
    const product = mapDujiaoProduct(
      {
        id: 14,
        slug: 'without-image',
        title: { en: 'Without image' },
        price_amount: '2',
        category: { icon: '/uploads/category.png' },
      },
      'https://shop.example.com/'
    );

    assert.equal(product.image_url, 'https://shop.example.com/uploads/category.png');
  });
});

describe('mapPriceAiProduct', () => {
  it('maps the lowest live offer without treating warranty price as duration', () => {
    const product = mapPriceAiProduct(
      {
        id: 'chatgpt-plus',
        slug: 'chatgpt-plus',
        displayName: 'ChatGPT Plus',
        lowestPrice: 12.5,
        lowestOffer: {
          url: 'https://seller.example/item/1',
          sourceName: '示例商店',
          sourceTitle: 'ChatGPT Plus 自动发货',
          status: 'active',
        },
        warrantyLowestPrice: 18,
        inStockCount: 2,
        outOfStockCount: 1,
      },
      'https://priceai.cc/'
    );

    assert.equal(product.external_id, 'chatgpt-plus');
    assert.equal(product.price, 12.5);
    assert.equal(product.product_url, 'https://seller.example/item/1');
    assert.equal(product.in_stock, true);
    assert.equal(product.warranty_days, null);
  });
});


describe('mapAibijiaOffer', () => {
  it('maps an aggregated offer with stock and warranty', () => {
    const product = mapAibijiaOffer(
      { slug: 'chatgpt', name: 'ChatGPT' },
      {
        platform_name: 'LDXP',
        source_store_name: '示例商店',
        source_title: 'ChatGPT Plus 质保30天',
        price: 20.8,
        currency: 'CNY',
        status: 'low_stock',
        url: 'https://seller.example/item/1',
        display_tags: [],
      },
      'https://aibijia.org/'
    );

    assert.equal(product.name, 'ChatGPT Plus 质保30天');
    assert.equal(product.price, 20.8);
    assert.equal(product.price_raw, '20.8 CNY');
    assert.equal(product.product_url, 'https://seller.example/item/1');
    assert.equal(product.warranty_days, 30);
    assert.equal(product.in_stock, true);
  });
});

describe('mapC2Product', () => {
  it('maps product links, images and sold-out state', () => {
    const product = mapC2Product(
      {
        id: 83,
        name: 'GPT Plus 质保7天',
        cover: '/assets/item.png',
        price: 25,
        status: 1,
        stock: 0,
        category: { id: 2, name: 'Code' },
      },
      'https://xiangzili.xyz/user/index/shop'
    );

    assert.equal(product.external_id, '83');
    assert.equal(product.price, 25);
    assert.equal(product.image_url, 'https://xiangzili.xyz/assets/item.png');
    assert.equal(product.product_url, 'https://xiangzili.xyz/item/83');
    assert.equal(product.warranty_days, 7);
    assert.equal(product.in_stock, false);
  });

  it('decodes HTML entities in API product names', () => {
    const product = mapC2Product(
      { id: 84, name: 'GPT &gt; Plus &amp; API', price: 9 },
      'https://faka.oapi.vip/'
    );

    assert.equal(product.name, 'GPT > Plus & API');
  });
});


describe('mapPayLdxpProduct', () => {
  it('maps API products across categories and decodes HTML entities', () => {
    const product = mapPayLdxpProduct(
      {
        goods_key: 'abc123',
        goods_type: 'card',
        name: 'GPT Plus &gt; \u8d28\u4fdd30\u5929',
        price: 12.5,
        link: 'https://pay.ldxp.cn/item/abc123',
        image: '/cover.png',
        description: '<p>\u8d28\u4fdd30\u5929</p>',
        category: { id: 7, name: 'GPT' },
        extend: { stock_count: 4, show_stock_type: 0 },
      },
      'https://pay.ldxp.cn/shop/demo'
    );

    assert.equal(product.external_id, 'abc123');
    assert.equal(product.name, 'GPT Plus > \u8d28\u4fdd30\u5929');
    assert.equal(product.price, 12.5);
    assert.equal(product.product_url, 'https://pay.ldxp.cn/item/abc123');
    assert.equal(product.image_url, 'https://pay.ldxp.cn/cover.png');
    assert.equal(product.warranty_days, 30);
    assert.equal(product.in_stock, true);
  });

  it('uses an image embedded in the description when the cover is empty', () => {
    const product = mapPayLdxpProduct(
      {
        goods_key: 'with-description-image',
        name: 'Product',
        price: 3,
        link: '/item/with-description-image',
        description: '<p>Details</p><img src="/uploads/detail.png">',
      },
      'https://pay.ldxp.cn/shop/demo'
    );

    assert.equal(product.image_url, 'https://pay.ldxp.cn/uploads/detail.png');
  });
});

describe('extractGeneric', () => {
  it('does not turn a description-only block into a product', async () => {
    const page = {
      url: () => 'https://example.com/shop',
      title: async () => 'Example shop',
      evaluate: async () => ({
        candidates: [
          {
            name: 'Shop announcement',
            price_raw: null,
            image_url: null,
            product_url: null,
            text: 'Shop announcement with warranty text',
            score: 6,
          },
          {
            name: 'Real product',
            price_raw: '$10',
            image_url: null,
            product_url: 'https://example.com/item/1',
            text: 'Real product $10',
            score: 4,
          },
        ],
        stats: {},
      }),
    };

    const result = await extractGeneric(page, page.url());

    assert.deepEqual(result.products.map((p) => p.name), ['Real product']);
  });
});

describe('extractPayLdxp', () => {
  it('fetches every configured type and follows API pagination', async () => {
    const calls = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
      const data = JSON.parse(options.body);
      calls.push({ url: String(url), data });
      let payload;
      if (String(url).endsWith('/Shop/info')) {
        payload = {
          code: 1,
          data: {
            card_count: 501,
            article_count: 1,
            resource_count: 0,
            equity_count: 0,
            goods_type_sort: ['card', 'article'],
          },
        };
      } else {
        const { goods_type: goodsType, current } = data;
        const list =
          goodsType === 'article'
            ? [{ goods_key: 'article-1', name: 'Article', price: 1 }]
            : Array.from({ length: current === 1 ? 300 : 201 }, (_, index) => ({
                goods_key: `card-${current}-${index}`,
                name: `Card ${current}-${index}`,
                price: 2,
              }));
        payload = {
          code: 1,
          data: { total: goodsType === 'article' ? 1 : 501, list },
        };
      }
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    };

    const page = {
      url: () => 'https://pay.ldxp.cn/shop/demo',
      title: async () => 'Demo shop',
    };

    try {
      const result = await extractPayLdxp(page, page.url());

      assert.equal(result.adapter, 'pay-ldxp-api');
      assert.equal(result.products.length, 502);
      assert.equal(result.sourceTotal, 502);
      assert.deepEqual(
        [...new Set(calls.filter((call) => call.url.endsWith('/Shop/goodsList')).map((call) => call.data.goods_type))],
        ['card', 'article']
      );
      assert.ok(calls.some((call) => call.data?.current === 2 && call.data.goods_type === 'card'));
      assert.ok(calls.every((call) => call.data?.category_id === '' || call.url.endsWith('/Shop/info')));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('fails instead of falling back to low-quality DOM data when the API is blocked', async () => {
    const originalFetch = globalThis.fetch;
    let evaluateCalled = false;
    globalThis.fetch = async () =>
      new Response('<!doctype html><title>Forbidden</title>', {
        status: 403,
        headers: { 'content-type': 'text/html' },
      });
    const page = {
      url: () => 'https://pay.ldxp.cn/shop/demo',
      title: async () => 'Demo shop',
      waitForTimeout: async () => {},
      evaluate: async () => {
        evaluateCalled = true;
        return { items: [], bodySample: '' };
      },
    };

    try {
      await assert.rejects(() => extractPayLdxp(page, page.url()), /API|403|fetch/i);
      assert.equal(evaluateCalled, false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe('runAdapter', () => {
  it('does not downgrade a known LDXP host to generic DOM extraction when its API fails', async () => {
    const originalFetch = globalThis.fetch;
    let evaluateCalled = false;
    globalThis.fetch = async () =>
      new Response('<!doctype html><title>Forbidden</title>', {
        status: 403,
        headers: { 'content-type': 'text/html' },
      });
    const page = {
      url: () => 'https://pay.ldxp.cn/shop/demo',
      title: async () => 'Demo shop',
      evaluate: async () => {
        evaluateCalled = true;
        return { items: [] };
      },
    };

    try {
      await assert.rejects(
        () => runAdapter('pay.ldxp.cn', page, page.url()),
        /API|403|fetch/i
      );
      assert.equal(evaluateCalled, false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('routes faka.oapi.vip to the C2 API adapter', async () => {
    const page = {
      url: () => 'https://faka.oapi.vip/',
      title: async () => 'Faka shop',
      context: () => ({
        request: {
          get: async () => ({
            ok: () => true,
            status: () => 200,
            json: async () => ({
              code: 200,
              data: [{ id: 1, name: 'Claude &gt; Pro', price: 10, stock: 2, status: 1 }],
            }),
          }),
        },
      }),
    };

    const result = await runAdapter('faka.oapi.vip', page, page.url());

    assert.equal(result.adapter, 'c2-shop');
    assert.equal(result.products.length, 1);
    assert.equal(result.products[0].name, 'Claude > Pro');
  });
});
