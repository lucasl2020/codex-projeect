import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RELAY_CACHE_STORAGE_KEY,
  clearRelayCaches,
  deleteRelayCache,
  readRelayCaches,
  matchesRelayCache,
  sameRelayIdentifier,
  upsertRelayCache,
  writeRelayCaches,
} from '../public/relay-cache.mjs';

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  };
}

test('缓存标识比较忽略首尾空格和大小写', () => {
  assert.equal(sameRelayIdentifier(' 公司中转 ', '公司中转'), true);
  assert.equal(sameRelayIdentifier('BACKUP', 'backup'), true);
  assert.equal(sameRelayIdentifier('主线路', '备用线路'), false);
});
test('相同缓存标识忽略大小写并更新原记录', () => {
  const first = upsertRelayCache([], {
    identifier: '公司中转',
    baseUrl: 'https://old.example.com/v1',
    apiKey: 'sk-old',
  }, 100);
  const updated = upsertRelayCache(first, {
    identifier: ' 公司中转 ',
    baseUrl: 'https://new.example.com/v1',
    apiKey: 'sk-new',
  }, 200);

  assert.equal(updated.length, 1);
  assert.deepEqual(updated[0], {
    identifier: '公司中转',
    baseUrl: 'https://new.example.com/v1',
    apiKey: 'sk-new',
    clientProfile: 'openai',
    modelsPath: '',
    chatPath: '',
    updatedAt: 200,
  });
});

test('标识、地址或 Key 缺失时拒绝保存', () => {
  assert.throws(
    () => upsertRelayCache([], { identifier: '', baseUrl: 'https://api.example.com', apiKey: 'sk-test' }),
    /均不能为空/
  );
  assert.throws(
    () => upsertRelayCache([], { identifier: '测试', baseUrl: '', apiKey: 'sk-test' }),
    /均不能为空/
  );
  assert.throws(
    () => upsertRelayCache([], { identifier: '测试', baseUrl: 'https://api.example.com', apiKey: '' }),
    /均不能为空/
  );
});
test('删除缓存只移除指定标识', () => {
  const entries = [
    { identifier: '主线路', baseUrl: 'https://a.example.com', apiKey: 'sk-a', updatedAt: 1 },
    { identifier: '备用线路', baseUrl: 'https://b.example.com', apiKey: 'sk-b', updatedAt: 2 },
  ];
  assert.deepEqual(deleteRelayCache(entries, '主线路'), [entries[1]]);
});

test('缓存可写入、读取并一键清空', () => {
  const storage = memoryStorage();
  const entries = [{ identifier: '测试', baseUrl: 'https://api.example.com', apiKey: 'sk-test', updatedAt: 1 }];

  writeRelayCaches(entries, storage);
  assert.deepEqual(readRelayCaches(storage), [{
    ...entries[0],
    clientProfile: 'openai',
    modelsPath: '',
    chatPath: '',
  }]);
  clearRelayCaches(storage);
  assert.deepEqual(readRelayCaches(storage), []);
});

test('缓存标识支持中文、拼音首字母和模糊匹配', () => {
  const entry = { identifier: '公司中转', baseUrl: 'https://relay.example.com', apiKey: 'sk-test' };
  assert.equal(matchesRelayCache(entry, '公司'), true);
  assert.equal(matchesRelayCache(entry, 'gszz'), true);
  assert.equal(matchesRelayCache(entry, 'gzz'), true);
  assert.equal(matchesRelayCache(entry, '备用'), false);
});

test('损坏或不完整的本地缓存不会阻断页面', () => {
  const broken = memoryStorage({ [RELAY_CACHE_STORAGE_KEY]: '{bad json' });
  assert.deepEqual(readRelayCaches(broken), []);

  const incomplete = memoryStorage({
    [RELAY_CACHE_STORAGE_KEY]: JSON.stringify([
      { identifier: '有效', baseUrl: 'https://api.example.com', apiKey: 'sk-ok' },
      { identifier: '缺 Key', baseUrl: 'https://bad.example.com' },
    ]),
  });
  assert.equal(readRelayCaches(incomplete).length, 1);
});
