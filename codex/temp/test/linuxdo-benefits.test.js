const test = require('node:test');
const assert = require('node:assert/strict');

const {
  WINDOW_MS,
  MAX_TOPICS,
  isWithinWindow,
  selectRecentTopics,
  parseCooked,
  classifyTopic,
  hasInviteRequirement,
  analyzeTopic,
  renderBenefitDocuments,
  loginSuccessSignal,
} = require('../linuxdo-benefits');

const NOW = new Date('2026-07-20T04:00:00.000Z');

test('48 小时窗口包含边界并排除更早或未来的主题', () => {
  assert.equal(isWithinWindow(new Date(NOW.getTime() - WINDOW_MS).toISOString(), NOW), true);
  assert.equal(isWithinWindow(new Date(NOW.getTime() - WINDOW_MS - 1).toISOString(), NOW), false);
  assert.equal(isWithinWindow(new Date(NOW.getTime() + 1).toISOString(), NOW), false);
  assert.equal(isWithinWindow('invalid', NOW), false);
});

test('解析首帖正文中的链接、纯文本 URL 和节点协议且不下载内容', () => {
  const parsed = parseCooked(`
    <p>订阅：<a href="https://sub.example.com/api/v1/client/subscribe?token=abc">点此获取</a></p>
    <pre><code>vless://uuid@example.com:443?security=tls#demo</code></pre>
    <p>官网 https://ai.example.com/</p>
  `);

  assert.match(parsed.text, /订阅/);
  assert.deepEqual(parsed.urls, [
    'https://sub.example.com/api/v1/client/subscribe?token=abc',
    'vless://uuid@example.com:443?security=tls#demo',
    'https://ai.example.com/',
  ]);
  assert.deepEqual(parsed.links[0], {
    text: '点此获取',
    url: 'https://sub.example.com/api/v1/client/subscribe?token=abc',
  });
});

test('按免费节点、AI 账号和 AI 公益站信号独立分类', () => {
  const node = classifyTopic(
    { title: '免费节点订阅分享', tags: ['福利羊毛', '节点'] },
    parseCooked('<p>公益机场，订阅地址自取 https://sub.example.com/sub</p>'),
  );
  assert.deepEqual(node, { node: true, account: false, publicSite: false });

  const account = classifyTopic(
    { title: '免费 ChatGPT 共享账号自取', tags: ['人工智能'] },
    parseCooked('<p>账号 test@example.com 密码 public-pass</p>'),
  );
  assert.deepEqual(account, { node: false, account: true, publicSite: false });

  const publicSite = classifyTopic(
    { title: 'Gemini 公益站，支持 LinuxDO 登录', tags: ['公益推广'] },
    parseCooked('<p><a href="https://ai.example.com">公益站地址</a></p>'),
  );
  assert.deepEqual(publicSite, { node: false, account: false, publicSite: true });

  const irrelevant = classifyTopic(
    { title: '如何部署 AI 网站教程', tags: ['开发调优'] },
    parseCooked('<p>这是付费服务的部署教程</p>'),
  );
  assert.deepEqual(irrelevant, { node: false, account: false, publicSite: false });
});

test('邀请码判断优先识别无需邀请码的否定表达', () => {
  assert.equal(hasInviteRequirement('注册需要邀请码，请在帖子里领取'), true);
  assert.equal(hasInviteRequirement('无需邀请码，直接使用 LinuxDO 登录'), false);
  assert.equal(hasInviteRequirement('不需要邀请代码，直接注册'), false);
  assert.equal(hasInviteRequirement('邀请码非必填，没有也能注册'), false);
});

