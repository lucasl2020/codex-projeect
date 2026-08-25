const fs = require('fs');
const file = 'D:\\codex-projeect\\codex\\temp\\daily-rewards-v2.js';
let s = fs.readFileSync(file, 'utf8');

const helper = \unction extractApiQuota(data, rawText) {
  const text = String(data?.msg || data?.message || rawText || '');
  const match = text.match(/获得.*?([\d.]+)\s*(MB|GB|TB|KB|M|G|T|K)/i);
  if (match) {
    const amount = Number(match[1]);
    const unit = String(match[2] || 'MB').toUpperCase();
    if (unit === 'TB' || unit === 'T') return amount * 1024 * 1024;
    if (unit === 'GB' || unit === 'G') return amount * 1024;
    return amount;
  }
  return undefined;
}
\;

if (!s.includes('function extractApiQuota')) {
  s = s.replace('async function runIkuuu(context) {', helper + 'async function runIkuuu(context) {');
}

const oldFinish = \const finish = async (message) => {
      let afterQuota;
      if (typeof page.reload === 'function') {
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
      }
      afterQuota = await readPageTrafficQuota(page);
      const quota = trafficQuotaSummary(beforeQuota, afterQuota);
      if (quota) log('ikuuu', quota);
      return { ok: true, message: message + (quota ? ';' + quota : '') };
    };\;

const newFinish = \const finish = async (message, directQuota) => {
      let afterQuota = directQuota;
      if (!afterQuota) {
        if (typeof page.reload === 'function') {
          await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
        }
        afterQuota = await readPageTrafficQuota(page).catch(() => undefined);
      }
      const quota = trafficQuotaSummary(beforeQuota, afterQuota);
      if (quota) log('ikuuu', quota);
      return { ok: true, message: message + (quota ? ';' + quota : '') };
    };\;

if (s.includes(oldFinish)) {
  s = s.replace(oldFinish, newFinish);
}

s = s.replace(\if (ikuuuSuccess(data)) return finish(messageOf(data) || '签到成功');\, 
  \if (ikuuuSuccess(data)) {
        const apiQuota = extractApiQuota(data, result.text);
        return finish(messageOf(data) || '签到成功', apiQuota);
      }\);

fs.writeFileSync(file, s, 'utf8');
console.log('Patched');
