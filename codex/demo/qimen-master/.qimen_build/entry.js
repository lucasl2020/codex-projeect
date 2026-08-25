// 浏览器端入口：把服务端排盘算法整体打包成自包含 IIFE
// 通过 globalThis.Qimen 暴露 calculate 及常量，供静态页面调用
const qimen = require('../lib/qimen');
globalThis.Qimen = qimen;
