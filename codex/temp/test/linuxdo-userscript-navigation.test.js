const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright-core');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function preloadedHtml(payload, body = '<main>LinuxDO welfare</main>') {
  return `<!doctype html><html><head><title>LinuxDO</title></head><body>${body}<script id="data-preloaded" type="application/json">${JSON.stringify(payload)}</script></body></html>`;
}

test('standalone local page automatically reads public RSS without visiting LinuxDO', {
  skip: !fs.existsSync(chromePath),
  timeout: 20_000,
}, async () => {
  const browser = await chromium.launch({ executablePath: chromePath, headless: true });
  const context = await browser.newContext();
  await context.addCookies([
    { name: 'rss_session', value: 'must-not-be-sent', domain: 'linuxdorss.longpink.com', path: '/' },
  ]);
  const created = new Date(Date.now() - 60 * 60 * 1000).toUTCString();
  const cooked = [
    '<p>免费节点订阅</p><a href="https://sub.example.com/sub?token=abc">subscription</a>',
    '<p>免费 AI 账号</p><p>账号: demo@example.com</p><p>密码: pass123</p>',
    '<p>AI 公益站，支持 LinuxDO 登录，无需邀请码</p><a href="https://ai.example.com">AI site</a>',
  ].join('');
  const rss = `<?xml version="1.0"?><rss version="2.0"><channel><item><title>免费 AI 公益站账号和节点订阅</title><link>https://linux.do/t/topic/9101</link><pubDate>${created}</pubDate><description><![CDATA[${cooked}]]></description></item></channel></rss>`;
  let publicRssRequests = 0;
  let publicRequestHeaders;
  let linuxdoRequests = 0;

  await context.route('https://linuxdorss.longpink.com/welfare.xml', async route => {
    publicRssRequests += 1;
    publicRequestHeaders = route.request().headers();
    await route.fulfill({
      status: 200,
      contentType: 'application/rss+xml; charset=utf-8',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: rss,
    });
  });
  await context.route('https://linux.do/**', async route => {
    linuxdoRequests += 1;
    await route.fulfill({ status: 500, body: 'unexpected LinuxDO request' });
  });

  const page = await context.newPage();
  const dialogs = [];
  page.on('dialog', async dialog => {
    dialogs.push(dialog.message());
    await dialog.dismiss();
  });
  try {
    const fileUrl = pathToFileURL(path.join(__dirname, '..', 'linuxdo-benefits.html')).href;
    await page.goto(fileUrl);
    await page.waitForSelector('#linuxdo-benefits-results', { timeout: 10_000 });

    const filenames = await page.locator('#linuxdo-benefits-results strong').allTextContents();
    assert.equal(page.url(), fileUrl);
    assert.equal(publicRssRequests, 1);
    assert.equal(linuxdoRequests, 0);
    assert.equal(publicRequestHeaders.cookie, undefined);
    assert.equal(publicRequestHeaders.referer, undefined);
    assert.ok(filenames.some(name => name.endsWith('节点.md')));
    assert.ok(filenames.some(name => name.endsWith('账号地址.md')));
    assert.ok(filenames.some(name => name.endsWith('公益站.md')));
    assert.deepEqual(dialogs, []);
  } finally {
    await context.close();
    await browser.close();
  }
});
test('public RSS mode stays on the verified page and sends no cookies or referrer', {
  skip: !fs.existsSync(chromePath),
  timeout: 20_000,
}, async () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'linuxdo-benefits.user.js'), 'utf8');
  const browser = await chromium.launch({ executablePath: chromePath, headless: true });
  const context = await browser.newContext();
  await context.addCookies([
    { name: 'cf_clearance', value: 'linuxdo-secret', domain: 'linux.do', path: '/' },
    { name: 'rss_session', value: 'rss-secret', domain: 'linuxdorss.longpink.com', path: '/' },
  ]);
  const created = new Date(Date.now() - 60 * 60 * 1000).toUTCString();
  const cooked = [
    '<p>\u514d\u8d39\u8282\u70b9\u8ba2\u9605</p><a href="https://sub.example.com/sub?token=abc">subscription</a>',
    '<p>\u514d\u8d39 AI \u8d26\u53f7</p><p>\u8d26\u53f7: demo@example.com</p><p>\u5bc6\u7801: pass123</p>',
    '<p>AI \u516c\u76ca\u7ad9\uff0c\u652f\u6301 LinuxDO \u767b\u5f55\uff0c\u65e0\u9700\u9080\u8bf7\u7801</p><a href="https://ai.example.com">AI site</a>',
  ].join('');
  const rss = `<?xml version="1.0"?><rss version="2.0"><channel><item><title>\u514d\u8d39 AI \u516c\u76ca\u7ad9\u8d26\u53f7\u548c\u8282\u70b9\u8ba2\u9605</title><link>https://linux.do/t/topic/9001</link><pubDate>${created}</pubDate><description><![CDATA[${cooked}]]></description></item></channel></rss>`;
  let publicRssRequests = 0;
  let publicRequestHeaders;
  let linuxdoTopicRequests = 0;
  let popupCount = 0;

  await context.route('https://linuxdorss.longpink.com/welfare.xml', async route => {
    publicRssRequests += 1;
    publicRequestHeaders = route.request().headers();
    await route.fulfill({
      status: 200,
      contentType: 'application/rss+xml; charset=utf-8',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: rss,
    });
  });
  await context.route('https://linux.do/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname.startsWith('/t/')) linuxdoTopicRequests += 1;
    const categories = [{ id: 36, slug: 'welfare', name: 'welfare' }];
    await route.fulfill({
      status: 200,
      contentType: 'text/html; charset=utf-8',
      body: preloadedHtml({ categories: JSON.stringify({ category_list: { categories } }) }, '<main>LinuxDO welfare: Cloudflare usage discussion</main>'),
    });
  });

  await context.addInitScript({ content: source });
  const page = await context.newPage();
  page.on('popup', () => { popupCount += 1; });
  try {
    const startUrl = 'https://linux.do/c/welfare/36/l/latest';
    await page.goto(startUrl);
    await page.waitForSelector('#linuxdo-benefits-public-rss-launcher');
    assert.match(await page.locator('#linuxdo-benefits-status').textContent(), /v1\.9\.1 已加载/);
    await page.click('#linuxdo-benefits-public-rss-launcher');
    await page.waitForSelector('#linuxdo-benefits-results', { timeout: 10_000 });

    const filenames = await page.locator('#linuxdo-benefits-results strong').allTextContents();
    assert.equal(page.url(), startUrl);
    assert.equal(publicRssRequests, 1);
    assert.equal(linuxdoTopicRequests, 0);
    assert.equal(popupCount, 0);
    assert.equal(publicRequestHeaders.cookie, undefined);
    assert.equal(publicRequestHeaders.referer, undefined);
    assert.ok(filenames.some(name => name.endsWith('\u8282\u70b9.md')));
    assert.ok(filenames.some(name => name.endsWith('\u8d26\u53f7\u5730\u5740.md')));
    assert.ok(filenames.some(name => name.endsWith('\u516c\u76ca\u7ad9.md')));
    assert.ok(await page.evaluate(() => localStorage.getItem('linuxdo-benefits-public-rss-cache-v1')));
  } finally {
    await context.close();
    await browser.close();
  }
});
test('authenticated autorun survives an initial manual Cloudflare verification without the hash', {
  skip: !fs.existsSync(chromePath),
  timeout: 30_000,
}, async () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'linuxdo-benefits.user.js'), 'utf8')
    .replace('const CURRENT_TAB_DELAY_MS = 5000;', 'const CURRENT_TAB_DELAY_MS = 20;');
  const browser = await chromium.launch({ executablePath: chromePath, headless: true });
  const context = await browser.newContext();
  const now = new Date();
  const topic = {
    id: 7051,
    slug: 'authenticated-autorun-topic',
    title: '免费 AI 公益站账号和节点订阅',
    created_at: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
    pinned: false,
    tags: [],
  };
  const categories = [{ id: 36, slug: 'welfare', name: '福利羊毛' }];
  const cooked = [
    '<p>免费节点订阅</p><a href="https://sub.example.com/sub?token=autorun">节点订阅地址</a>',
    '<p>免费 AI 账号</p><p>账号: autorun@example.com</p><p>密码: pass123</p>',
    '<p>AI 公益站，支持 LinuxDO 登录，无需邀请码</p><a href="https://ai.example.com/autorun">示例公益站</a>',
  ].join('');
  let challengeCount = 0;
  let popupCount = 0;
  const visited = [];
  const dialogs = [];

  await context.route('https://linux.do/**', async route => {
    const url = new URL(route.request().url());
    visited.push(url.toString());
    let html;

    if (url.pathname === '/c/welfare/36/l/latest'
      && (!url.search || url.searchParams.get('linuxdo_benefits_authenticated') === '1')) {
      if (challengeCount === 0) {
        challengeCount += 1;
        html = '<!doctype html><html><head><title>Just a moment...</title></head><body>Checking your browser with Cloudflare<button id="manual-verify" onclick="location.href=\'/c/welfare/36/l/latest\'">Verify</button></body></html>';
      } else {
        html = preloadedHtml({ categories: JSON.stringify({ category_list: { categories } }) });
      }
    } else if (url.pathname === '/c/welfare/36/l/latest'
      && url.searchParams.get('order') === 'created'
      && url.searchParams.get('page') === '0') {
      html = preloadedHtml({ topic_list: JSON.stringify({ topic_list: { topics: [topic] } }) });
    } else if (url.pathname === '/c/welfare/36/l/latest'
      && url.searchParams.get('order') === 'created'
      && url.searchParams.get('page') === '1') {
      html = preloadedHtml({ topic_list: JSON.stringify({ topic_list: { topics: [] } }) });
    } else if (url.pathname === `/t/${topic.slug}/${topic.id}`) {
      html = preloadedHtml({
        [`topic_${topic.id}`]: JSON.stringify({
          title: topic.title,
          post_stream: { posts: [{ post_number: 1, cooked }] },
        }),
      });
    } else {
      html = preloadedHtml({ categories: JSON.stringify({ category_list: { categories } }) });
    }

    await route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html });
  });

  await context.addInitScript({ content: source });
  const page = await context.newPage();
  page.on('popup', () => { popupCount += 1; });
  page.on('dialog', async dialog => {
    dialogs.push(dialog.message());
    await dialog.dismiss();
  });

  try {
    await page.goto('https://linux.do/c/welfare/36/l/latest?linuxdo_benefits_authenticated=1#linuxdo-benefits-authenticated');
    await page.waitForSelector('#manual-verify', { timeout: 10_000 });
    assert.equal(await page.evaluate(() => sessionStorage.getItem('linuxdo-benefits-authenticated-pending-v1')), '1');

    await page.click('#manual-verify');
    await page.waitForSelector('#linuxdo-benefits-results', { timeout: 20_000 });

    const filenames = await page.locator('#linuxdo-benefits-results strong').allTextContents();
    assert.equal(challengeCount, 1);
    assert.equal(page.url(), 'https://linux.do/c/welfare/36/l/latest');
    assert.equal(await page.evaluate(() => sessionStorage.getItem('linuxdo-benefits-authenticated-pending-v1')), null);
    assert.equal(await page.evaluate(() => sessionStorage.getItem('linuxdo-benefits-current-tab-v1')), null);
    assert.ok(visited.some(url => url.includes('order=created')));
    assert.ok(visited.some(url => url.includes(`/t/${topic.slug}/${topic.id}`)));
    assert.ok(filenames.some(name => name.endsWith('节点.md')));
    assert.ok(filenames.some(name => name.endsWith('账号地址.md')));
    assert.ok(filenames.some(name => name.endsWith('公益站.md')));
    assert.equal(popupCount, 0);
    assert.deepEqual(dialogs, []);
  } finally {
    await context.close();
    await browser.close();
  }
});test('current-tab relay pauses for one manual Cloudflare verification and finishes without a popup', {
  skip: !fs.existsSync(chromePath),
  timeout: 30_000,
}, async () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'linuxdo-benefits.user.js'), 'utf8')
    .replace('const CURRENT_TAB_DELAY_MS = 5000;', 'const CURRENT_TAB_DELAY_MS = 20;');
  const browser = await chromium.launch({ executablePath: chromePath, headless: true });
  const context = await browser.newContext();
  const now = new Date();
  const topic = {
    id: 7001,
    slug: 'free-ai-benefits',
    title: '免费 AI 公益站账号和节点订阅',
    created_at: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
    pinned: false,
    tags: [],
  };
  const categories = [{ id: 36, slug: 'welfare', name: '福利羊毛' }];
  const cooked = [
    '<p>免费节点订阅</p><a href="https://sub.example.com/sub?token=abc">节点订阅地址</a>',
    '<p>免费 AI 账号</p><p>账号: demo@example.com</p><p>密码: pass123</p>',
    '<p>AI 公益站，支持 LinuxDO 登录，无需邀请码</p><a href="https://ai.example.com">示例公益站</a>',
  ].join('');
  let challengeCount = 0;
  let popupCount = 0;
  const visited = [];
  const dialogs = [];

  await context.route('https://linux.do/**', async route => {
    const url = new URL(route.request().url());
    visited.push(url.toString());
    let html;

    if (url.pathname === '/c/welfare/36/l/latest'
      && url.searchParams.get('order') === 'created'
      && url.searchParams.get('page') === '0') {
      if (challengeCount === 0) {
        challengeCount += 1;
        html = '<!doctype html><html><head><title>Just a moment...</title></head><body>Checking your browser with Cloudflare<button id="manual-verify" onclick="location.reload()">Verify</button></body></html>';
      } else {
        html = preloadedHtml({ topic_list: JSON.stringify({ topic_list: { topics: [topic] } }) });
      }
    } else if (url.pathname === '/c/welfare/36/l/latest'
      && url.searchParams.get('order') === 'created'
      && url.searchParams.get('page') === '1') {
      html = preloadedHtml({ topic_list: JSON.stringify({ topic_list: { topics: [] } }) });
    } else if (url.pathname === `/t/${topic.slug}/${topic.id}`) {
      html = preloadedHtml({
        [`topic_${topic.id}`]: JSON.stringify({
          title: topic.title,
          post_stream: { posts: [{ post_number: 1, cooked }] },
        }),
      });
    } else {
      html = preloadedHtml({ categories: JSON.stringify({ category_list: { categories } }) });
    }

    await route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html });
  });

  await context.addInitScript({ content: source });
  const page = await context.newPage();
  page.on('popup', () => { popupCount += 1; });
  page.on('dialog', async dialog => {
    dialogs.push(dialog.message());
    await dialog.dismiss();
  });

  try {
    await page.goto('https://linux.do/c/welfare/36/l/latest');
    await page.waitForSelector('#linuxdo-benefits-launcher');
    await page.waitForSelector('#linuxdo-benefits-navigation-launcher');
    await page.click('#linuxdo-benefits-navigation-launcher');

    await page.waitForSelector('#manual-verify', { timeout: 10_000 });
    await page.click('#manual-verify');
    await page.waitForSelector('#linuxdo-benefits-results', { timeout: 20_000 });

    const filenames = await page.locator('#linuxdo-benefits-results strong').allTextContents();
    assert.equal(challengeCount, 1);
    assert.equal(popupCount, 0);
    assert.ok(visited.every(url => !url.includes('linuxdo_benefits_worker')));
    assert.ok(filenames.some(name => name.endsWith('节点.md')));
    assert.ok(filenames.some(name => name.endsWith('账号地址.md')));
    assert.ok(filenames.some(name => name.endsWith('公益站.md')));
    assert.equal(await page.evaluate(() => sessionStorage.getItem('linuxdo-benefits-current-tab-v1')), null);
    assert.deepEqual(dialogs, []);
  } finally {
    await context.close();
    await browser.close();
  }
});
test('current-tab low-frequency relay pauses after 20 topics until the user continues', {
  skip: !fs.existsSync(chromePath),
  timeout: 30_000,
}, async () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'linuxdo-benefits.user.js'), 'utf8')
    .replace('const CURRENT_TAB_DELAY_MS = 5000;', 'const CURRENT_TAB_DELAY_MS = 10;');
  const browser = await chromium.launch({ executablePath: chromePath, headless: true });
  const context = await browser.newContext();
  const now = new Date();
  const topics = Array.from({ length: 21 }, (_, index) => ({
    id: 7100 + index,
    slug: `batch-topic-${index}`,
    title: `Batch topic ${index + 1}`,
    created_at: new Date(now.getTime() - (index + 1) * 60_000).toISOString(),
    pinned: false,
    tags: [],
  }));
  const categories = [{ id: 36, slug: 'welfare', name: 'welfare' }];
  let topicVisits = 0;

  await context.route('https://linux.do/**', async route => {
    const url = new URL(route.request().url());
    let html;
    if (url.pathname === '/c/welfare/36/l/latest' && url.searchParams.get('order') === 'created') {
      const pageNumber = Number(url.searchParams.get('page') || 0);
      const pageTopics = pageNumber === 0 ? topics : [];
      html = preloadedHtml({ topic_list: JSON.stringify({ topic_list: { topics: pageTopics } }) });
    } else if (url.pathname.startsWith('/t/batch-topic-')) {
      topicVisits += 1;
      const id = Number(url.pathname.split('/').at(-1));
      const topic = topics.find(entry => entry.id === id);
      html = preloadedHtml({
        [`topic_${id}`]: JSON.stringify({
          title: topic.title,
          post_stream: { posts: [{ post_number: 1, cooked: '<p>batch content</p>' }] },
        }),
      });
    } else {
      html = preloadedHtml({ categories: JSON.stringify({ category_list: { categories } }) });
    }
    await route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html });
  });

  await context.addInitScript({ content: source });
  const page = await context.newPage();
  try {
    await page.goto('https://linux.do/c/welfare/36/l/latest');
    await page.waitForSelector('#linuxdo-benefits-navigation-launcher');
    await page.click('#linuxdo-benefits-navigation-launcher');
    await page.waitForSelector('#linuxdo-benefits-current-tab-continue', { timeout: 20_000 });

    const pausedState = await page.evaluate(() => JSON.parse(sessionStorage.getItem('linuxdo-benefits-current-tab-v1')));
    assert.equal(pausedState.topicIndex, 20);
    assert.equal(pausedState.pausedForBatch, true);
    assert.equal(topicVisits, 20);
    await page.waitForTimeout(100);
    assert.equal(topicVisits, 20);

    await page.click('#linuxdo-benefits-current-tab-continue');
    await page.waitForSelector('#linuxdo-benefits-results', { timeout: 10_000 });
    assert.equal(topicVisits, 21);
    assert.equal(await page.evaluate(() => sessionStorage.getItem('linuxdo-benefits-current-tab-v1')), null);
  } finally {
    await context.close();
    await browser.close();
  }
});
test('default browser mode uses one RSS request before JSON or topic pages', {
  skip: !fs.existsSync(chromePath),
  timeout: 20_000,
}, async () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'linuxdo-benefits.user.js'), 'utf8');
  const browser = await chromium.launch({ executablePath: chromePath, headless: true });
  const context = await browser.newContext();
  const categories = [{ id: 36, slug: 'welfare', name: 'welfare' }];
  const created = new Date(Date.now() - 60 * 60 * 1000).toUTCString();
  const title = '\u514d\u8d39 AI \u516c\u76ca\u7ad9\u8d26\u53f7\u548c\u8282\u70b9\u8ba2\u9605';
  const cooked = [
    '<p>\u514d\u8d39\u8282\u70b9\u8ba2\u9605</p><a href="https://sub.example.com/sub?token=abc">sub</a>',
    '<p>\u514d\u8d39 AI \u8d26\u53f7</p><p>\u8d26\u53f7: demo@example.com</p><p>\u5bc6\u7801: pass123</p>',
    '<p>AI \u516c\u76ca\u7ad9\uff0c\u652f\u6301 LinuxDO \u767b\u5f55\uff0c\u65e0\u9700\u9080\u8bf7\u7801</p><a href="https://ai.example.com">AI site</a>',
  ].join('');
  const rss = `<?xml version="1.0"?><rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><item><title><![CDATA[${title}]]></title><link>https://linux.do/t/rss-topic/8001</link><pubDate>${created}</pubDate><content:encoded><![CDATA[${cooked}]]></content:encoded></item></channel></rss>`;
  let rssRequests = 0;
  let fallbackRequests = 0;
  const dialogs = [];

  await context.route('https://linux.do/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/c/welfare/36.rss') {
      rssRequests += 1;
      await route.fulfill({ status: 200, contentType: 'application/rss+xml; charset=utf-8', body: rss });
      return;
    }
    if (url.pathname.endsWith('.json') || url.pathname.startsWith('/t/')) {
      fallbackRequests += 1;
      await route.fulfill({ status: 500, contentType: 'text/plain', body: 'unexpected fallback' });
      return;
    }
    const html = preloadedHtml({ categories: JSON.stringify({ category_list: { categories } }) });
    await route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html });
  });

  await context.addInitScript({ content: source });
  const page = await context.newPage();
  page.on('dialog', async dialog => {
    dialogs.push(dialog.message());
    await dialog.dismiss();
  });

  try {
    await page.goto('https://linux.do/c/welfare/36/l/latest');
    await page.waitForSelector('#linuxdo-benefits-launcher');
    await page.click('#linuxdo-benefits-launcher');
    await page.waitForSelector('#linuxdo-benefits-results', { timeout: 15_000 });
    const filenames = await page.locator('#linuxdo-benefits-results strong').allTextContents();
    assert.equal(rssRequests, 1);
    assert.equal(fallbackRequests, 0);
    assert.ok(filenames.some(name => name.endsWith('\u8282\u70b9.md')));
    assert.ok(filenames.some(name => name.endsWith('\u8d26\u53f7\u5730\u5740.md')));
    assert.ok(filenames.some(name => name.endsWith('\u516c\u76ca\u7ad9.md')));
    assert.deepEqual(dialogs, []);
  } finally {
    await context.close();
    await browser.close();
  }
});
