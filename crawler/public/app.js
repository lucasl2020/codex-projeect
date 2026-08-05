const $ = (sel) => document.querySelector(sel);

async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || res.statusText || 'request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function money(p) {
  if (p == null || Number.isNaN(Number(p))) return '—';
  return `¥${Number(p).toFixed(2)}`;
}

function warrantyLabel(days, raw) {
  if (raw) return raw;
  if (days == null) return '质保未知';
  if (days >= 36500) return '永久';
  if (days >= 365 && days % 365 === 0) return `${days / 365}年`;
  if (days >= 30 && days % 30 === 0) return `${days / 30}个月`;
  return `${days}天`;
}

function statusTag(status) {
  const s = status || '—';
  const cls = s === 'ok' ? 'ok' : s === 'failed' ? 'failed' : s === 'partial' ? 'partial' : '';
  return `<span class="tag ${cls}">${esc(s)}</span>`;
}

function productCard(p) {
  const img = p.image_url
    ? `<img src="${esc(p.image_url)}" alt="" loading="lazy" onerror="this.style.display='none'" />`
    : `<div class="img-ph">无图</div>`;
  const link = p.product_url
    ? `<a href="${esc(p.product_url)}" target="_blank" rel="noopener">详情</a>`
    : '';
  return `<article class="product">
    ${img}
    <div class="body">
      <div class="name" title="${esc(p.name)}">${esc(p.name)}</div>
      <div class="price">${money(p.price)}</div>
      <div class="warranty">${esc(warrantyLabel(p.warranty_days, p.warranty_raw))}</div>
      ${link}
    </div>
  </article>`;
}

function siteActions(s) {
  return `<div class="shop-actions">
    <select class="type-select" data-type="${s.id}">
      <option value="shop" ${s.type === 'shop' ? 'selected' : ''}>店铺</option>
      <option value="nav" ${s.type === 'nav' ? 'selected' : ''}>导航</option>
      <option value="unknown" ${s.type === 'unknown' ? 'selected' : ''}>未识别</option>
    </select>
    <button class="btn sm" data-crawl="${s.id}">刷新</button>
    <button class="btn sm" data-toggle="${s.id}" data-enabled="${s.enabled ? 1 : 0}">${s.enabled ? '禁用' : '启用'}</button>
    <button class="btn sm danger" data-del="${s.id}">删除</button>
  </div>`;
}

function renderShop(s) {
  const products = s.products || [];
  return `<div class="shop">
    <div class="shop-head">
      <div>
        <div class="shop-title">${esc(s.name || s.domain || s.url)} ${statusTag(s.last_status)}</div>
        <div class="shop-meta"><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url)}</a>
          · 商品 ${products.length}
          ${s.last_crawl_at ? ` · ${esc(s.last_crawl_at)}` : ''}
          ${s.fail_count ? ` · 失败${s.fail_count}` : ''}
          ${s.last_error ? ` · ${esc(s.last_error)}` : ''}
        </div>
      </div>
      ${siteActions(s)}
    </div>
    <div class="products">
      ${products.length ? products.map(productCard).join('') : '<div class="empty">暂无商品（可能尚未爬取成功）</div>'}
    </div>
  </div>`;
}

function renderLinkRow(s) {
  return `<div class="link-row">
    <div>
      <div><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name || s.url)}</a> ${statusTag(s.last_status)}</div>
      <div class="muted">${esc(s.url)}${s.last_error ? ' · ' + esc(s.last_error) : ''}</div>
    </div>
    ${siteActions(s)}
  </div>`;
}

async function loadOverview() {
  const data = await api('/api/overview');
  $('#shopCount').textContent = String(data.shops?.length || 0);
  $('#navCount').textContent = String(data.nav?.length || 0);
  $('#unknownCount').textContent = String(data.unknown?.length || 0);
  $('#shops').innerHTML = (data.shops || []).map(renderShop).join('') || '<div class="empty">暂无店铺</div>';
  $('#navs').innerHTML = (data.nav || []).map(renderLinkRow).join('') || '<div class="empty">暂无导航站</div>';
  $('#unknowns').innerHTML = (data.unknown || []).map(renderLinkRow).join('') || '<div class="empty">暂无未识别站点</div>';
}

async function runSearch() {
  const q = $('#filterQ').value.trim();
  const minPrice = $('#filterMin').value;
  const maxPrice = $('#filterMax').value;
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (minPrice !== '') params.set('minPrice', minPrice);
  if (maxPrice !== '') params.set('maxPrice', maxPrice);
  const rows = await api(`/api/search?${params}`);
  const box = $('#searchResults');
  box.classList.remove('hidden');
  if (!rows.length) {
    box.innerHTML = '<div class="empty">无匹配商品</div>';
    return;
  }
  box.innerHTML = `<div class="muted" style="margin-bottom:0.5rem">跨店结果 ${rows.length} 条（已按价格/质保排序）</div>
    <div class="products">${rows.map((p) => {
      const site = p.site_name || p.site_domain || '';
      return `<article class="product">
        ${p.image_url ? `<img src="${esc(p.image_url)}" alt="" loading="lazy" onerror="this.style.display='none'" />` : `<div class="img-ph">无图</div>`}
        <div class="body">
          <div class="name">${esc(p.name)}</div>
          <div class="price">${money(p.price)}</div>
          <div class="warranty">${esc(warrantyLabel(p.warranty_days, p.warranty_raw))}</div>
          <div class="muted">${esc(site)}</div>
          <a href="${esc(p.site_url || p.product_url || '#')}" target="_blank" rel="noopener">来源</a>
        </div>
      </article>`;
    }).join('')}</div>`;
}