test('分析主题时只保留首帖公开信息并生成三个类别的结构', () => {
  const topic = {
    id: 123,
    title: '免费 AI 公益站与共享账号，附节点订阅',
    created_at: '2026-07-20T03:00:00.000Z',
    tags: ['福利羊毛', '人工智能'],
  };
  const cooked = `
    <p>公益站支持 LinuxDO 登录，无需邀请码：</p>
    <p><a href="https://ai.example.com">Demo AI</a></p>
    <p>共享账号：demo@example.com</p>
    <p>密码：public-pass</p>
    <p>免费节点订阅：https://sub.example.com/subscribe/token</p>
  `;

  const result = analyzeTopic(topic, cooked);
  assert.equal(result.nodes.length, 1);
  assert.equal(result.accounts.length, 1);
  assert.equal(result.publicSites.length, 1);
  assert.equal(result.nodes[0].articleUrl, 'https://linux.do/t/topic/123');
  assert.deepEqual(result.nodes[0].addresses, [
    'https://ai.example.com/',
    'https://sub.example.com/subscribe/token',
  ]);
  assert.match(result.accounts[0].details.join('\n'), /demo@example\.com/);
  assert.equal(result.publicSites[0].siteName, 'Demo AI');
  assert.equal(result.publicSites[0].siteUrl, 'https://ai.example.com/');
  assert.equal(result.publicSites[0].requiresInvite, false);
});

test('Markdown 只为非空类别生成文件，按时间倒序并包含要求字段', () => {
  const documents = renderBenefitDocuments({
    nodes: [
      {
        topicId: 1,
        title: '较早节点',
        createdAt: '2026-07-19T03:00:00.000Z',
        articleUrl: 'https://linux.do/t/topic/1',
        addresses: ['https://sub.example.com/old'],
      },
      {
        topicId: 2,
        title: '较新节点',
        createdAt: '2026-07-20T03:00:00.000Z',
        articleUrl: 'https://linux.do/t/topic/2',
        addresses: ['vless://new-node'],
      },
    ],
    accounts: [],
    publicSites: [
      {
        topicId: 3,
        title: '公益站帖子',
        createdAt: '2026-07-20T02:00:00.000Z',
        articleUrl: 'https://linux.do/t/topic/3',
        siteName: '公益 AI',
        siteUrl: 'https://ai.example.com/',
        requiresInvite: true,
        status: '需邀请码',
        note: '首帖明确要求邀请码',
      },
    ],
  }, NOW);

  assert.deepEqual(Object.keys(documents).sort(), ['07月20日公益站.md', '07月20日节点.md']);
  assert.ok(documents['07月20日节点.md'].indexOf('较新节点') < documents['07月20日节点.md'].indexOf('较早节点'));
  assert.match(documents['07月20日节点.md'], /vless:\/\/new-node/);
  assert.match(documents['07月20日节点.md'], /https:\/\/linux\.do\/t\/topic\/2/);
  assert.match(documents['07月20日公益站.md'], /公益 AI/);
  assert.match(documents['07月20日公益站.md'], /需邀请码/);
});

test('登录状态判断只接受明确的已登录信号', () => {
  assert.equal(loginSuccessSignal('登录 注册 产品控制台 账户中心'), false);
  assert.equal(loginSuccessSignal('欢迎回来，demo 用户；退出登录'), true);
  assert.equal(loginSuccessSignal('Sign out'), true);
});
test('账号标签和值分行时保留紧随其后的公开值', () => {
  const result = analyzeTopic({
    id: 456,
    title: '免费 Claude 共享账号',
    created_at: '2026-07-20T03:00:00.000Z',
    tags: ['福利羊毛', '人工智能'],
  }, '<p>账号：</p><pre><code>demo@example.com</code></pre><p>密码：</p><pre><code>public-pass</code></pre>');

  assert.deepEqual(result.accounts[0].details, [
    '账号：',
    'demo@example.com',
    '密码：',
    'public-pass',
  ]);
});
test('每次最多读取 200 个唯一主题并按创建时间倒序', () => {
  const topics = Array.from({ length: 205 }, (_, index) => ({
    id: index + 1,
    created_at: new Date(Date.parse('2026-07-20T04:00:00.000Z') - index * 60_000).toISOString(),
  }));
  topics.push({ id: 1, created_at: '2026-07-20T03:59:00.000Z' });
  topics.push({ id: 999, created_at: '2026-07-18T03:59:00.000Z' });

  const result = selectRecentTopics(topics, NOW);

  assert.equal(MAX_TOPICS, 200);
  assert.equal(result.length, 200);
  assert.equal(result[0].id, 1);
  assert.equal(result.at(-1).id, 200);
  assert.equal(result.some(topic => topic.id === 999), false);
});