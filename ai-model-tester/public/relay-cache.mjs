export const RELAY_CACHE_STORAGE_KEY = 'ai-model-tester.relay-cache.v1';

function identifierKey(value) {
  return String(value || '').trim().toLocaleLowerCase('zh-CN');
}

const PINYIN_BOUNDARIES = '阿八嚓哒妸发旮哈讥咔垃妈拿哦啪期然撒塌挖昔压匝';
const PINYIN_INITIALS = 'ABCDEFGHJKLMNOPQRSTWXYZ';

function pinyinInitials(value) {
  return [...String(value || '')]
    .map((char) => {
      if (/^[a-z0-9]$/i.test(char)) return char.toLowerCase();
      for (let index = PINYIN_BOUNDARIES.length - 1; index >= 0; index -= 1) {
        if (char.localeCompare(PINYIN_BOUNDARIES[index], 'zh-CN') >= 0) {
          return PINYIN_INITIALS[index] || '';
        }
      }
      return '';
    })
    .join('');
}

function compact(value) {
  return String(value || '').toLocaleLowerCase('zh-CN').replace(/[\s\-_./:]+/g, '');
}

function fuzzyIncludes(query, target) {
  const needle = compact(query);
  const haystack = compact(target);
  if (!needle) return true;
  if (haystack.includes(needle)) return true;
  let cursor = 0;
  for (const char of needle) {
    cursor = haystack.indexOf(char, cursor);
    if (cursor < 0) return false;
    cursor += 1;
  }
  return true;
}

export function sameRelayIdentifier(left, right) {
  return identifierKey(left) === identifierKey(right);
}

export function matchesRelayCache(entry, query) {
  if (!query) return true;
  const identifier = String(entry?.identifier || '');
  return fuzzyIncludes(query, identifier) || fuzzyIncludes(query, pinyinInitials(identifier));
}

function normalizeEntry(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const identifier = String(entry.identifier || '').trim();
  const baseUrl = String(entry.baseUrl || '').trim();
  const apiKey = String(entry.apiKey || '').trim();
  if (!identifier || !baseUrl || !apiKey) return null;
  return {
    identifier,
    baseUrl,
    apiKey,
    clientProfile: String(entry.clientProfile || 'openai'),
    modelsPath: String(entry.modelsPath || '').trim(),
    chatPath: String(entry.chatPath || '').trim(),
    updatedAt: Number.isFinite(Number(entry.updatedAt)) ? Number(entry.updatedAt) : 0,
  };
}

export function readRelayCaches(storage = globalThis.localStorage) {
  try {
    const parsed = JSON.parse(storage.getItem(RELAY_CACHE_STORAGE_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeEntry).filter(Boolean);
  } catch {
    return [];
  }
}

export function writeRelayCaches(entries, storage = globalThis.localStorage) {
  storage.setItem(RELAY_CACHE_STORAGE_KEY, JSON.stringify(entries));
}

export function upsertRelayCache(entries, entry, now = Date.now()) {
  const normalized = normalizeEntry({ ...entry, updatedAt: now });
  if (!normalized) throw new Error('标识、地址和 Key 均不能为空。');
  const remaining = entries.filter((item) => !sameRelayIdentifier(item.identifier, normalized.identifier));
  return [normalized, ...remaining];
}

export function deleteRelayCache(entries, identifier) {
  return entries.filter((item) => !sameRelayIdentifier(item.identifier, identifier));
}

export function clearRelayCaches(storage = globalThis.localStorage) {
  storage.removeItem(RELAY_CACHE_STORAGE_KEY);
}
