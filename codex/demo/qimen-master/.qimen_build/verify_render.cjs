// 用最小 DOM 桩验证 render.js 能正常生成排盘页面（无需真实浏览器）
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

global.window = global;
global.addEventListener = (ev, cb) => { if (ev === 'DOMContentLoaded') global.__domReady = cb; };
const store = {};
function fakeEl(id) {
  return store[id] || (store[id] = {
    id: id, value: '', _html: '', _handlers: {},
    set innerHTML(v) { this._html = v; }, get innerHTML() { return this._html; },
    addEventListener(ev, cb) { this._handlers[ev] = cb; }
  });
}
global.document = {
  getElementById: (id) => fakeEl(id),
  addEventListener: (ev, cb) => { if (ev === 'DOMContentLoaded') global.__domReady = cb; }
};

require(path.join(root, '.qimen_build/qimen.bundle.js'));
require(path.join(root, '.qimen_build/render.js'));

// 触发 DOMContentLoaded
global.__domReady && global.__domReady();

const out = store['qimenRoot']._html || '';
const checks = {
  '含九宫格容器 pan-grid': out.indexOf('pan-grid') !== -1,
  '含 9 个宫位(gong1..gong9)': ['1','2','3','4','5','6','7','8','9'].every(g => out.indexOf('gong' + g + ' ') !== -1 || out.indexOf('gong gong' + g) !== -1),
  '含四柱 label': out.indexOf('label-primary') !== -1,
  '含分析与建议': out.indexOf('分析与建议') !== -1,
  '含格局': out.indexOf('格局') !== -1,
  '含九宫详解': out.indexOf('九宫详解') !== -1,
  '含值符/值使': out.indexOf('值符') !== -1 && out.indexOf('值使') !== -1,
};
let ok = true;
for (const k in checks) { console.log((checks[k] ? 'OK  ' : 'FAIL') + ' ' + k); if (!checks[k]) ok = false; }
console.log(ok ? '\n渲染验证通过：页面可正常生成排盘' : '\n渲染验证失败');
process.exit(ok ? 0 : 1);
