const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const userscript = require('../linuxdo-benefits.user.js');

test('普通浏览器用户脚本保持48小时和200条限制', () => {
  const now = new Date('2026-07-22T12:00:00Z');
  const topics = Array.from({ length: 230 }, (_, index) => ({
    id: index + 1,
    created_at: new Date(now.getTime() - index * 60_000).toISOString(),
  }));
  topics.push({ id: 999, created_at: new Date(now.getTime() - 49 * 60 * 60 * 1000).toISOString() });
  const selected = userscript.selectRecentTopics(topics, now);
  assert.equal(userscript.MAX_TOPICS, 200);
  assert.equal(selected.length, 200);
  assert.equal(selected[0].id, 1);
  assert.equal(selected.at(-1).id, 200);
});

test('公开 RSS 合并实时数据和本地缓存，只保留48小时内最多200条', () => {
  const now = new Date('2026-07-23T04:00:00Z');
  const cached = [
    { id: 1, title: 'cached', created_at: '2026-07-23T01:00:00Z', cooked: 'old' },
    { id: 2, title: 'cached only', created_at: '2026-07-22T01:00:00Z', cooked: 'cached' },
    { id: 999, title: 'expired', created_at: '2026-07-21T03:59:59Z', cooked: 'expired' },
  ];
  const live = [
    { id: 1, title: 'live', created_at: '2026-07-23T01:00:00Z', cooked: 'new' },
    ...Array.from({ length: 205 }, (_, index) => ({
      id: 10 + index,
      title: `live ${index}`,
      created_at: new Date(now.getTime() - index * 60_000).toISOString(),
      cooked: 'live',
    })),
  ];
  const merged = userscript.mergePublicRssTopics(live, cached, now);
  assert.equal(merged.length, 200);
  assert.equal(merged.find(topic => topic.id === 1).title, 'live');
  assert.equal(merged.some(topic => topic.id === 999), false);
});

test('公开 RSS 缓存可保存、读取并安全忽略损坏数据', () => {
  const values = new Map();
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  const topics = [{ id: 1, created_at: '2026-07-23T01:00:00Z', cooked: '<p>free AI</p>' }];
  assert.equal(userscript.savePublicRssCache(topics, storage), true);
  assert.deepEqual(userscript.loadPublicRssCache(storage), topics);
  values.set('linuxdo-benefits-public-rss-cache-v1', '{bad json');
  assert.deepEqual(userscript.loadPublicRssCache(storage), []);
});
test('用户脚本识别福利子分类', () => {
  const categories = [
    { id: 36, slug: 'welfare' },
    { id: 37, parent_category_id: 36 },
    { id: 38, parent_category_id: 37 },
    { id: 99, parent_category_id: null },
  ];
  assert.deepEqual(userscript.discoverWelfareCategories(categories).map(item => item.id), [36, 37, 38]);
});

test('用户脚本可生成要求的 Markdown 文档', () => {
  const now = new Date('2026-07-22T12:00:00Z');
  const analyzed = userscript.analyzeTopic(
    { id: 1, title: '免费 AI 公益站和账号', created_at: now.toISOString(), tags: [] },
    '<p>公益站 AI，免费使用，无需邀请码</p><a href="https://example.com">示例公益站</a><p>账号: demo@example.com</p>',
  );
  const documents = userscript.renderBenefitDocuments(analyzed, now);
  assert.ok(documents['07月22日账号地址.md']);
  assert.ok(documents['07月22日公益站.md']);
  assert.match(documents['07月22日公益站.md'], /https:\/\/linux\.do\/t\/topic\/1/);
});

test('用户脚本不包含自动化浏览器或 Cloudflare 绕过代码', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'linuxdo-benefits.user.js'), 'utf8');
  assert.doesNotMatch(source, /playwright|puppeteer|navigator\.webdriver|disable-blink-features|stealth|flaresolverr/i);
  assert.match(source, /@match\s+https:\/\/linux\.do\/c\/\*/);
  assert.match(source, /@match\s+https:\/\/linux\.do\/t\/\*/);
  assert.match(source, /@noframes/);
  assert.match(source, /credentials:\s*'include'/);
  assert.match(source, /@version\s+1\.9\.1/);
  assert.match(source, /CURRENT_TAB_AUTORUN_PARAM = 'linuxdo_benefits_authenticated'/);
  assert.match(source, /LinuxDO 福利脚本 v\$\{USERSCRIPT_VERSION\} 已加载/);
});

test('userscript stays inactive on Cloudflare challenge pages', () => {
  assert.equal(userscript.looksLikeCloudflareChallenge('<title>Just a moment...</title><div id="cf-chl-widget">Checking your browser</div>'), true);
  assert.equal(userscript.shouldInstallLauncher(
    { href: 'https://linux.do/c/welfare/36/l/latest', pathname: '/c/welfare/36/l/latest' },
    'LinuxDO',
    'welfare topics',
  ), true);
  assert.equal(userscript.shouldInstallLauncher(
    { href: 'https://linux.do/c/welfare/36/l/latest', pathname: '/c/welfare/36/l/latest' },
    'Just a moment...',
    'Checking your browser with Cloudflare /cdn-cgi/challenge-platform/',
  ), false);
  assert.equal(userscript.shouldInstallLauncher(
    { href: 'https://linux.do/t/topic/1', pathname: '/t/topic/1' },
    'LinuxDO topic',
    'topic',
  ), false);
});

