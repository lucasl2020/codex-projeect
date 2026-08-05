const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline/promises');
const { chromium } = require('playwright-core');

const ROOT = __dirname;
const BASE_URL = 'https://linux.do';
const CATEGORY_ID = 36;
const WINDOW_MS = 48 * 60 * 60 * 1000;
const MAX_TOPICS = 200;
const REQUEST_DELAY_MS = 800;
const PROFILE_DIR = process.env.LINUXDO_PROFILE_DIR || path.join(ROOT, 'linuxdo-browser-profile');
const OUTPUT_DIR = process.env.LINUXDO_OUTPUT_DIR || path.join(ROOT, 'outputs');
const STATE_FILE = process.env.LINUXDO_STATE_FILE || path.join(ROOT, 'linuxdo-state.json');
const HEADLESS = process.env.HEADLESS === '1';
const OAUTH_HOSTS = new Set(
  (process.env.LINUXDO_OAUTH_HOSTS || 'connect.linux.do')
    .split(',')
    .map(value => value.trim().toLowerCase())
    .filter(Boolean),
);

const FREE_TERMS = ['免费', '公益', '白嫖', '赠送', '送号', '自取', '共享', '福利'];
const NODE_TERMS = ['节点', '订阅', '机场', '代理', 'clash', 'vless', 'vmess', 'trojan', 'hysteria', 'tuic'];
const ACCOUNT_TERMS = ['账号', '账户', '共享号', '送号', '邮箱', '用户名', '密码', '自取', '领取'];
const AI_TERMS = [
  'ai', '人工智能', 'chatgpt', 'openai', 'claude', 'gemini', 'grok', 'cursor',
  'codex', 'deepseek', 'kimi', 'copilot', 'windsurf', 'kiro', '模型', '大模型',
];
const PUBLIC_SITE_TERMS = ['公益站', '公益 ai', '公益ai', '免费 ai 站', '免费ai站', '公益额度', '公益服务'];
const NEGATIVE_TERMS = ['求助', '求推荐', '讨论', '教程', '付费', '优惠', '拼车'];
const ACCOUNT_LINE_RE = /账号|账户|共享号|邮箱|e-?mail|用户名|user(?:name)?|密码|pass(?:word)?|口令|登录信息|领取|兑换|卡密|key/i;
const SUBSCRIPTION_SCHEMES_RE = /^(?:ssr?|vmess|vless|trojan|hysteria2?|tuic|snell|wireguard|clash):\/\//i;
const SUBSCRIPTION_URL_RE = /(?:\/sub(?:scribe|scription)?(?:\/|\?|$)|subscribe|subscription|client\/subscribe|clash|nodes?|proxy|token=)/i;
const IMAGE_OR_ATTACHMENT_RE = /\.(?:png|jpe?g|gif|webp|svg|ico|zip|rar|7z|tar|gz|pdf|docx?|xlsx?|apk|exe)(?:[?#]|$)/i;
const IGNORED_SITE_HOSTS = new Set([
  'linux.do', 'www.linux.do', 'connect.linux.do', 'github.com', 'www.github.com',
  't.me', 'telegram.me', 'discord.com', 'discord.gg', 'youtube.com', 'www.youtube.com',
]);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function log(scope, message) {
  console.log(`[${new Date().toLocaleString('zh-CN')}] [${scope}] ${message}`);
}

function containsAny(text, terms) {
  const normalized = String(text || '').toLowerCase();
  return terms.some(term => normalized.includes(term.toLowerCase()));
}

function decodeHtml(value) {
  const named = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
    ndash: '–', mdash: '—', hellip: '…', copy: '©', reg: '®',
  };
  return String(value || '')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => named[name.toLowerCase()] ?? match);
}

