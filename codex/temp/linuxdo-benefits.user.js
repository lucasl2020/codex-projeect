// ==UserScript==
// @name         LinuxDO 福利抓取（普通浏览器）
// @namespace    local.linuxdo.benefits
// @version      1.9.1
// @description  在已登录的普通浏览器会话中抓取最近48小时福利，最多读取200个主题。
// @match        https://linux.do/c/*
// @match        https://linux.do/t/*
// @noframes
// @run-at       document-idle
// @grant        GM_registerMenuCommand
// ==/UserScript==
(function () {
'use strict';
const USERSCRIPT_VERSION = '1.9.1';

const BASE_URL = 'https://linux.do';
const CATEGORY_ID = 36;
const WINDOW_MS = 48 * 60 * 60 * 1000;
const MAX_TOPICS = 200;
const REQUEST_DELAY_MS = 800;
const CURRENT_TAB_STORAGE_KEY = 'linuxdo-benefits-current-tab-v1';
const CURRENT_TAB_DELAY_MS = 5000;
const CURRENT_TAB_BATCH_SIZE = 20;
const CURRENT_TAB_AUTORUN_HASH = '#linuxdo-benefits-authenticated';
const CURRENT_TAB_AUTORUN_PARAM = 'linuxdo_benefits_authenticated';
const CURRENT_TAB_AUTORUN_PENDING_KEY = 'linuxdo-benefits-authenticated-pending-v1';
const PUBLIC_RSS_URL = 'https://linuxdorss.longpink.com/welfare.xml';
const PUBLIC_RSS_CACHE_KEY = 'linuxdo-benefits-public-rss-cache-v1';
const MAX_CATEGORY_PAGES = 30;
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

const CLOUDFLARE_CHALLENGE_RE = /cf-chl|challenge-platform|cdn-cgi\/challenge|just a moment|checking your browser|verify you are human|performing security verification|turnstile|\u9a8c\u8bc1\u60a8\u662f\u771f\u4eba|\u5b89\u5168\u68c0\u67e5|\u8bf7\u7a0d\u5019|\u6b63\u5728\u9a8c\u8bc1/i;
const CLOUDFLARE_ERROR_RE = /ray id|attention required|access denied|error 10\d\d/i;

function looksLikeCloudflareChallenge(value) {
  const text = String(value || '');
  return CLOUDFLARE_CHALLENGE_RE.test(text)
    || (/cloudflare/i.test(text) && CLOUDFLARE_ERROR_RE.test(text));
}

function isCloudflareChallengeError(error) {
  return Boolean(error?.cloudflareChallenge) || looksLikeCloudflareChallenge(error?.message);
}

function shouldInstallLauncher(locationLike, title = '', bodyText = '') {
  const href = String(locationLike?.href || '');
  let pathname = String(locationLike?.pathname || '');
  if (!pathname && href) {
    try { pathname = new URL(href).pathname; } catch { pathname = ''; }
  }
  if (!/^\/c\//.test(pathname)) return false;
  return !looksLikeCloudflareChallenge(`${href}\n${title}\n${bodyText}`);
}

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

function parseJsonScripts(html) {
  const payloads = [];
  const scriptRe = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRe.exec(String(html || ''))) !== null) {
    const attributes = match[1] || '';
    if (!/\bid\s*=\s*["']data-preloaded["']/i.test(attributes)
      && !/\btype\s*=\s*["']application\/json["']/i.test(attributes)) continue;
    const text = String(match[2] || '').trim();
    if (!text) continue;
    try {
      payloads.push(JSON.parse(text));
    } catch {
      try { payloads.push(JSON.parse(decodeHtml(text))); } catch { /* ignore unrelated JSON scripts */ }
    }
  }
  return payloads;
}

function walkPayload(value, visit, depth = 0, seen = new Set()) {
  if (depth > 10 || value == null) return;
  if (typeof value === 'string') {
    const text = value.trim();
    if (!/^[{\[]/.test(text)) return;
    try { walkPayload(JSON.parse(text), visit, depth + 1, seen); } catch { /* not nested JSON */ }
    return;
  }
  if (typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);
  visit(value);
  if (Array.isArray(value)) {
    value.forEach(item => walkPayload(item, visit, depth + 1, seen));
  } else {
    Object.values(value).forEach(item => walkPayload(item, visit, depth + 1, seen));
  }
}

function extractTopicsFromHtml(html) {
  let found = null;
  for (const payload of parseJsonScripts(html)) {
    walkPayload(payload, value => {
      if (found !== null) return;
      if (Array.isArray(value?.topic_list?.topics)) found = value.topic_list.topics;
      else if (Array.isArray(value?.topics)
        && value.topics.every(item => !item || typeof item === 'object')) found = value.topics;
    });
    if (found !== null) break;
  }
  return found;
}

function extractTopicFromHtml(html) {
  let result = null;
  for (const payload of parseJsonScripts(html)) {
    walkPayload(payload, value => {
      if (result) return;
      const posts = value?.post_stream?.posts;
      if (!Array.isArray(posts)) return;
      const firstPost = posts.find(post => post?.post_number === 1) || posts[0];
      if (firstPost?.cooked) result = { title: value.title || '', firstPost };
    });
    if (result) break;
  }
  return result;
}

function extractCategoriesFromHtml(html) {
  let found = null;
  for (const payload of parseJsonScripts(html)) {
    walkPayload(payload, value => {
      if (found !== null) return;
      const categoryList = value?.category_list?.categories;
      if (Array.isArray(categoryList)) found = categoryList;
      else if (Array.isArray(value?.categories)
        && value.categories.every(item => item && typeof item === 'object' && 'id' in item)) found = value.categories;
    });
    if (found !== null) break;
  }
  return found;
}

function unwrapXmlValue(value) {
  const raw = String(value || '').trim();
  const cdata = raw.match(/^<!\[CDATA\[([\s\S]*)\]\]>$/i);
  return decodeHtml(cdata ? cdata[1] : raw);
}

function extractXmlTag(xml, names) {
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = String(xml || '').match(new RegExp(`<${escaped}\\b[^>]*>([\\s\\S]*?)<\\/${escaped}>`, 'i'));
    if (match) return unwrapXmlValue(match[1]);
  }
  return '';
}

function parseRssFeed(xml) {
  const source = String(xml || '');
  if (!/^\s*(?:<\?xml\b[^>]*>\s*)?<(?:rss|feed)\b/i.test(source)) return null;
  const topics = [];
  const itemRe = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRe.exec(source)) !== null) {
    const item = match[1];
    const topicUrl = normalizeUrl(extractXmlTag(item, ['link', 'guid']));
    if (!topicUrl) continue;
    let parsedUrl;
    try { parsedUrl = new URL(topicUrl); } catch { continue; }
    const topicMatch = parsedUrl.pathname.match(/^\/t\/([^/]+)\/(\d+)(?:\/|$)|^\/t\/(\d+)(?:\/|$)/);
    if (!topicMatch) continue;
    const id = Number(topicMatch[2] || topicMatch[3]);
    if (!Number.isInteger(id)) continue;
    const cooked = extractXmlTag(item, ['content:encoded', 'description']);
    topics.push({
      id,
      slug: topicMatch[1] || 'topic',
      title: htmlToText(extractXmlTag(item, ['title'])),
      created_at: extractXmlTag(item, ['pubDate', 'published', 'updated']),
      pinned: false,
      tags: [],
      cooked,
    });
  }
  return topics;
}

function publicRssStorage(storage) {
  if (storage) return storage;
  try { return typeof window !== 'undefined' ? window.localStorage : null; } catch { return null; }
}

function loadPublicRssCache(storage) {
  const target = publicRssStorage(storage);
  if (!target) return [];
  try {
    const cached = JSON.parse(target.getItem(PUBLIC_RSS_CACHE_KEY) || 'null');
    return cached?.version === 1 && Array.isArray(cached.topics) ? cached.topics : [];
  } catch {
    return [];
  }
}

function savePublicRssCache(topics, storage) {
  const target = publicRssStorage(storage);
  if (!target) return false;
  try {
    target.setItem(PUBLIC_RSS_CACHE_KEY, JSON.stringify({ version: 1, topics }));
    return true;
  } catch {
    return false;
  }
}

function mergePublicRssTopics(liveTopics, cachedTopics, now = new Date()) {
  const byId = new Map((cachedTopics || []).map(topic => [topic.id, topic]));
  for (const topic of liveTopics || []) byId.set(topic.id, topic);
  return selectRecentTopics(byId.values(), now, MAX_TOPICS);
}

async function fetchPublicRssTopics() {
  const response = await fetch(PUBLIC_RSS_URL, {
    mode: 'cors',
    credentials: 'omit',
    cache: 'no-store',
    referrerPolicy: 'no-referrer',
    headers: { Accept: 'application/rss+xml,application/xml,text/xml;q=0.9,*/*;q=0.8' },
  });
  const text = await response.text();
  const topics = parseRssFeed(text);
  if (!response.ok || topics === null) throw new Error(`公开 RSS 请求失败：HTTP ${response.status}`);
  if (!topics.length) throw new Error('公开 RSS 当前没有可解析的主题');
  return topics;
}

async function collectBenefitsFromPublicRss(now, report = () => {}) {
  report('正在读取第三方公开只读 RSS；不会发送 LinuxDO Cookie，也不会访问主题页。');
  const liveTopics = await fetchPublicRssTopics();
  const topics = mergePublicRssTopics(liveTopics, loadPublicRssCache(), now);
  const cacheSaved = savePublicRssCache(topics);
  const benefits = { nodes: [], accounts: [], publicSites: [] };
  for (const topic of topics) {
    const analyzed = analyzeTopic(topic, topic.cooked);
    benefits.nodes.push(...analyzed.nodes);
    benefits.accounts.push(...analyzed.accounts);
    benefits.publicSites.push(...analyzed.publicSites);
  }

  const times = topics
    .map(topic => new Date(topic.created_at || topic.createdAt).getTime())
    .filter(Number.isFinite);
  const oldest = times.length ? new Date(Math.min(...times)) : null;
  const coverageHours = oldest ? Math.max(0, (new Date(now).getTime() - oldest.getTime()) / 3600000) : 0;
  let sourceNotice = '数据来自第三方公开只读 RSS（linuxdorss.longpink.com）。请求不携带 LinuxDO Cookie，但该服务会像普通网站一样看到你的 IP 和浏览器信息。';
  if (coverageHours < 47 && topics.length < MAX_TOPICS) {
    sourceNotice += ` 当前公开源与本地缓存合并后约覆盖 ${coverageHours.toFixed(1)} 小时，首次运行可能不足完整48小时；以后定期运行可由本地缓存逐步补齐。`;
  }
  if (!cacheSaved) sourceNotice += ' 当前浏览器未能保存本地缓存。';
  benefits.sourceNotice = sourceNotice;
  report(`公开 RSS 已解析 ${topics.length} 个主题（最多 ${MAX_TOPICS} 个），无需逐页访问 LinuxDO。`);
  return benefits;
}
async function fetchRss(requestPath) {
  const response = await fetch(new URL(requestPath, BASE_URL), {
    credentials: 'include',
    headers: { Accept: 'application/rss+xml,application/xml,text/xml;q=0.9,*/*;q=0.8' },
  });
  const text = await response.text();
  const topics = parseRssFeed(text);
  if (!response.ok || topics === null) {
    const challenged = looksLikeCloudflareChallenge(text);
    const message = challenged
      ? `RSS Cloudflare challenge (HTTP ${response.status}, request: ${requestPath})`
      : `RSS request failed: HTTP ${response.status} ${requestPath}`;
    const error = new Error(message);
    error.status = response.status;
    error.cloudflareChallenge = challenged;
    throw error;
  }
  return topics;
}

async function fetchCategoryRss(category) {
  const slug = encodeURIComponent(category.slug || 'welfare');
  const routes = [
    `/c/${slug}/${category.id}.rss?order=created`,
    `/c/${category.id}.rss?order=created`,
    `/c/${slug}.rss?order=created`,
  ];
  let lastError;
  for (const route of routes) {
    try {
      return await fetchRss(route);
    } catch (error) {
      lastError = error;
      if (![400, 404].includes(error.status)) throw error;
    }
  }
  throw lastError || new Error(`RSS category unavailable: ${category.id}`);
}

async function collectBenefitsFromRss(now, report = () => {}) {
  const pageHtml = typeof document === 'undefined' ? '' : document.documentElement?.outerHTML || '';
  const categories = discoverWelfareCategories(
    extractCategoriesFromHtml(pageHtml) || [{ id: CATEGORY_ID, slug: 'welfare', name: 'welfare' }],
    CATEGORY_ID,
  );
  const byId = new Map();
  for (const category of categories) {
    report(`RSS: ${category.name || category.slug || category.id}`);
    const topics = await fetchCategoryRss(category);
    for (const topic of topics) {
      if (topic.cooked && isWithinWindow(topic.created_at, now)) byId.set(topic.id, topic);
    }
  }

  const topics = selectRecentTopics(byId.values(), now);
  const benefits = { nodes: [], accounts: [], publicSites: [] };
  for (const topic of topics) {
    const analyzed = analyzeTopic(topic, topic.cooked);
    benefits.nodes.push(...analyzed.nodes);
    benefits.accounts.push(...analyzed.accounts);
    benefits.publicSites.push(...analyzed.publicSites);
  }
  report(`RSS parsed ${topics.length} topics (max ${MAX_TOPICS})`);
  return benefits;
}
async function fetchJson(requestPath) {
  const response = await fetch(new URL(requestPath, BASE_URL), {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  const text = await response.text();
  const contentType = response.headers.get('content-type') || '';
  const challenged = looksLikeCloudflareChallenge(text);
  if (!response.ok || !contentType.includes('json')) {
    const message = challenged
      ? `当前普通浏览器会话仍被 Cloudflare 挑战（HTTP ${response.status}，请求：${requestPath}）。脚本不会也不能破解验证。请先处理浏览器、网络或 IP 问题。`
      : `请求失败：HTTP ${response.status} ${requestPath}`;
    const error = new Error(message);
    error.status = response.status;
    error.cloudflareChallenge = challenged;
    throw error;
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`返回内容不是有效 JSON：${requestPath}`);
  }
}

async function fetchHtml(requestPath) {
  const response = await fetch(new URL(requestPath, BASE_URL), {
    credentials: 'include',
    headers: { Accept: 'text/html,application/xhtml+xml' },
  });
  const text = await response.text();
  const contentType = response.headers.get('content-type') || '';
  if (!response.ok || !contentType.includes('html')) {
    const challenged = looksLikeCloudflareChallenge(text);
    const message = challenged
      ? `\u666e\u901a HTML \u9875\u9762\u4e5f\u88ab Cloudflare \u6311\u6218\uff08HTTP ${response.status}\uff0c\u8bf7\u6c42\uff1a${requestPath}\uff09\u3002\u8bf7\u5148\u5728\u5f53\u524d\u6d4f\u89c8\u5668\u624b\u52a8\u5b8c\u6210\u9a8c\u8bc1\u3002`
      : `\u666e\u901a\u9875\u9762\u8bf7\u6c42\u5931\u8d25\uff1aHTTP ${response.status} ${requestPath}`;
    const error = new Error(message);
    error.status = response.status;
    error.cloudflareChallenge = challenged;
    throw error;
  }
  return text;
}

async function fetchCategoryHtmlPage(category, pageNumber) {
  const query = `order=created&ascending=false&page=${pageNumber}`;
  const slug = encodeURIComponent(category.slug || 'welfare');
  const routes = [
    `/c/${slug}/${category.id}/l/latest?${query}`,
    `/c/${category.id}/l/latest?${query}`,
    `/c/${slug}/${category.id}?${query}`,
  ];
  let lastError;
  for (const route of routes) {
    try {
      const topics = extractTopicsFromHtml(await fetchHtml(route));
      if (topics !== null) return topics;
      lastError = new Error(`\u666e\u901a\u5206\u7c7b\u9875\u672a\u53d1\u73b0 Discourse \u4e3b\u9898\u6570\u636e\uff1a${route}`);
    } catch (error) {
      lastError = error;
      if (isCloudflareChallengeError(error) || ![400, 404].includes(error.status)) throw error;
    }
  }
  throw lastError || new Error(`\u65e0\u6cd5\u8bfb\u53d6\u666e\u901a\u5206\u7c7b\u9875 ${category.name || category.id}`);
}

async function fetchTopicHtml(topic) {
  const slug = encodeURIComponent(topic.slug || 'topic');
  const routes = [`/t/${slug}/${topic.id}`, `/t/${topic.id}`];
  let lastError;
  for (const route of routes) {
    try {
      const result = extractTopicFromHtml(await fetchHtml(route));
      if (result) return result;
      lastError = new Error(`\u666e\u901a\u4e3b\u9898\u9875\u672a\u53d1\u73b0\u9996\u5e16\u6570\u636e\uff1a${route}`);
    } catch (error) {
      lastError = error;
      if (isCloudflareChallengeError(error) || ![400, 404].includes(error.status)) throw error;
    }
  }
  throw lastError || new Error(`\u65e0\u6cd5\u8bfb\u53d6\u4e3b\u9898 ${topic.id}`);
}

async function fetchCategoryPage(category, pageNumber, routeCache) {
  const htmlModeKey = `html:${category.id}`;
  if (routeCache.get(htmlModeKey)) return fetchCategoryHtmlPage(category, pageNumber);

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
      const json = await fetchJson(route);
      if (!cached) routeCache.set(category.id, route.replace(`page=${pageNumber}`, 'page={page}'));
      return topicArray(json);
    } catch (error) {
      lastError = error;
      if (isCloudflareChallengeError(error)) break;
      if (cached || ![400, 404].includes(error.status)) break;
    }
  }

  routeCache.set(htmlModeKey, true);
  try {
    return await fetchCategoryHtmlPage(category, pageNumber);
  } catch (htmlError) {
    throw htmlError;
  }
}

async function collectRecentTopicSummaries(now, report = () => {}) {
  let categories;
  try {
    const data = await fetchJson('/categories.json');
    categories = discoverWelfareCategories(data?.category_list?.categories, CATEGORY_ID);
  } catch (error) {
    report(`\u5206\u7c7b JSON \u63a5\u53e3\u4e0d\u53ef\u7528\uff0c\u6539\u7528\u666e\u901a HTML \u9875\u9762\uff1a${error.message}`);
    categories = [{ id: CATEGORY_ID, slug: 'welfare', name: '\u798f\u5229\u7f8a\u6bdb' }];
  }

  const routeCache = new Map();
  const byId = new Map();
  for (const category of categories) {
    report(`扫描分类：${category.name || category.slug || category.id}`);
    let previousSignature = '';
    for (let pageNumber = 0; pageNumber < 30; pageNumber += 1) {
      const topics = await fetchCategoryPage(category, pageNumber, routeCache);
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

async function collectBenefits(now, report = () => {}) {
  try {
    report('\u4f18\u5148\u5c1d\u8bd5 Discourse \u5b98\u65b9 RSS\uff08\u8bf7\u6c42\u66f4\u5c11\uff09');
    return await collectBenefitsFromRss(now, report);
  } catch (error) {
    report(`RSS \u4e0d\u53ef\u7528\uff0c\u6539\u7528\u666e\u901a\u5206\u7c7b/\u4e3b\u9898\u8bfb\u53d6\uff1a${error.message}`);
  }

  const topics = await collectRecentTopicSummaries(now, report);
  const benefits = { nodes: [], accounts: [], publicSites: [] };
  let useHtmlMode = false;
  report(`\u51c6\u5907\u8bfb\u53d6 ${topics.length} \u4e2a\u5019\u9009\u4e3b\u9898\u7684\u9996\u5e16\uff08\u6700\u591a 200 \u4e2a\uff09`);
  for (let index = 0; index < topics.length; index += 1) {
    const topic = topics[index];
    try {
      let title = topic.title;
      let firstPost;
      if (!useHtmlMode) {
        try {
          const json = await fetchJson(`/t/${topic.id}.json`);
          title = json.title || title;
          firstPost = json?.post_stream?.posts?.find(post => post.post_number === 1)
            || json?.post_stream?.posts?.[0];
        } catch (error) {
          if (!isCloudflareChallengeError(error)) throw error;
          useHtmlMode = true;
          report(`\u4e3b\u9898 JSON \u63a5\u53e3\u88ab\u6311\u6218\uff0c\u540e\u7eed\u6539\u7528\u666e\u901a HTML \u9875\u9762`);
        }
      }
      if (useHtmlMode && !firstPost) {
        const htmlTopic = await fetchTopicHtml(topic);
        title = htmlTopic.title || title;
        firstPost = htmlTopic.firstPost;
      }
      if (firstPost?.cooked) {
        const analyzed = analyzeTopic({ ...topic, title }, firstPost.cooked);
        benefits.nodes.push(...analyzed.nodes);
        benefits.accounts.push(...analyzed.accounts);
        benefits.publicSites.push(...analyzed.publicSites);
      }
      report(`${index + 1}/${topics.length}\uff1a${topic.title}`);
      await sleep(REQUEST_DELAY_MS);
    } catch (error) {
      if (isCloudflareChallengeError(error)) throw error;
      report(`\u8df3\u8fc7\u4e3b\u9898 ${topic.id}\uff1a${error.message}`);
    }
  }
  return benefits;
}


function currentTabStorage(storage) {
  if (storage) return storage;
  try { return typeof window !== 'undefined' ? window.sessionStorage : null; } catch { return null; }
}

function hasCurrentTabAutorunPending(storage) {
  try { return currentTabStorage(storage)?.getItem(CURRENT_TAB_AUTORUN_PENDING_KEY) === '1'; } catch { return false; }
}

function setCurrentTabAutorunPending(value, storage) {
  try {
    const target = currentTabStorage(storage);
    if (!target) return;
    if (value) target.setItem(CURRENT_TAB_AUTORUN_PENDING_KEY, '1');
    else target.removeItem(CURRENT_TAB_AUTORUN_PENDING_KEY);
  } catch {
    // 某些隐私模式会禁用 sessionStorage；地址 hash 仍可作为一次性兜底标记。
  }
}

function loadCurrentTabState(storage) {
  const target = currentTabStorage(storage);
  if (!target) return null;
  try {
    const state = JSON.parse(target.getItem(CURRENT_TAB_STORAGE_KEY) || 'null');
    return state?.version === 1 ? state : null;
  } catch {
    return null;
  }
}

function saveCurrentTabState(state, storage) {
  const target = currentTabStorage(storage);
  if (!target) throw new Error('\u5f53\u524d\u6d4f\u89c8\u5668\u4e0d\u5141\u8bb8\u4f7f\u7528 sessionStorage');
  target.setItem(CURRENT_TAB_STORAGE_KEY, JSON.stringify(state));
}

function clearCurrentTabState(storage) {
  currentTabStorage(storage)?.removeItem(CURRENT_TAB_STORAGE_KEY);
}

function categoryNavigationUrl(category, pageNumber) {
  const slug = encodeURIComponent(category.slug || 'welfare');
  const url = new URL(`/c/${slug}/${category.id}/l/latest`, BASE_URL);
  url.searchParams.set('order', 'created');
  url.searchParams.set('ascending', 'false');
  url.searchParams.set('page', String(pageNumber));
  return url.toString();
}

function topicNavigationUrl(topic) {
  return new URL(`/t/${encodeURIComponent(topic.slug || 'topic')}/${topic.id}`, BASE_URL).toString();
}

function isExpectedCategoryLocation(locationLike, category, pageNumber) {
  const current = new URL(locationLike.href || String(locationLike));
  const expected = new URL(categoryNavigationUrl(category, pageNumber));
  return current.pathname === expected.pathname
    && current.searchParams.get('order') === 'created'
    && current.searchParams.get('ascending') === 'false'
    && Number(current.searchParams.get('page') || 0) === pageNumber;
}

function isExpectedTopicLocation(locationLike, topic) {
  const current = new URL(locationLike.href || String(locationLike));
  return new RegExp(`/t/(?:[^/]+/)?${topic.id}(?:/|$)`).test(current.pathname);
}

function samePageUrl(first, second) {
  try {
    const a = new URL(first);
    const b = new URL(second);
    return a.origin === b.origin && a.pathname === b.pathname && a.search === b.search;
  } catch {
    return false;
  }
}

function installCurrentTabCancel(state) {
  let cancel = document.getElementById('linuxdo-benefits-current-tab-cancel');
  if (cancel) return cancel;
  cancel = createElement('button', {
    id: 'linuxdo-benefits-current-tab-cancel',
    textContent: '\u53d6\u6d88\u63a5\u529b\u6293\u53d6',
    onclick: () => {
      clearCurrentTabState();
      const returnUrl = state.returnUrl || `${BASE_URL}/c/welfare/${CATEGORY_ID}/l/latest`;
      if (samePageUrl(window.location.href, returnUrl)) window.location.reload();
      else window.location.assign(returnUrl);
    },
  });
  cancel.style.cssText = 'position:fixed;right:16px;bottom:108px;z-index:2147483647;background:#b3261e;color:#fff;border:0;border-radius:7px;padding:8px 12px;cursor:pointer;font:13px sans-serif';
  document.body.append(cancel);
  return cancel;
}

function installCurrentTabContinue() {
  let button = document.getElementById('linuxdo-benefits-current-tab-continue');
  if (button) return button;
  button = createElement('button', {
    id: 'linuxdo-benefits-current-tab-continue',
    textContent: '\u7ee7\u7eed\u8bfb\u53d6\u4e0b\u4e00\u6279',
    onclick: () => {
      const latest = loadCurrentTabState();
      if (!latest) {
        button.remove();
        return;
      }
      button.disabled = true;
      button.textContent = '\u6b63\u5728\u7ee7\u7eed\u2026';
      latest.pausedForBatch = false;
      scheduleCurrentTabNavigation(latest, `\u7ee7\u7eed\u4f4e\u9891\u8bfb\u53d6\uff1a${latest.topicIndex + 1}/${latest.topics.length}`);
    },
  });
  button.style.cssText = 'position:fixed;right:16px;bottom:150px;z-index:2147483647;background:#137333;color:#fff;border:0;border-radius:7px;padding:9px 13px;cursor:pointer;font:13px sans-serif';
  document.body.append(button);
  return button;
}

function reportCurrentTab(state, message) {
  const status = installStatus();
  status.style.display = 'block';
  status.textContent = message;
  installCurrentTabCancel(state);
  console.log('[LinuxDO\u5f53\u524d\u6807\u7b7e\u9875\u6a21\u5f0f]', message);
}

function nextStateUrl(state) {
  if (state.phase === 'category') return categoryNavigationUrl(state.categories[state.categoryIndex], state.pageNumber);
  if (state.phase === 'topic') return topicNavigationUrl(state.topics[state.topicIndex]);
  return state.returnUrl;
}

function scheduleCurrentTabNavigation(state, message) {
  document.getElementById('linuxdo-benefits-current-tab-continue')?.remove();
  saveCurrentTabState(state);
  reportCurrentTab(state, message);
  const target = nextStateUrl(state);
  setTimeout(() => window.location.assign(target), CURRENT_TAB_DELAY_MS);
}

function beginTopicPhase(state) {
  state.topics = selectRecentTopics(state.topics, new Date(state.now), MAX_TOPICS);
  state.topicIndex = 0;
  state.phase = state.topics.length ? 'topic' : 'return';
  state.previousSignature = '';
}

function advanceCategory(state) {
  state.categoryIndex += 1;
  state.pageNumber = 0;
  state.previousSignature = '';
  if (state.categoryIndex >= state.categories.length || state.topics.length >= MAX_TOPICS) beginTopicPhase(state);
}

function addRecentTopics(state, topics) {
  const known = new Set(state.topics.map(topic => topic.id));
  for (const topic of topics) {
    if (state.topics.length >= MAX_TOPICS) break;
    if (!known.has(topic.id) && isWithinWindow(topic.created_at || topic.createdAt, new Date(state.now))) {
      state.topics.push(topic);
      known.add(topic.id);
    }
  }
}

function finishCurrentTabScan(state) {
  clearCurrentTabState();
  document.getElementById('linuxdo-benefits-current-tab-cancel')?.remove();
  document.getElementById('linuxdo-benefits-current-tab-continue')?.remove();
  const now = new Date(state.now);
  const benefits = state.benefits || { nodes: [], accounts: [], publicSites: [] };
  showResults(renderBenefitDocuments(benefits, now), benefits);
  installLauncher();
  const status = installStatus();
  status.style.display = 'block';
  status.textContent = `\u5b8c\u6210\uff1a\u8282\u70b9 ${benefits.nodes.length}\uff0c\u8d26\u53f7 ${benefits.accounts.length}\uff0c\u516c\u76ca\u7ad9 ${benefits.publicSites.length}`;
}

async function resumeCurrentTabScan() {
  const state = loadCurrentTabState();
  if (!state) return false;

  const pageSignal = `${window.location.href}\n${document.title}\n${document.body?.innerText || ''}`;
  if (looksLikeCloudflareChallenge(pageSignal)) {
    reportCurrentTab(state, '\u5f53\u524d\u9875\u9762\u6b63\u5728 Cloudflare \u9a8c\u8bc1\u3002\u8bf7\u624b\u52a8\u5b8c\u6210\uff0c\u9a8c\u8bc1\u540e\u9875\u9762\u91cd\u8f7d\u65f6\u4f1a\u81ea\u52a8\u7ee7\u7eed\u3002');
    return true;
  }

  if (state.pausedForBatch) {
    reportCurrentTab(state, `\u5df2\u4f4e\u9891\u8bfb\u53d6 ${state.topicIndex}/${state.topics.length} \u4e2a\u4e3b\u9898\u3002\u4e3a\u964d\u4f4e\u8fde\u7eed\u8bbf\u95ee\u9891\u7387\uff0c\u5df2\u6682\u505c\uff1b\u8bf7\u70b9\u51fb\u201c\u7ee7\u7eed\u8bfb\u53d6\u4e0b\u4e00\u6279\u201d\u3002`);
    installCurrentTabContinue();
    return true;
  }

  if (state.phase === 'category') {
    const category = state.categories[state.categoryIndex];
    if (!category) {
      beginTopicPhase(state);
      scheduleCurrentTabNavigation(state, '\u5206\u7c7b\u626b\u63cf\u5b8c\u6210\uff0c\u51c6\u5907\u8bfb\u53d6\u4e3b\u9898\u9996\u5e16\u2026');
      return true;
    }
    if (!isExpectedCategoryLocation(window.location, category, state.pageNumber)) {
      scheduleCurrentTabNavigation(state, `\u5f53\u524d\u6807\u7b7e\u9875\u6a21\u5f0f\uff1a${category.name || category.slug || category.id} \u7b2c ${state.pageNumber + 1} \u9875`);
      return true;
    }

    const topics = extractTopicsFromHtml(document.documentElement?.outerHTML || '');
    if (topics === null) throw new Error('\u5f53\u524d\u5206\u7c7b\u9875\u5df2\u52a0\u8f7d\uff0c\u4f46\u672a\u627e\u5230 Discourse \u4e3b\u9898\u6570\u636e');
    const signature = topics.map(topic => topic.id).join(',');
    if (!topics.length || signature === state.previousSignature) {
      advanceCategory(state);
    } else {
      addRecentTopics(state, topics);
      state.previousSignature = signature;
      const oldest = topics.filter(topic => !topic.pinned).reduce((minimum, topic) => {
        const time = new Date(topic.created_at || topic.createdAt).getTime();
        return Number.isFinite(time) ? Math.min(minimum, time) : minimum;
      }, Number.POSITIVE_INFINITY);
      if (state.topics.length >= MAX_TOPICS
        || oldest < new Date(state.now).getTime() - WINDOW_MS
        || state.pageNumber + 1 >= MAX_CATEGORY_PAGES) {
        advanceCategory(state);
      } else {
        state.pageNumber += 1;
      }
    }
    scheduleCurrentTabNavigation(
      state,
      state.phase === 'topic'
        ? `\u51c6\u5907\u8bfb\u53d6 ${state.topics.length} \u4e2a\u4e3b\u9898\u9996\u5e16\u2026`
        : '\u7ee7\u7eed\u8bfb\u53d6\u5206\u7c7b\u9875\u2026',
    );
    return true;
  }

  if (state.phase === 'topic') {
    const topic = state.topics[state.topicIndex];
    if (!topic) {
      state.phase = 'return';
      scheduleCurrentTabNavigation(state, '\u4e3b\u9898\u8bfb\u53d6\u5b8c\u6210\uff0c\u6b63\u5728\u8fd4\u56de\u7ed3\u679c\u9875\u2026');
      return true;
    }
    if (!isExpectedTopicLocation(window.location, topic)) {
      scheduleCurrentTabNavigation(state, `${state.topicIndex + 1}/${state.topics.length}\uff1a${topic.title}`);
      return true;
    }

    const parsed = extractTopicFromHtml(document.documentElement?.outerHTML || '');
    if (!parsed?.firstPost?.cooked) throw new Error(`\u4e3b\u9898 ${topic.id} \u672a\u627e\u5230\u53ef\u89e3\u6790\u7684\u9996\u5e16`);
    const analyzed = analyzeTopic({ ...topic, title: parsed.title || topic.title }, parsed.firstPost.cooked);
    state.benefits.nodes.push(...analyzed.nodes);
    state.benefits.accounts.push(...analyzed.accounts);
    state.benefits.publicSites.push(...analyzed.publicSites);
    state.topicIndex += 1;
    if (state.topicIndex >= state.topics.length) state.phase = 'return';
    if (state.phase === 'topic' && state.topicIndex % CURRENT_TAB_BATCH_SIZE === 0) {
      state.pausedForBatch = true;
      saveCurrentTabState(state);
      reportCurrentTab(state, `\u5df2\u4f4e\u9891\u8bfb\u53d6 ${state.topicIndex}/${state.topics.length} \u4e2a\u4e3b\u9898\u3002\u4e3a\u964d\u4f4e\u8fde\u7eed\u8bbf\u95ee\u9891\u7387\uff0c\u5df2\u6682\u505c\uff1b\u8bf7\u70b9\u51fb\u201c\u7ee7\u7eed\u8bfb\u53d6\u4e0b\u4e00\u6279\u201d\u3002`);
      installCurrentTabContinue();
      return true;
    }
    scheduleCurrentTabNavigation(
      state,
      state.phase === 'return'
        ? '\u4e3b\u9898\u8bfb\u53d6\u5b8c\u6210\uff0c\u6b63\u5728\u8fd4\u56de\u7ed3\u679c\u9875\u2026'
        : `${state.topicIndex + 1}/${state.topics.length}\uff1a${state.topics[state.topicIndex].title}`,
    );
    return true;
  }

  if (state.phase === 'return') {
    if (!samePageUrl(window.location.href, state.returnUrl)) {
      scheduleCurrentTabNavigation(state, '\u6b63\u5728\u8fd4\u56de\u8d77\u59cb\u9875\u5e76\u751f\u6210\u6587\u6863\u2026');
    } else {
      finishCurrentTabScan(state);
    }
    return true;
  }

  throw new Error('\u5f53\u524d\u6807\u7b7e\u9875\u6293\u53d6\u72b6\u6001\u65e0\u6548');
}

function handleCurrentTabFailure(error) {
  const state = loadCurrentTabState();
  console.error(error);
  const returnUrl = state?.returnUrl;
  clearCurrentTabState();
  document.getElementById('linuxdo-benefits-current-tab-cancel')?.remove();
  document.getElementById('linuxdo-benefits-current-tab-continue')?.remove();
  alert(`LinuxDO \u5f53\u524d\u6807\u7b7e\u9875\u6a21\u5f0f\u5931\u8d25\uff1a\n\n${error.message}`);
  if (returnUrl && !samePageUrl(window.location.href, returnUrl)) window.location.assign(returnUrl);
}

function runCurrentTabScan(button) {
  if (button?.disabled) return;
  const now = new Date();
  const pageHtml = document.documentElement?.outerHTML || '';
  const categories = discoverWelfareCategories(
    extractCategoriesFromHtml(pageHtml) || [{ id: CATEGORY_ID, slug: 'welfare', name: '\u798f\u5229\u7f8a\u6bdb' }],
    CATEGORY_ID,
  );
  const state = {
    version: 1,
    now: now.toISOString(),
    returnUrl: window.location.href,
    phase: 'category',
    categories,
    categoryIndex: 0,
    pageNumber: 0,
    previousSignature: '',
    topics: [],
    topicIndex: 0,
    pausedForBatch: false,
    benefits: { nodes: [], accounts: [], publicSites: [] },
  };
  saveCurrentTabState(state);
  if (button) {
    button.disabled = true;
    button.textContent = '\u51c6\u5907\u63a5\u529b\u6293\u53d6\u2026';
  }
  resumeCurrentTabScan().catch(handleCurrentTabFailure);
}
function createElement(tag, properties = {}, children = []) {
  const element = document.createElement(tag);
  Object.assign(element, properties);
  for (const child of children) element.append(child);
  return element;
}

function downloadText(filename, content) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/markdown;charset=utf-8' }));
  const anchor = createElement('a', { href: url, download: filename });
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function copyText(content) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(content);
  const area = createElement('textarea', { value: content });
  document.body.append(area);
  area.select();
  document.execCommand('copy');
  area.remove();
}

function showResults(documents, benefits) {
  document.getElementById('linuxdo-benefits-results')?.remove();
  const panel = createElement('section', { id: 'linuxdo-benefits-results' });
  panel.style.cssText = 'position:fixed;inset:5vh 5vw;z-index:2147483647;background:#fff;color:#222;border:1px solid #888;border-radius:10px;padding:16px;box-shadow:0 8px 30px #0006;overflow:auto;font:14px/1.5 sans-serif';
  panel.append(createElement('button', { textContent: '关闭', onclick: () => panel.remove(), style: 'float:right;padding:6px 12px' }));
  panel.append(createElement('h2', { textContent: 'LinuxDO 福利抓取结果' }));
  if (benefits?.sourceNotice) {
    const notice = createElement('p', { textContent: benefits.sourceNotice });
    notice.style.cssText = 'padding:10px 12px;background:#fff8e1;border-left:4px solid #f9ab00;border-radius:4px';
    panel.append(notice);
  }

  const entries = Object.entries(documents);
  if (!entries.length) panel.append(createElement('p', { textContent: '最近 48 小时未识别到符合条件的信息。' }));
  for (const [filename, content] of entries) {
    const block = createElement('div');
    block.style.cssText = 'margin:16px 0;padding:12px;border:1px solid #ddd;border-radius:8px';
    block.append(createElement('strong', { textContent: filename }));
    block.append(' ');
    block.append(createElement('button', { textContent: '下载', onclick: () => downloadText(filename, content) }));
    block.append(' ');
    block.append(createElement('button', {
      textContent: '复制',
      onclick: async event => {
        await copyText(content);
        event.currentTarget.textContent = '已复制';
      },
    }));
    const preview = createElement('textarea', { value: content, readOnly: true });
    preview.style.cssText = 'display:block;width:100%;height:180px;margin-top:8px;box-sizing:border-box;font:12px/1.4 monospace';
    block.append(preview);
    panel.append(block);
  }

  if (benefits.publicSites.length) {
    panel.append(createElement('h3', { textContent: '公益站（仅人工打开和登录）' }));
    for (const entry of benefits.publicSites) {
      const link = createElement('a', {
        textContent: `打开：${entry.siteName || entry.siteUrl}`,
        href: entry.siteUrl,
        target: '_blank',
        rel: 'noopener noreferrer',
      });
      link.style.cssText = 'display:block;margin:6px 0';
      panel.append(link);
    }
  }
  document.body.append(panel);
}

function installStatus() {
  let status = document.getElementById('linuxdo-benefits-status');
  if (status) return status;
  status = createElement('div', { id: 'linuxdo-benefits-status' });
  status.style.cssText = 'position:fixed;right:16px;bottom:64px;z-index:2147483647;max-width:420px;background:#222;color:#fff;border-radius:6px;padding:8px 12px;font:12px/1.5 sans-serif;display:none;white-space:pre-wrap';
  document.body.append(status);
  return status;
}

async function runPublicRssScan(button) {
  if (button?.disabled) return;
  const idleText = button?.textContent || '公开RSS（备用）';
  const status = installStatus();
  const report = message => {
    status.style.display = 'block';
    status.textContent = message;
    console.log('[LinuxDO公开RSS]', message);
  };
  if (button) {
    button.disabled = true;
    button.textContent = '正在读取公开RSS…';
  }
  try {
    const now = new Date();
    const benefits = await collectBenefitsFromPublicRss(now, report);
    showResults(renderBenefitDocuments(benefits, now), benefits);
    report(`完成（公开RSS）：节点 ${benefits.nodes.length}，账号 ${benefits.accounts.length}，公益站 ${benefits.publicSites.length}`);
  } catch (error) {
    console.error(error);
    report(`公开 RSS 失败：${error.message}`);
    alert(`公开 RSS 抓取失败：\n\n${error.message}\n\n没有回退到 LinuxDO 主题页，也没有触发站内自动访问。你可以稍后重试，或手动选择“当前标签页低频模式”。`);
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = idleText;
    }
  }
}
async function runBrowserScan(button) {
  if (button?.disabled) return;
  const status = installStatus();
  const report = message => {
    status.style.display = 'block';
    status.textContent = message;
    console.log('[LinuxDO福利]', message);
  };
  if (button) {
    button.disabled = true;
    button.textContent = '正在抓取…';
  }
  try {
    const now = new Date();
    const benefits = await collectBenefits(now, report);
    const documents = renderBenefitDocuments(benefits, now);
    showResults(documents, benefits);
    report(`完成：节点 ${benefits.nodes.length}，账号 ${benefits.accounts.length}，公益站 ${benefits.publicSites.length}`);
  } catch (error) {
    console.error(error);
    report(`失败：${error.message}`);
    alert(`LinuxDO 福利抓取失败：\n\n${error.message}\n\n如果普通 Chrome 本身也一直循环验证，请关闭代理/VPN和隐私扩展、清除 linux.do 站点数据、换网络后重试，或联系站点管理员。`);
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = '站内RSS/接口（备用）';
    }
  }
}

function installLauncher() {
  if (document.getElementById('linuxdo-benefits-launcher')) return;
  const publicButton = createElement('button', {
    id: 'linuxdo-benefits-public-rss-launcher',
    textContent: '公开RSS（备用）',
  });
  publicButton.style.cssText = 'position:fixed;right:290px;bottom:16px;z-index:2147483647;background:#5f6368;color:#fff;border:0;border-radius:7px;padding:10px 14px;cursor:pointer;font:14px sans-serif;box-shadow:0 3px 12px #0004';
  publicButton.addEventListener('click', () => runPublicRssScan(publicButton));
  const pageButton = createElement('button', {
    id: 'linuxdo-benefits-navigation-launcher',
    textContent: '\u5df2\u767b\u5f55\u5f53\u524d\u6807\u7b7e\u9875\u6293\u53d6\uff08\u63a8\u8350\uff09',
  });
  pageButton.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147483647;background:#137333;color:#fff;border:0;border-radius:7px;padding:10px 14px;cursor:pointer;font:14px sans-serif;box-shadow:0 3px 12px #0004';
  pageButton.addEventListener('click', () => runCurrentTabScan(pageButton));
  const button = createElement('button', {
    id: 'linuxdo-benefits-launcher',
    textContent: '站内RSS/接口（备用）',
  });
  button.style.cssText = 'position:fixed;right:430px;bottom:16px;z-index:2147483647;background:#0b57d0;color:#fff;border:0;border-radius:7px;padding:10px 14px;cursor:pointer;font:14px sans-serif;box-shadow:0 3px 12px #0004';
  button.addEventListener('click', () => runBrowserScan(button));
  document.body.append(publicButton, pageButton, button);
}


const LinuxdoBenefitsUserscript = {
  MAX_TOPICS,
  isWithinWindow,
  selectRecentTopics,
  analyzeTopic,
  renderBenefitDocuments,
  discoverWelfareCategories,
  looksLikeCloudflareChallenge,
  shouldInstallLauncher,
  parseJsonScripts,
  extractTopicsFromHtml,
  extractTopicFromHtml,
  extractCategoriesFromHtml,
  parseRssFeed,
  mergePublicRssTopics,
  loadPublicRssCache,
  savePublicRssCache,
  loadCurrentTabState,
  saveCurrentTabState,
  clearCurrentTabState,
  categoryNavigationUrl,
  runPublicRssScan,
};

if (typeof module !== 'undefined' && module.exports) module.exports = LinuxdoBenefitsUserscript;
if (typeof window !== 'undefined') window.LinuxdoBenefitsUserscript = LinuxdoBenefitsUserscript;
if (typeof window !== 'undefined' && typeof document !== 'undefined' && window.top === window.self && /(^|\.)linux\.do$/i.test(window.location.hostname)) {
  const installOnForumPage = () => {
    const state = loadCurrentTabState();
    if (state) {
      resumeCurrentTabScan().catch(handleCurrentTabFailure);
      return;
    }
    const pageSignal = `${window.location.href}\n${document.title}\n${document.body?.innerText || ''}`;
    const autoRunCurrentTab = window.location.hash === CURRENT_TAB_AUTORUN_HASH
      || new URL(window.location.href).searchParams.get(CURRENT_TAB_AUTORUN_PARAM) === '1'
      || hasCurrentTabAutorunPending();
    if (!shouldInstallLauncher(window.location, document.title, document.body?.innerText || '')) {
      if (looksLikeCloudflareChallenge(pageSignal)) {
        if (autoRunCurrentTab) setCurrentTabAutorunPending(true);
        console.warn('[LinuxDO Benefits] Cloudflare challenge page detected; complete it manually, then reload the forum page.');
      }
      return;
    }
    installLauncher();
    const startupStatus = installStatus();
    startupStatus.style.display = 'block';
    startupStatus.textContent = autoRunCurrentTab
      ? `LinuxDO 福利脚本 v${USERSCRIPT_VERSION} 已加载，正在启动登录态抓取…`
      : `LinuxDO 福利脚本 v${USERSCRIPT_VERSION} 已加载。请点击右下角绿色按钮开始。`;
    if (typeof GM_registerMenuCommand === 'function') {
      GM_registerMenuCommand('已登录当前标签页抓取（推荐）', () => runCurrentTabScan(document.getElementById('linuxdo-benefits-navigation-launcher')));
      GM_registerMenuCommand('公开RSS抓取（备用）', () => runPublicRssScan(document.getElementById('linuxdo-benefits-public-rss-launcher')));
      GM_registerMenuCommand('站内RSS/接口抓取（备用）', () => runBrowserScan(document.getElementById('linuxdo-benefits-launcher')));
    }
    if (autoRunCurrentTab) {
      setCurrentTabAutorunPending(false);
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete(CURRENT_TAB_AUTORUN_PARAM);
      cleanUrl.hash = '';
      window.history.replaceState(window.history.state, document.title, `${cleanUrl.pathname}${cleanUrl.search}`);
      runCurrentTabScan(document.getElementById('linuxdo-benefits-navigation-launcher'));
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installOnForumPage, { once: true });
  } else {
    installOnForumPage();
  }
}})();



