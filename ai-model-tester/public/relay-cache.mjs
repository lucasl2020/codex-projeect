export const RELAY_CACHE_STORAGE_KEY = 'ai-model-tester.relay-cache.v1';

function identifierKey(value) {
  return String(value || '').trim().toLocaleLowerCase('zh-CN');
}

export function sameRelayIdentifier(left, right) {
  return identifierKey(left) === identifierKey(right);
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