const SEED_URLS = `https://aiprobe.top
https://aibijia.org/
https://priceai.cc/
https://cardnav.xyz/
https://www.nodebits.xyz/#shops
https://aihaotan.com/#home
https://nav.boji1334.com/
https://pay.ldxp.cn/shop/mengze
https://shop.hailizi.de
https://chirou.ai/cat/38
https://talkw.cc/
https://www.jeejia.cn/shop/9DBMWCKH
https://catfk.com/shop/UEL55G64
https://haoapi.store
https://gmail6868.com/
https://faka.oapi.vip/
https://icowpen.com/
https://buy.aixou.top/products`;

function bind() {
  $('#btnImport').onclick = async () => {
    const text = $('#importText').value;
    $('#importMsg').textContent = '导入中…';
    try {
      const r = await api('/api/import', {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      $('#importMsg').textContent = `导入 ${r.imported}，跳过 ${r.skipped}${r.errors?.length ? `，错误 ${r.errors.length}` : ''}`;
      await loadOverview();
    } catch (e) {
      $('#importMsg').textContent = e.message;
    }
  };

  $('#btnImportSeed').onclick = async () => {
    $('#importText').value = SEED_URLS;
    $('#btnImport').click();
  };

  $('#btnRefreshAll').onclick = async () => {
    try {
      await api('/api/crawl', { method: 'POST', body: '{}' });
      pollStatus();
    } catch (e) {
      alert(e.message);
    }
  };

  $('#btnReload').onclick = () => loadOverview();
  $('#btnSearch').onclick = () => runSearch().catch((e) => alert(e.message));
  $('#btnClearSearch').onclick = () => {
    $('#filterQ').value = '';
    $('#filterMin').value = '';
    $('#filterMax').value = '';
    $('#searchResults').classList.add('hidden');
    $('#searchResults').innerHTML = '';
  };

  $('#btnSettings').onclick = async () => {
    const s = await api('/api/settings');
    $('#s_crawl_on_startup').checked = s.crawl_on_startup !== 'false';
    $('#s_schedule_enabled').checked = s.schedule_enabled !== 'false';
    $('#s_schedule_interval_hours').value = s.schedule_interval_hours || '6';
    $('#s_crawl_concurrency').value = s.crawl_concurrency || '2';
    $('#s_crawl_delay_ms').value = s.crawl_delay_ms || '800';
    $('#s_request_timeout_ms').value = s.request_timeout_ms || '45000';
    $('#s_auto_disable_after_fails').value = s.auto_disable_after_fails || '5';
    $('#s_playwright_headless').checked = s.playwright_headless !== 'false';
    $('#settingsDialog').showModal();
  };

  $('#btnSaveSettings').onclick = async (e) => {
    e.preventDefault();
    await api('/api/settings', {
      method: 'PUT',
      body: JSON.stringify({
        crawl_on_startup: $('#s_crawl_on_startup').checked,
        schedule_enabled: $('#s_schedule_enabled').checked,
        schedule_interval_hours: Number($('#s_schedule_interval_hours').value) || 6,
        crawl_concurrency: Number($('#s_crawl_concurrency').value) || 2,
        crawl_delay_ms: Number($('#s_crawl_delay_ms').value) || 0,
        request_timeout_ms: Number($('#s_request_timeout_ms').value) || 45000,
        auto_disable_after_fails: Number($('#s_auto_disable_after_fails').value) || 0,
        playwright_headless: $('#s_playwright_headless').checked,
      }),
    });
    $('#settingsDialog').close();
  };

  document.body.addEventListener('click', async (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    const crawlId = t.getAttribute('data-crawl');
    if (crawlId) {
      try {
        await api('/api/crawl', {
          method: 'POST',
          body: JSON.stringify({ siteId: Number(crawlId) }),
        });
        pollStatus();
      } catch (err) {
        alert(err.message);
      }
    }
    const delId = t.getAttribute('data-del');
    if (delId) {
      if (!confirm('删除该站点及商品？')) return;
      await api(`/api/sites/${delId}`, { method: 'DELETE' });
      await loadOverview();
    }
    const toggleId = t.getAttribute('data-toggle');
    if (toggleId) {
      const enabled = t.getAttribute('data-enabled') === '1' ? false : true;
      await api(`/api/sites/${toggleId}`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled }),
      });
      await loadOverview();
    }
  });

  document.body.addEventListener('change', async (e) => {
    const t = e.target;
    if (!(t instanceof HTMLSelectElement)) return;
    const id = t.getAttribute('data-type');
    if (!id) return;
    await api(`/api/sites/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ type: t.value }),
    });
    await loadOverview();
  });
}

let wasRunning = false;
async function pollStatus() {
  await tick();
}

async function tick() {
  const before = wasRunning;
  try {
    const st = await api('/api/crawl/status');
    wasRunning = Boolean(st.running);
    const el = $('#crawlStatus');
    if (st.running) {
      const cur = st.job?.currentUrl ? ` · ${st.job.currentUrl}` : '';
      el.textContent = `running ${st.job?.done || 0}/${st.job?.total || '?'}${cur}`;
      el.title = st.job?.currentUrl || '';
      el.className = 'status pill running';
    } else {
      el.textContent = 'idle';
      el.title = '';
      el.className = 'status pill idle';
      if (before) await loadOverview();
    }
  } catch {
    /* ignore */
  }
}

bind();
loadOverview();
tick();
setInterval(tick, 2000);