function cleanUrlCandidate(value) {
  return decodeHtml(value)
    .trim()
    .replace(/^[<（(\[]+/, '')
    .replace(/[>）)\],，。；;！!？?'"、]+$/g, '');
}

function normalizeUrl(value, baseUrl = BASE_URL) {
  const cleaned = cleanUrlCandidate(value);
  if (!cleaned) return null;
  if (SUBSCRIPTION_SCHEMES_RE.test(cleaned)) {
    try { return new URL(cleaned).toString(); } catch { return cleaned; }
  }
  if (!/^https?:\/\//i.test(cleaned) && !/^\//.test(cleaned)) return null;
  try {
    const url = new URL(cleaned, baseUrl);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function htmlToText(html) {
  return decodeHtml(
    String(html || '')
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<(?:br|hr)\s*\/?>/gi, '\n')
      .replace(/<\/(?:p|div|li|pre|code|blockquote|h[1-6]|tr|details|summary)>/gi, '\n')
      .replace(/<li\b[^>]*>/gi, '- ')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\r/g, '')
    .replace(/[\t ]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function parseCooked(cooked) {
  const links = [];
  const linkRe = /<a\b[^>]*\bhref=(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = linkRe.exec(String(cooked || ''))) !== null) {
    const url = normalizeUrl(match[1] || match[2] || match[3] || '');
    if (!url) continue;
    links.push({ text: htmlToText(match[4]) || url, url });
  }

  const text = htmlToText(cooked);
  const found = links.map(link => link.url);
  const addressRe = /(?:https?:\/\/|(?:ssr?|vmess|vless|trojan|hysteria2?|tuic|snell|wireguard|clash):\/\/)[^\s<>"'`]+/gi;
  while ((match = addressRe.exec(text)) !== null) {
    found.push(normalizeUrl(match[0]));
  }

  return {
    text,
    lines: text.split('\n').map(line => line.trim()).filter(Boolean),
    links: links.filter((link, index, all) => all.findIndex(item => item.url === link.url) === index),
    urls: unique(found),
  };
}

function isExternalHttpUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !['linux.do', 'www.linux.do'].includes(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function isUsableAddress(value) {
  if (!value || IMAGE_OR_ATTACHMENT_RE.test(value)) return false;
  return SUBSCRIPTION_SCHEMES_RE.test(value) || isExternalHttpUrl(value);
}

function isLikelySubscriptionUrl(value) {
  return SUBSCRIPTION_SCHEMES_RE.test(value) || SUBSCRIPTION_URL_RE.test(value);
}

function topicText(topic, parsed) {
  return [topic.title, ...(topic.tags || []), parsed.text].join('\n').toLowerCase();
}

function classifyTopic(topic, parsed) {
  const text = topicText(topic, parsed);
  const hasFree = containsAny(text, FREE_TERMS);
  const hasNode = containsAny(text, NODE_TERMS);
  const hasAccount = containsAny(text, ACCOUNT_TERMS);
  const hasAi = containsAny(text, AI_TERMS);
  const hasPublicSite = containsAny(text, PUBLIC_SITE_TERMS);
  const hasExternal = parsed.urls.some(isExternalHttpUrl);
  const negativeOnly = containsAny(text, NEGATIVE_TERMS) && !hasFree;

  return {
    node: !negativeOnly && hasFree && hasNode,
    account: !negativeOnly && hasFree && hasAccount && hasAi,
    publicSite: !negativeOnly && hasPublicSite && hasExternal && (hasAi || text.includes('公益站')),
  };
}

function hasInviteRequirement(text) {
  const value = String(text || '');
  if (/无需.{0,3}(?:邀请(?:码|代码)?|注册码)|不需要.{0,3}(?:邀请(?:码|代码)?|注册码)|免(?:邀请(?:码|代码)?|注册码)|(?:邀请(?:码|代码)?|注册码).{0,4}(?:非必填|选填|可选|可不填|不必填)/i.test(value)) {
    return false;
  }
  return /需要.{0,4}(?:邀请(?:码|代码)?|注册码)|(?:邀请(?:码|代码)?|注册码).{0,6}(?:必填|才能|注册|领取|获取)|凭邀请码/i.test(value);
}

function isWithinWindow(createdAt, now = new Date()) {
  const created = new Date(createdAt).getTime();
  const current = new Date(now).getTime();
  return Number.isFinite(created) && Number.isFinite(current) && created <= current && created >= current - WINDOW_MS;
}

function selectRecentTopics(topics, now = new Date(), limit = MAX_TOPICS) {
  const seen = new Set();
  return [...topics]
    .filter(topic => isWithinWindow(topic.created_at || topic.createdAt, now))
    .sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt))
    .filter(topic => !seen.has(topic.id) && seen.add(topic.id))
    .slice(0, limit);
}

function articleUrl(topic) {
  return `${BASE_URL}/t/topic/${topic.id}`;
}

function extractAccountDetails(parsed) {
  const details = [];
  const labelOnly = /^(?:账号|账户|共享号|邮箱|e-?mail|用户名|user(?:name)?|密码|pass(?:word)?|口令|登录信息|卡密|key)(?:如下)?\s*[:：]?\s*$/i;
  parsed.lines.forEach((line, index) => {
    if (ACCOUNT_LINE_RE.test(line)) details.push(line.slice(0, 500));
    if (labelOnly.test(line) && parsed.lines[index + 1]) details.push(parsed.lines[index + 1].slice(0, 500));
  });
  return unique(details);
}

function extractExternalUrls(parsed) {
  return unique(parsed.urls.filter(isExternalHttpUrl).filter(url => !IMAGE_OR_ATTACHMENT_RE.test(url)));
}

function siteCandidateScore(link) {
  let score = 0;
  if (!isLikelySubscriptionUrl(link.url)) score += 4;
  if (containsAny(link.text, ['公益', 'ai', '站', '官网', '地址', '登录'])) score += 3;
  try {
    const url = new URL(link.url);
    if (url.pathname === '/' || url.pathname === '') score += 2;
    if (IGNORED_SITE_HOSTS.has(url.hostname.toLowerCase())) score -= 20;
  } catch {
    score -= 20;
  }
  return score;
}

function choosePrimarySite(parsed) {
  const candidates = parsed.links
    .filter(link => isExternalHttpUrl(link.url) && !IMAGE_OR_ATTACHMENT_RE.test(link.url))
    .map((link, index) => ({ ...link, index, score: siteCandidateScore(link) }))
    .filter(link => link.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index);

  if (candidates.length) return candidates[0];
  const fallback = extractExternalUrls(parsed).find(url => !isLikelySubscriptionUrl(url));
  return fallback ? { text: '', url: fallback } : null;
}

function inferSiteName(topic, candidate) {
  const label = String(candidate?.text || '').trim();
  if (label && !/^(?:点击|点此|地址|链接|官网|进入|登录|注册|here)$/i.test(label)) return label.slice(0, 100);
  const cleaned = String(topic.title || '')
    .replace(/[【\[].*?[】\]]/g, ' ')
    .replace(/免费|公益站|公益|支持|linux\s*do|登录|注册|分享/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned) return cleaned.slice(0, 100);
  try { return new URL(candidate.url).hostname; } catch { return '未命名公益站'; }
}

function analyzeTopic(topic, cooked) {
  const parsed = parseCooked(cooked);
  const classification = classifyTopic(topic, parsed);
  const common = {
    topicId: topic.id,
    title: topic.title,
    createdAt: topic.created_at || topic.createdAt,
    articleUrl: articleUrl(topic),
  };
  const result = { nodes: [], accounts: [], publicSites: [] };

  if (classification.node) {
    result.nodes.push({ ...common, addresses: unique(parsed.urls.filter(isUsableAddress)) });
  }
  if (classification.account) {
    result.accounts.push({
      ...common,
      siteUrls: extractExternalUrls(parsed).filter(url => !isLikelySubscriptionUrl(url)),
      details: extractAccountDetails(parsed),
    });
  }
  if (classification.publicSite) {
    const candidate = choosePrimarySite(parsed);
    if (candidate) {
      result.publicSites.push({
        ...common,
        siteName: inferSiteName(topic, candidate),
        siteUrl: candidate.url,
        requiresInvite: hasInviteRequirement(parsed.text),
        status: hasInviteRequirement(parsed.text) ? '需邀请码' : '待确认',
        note: hasInviteRequirement(parsed.text) ? '首帖明确要求邀请码' : '',
      });
    }
  }
  return result;
}

function dateParts(date, timeZone = 'Asia/Shanghai') {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(date));
  return Object.fromEntries(parts.map(part => [part.type, part.value]));
}

function formatDayName(date) {
  const parts = dateParts(date);
  return `${parts.month}月${parts.day}日`;
}

function formatLocalTime(date) {
  const parts = dateParts(date);
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

function markdownText(value) {
  return String(value ?? '').replace(/\r?\n/g, ' ').trim();
}

function dedupeEntries(entries, keyOf) {
  const seen = new Set();
  return entries.filter(entry => {
    const key = keyOf(entry);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sortedEntries(entries) {
  return [...entries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function renderNodeDocument(entries, now) {
  const lines = [
    `# ${formatDayName(now)}节点`,
    '',
    `> 抓取时间：${formatLocalTime(now)}（Asia/Shanghai）`,
    '> 范围：主题创建时间位于本次运行前 48 小时内；脚本未访问或测试以下订阅地址。',
    '',
  ];
  sortedEntries(entries).forEach((entry, index) => {
    lines.push(`## ${index + 1}. ${markdownText(entry.title)}`, '');
    lines.push(`- 发布时间：${formatLocalTime(entry.createdAt)}`);
    lines.push(`- 原帖地址：${entry.articleUrl}`);
    if (entry.addresses?.length) {
      lines.push('- 地址：');
      entry.addresses.forEach(value => lines.push(`  - ${value}`));
    } else {
      lines.push('- 地址：首帖未发现可直接复制的地址，请查看原帖。');
    }
    lines.push('');
  });
  return `${lines.join('\n').trim()}\n`;
}

function renderAccountDocument(entries, now) {
  const lines = [
    `# ${formatDayName(now)}账号地址`,
    '',
    `> 抓取时间：${formatLocalTime(now)}（Asia/Shanghai）`,
    '> 仅保存作者在首帖中公开展示的信息；未读取回复、未下载附件、未尝试登录。',
    '',
  ];
  sortedEntries(entries).forEach((entry, index) => {
    lines.push(`## ${index + 1}. ${markdownText(entry.title)}`, '');
    lines.push(`- 发布时间：${formatLocalTime(entry.createdAt)}`);
    lines.push(`- 原帖地址：${entry.articleUrl}`);
    if (entry.siteUrls?.length) {
      lines.push('- 站点地址：');
      entry.siteUrls.forEach(value => lines.push(`  - ${value}`));
    }
    if (entry.details?.length) {
      lines.push('- 首帖公开信息：');
      entry.details.forEach(value => lines.push(`  - ${markdownText(value)}`));
    } else {
      lines.push('- 首帖公开信息：未发现结构化账号信息，请查看原帖。');
    }
    lines.push('');
  });
  return `${lines.join('\n').trim()}\n`;
}

function renderPublicSiteDocument(entries, now) {
  const lines = [
    `# ${formatDayName(now)}公益站`,
    '',
    `> 抓取时间：${formatLocalTime(now)}（Asia/Shanghai）`,
    '',
  ];
  sortedEntries(entries).forEach((entry, index) => {
    lines.push(`## ${index + 1}. ${markdownText(entry.siteName || entry.title)}`, '');
    lines.push(`- 帖子标题：${markdownText(entry.title)}`);
    lines.push(`- 发布时间：${formatLocalTime(entry.createdAt)}`);
    lines.push(`- 公益站地址：${entry.siteUrl}`);
    lines.push(`- 原帖地址：${entry.articleUrl}`);
    lines.push(`- 邀请码：${entry.requiresInvite ? '需要' : '未发现需要邀请码的明确提示'}`);
    lines.push(`- 处理状态：${entry.status || '待确认'}`);
    if (entry.note) lines.push(`- 说明：${markdownText(entry.note)}`);
    lines.push('');
  });
  return `${lines.join('\n').trim()}\n`;
}

function renderBenefitDocuments(benefits, now = new Date()) {
  const day = formatDayName(now);
  const nodes = dedupeEntries(benefits.nodes || [], entry => String(entry.topicId));
  const accounts = dedupeEntries(benefits.accounts || [], entry => String(entry.topicId));
  const publicSites = dedupeEntries(
    benefits.publicSites || [],
    entry => `${entry.topicId}|${normalizeUrl(entry.siteUrl) || entry.siteUrl}`,
  );
  const documents = {};
  if (nodes.length) documents[`${day}节点.md`] = renderNodeDocument(nodes, now);
  if (accounts.length) documents[`${day}账号地址.md`] = renderAccountDocument(accounts, now);
  if (publicSites.length) documents[`${day}公益站.md`] = renderPublicSiteDocument(publicSites, now);
  return documents;
}

function writeBenefitDocuments(benefits, now = new Date()) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const documents = renderBenefitDocuments(benefits, now);
  const expectedNames = [
    `${formatDayName(now)}节点.md`,
    `${formatDayName(now)}账号地址.md`,
    `${formatDayName(now)}公益站.md`,
  ];
  for (const name of expectedNames) {
    const target = path.join(OUTPUT_DIR, name);
    if (documents[name]) {
      fs.writeFileSync(target, documents[name], 'utf8');
      log('output', `已生成 ${target}`);
    } else if (fs.existsSync(target)) {
      fs.rmSync(target, { force: true });
      log('output', `当前 48 小时无对应结果，已移除旧文件 ${target}`);
    }
  }
  return documents;
}

function readState() {
  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    if (!state || typeof state !== 'object') return { sites: {} };
    state.sites ||= {};
    return state;
  } catch {
    return { sites: {} };
  }
}

function writeState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    process.env['PROGRAMFILES(X86)'] && path.join(process.env['PROGRAMFILES(X86)'], 'Google', 'Chrome', 'Application', 'chrome.exe'),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe'),
  ].filter(Boolean);
  const chromePath = candidates.find(candidate => fs.existsSync(candidate));
  if (!chromePath) throw new Error('未找到 Google Chrome；请安装 Chrome 或设置 CHROME_PATH。');
  return chromePath;
}

async function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

async function askYesNo(question) {
  const answer = await ask(`${question} [y/N] `);
  return /^(?:y|yes|是|确认)$/i.test(answer);
}

async function launchContext(headless = HEADLESS) {
  fs.mkdirSync(PROFILE_DIR, { recursive: true });
  return chromium.launchPersistentContext(PROFILE_DIR, {
    executablePath: findChrome(),
    headless,
    viewport: { width: 1440, height: 1000 },
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    acceptDownloads: false,
  });
}

async function pageFetchJson(page, requestPath) {
  const result = await page.evaluate(async url => {
    const response = await fetch(url, {
      credentials: 'include',
      headers: { accept: 'application/json', 'x-requested-with': 'XMLHttpRequest' },
    });
    const text = await response.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text.slice(0, 1000) }; }
    return { status: response.status, ok: response.ok, json };
  }, requestPath);
  if (!result.ok) {
    const detail = result.json?.errors?.join?.('; ') || result.json?.error || result.json?.raw || '';
    const error = new Error(`请求 ${requestPath} 失败：HTTP ${result.status}${detail ? `，${detail}` : ''}`);
    error.status = result.status;
    throw error;
  }
  return result.json;
}

async function openForumPage(context) {
  const page = context.pages()[0] || await context.newPage();
  page.setDefaultTimeout(30000);
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  return page;
}

async function currentForumUser(page) {
  try {
    const session = await pageFetchJson(page, '/session/current.json');
    return session?.current_user || session?.user || null;
  } catch {
    return null;
  }
}

async function ensureForumLogin(page, headless = HEADLESS) {
  const existing = await currentForumUser(page);
  if (existing) {
    log('login', `已复用 LinuxDO 登录：${existing.username || existing.name || '当前用户'}`);
    return existing;
  }
  if (headless) {
    throw new Error('当前专用浏览器会话未登录 LinuxDO；请先运行 npm run linuxdo:setup。');
  }
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await page.bringToFront();
  await ask('请在 Chrome 中完成 LinuxDO 登录和验证码，然后回到此窗口按 Enter：');
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const user = await currentForumUser(page);
  if (!user) throw new Error('仍未检测到 LinuxDO 登录状态，请重新运行 setup。');
  log('login', `登录成功：${user.username || user.name || '当前用户'}`);
  return user;
}

function discoverWelfareCategories(categories, rootId = CATEGORY_ID) {
  const all = Array.isArray(categories) ? categories : [];
  const selected = new Set([rootId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const category of all) {
      if (selected.has(category.parent_category_id) && !selected.has(category.id)) {
        selected.add(category.id);
        changed = true;
      }
    }
  }
  const result = all.filter(category => selected.has(category.id));
  if (!result.some(category => category.id === rootId)) {
    result.unshift({ id: rootId, slug: 'welfare', name: '福利羊毛' });
  }
  return result;
}

function topicArray(json) {
  return json?.topic_list?.topics || json?.topics || [];
}

async function fetchCategoryPage(page, category, pageNumber, routeCache) {
  const query = `order=created&ascending=false&page=${pageNumber}`;
  const slug = encodeURIComponent(category.slug || 'welfare');
  const candidates = [
    `/c/${slug}/${category.id}/l/latest.json?${query}`,
    `/c/${category.id}/l/latest.json?${query}`,
    `/c/${slug}/${category.id}.json?${query}`,
  ];
  const cached = routeCache.get(category.id);
  const routes = cached ? [cached.replace('{page}', String(pageNumber))] : candidates;
  let lastError;
  for (const route of routes) {
    try {
      const json = await pageFetchJson(page, route);
      if (!cached) routeCache.set(category.id, route.replace(`page=${pageNumber}`, 'page={page}'));
      return topicArray(json);
    } catch (error) {
      lastError = error;
      if (cached || ![400, 404].includes(error.status)) throw error;
    }
  }
  throw lastError || new Error(`无法读取分类 ${category.name || category.id}`);
}

async function collectRecentTopicSummaries(page, now = new Date()) {
  let categories;
  try {
    const data = await pageFetchJson(page, '/categories.json');
    categories = discoverWelfareCategories(data?.category_list?.categories, CATEGORY_ID);
  } catch (error) {
    log('scan', `读取分类列表失败，回退到福利羊毛主分类：${error.message}`);
    categories = [{ id: CATEGORY_ID, slug: 'welfare', name: '福利羊毛' }];
  }

  const routeCache = new Map();
  const byId = new Map();
  for (const category of categories) {
    log('scan', `扫描分类：${category.name || category.slug || category.id}`);
    let previousSignature = '';
    for (let pageNumber = 0; pageNumber < 30; pageNumber += 1) {
      const topics = await fetchCategoryPage(page, category, pageNumber, routeCache);
      if (!topics.length) break;
      const signature = topics.map(topic => topic.id).join(',');
      if (signature === previousSignature) break;
      previousSignature = signature;

      for (const topic of topics) {
        if (isWithinWindow(topic.created_at, now)) byId.set(topic.id, topic);
      }
      const unpinned = topics.filter(topic => !topic.pinned);
      const oldest = unpinned.reduce((minimum, topic) => {
        const time = new Date(topic.created_at).getTime();
        return Number.isFinite(time) ? Math.min(minimum, time) : minimum;
      }, Number.POSITIVE_INFINITY);
      if (oldest < now.getTime() - WINDOW_MS) break;
      await sleep(REQUEST_DELAY_MS);
    }
  }
  return selectRecentTopics(byId.values(), now);
}

async function collectBenefits(page, now = new Date()) {
  const topics = await collectRecentTopicSummaries(page, now);
  const benefits = { nodes: [], accounts: [], publicSites: [] };
  log('scan', `最近 48 小时按创建时间读取前 ${topics.length} 个候选主题（最多 200 个），开始读取首帖。`);
  let index = 0;
  for (const topic of topics) {
    index += 1;
    try {
      const json = await pageFetchJson(page, `/t/${topic.id}.json`);
      const firstPost = json?.post_stream?.posts?.find(post => post.post_number === 1)
        || json?.post_stream?.posts?.[0];
      if (!firstPost?.cooked) continue;
      const analyzed = analyzeTopic({ ...topic, title: json.title || topic.title }, firstPost.cooked);
      benefits.nodes.push(...analyzed.nodes);
      benefits.accounts.push(...analyzed.accounts);
      benefits.publicSites.push(...analyzed.publicSites);
      log('scan', `${index}/${topics.length} ${topic.title}`);
      await sleep(REQUEST_DELAY_MS);
    } catch (error) {
      log('scan', `跳过主题 ${topic.id}：${error.message}`);
    }
  }
  return benefits;
}

function originKey(value) {
  try { return new URL(value).origin.toLowerCase(); } catch { return String(value || '').toLowerCase(); }
}

function isAllowedOAuthUrl(value) {
  try { return OAUTH_HOSTS.has(new URL(value).hostname.toLowerCase()); } catch { return false; }
}

async function visibleActions(page) {
  return page.locator('a, button, [role="button"], input[type="submit"]').evaluateAll(elements => (
    elements.map((element, index) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const text = (element.innerText || element.value || element.getAttribute('aria-label') || element.title || '')
        .replace(/\s+/g, ' ')
        .trim();
      return {
        index,
        text,
        href: element.href || element.getAttribute('href') || '',
        visible: style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0,
      };
    }).filter(item => item.visible)
  ));
}

async function findLinuxdoAction(page) {
  const actions = await visibleActions(page);
  const candidates = actions.map(action => {
    const combined = `${action.text} ${action.href}`;
    let score = 0;
    if (/linux\s*do|linuxdo/i.test(action.text)) score += 6;
    if (/connect\.linux\.do/i.test(action.href)) score += 5;
    if (/登录|注册|login|sign\s*in|oauth|connect/i.test(combined)) score += 2;
    return { ...action, score };
  }).filter(action => action.score > 0).sort((a, b) => b.score - a.score);

  if (!candidates.length) return { status: 'missing' };
  if (candidates.length > 1 && candidates[0].score === candidates[1].score) {
    return { status: 'ambiguous', candidates: candidates.slice(0, 5) };
  }
  return {
    status: 'found',
    description: candidates[0],
    locator: page.locator('a, button, [role="button"], input[type="submit"]').nth(candidates[0].index),
  };
}

async function findAuthorizeAction(page) {
  const actions = await visibleActions(page);
  const candidates = actions.filter(action => /授权|允许|同意|继续|authorize|approve|allow|continue/i.test(action.text));
  if (candidates.length !== 1) return null;
  return page.locator('a, button, [role="button"], input[type="submit"]').nth(candidates[0].index);
}

async function bodyText(page) {
  return (await page.locator('body').innerText({ timeout: 10000 }).catch(() => '')).slice(0, 30000);
}

function loginSuccessSignal(text) {
  return /退出(?:登录|账号)|注销登录|登出|sign\s*out|log\s*out|logout/i.test(String(text || ''));
}

async function waitForOAuthOrReturn(page, popup, siteOrigin, visited, timeoutMs = 30000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const pages = [popup, page].filter(candidate => candidate && !candidate.isClosed());
    for (const candidate of pages) {
      const url = candidate.url();
      if (url) visited.add(url);
      if (isAllowedOAuthUrl(url)) return { stage: 'oauth', page: candidate };
      try {
        if (new URL(url).origin.toLowerCase() === siteOrigin && url !== 'about:blank') {
          if (loginSuccessSignal(await bodyText(candidate))) return { stage: 'returned', page: candidate };
        }
      } catch {}
    }
    if (popup?.isClosed()) return { stage: 'returned', page };
    await sleep(500);
  }
  return { stage: 'timeout', page: popup && !popup.isClosed() ? popup : page };
}

async function waitForSiteResult(page, popup, siteOrigin, timeoutMs = 30000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const candidates = [page, popup].filter(candidate => candidate && !candidate.isClosed());
    for (const candidate of candidates) {
      try {
        if (new URL(candidate.url()).origin.toLowerCase() !== siteOrigin) continue;
        const text = await bodyText(candidate);
        if (loginSuccessSignal(text)) return { success: true, page: candidate };
      } catch {}
    }
    if (popup?.isClosed()) {
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
      if (loginSuccessSignal(await bodyText(page))) return { success: true, page };
    }
    await sleep(750);
  }
  return { success: false, page: popup && !popup.isClosed() ? popup : page };
}

async function attemptPublicSite(context, entry, state, manualPages) {
  const key = originKey(entry.siteUrl);
  if (state.sites[key]?.status === '已登录/注册') {
    entry.status = '已处理无需重复';
    entry.note = `上次成功时间：${state.sites[key].updatedAt || '未知'}`;
    return;
  }
  if (entry.requiresInvite) {
    entry.status = '需邀请码';
    entry.note ||= '首帖明确要求邀请码';
    return;
  }
  if (HEADLESS) {
    entry.status = '需人工处理';
    entry.note = 'HEADLESS=1：已跳过第三方登录操作';
    return;
  }

  const confirmed = await askYesNo(`是否打开并尝试使用 LinuxDO 登录“${entry.siteName}”？\n站点：${entry.siteUrl}\n原帖：${entry.articleUrl}\n`);
  if (!confirmed) {
    entry.status = '用户跳过';
    entry.note = '未访问该第三方站点';
    return;
  }

  const sitePage = await context.newPage();
  sitePage.setDefaultTimeout(30000);
  let recordRequest = null;
  try {
    const response = await sitePage.goto(entry.siteUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    if (response && response.status() >= 400) throw new Error(`站点返回 HTTP ${response.status()}`);
    await sitePage.bringToFront();
    const text = await bodyText(sitePage);
    if (hasInviteRequirement(text)) {
      entry.requiresInvite = true;
      entry.status = '需邀请码';
      entry.note = '公益站注册页面明确要求邀请码';
      await sitePage.close().catch(() => {});
      return;
    }
    if (loginSuccessSignal(text)) {
      entry.status = '已登录/注册';
      entry.note = '打开站点时已处于登录状态';
      state.sites[key] = { status: entry.status, updatedAt: new Date().toISOString(), articleUrl: entry.articleUrl };
      writeState(state);
      await sitePage.close();
      return;
    }

    const action = await findLinuxdoAction(sitePage);
    if (action.status === 'missing') {
      entry.status = '需人工处理';
      entry.note = '未找到明确的 LinuxDO 登录入口';
      manualPages.push(sitePage);
      return;
    }
    if (action.status === 'ambiguous') {
      entry.status = '需人工处理';
      entry.note = '页面存在多个含义相同的 LinuxDO 登录入口，脚本未自动选择';
      manualPages.push(sitePage);
      return;
    }

    const visited = new Set([sitePage.url()]);
    recordRequest = request => {
      if (request.isNavigationRequest()) visited.add(request.url());
    };
    context.on('request', recordRequest);
    const popupPromise = sitePage.waitForEvent('popup', { timeout: 8000 }).catch(() => null);
    try {
      await action.locator.click({ timeout: 15000 });
    } catch (error) {
      throw new Error(`点击 LinuxDO 登录失败：${error.message}`);
    }
    const popup = await popupPromise;
    if (popup) {
      popup.setDefaultTimeout(30000);
      await popup.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
    }

    let stage = await waitForOAuthOrReturn(sitePage, popup, key, visited);
    if (stage.stage === 'oauth') {
      const oauthPage = stage.page;
      const authorize = await findAuthorizeAction(oauthPage);
      if (!authorize) {
        entry.status = '需人工处理';
        entry.note = '已到达 Linux DO Connect，但未找到唯一的授权按钮，可能需要验证码或手动确认';
        manualPages.push(oauthPage);
        return;
      }
      await authorize.click({ timeout: 15000 });
      stage = await waitForSiteResult(sitePage, popup, key);
      if (stage.success) {
        entry.status = '已登录/注册';
        entry.note = '已通过 LinuxDO OAuth 返回站点并检测到登录状态';
        state.sites[key] = { status: entry.status, updatedAt: new Date().toISOString(), articleUrl: entry.articleUrl };
        writeState(state);
        if (popup && !popup.isClosed()) await popup.close().catch(() => {});
        if (!sitePage.isClosed()) await sitePage.close().catch(() => {});
        return;
      }
    } else if (stage.stage === 'returned') {
      const result = await waitForSiteResult(sitePage, popup, key, 10000);
      if (result.success) {
        entry.status = '已登录/注册';
        entry.note = 'LinuxDO 登录已自动返回并检测到登录状态';
        state.sites[key] = { status: entry.status, updatedAt: new Date().toISOString(), articleUrl: entry.articleUrl };
        writeState(state);
        if (popup && !popup.isClosed()) await popup.close().catch(() => {});
        if (!sitePage.isClosed()) await sitePage.close().catch(() => {});
        return;
      }
    }

    const reachedOfficialOAuth = [...visited].some(isAllowedOAuthUrl);
    entry.status = '需人工处理';
    entry.note = reachedOfficialOAuth
      ? '已进入官方 OAuth 流程，但脚本无法明确确认注册成功'
      : '登录流程未经过允许的 Linux DO Connect 域名，脚本已停止';
    manualPages.push(stage.page || sitePage);
  } catch (error) {
    entry.status = '失败';
    entry.note = error.message;
    if (!sitePage.isClosed()) manualPages.push(sitePage);
  } finally {
    if (recordRequest) context.off('request', recordRequest);
  }
}

async function processPublicSites(context, entries) {
  const state = readState();
  const manualPages = [];
  for (const entry of entries) {
    await attemptPublicSite(context, entry, state, manualPages);
  }
  return manualPages.filter((page, index, all) => page && !page.isClosed() && all.indexOf(page) === index);
}

async function runSetup() {
  let context;
  try {
    context = await launchContext(false);
    const page = await openForumPage(context);
    await ensureForumLogin(page, false);
    log('setup', `LinuxDO 专用会话已保存到：${PROFILE_DIR}`);
  } finally {
    if (context) await context.close().catch(() => {});
  }
}

async function runScan() {
  const now = new Date();
  let context;
  let manualPages = [];
  try {
    context = await launchContext();
    const page = await openForumPage(context);
    await ensureForumLogin(page);

    const benefits = await collectBenefits(page, now);
    manualPages = await processPublicSites(context, benefits.publicSites);
    const documents = writeBenefitDocuments(benefits, now);

    log(
      'done',
      `节点 ${benefits.nodes.length} 条，AI 账号 ${benefits.accounts.length} 条，公益站 ${benefits.publicSites.length} 条。`,
    );
    const names = Object.keys(documents);
    log('done', names.length ? `输出目录：${OUTPUT_DIR}；文件：${names.join('、')}` : '最近 48 小时没有匹配结果。');

    if (manualPages.length) {
      for (const manualPage of manualPages) {
        await manualPage.bringToFront().catch(() => {});
      }
      await ask(`有 ${manualPages.length} 个页面需要人工确认或处理。处理完后回到此窗口按 Enter 关闭浏览器：`);
    }
  } finally {
    if (context) await context.close().catch(() => {});
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || (args.length === 1 && args[0] === '--scan')) {
    await runScan();
    return;
  }
  if (args.length === 1 && args[0] === '--setup') {
    await runSetup();
    return;
  }
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) {
    console.log('用法：node linuxdo-benefits.js [--setup|--scan]');
    return;
  }
  throw new Error(`未知参数：${args.join(' ')}`);
}

module.exports = {
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
};

if (require.main === module) {
  main().catch(error => {
    console.error(`[fatal] ${error.stack || error.message}`);
    process.exitCode = 1;
  });
}