test('normal forum pages mentioning Cloudflare still install the launcher', () => {
  assert.equal(userscript.shouldInstallLauncher(
    { href: 'https://linux.do/c/welfare/36/l/latest', pathname: '/c/welfare/36/l/latest' },
    'LinuxDO',
    '福利列表：Cloudflare 使用教程和免费 AI 公益站',
  ), true);
});


test('userscript parses Discourse preloaded data from normal HTML pages', () => {
  const topics = [{ id: 7, title: 'free AI', created_at: '2026-07-22T10:00:00Z', pinned: false }];
  const categoryHtml = `<script id="data-preloaded" type="application/json">${JSON.stringify({
    topic_list: JSON.stringify({ topic_list: { topics } }),
  })}</script>`;
  assert.deepEqual(userscript.extractTopicsFromHtml(categoryHtml), topics);

  const cooked = '<p>free AI account</p>';
  const topicHtml = `<script id="data-preloaded" type="application/json">${JSON.stringify({
    topic_7: JSON.stringify({
      title: 'free AI',
      post_stream: { posts: [{ post_number: 1, cooked }] },
    }),
  })}</script>`;
  const parsed = userscript.extractTopicFromHtml(topicHtml);
  assert.equal(parsed.title, 'free AI');
  assert.equal(parsed.firstPost.cooked, cooked);
});

test('userscript parses parent and child welfare categories from normal HTML', () => {
  const categories = [
    { id: 36, slug: 'welfare', name: '福利羊毛' },
    { id: 37, slug: 'free-ai', name: '免费 AI', parent_category_id: 36 },
    { id: 99, slug: 'other', name: '其他' },
  ];
  const html = `<script id="data-preloaded" type="application/json">${JSON.stringify({
    categories: JSON.stringify({ category_list: { categories } }),
  })}</script>`;
  assert.deepEqual(userscript.extractCategoriesFromHtml(html), categories);
  assert.deepEqual(
    userscript.discoverWelfareCategories(userscript.extractCategoriesFromHtml(html)).map(item => item.id),
    [36, 37],
  );
});

test('userscript contains current-tab relay mode without popup or fingerprint bypasses', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'linuxdo-benefits.user.js'), 'utf8');
  assert.match(source, /linuxdo-benefits-navigation-launcher/);
  assert.match(source, /CURRENT_TAB_STORAGE_KEY/);
  assert.match(source, /window\.sessionStorage/);
  assert.doesNotMatch(source, /window\.open|linuxdo-benefits-worker/);
  assert.doesNotMatch(source, /playwright|puppeteer|navigator\.webdriver|disable-blink-features|stealth|flaresolverr/i);
});

test('current-tab relay state persists and category URLs use standard Discourse parameters', () => {
  const values = new Map();
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
  const state = { version: 1, phase: 'category', pageNumber: 0 };
  userscript.saveCurrentTabState(state, storage);
  assert.deepEqual(userscript.loadCurrentTabState(storage), state);
  userscript.clearCurrentTabState(storage);
  assert.equal(userscript.loadCurrentTabState(storage), null);

  const url = new URL(userscript.categoryNavigationUrl({ id: 36, slug: 'welfare' }, 2));
  assert.equal(url.pathname, '/c/welfare/36/l/latest');
  assert.equal(url.searchParams.get('order'), 'created');
  assert.equal(url.searchParams.get('ascending'), 'false');
  assert.equal(url.searchParams.get('page'), '2');
});
test('normal HTML parser treats an empty topic list as a successful page', () => {
  const html = `<script id="data-preloaded" type="application/json">${JSON.stringify({
    topic_list: JSON.stringify({ topic_list: { topics: [] } }),
  })}</script>`;
  assert.deepEqual(userscript.extractTopicsFromHtml(html), []);
});
test('userscript parses Discourse category RSS first-post content', () => {
  const xml = `<?xml version="1.0"?><rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><item>
    <title><![CDATA[Free AI benefits]]></title>
    <link>https://linux.do/t/free-ai-benefits/7001</link>
    <pubDate>Thu, 23 Jul 2026 01:00:00 GMT</pubDate>
    <content:encoded><![CDATA[<p>free AI account</p><a href="https://ai.example.com">site</a>]]></content:encoded>
  </item></channel></rss>`;
  const topics = userscript.parseRssFeed(xml);
  assert.equal(topics.length, 1);
  assert.equal(topics[0].id, 7001);
  assert.equal(topics[0].slug, 'free-ai-benefits');
  assert.equal(topics[0].title, 'Free AI benefits');
  assert.match(topics[0].cooked, /https:\/\/ai\.example\.com/);
  assert.equal(userscript.parseRssFeed('<title>Just a moment...</title>Cloudflare'), null);
});

test('valid RSS is not rejected when a topic mentions Cloudflare', () => {
  const xml = `<?xml version="1.0"?><rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><item>
    <title><![CDATA[Cloudflare usage discussion]]></title>
    <link>https://linux.do/t/cloudflare-usage/7002</link>
    <pubDate>Thu, 23 Jul 2026 01:00:00 GMT</pubDate>
    <content:encoded><![CDATA[<p>This normal topic mentions Cloudflare but is not a challenge page.</p>]]></content:encoded>
  </item></channel></rss>`;
  const topics = userscript.parseRssFeed(xml);
  assert.equal(topics.length, 1);
  assert.equal(topics[0].id, 7002);
  assert.match(topics[0].cooked, /Cloudflare/);
});
