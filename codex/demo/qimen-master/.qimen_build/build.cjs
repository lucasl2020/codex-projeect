// 构建脚本：把 lib/ + lunar-javascript 打包成浏览器端 IIFE
// 输出 .qimen_build/qimen.bundle.js
const esbuild = require('C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules/esbuild');
const path = require('path');

const root = path.resolve(__dirname, '..');

esbuild.build({
  entryPoints: [path.join(__dirname, 'entry.js')],
  bundle: true,
  platform: 'browser',
  format: 'iife',
  target: ['es2018'],
  outfile: path.join(__dirname, 'qimen.bundle.js'),
  logLevel: 'info',
  // 让 lunar-javascript 按浏览器方式打包
  mainFields: ['browser', 'module', 'main'],
  conditions: ['browser', 'import'],
}).then(() => {
  console.log('bundle done');
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
