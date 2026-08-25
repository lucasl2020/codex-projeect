// 组装自包含静态页面：内联 CSS + 算法 bundle + 渲染脚本
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const bootstrapCss = read('public/css/bootstrap.min.css');
const styleCss = read('public/css/style-new.css');
const bundle = read('.qimen_build/qimen.bundle.js');
const render = read('.qimen_build/render.js');

const html = '<!DOCTYPE html>\n' +
'<html lang="zh-CN">\n' +
'<head>\n' +
'  <meta charset="utf-8">\n' +
'  <meta http-equiv="X-UA-Compatible" content="IE=edge">\n' +
'  <meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'  <title>奇门遁甲排盘系统</title>\n' +
'  <style>\n' + bootstrapCss + '\n' + styleCss + '\n  </style>\n' +
'</head>\n' +
'<body>\n' +
'  <nav class="navbar navbar-inverse navbar-fixed-top" role="navigation">\n' +
'    <div class="navbar-header"><a class="navbar-brand" href="#">奇门遁甲排盘系统</a></div>\n' +
'  </nav>\n' +
'  <div class="container" style="margin-top:70px;">\n' +
'    <div class="row">\n' +
'      <div class="col-md-12">\n' +
'        <div class="panel panel-default">\n' +
'          <div class="panel-heading"><h3 class="panel-title">排盘设置</h3></div>\n' +
'          <div class="panel-body">\n' +
'            <form id="panForm" class="form-inline">\n' +
'              <div class="form-group" style="margin:4px;"><label>类型 </label>\n' +
'                <select id="f-type" class="form-control"><option value="四柱">四柱</option><option value="三元">三元</option></select></div>\n' +
'              <div class="form-group" style="margin:4px;"><label>方法 </label>\n' +
'                <select id="f-method" class="form-control"><option value="时家">时家奇门</option><option value="日家">日家奇门</option><option value="月家">月家奇门</option><option value="年家">年家奇门</option></select></div>\n' +
'              <div class="form-group" style="margin:4px;"><label>日期 </label>\n' +
'                <input type="date" id="f-date" class="form-control" required></div>\n' +
'              <div class="form-group" style="margin:4px;"><label>时间 </label>\n' +
'                <input type="time" id="f-time" class="form-control" required></div>\n' +
'              <div class="form-group" style="margin:4px;"><label>目的 </label>\n' +
'                <select id="f-purpose" class="form-control"><option value="综合">综合分析</option><option value="事业">事业</option><option value="财运">财运</option><option value="婚姻">婚姻</option><option value="健康">健康</option><option value="学业">学业</option></select></div>\n' +
'              <div class="form-group" style="margin:4px;"><label>地点 </label>\n' +
'                <input type="text" id="f-location" class="form-control" placeholder="如：北京市"></div>\n' +
'              <button type="submit" class="btn btn-primary" style="margin:4px;">排盘</button>\n' +
'            </form>\n' +
'          </div>\n' +
'        </div>\n' +
'      </div>\n' +
'    </div>\n' +
'    <div id="qimenRoot"></div>\n' +
'  </div>\n' +
'  <footer class="footer"><div class="container"><p class="text-muted">奇门遁甲排盘系统 &copy; 2025（纯前端版，无需后端）</p></div></footer>\n' +
'  <script>\n' + bundle + '\n  </script>\n' +
'  <script>\n' + render + '\n  </script>\n' +
'</body>\n' +
'</html>\n';

const outDir = path.join(root, 'dist');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
const outFile = path.join(outDir, 'index.html');
fs.writeFileSync(outFile, html, 'utf8');
console.log('written', outFile, 'size', html.length, 'bytes');
