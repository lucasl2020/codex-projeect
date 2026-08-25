// 客户端渲染逻辑：复用与服务端 index.html 相同的 pan 对象结构
(function () {
  'use strict';
  var Q = window.Qimen;
  if (!Q) { document.getElementById('qimenRoot').innerHTML = '<p class="text-danger">算法脚本未加载</p>'; return; }
  var JIU_GONG = Q.JIU_GONG;

  var GONG_NUMBER = { '1': '一', '2': '二', '3': '三', '4': '四', '5': '五', '6': '六', '7': '七', '8': '八', '9': '九' };
  var GONG_ORDER = ['4', '9', '2', '3', '5', '7', '8', '1', '6']; // 三行：4,9,2 / 3,5,7 / 8,1,6

  function esc(s) { return (s === undefined || s === null) ? '' : String(s); }

  // —— 五行配色（与 standardGongTemplate.ejs 一致）——
  function shenColor(s) {
    return { '值符': 'wuxing-mu', '腾蛇': 'wuxing-huo', '太阴': 'wuxing-jin', '六合': 'wuxing-mu',
      '白虎': 'wuxing-jin', '玄武': 'wuxing-shui', '九地': 'wuxing-tu', '九天': 'wuxing-jin' }[s] || '';
  }
  function menColor(s) {
    return { '休门': 'wuxing-shui', '生门': 'wuxing-tu', '伤门': 'wuxing-mu', '杜门': 'wuxing-mu',
      '景门': 'wuxing-huo', '死门': 'wuxing-tu', '惊门': 'wuxing-jin', '开门': 'wuxing-jin' }[s] || '';
  }
  function xingColor(s) {
    if (s.indexOf('天蓬') >= 0) return 'wuxing-shui';
    if (s.indexOf('天冲') >= 0 || s.indexOf('天辅') >= 0) return 'wuxing-mu';
    if (s.indexOf('天英') >= 0) return 'wuxing-huo';
    if (s.indexOf('天柱') >= 0 || s.indexOf('天心') >= 0) return 'wuxing-jin';
    if (s.indexOf('天芮') >= 0 || s.indexOf('天禽') >= 0 || s.indexOf('天任') >= 0 || s.indexOf('禽') >= 0 || s.indexOf('芮') >= 0) return 'wuxing-tu';
    return '';
  }
  function ganColor(s) {
    if (s === '戊' || s === '己') return 'wuxing-tu';
    if (s === '庚' || s === '辛') return 'wuxing-jin';
    if (s === '壬' || s === '癸') return 'wuxing-shui';
    if (s === '丁' || s === '丙') return 'wuxing-huo';
    if (s === '乙' || s === '甲') return 'wuxing-mu';
    return '';
  }
  function borderColor(s) {
    if (s === '戊' || s === '己') return 'border-tu';
    if (s === '庚' || s === '辛') return 'border-jin';
    if (s === '壬' || s === '癸') return 'border-shui';
    if (s === '丁' || s === '丙') return 'border-huo';
    if (s === '乙' || s === '甲') return 'border-mu';
    return '';
  }
  function gongColor(s) {
    if (s === '震' || s === '巽') return 'wuxing-mu';
    if (s === '离') return 'wuxing-huo';
    if (s === '坤' || s === '艮' || s === '中') return 'wuxing-tu';
    if (s === '乾' || s === '兑') return 'wuxing-jin';
    if (s === '坎') return 'wuxing-shui';
    return '';
  }

  // —— 单宫内容（移植 standardGongTemplate.ejs）——
  function gongContentHTML(g, pan) {
    var baShen = esc(pan.baShen && pan.baShen[g]);
    var baMen = esc(pan.baMen && pan.baMen[g]);
    var jiuXing = esc(pan.jiuXing && pan.jiuXing[g]);
    var tianPan = esc(pan.sanQiLiuYi && pan.sanQiLiuYi[g]);
    var diPan = esc(pan.diPan && pan.diPan[g]);
    var diZhi = esc(pan.anGan && pan.anGan[g]);
    var dayXunShou = pan.dayXunShou || '';
    var showEmptyCircle = !!(pan.kongWangGong && pan.kongWangGong.indexOf(g) !== -1);
    var showMaStar = !!(pan.maStar && pan.maStar.gong === g);
    var gongName = JIU_GONG[g].name;
    var gongNumber = GONG_NUMBER[g];

    var sC = shenColor(baShen);
    var mC = menColor(baMen);
    var xC = xingColor(jiuXing);

    var isEmpty = !tianPan;
    var isDayXunShou = tianPan && dayXunShou && tianPan === dayXunShou;
    var tC = ganColor(tianPan);
    var tBorder = borderColor(tianPan);
    var tClass = tC + (isDayXunShou ? ' tianpan-boxed ' + tBorder : '');

    var gC = gongColor(gongName);
    var dC = ganColor(diPan);

    var marks = '';
    if (showMaStar) marks += '<span class="circle-mark green-circle">马</span>';
    if (showEmptyCircle) marks += '<span class="circle-mark yellow-circle">空</span>';

    return '' +
      '<div class="gong-content">' +
        '<div class="gong-dizhi di-zhi">' + diZhi + '</div>' +
        '<div class="gong-dizhi2"></div>' +
        '<div class="gong-bashen ' + sC + '">' + baShen + '</div>' +
        '<div class="gong-tianganfang">' + marks + '</div>' +
        '<div class="gong-tianganfang2"></div>' +
        '<div class="gong-bamen ' + mC + '">' + baMen + '</div>' +
        '<div class="gong-gongname2"></div>' +
        '<div class="gong-jiuxing ' + xC + '">' + jiuXing + '</div>' +
        '<div class="gong-tiangan ' + tClass + '">' + (isEmpty ? '' : tianPan) + '</div>' +
        '<div class="gong-gongname ' + gC + '">' + gongName + '</div>' +
        '<div class="gong-number">' + gongNumber + '</div>' +
        '<div class="gong-dipan ' + dC + '">' + (diPan ? diPan : '') + '</div>' +
      '</div>';
  }

  function gongHTML(g, pan) {
    var jiXiongClass, zhifu = '', zhishi = '';
    if (g === '5') {
      jiXiongClass = 'ping';
    } else {
      jiXiongClass = (pan.jiuGongAnalysis && pan.jiuGongAnalysis[g] && pan.jiuGongAnalysis[g].jiXiong) || 'ping';
    }
    if (pan.zhiFuGong === g) zhifu = ' zhifu';
    if (pan.zhiShiGong === g) zhishi = ' zhishi';
    return '<div class="gong gong' + g + ' ' + jiXiongClass + zhifu + zhishi + '">' + gongContentHTML(g, pan) + '</div>';
  }

  // —— 基本信息行 ——
  function basicInfoHTML(pan) {
    var b = pan.basicInfo || {};
    var s = pan.siZhu || {};
    var a = pan.analysis || {};
    function item(label, val) {
      return '<div class="info-item"><strong>' + label + ':</strong> <span>' + esc(val) + '</span></div>';
    }
    var html = '';
    html += item('排盘类型', b.type);
    html += item('排盘方法', b.method);
    html += item('公历', b.date);
    html += item('农历', b.lunarDate);
    html += '<div class="info-item"><strong>四柱:</strong> ' +
      '<span class="label label-primary">' + esc(s.year) + '</span> ' +
      '<span class="label label-primary">' + esc(s.month) + '</span> ' +
      '<span class="label label-primary">' + esc(s.day) + '</span> ' +
      '<span class="label label-primary">' + esc(s.time) + '</span></div>';
    html += item('旬首', pan.xunShou);
    html += item('局数', pan.juShu && pan.juShu.fullName);
    html += item('值符', (pan.zhiFuXing || '') + '(' + (pan.zhiFuGong || '') + '宫)');
    html += item('值使', (pan.zhiShiMen || '') + '(' + (pan.zhiShiGong || '') + '宫)');
    html += '<div class="info-item"><strong>运势:</strong> <span class="' + esc(a.overallJiXiong || 'ping') + '">' + esc(a.overallJiXiongText || '平') + '</span></div>';
    return html;
  }

  // —— 分析与建议 ——
  function analysisHTML(pan) {
    var a = pan.analysis || {};
    var jg = pan.jiuGongAnalysis || {};
    var html = '<p>值符:<strong>' + esc(pan.zhiFuGong || '5') + '宫(' +
      esc((jg[pan.zhiFuGong] && jg[pan.zhiFuGong].gongName) || '中') + ')</strong>, 值使:<strong>' +
      esc(pan.zhiShiGong || '5') + '宫(' + esc((jg[pan.zhiShiGong] && jg[pan.zhiShiGong].gongName) || '中') + ')</strong></p>';
    if (a.bestGong && jg[a.bestGong]) {
      html += '<p>最有利方位: <strong>' + esc(jg[a.bestGong].direction || '') + '(' + esc(jg[a.bestGong].gongName || '') + '宫)</strong></p>';
    }
    if (a.suggestions && Array.isArray(a.suggestions) && a.suggestions.length) {
      html += '<strong>建议:</strong><ul class="suggestion-list">';
      a.suggestions.forEach(function (s) { html += '<li>' + esc(s) + '</li>'; });
      html += '</ul>';
    } else {
      html += '<p>暂无建议</p>';
    }
    return html;
  }

  // —— 格局 ——
  function gejuHTML(pan) {
    var geju = pan.geju || [];
    if (Array.isArray(geju) && geju.length) {
      var html = '<ul class="geju-list">';
      geju.forEach(function (g) {
        var cls = g.jiXiong === 'ji' ? 'success' : g.jiXiong === 'xiong' ? 'danger' : 'default';
        var txt = g.jiXiong === 'ji' ? '吉' : g.jiXiong === 'xiong' ? '凶' : '平';
        html += '<li><span class="label label-' + cls + '">' + txt + '</span> ' +
          '<strong>' + esc(g.name) + '</strong>' + (g.gong ? '（' + esc(g.gong) + '宫）' : '') +
          ' — ' + esc(g.explain) + '</li>';
      });
      html += '</ul>';
      return html;
    }
    return '<p>本盘未见显著格局。</p>';
  }

  // —— 九宫详解 ——
  function detailsHTML(pan) {
    var jg = pan.jiuGongAnalysis || {};
    var html = '<div class="gong-details">';
    for (var i = 1; i <= 9; i++) {
      var item = jg[i];
      if (!item) continue;
      var jiXiong = item.jiXiong || 'ping';
      var panelCls = (jiXiong.indexOf('ji') >= 0) ? 'success' : (jiXiong === 'ping' ? 'info' : 'danger');
      var labelCls = (jiXiong.indexOf('ji') >= 0) ? 'success' : (jiXiong === 'ping' ? 'default' : 'danger');
      html += '<div class="col-md-4"><div class="panel panel-' + panelCls + '">' +
        '<div class="panel-heading"><h4 class="panel-title">' + i + '-' + esc(item.gongName || '') +
        '<span class="pull-right label label-' + labelCls + '">' + esc(item.jiXiongText || '平') + '</span></h4></div>' +
        '<div class="panel-body">' +
        '<p><strong>方位:</strong> ' + esc(item.direction || '') +
        ' <strong>九星:</strong> ' + esc(item.xing || '') + (item.xingAlias ? '(' + esc(item.xingAlias) + ')' : '') + '</p>' +
        (item.men ? '<p><strong>八门:</strong> ' + esc(item.men) + '</p>' : '') +
        (item.shen ? '<p><strong>八神:</strong> ' + esc(item.shen) + '</p>' : '') +
        '<p><strong>天盘:</strong> ' + esc(item.tianGan || '') + ' <strong>地盘:</strong> ' + esc(item.diGan || '') +
        (item.anGan ? ' <strong>暗干:</strong> ' + esc(item.anGan) : '') + '</p>' +
        '<p>' +
        (item.keYing ? '<span class="label label-' + (item.keYing.jiXiong === 'ji' ? 'success' : item.keYing.jiXiong === 'xiong' ? 'danger' : 'default') + '">' + esc(item.keYing.name) + '</span> ' : '') +
        (item.menPo ? '<span class="label label-danger">门迫</span> ' : '') +
        (item.kongWang ? '<span class="label label-default">空亡</span> ' : '') +
        (item.yiMa ? '<span class="label label-info">驿马</span> ' : '') +
        '</p>' +
        '<p class="gong-explain">' + esc(item.explain || '暂无解释') + '</p>' +
        '</div></div></div>';
    }
    html += '</div>';
    return html;
  }

  // —— 总渲染 ——
  function renderPan(pan) {
    if (pan.error) {
      document.getElementById('qimenRoot').innerHTML = '<div class="alert alert-danger">排盘出错: ' + esc(pan.message) + '</div>';
      return;
    }
    var grid = '';
    GONG_ORDER.forEach(function (g) { grid += gongHTML(g, pan); });

    var html = '' +
      '<div class="row"><div class="col-md-12 text-center">' +
        '<h2 class="page-title">奇门遁甲排盘</h2>' +
        '<div class="basic-info">' + basicInfoHTML(pan) + '</div>' +
      '</div></div>' +
      '<div class="row"><div class="col-md-12"><div class="qimen-pan"><div class="pan-outer"><div class="pan-grid">' + grid + '</div></div></div></div></div>' +
      '<div class="row"><div class="col-md-12"><div class="panel panel-primary"><div class="panel-heading"><h3 class="panel-title">分析与建议</h3></div><div class="panel-body">' + analysisHTML(pan) + '</div></div></div></div>' +
      '<div class="row"><div class="col-md-12"><div class="panel panel-warning"><div class="panel-heading"><h3 class="panel-title">格局</h3></div><div class="panel-body">' + gejuHTML(pan) + '</div></div></div></div>' +
      '<div class="row"><div class="col-md-12"><div class="panel panel-default"><div class="panel-heading"><h3 class="panel-title">九宫详解</h3></div><div class="panel-body">' + detailsHTML(pan) + '</div></div></div></div>';

    document.getElementById('qimenRoot').innerHTML = html;
  }

  // —— 表单交互 ——
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function nowLocal() {
    var d = new Date();
    return { date: d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()), time: pad(d.getHours()) + ':' + pad(d.getMinutes()) };
  }

  function doPan() {
    var type = document.getElementById('f-type').value;
    var method = document.getElementById('f-method').value;
    var dateStr = document.getElementById('f-date').value;
    var timeStr = document.getElementById('f-time').value;
    var purpose = document.getElementById('f-purpose').value;
    var location = document.getElementById('f-location').value || '默认位置';

    var date;
    if (dateStr && timeStr) {
      date = new Date(dateStr + 'T' + timeStr);
    } else {
      date = new Date();
    }
    if (isNaN(date.getTime())) {
      document.getElementById('qimenRoot').innerHTML = '<div class="alert alert-danger">无效的日期时间</div>';
      return;
    }
    var pan = Q.calculate(date, { type: type, method: method, purpose: purpose, location: location });
    renderPan(pan);
  }

  window.addEventListener('DOMContentLoaded', function () {
    var def = nowLocal();
    document.getElementById('f-date').value = def.date;
    document.getElementById('f-time').value = def.time;
    document.getElementById('panForm').addEventListener('submit', function (e) { e.preventDefault(); doPan(); });
    doPan();
  });
})();
