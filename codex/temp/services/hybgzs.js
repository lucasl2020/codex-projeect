const {
  URLS,
  log,
  parseJson,
  messageOf,
  isLoginUrl,
  tryClickTurnstile,
  hybgzsCfWatchers,
  watchHybgzsCf,
  sleep,
  runServiceStandalone,
} = require('./common');

async function hybgzsStats(page) {
  const res = await page.evaluate(async () => {
    const r = await fetch('/api/dashboard/stats', { credentials: 'include', signal: AbortSignal.timeout(15000) });
    return { status: r.status, text: await r.text() };
  });
  return { status: res.status, data: parseJson(res.text) };
}

function clickWaitPost(page, matcher, timeout = 45000) {
  return page.waitForResponse(
    res => res.request().method() === 'POST' && res.url().includes(matcher),
    { timeout },
  ).catch(() => null);
}

// 点击 CapDialog 里无文字的圆环按钮（onClick=em），触发 <cap-widget> 自动 PoW 验证。
async function clickCapStart(page, { timeout = 4000 } = {}) {
  if (typeof page?.locator !== 'function' || !page?.mouse) return false;
  try {
    const ring = page.locator('button.flex-shrink-0.aspect-square').first();
    await ring.waitFor({ state: 'visible', timeout }).catch(() => {});
    if (!(await ring.isVisible().catch(() => false))) return false;

    // 若弹窗已经在计算验证、验证中或已成功提交，不再重复点击打断
    const dialog = page.locator('[role="dialog"]').first();
    const dialogText = await dialog.innerText({ timeout: 100 }).catch(() => '');
    if (/正在计算|正在验证|验证成功|正在提交/i.test(dialogText)) {
      return false;
    }

    // 等待 nonce 准备就绪，按钮移除 disabled 状态（高频微轮询，每 30ms 一次，最多 3 秒）
    const deadline = Date.now() + 3000;
    while (Date.now() < deadline) {
      const disabled = await ring.isDisabled().catch(() => true);
      const text = await dialog.innerText({ timeout: 100 }).catch(() => '');
      if (/正在计算|正在验证|验证成功|正在提交/i.test(text)) {
        return false;
      }
      if (!disabled && !text.includes('正在准备验证')) break;
      if (page.waitForTimeout) await page.waitForTimeout(30);
      else await sleep(30);
    }
    if (await ring.isDisabled().catch(() => true)) return false;

    const box = await ring.boundingBox().catch(() => null);
    if (!box || box.width <= 0 || box.height <= 0) return false;

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    if (page.waitForTimeout) await page.waitForTimeout(20);
    else await sleep(20);
    await page.mouse.up();
    return true;
  } catch {
    return false;
  }
}

// 在当前会话自动操作验证组件（同时支持网站自带的绮问演算/CapDialog 与 Cloudflare Turnstile），以实际业务响应为完成依据。
async function hybgzsCapFlow(page, triggerBtn, finalMatcher, { timeoutMs = 90000 } = {}) {
  let finished = false;
  let resp = null;
  const finalPromise = clickWaitPost(page, finalMatcher, timeoutMs).then(value => {
    resp = value;
    finished = true;
    return value;
  });

  // 监听网站自身的 CapDialog challenge（获取验证 nonce）
  const capChallengePromise = clickWaitPost(page, '/api/cap/challenge', timeoutMs);

  // 点击触发按钮（签到或抽奖）
  await triggerBtn.click({ timeout: 15000 });
  log('hybgzs', '已触发操作，等待验证组件放行或业务响应。');

  // 等待网站自身验证准备就绪，或直接由最终接口响应
  const initialWinner = await Promise.race([
    finalPromise.then(r => (r ? '__DIRECT_DONE__' : null)),
    capChallengePromise.then(r => (r ? '__CAP_CHALLENGE__' : null)),
    (page.waitForTimeout ? page.waitForTimeout(500) : sleep(500)).then(() => null),
  ]);

  if (finished && resp) {
    return { resp, capError: '' };
  }

  if (initialWinner === '__DIRECT_DONE__') {
    return { resp, capError: '' };
  }

  let capError = '';
  if (initialWinner === '__CAP_CHALLENGE__') {
    const capResp = await capChallengePromise;
    if (capResp) {
      const status = typeof capResp.status === 'function' ? capResp.status() : 200;
      let cd = null;
      if (typeof capResp.json === 'function') {
        try { cd = await capResp.json(); } catch {}
      }
      if (status !== 200 || (cd && cd.success !== true)) {
        capError = String(cd?.error || cd?.message || ('HTTP ' + status));
      }
    }
  }

  // 尝试立即点击网站自带的 CapDialog 圆环按钮
  if (capError) return { resp: null, capError };
  let capStarted = false;
  if (!capError) {
    capStarted = await clickCapStart(page, { timeout: 1500 });
    if (capStarted) {
      log('hybgzs', '已自动点击绮问演算验证按钮，正在计算 PoW 并等待放行。');
    }
  }

  const deadline = Date.now() + timeoutMs;
  while (!finished && Date.now() < deadline) {
    let capClicked = false;
    if (!capStarted) {
      capClicked = await clickCapStart(page, { timeout: 400 });
      if (capClicked) {
        capStarted = true;
        log('hybgzs', '已自动点击绮问演算验证按钮，正在计算 PoW 并等待放行。');
      }
    } else if (typeof page.locator === 'function') {
      const needsRetry = await page.locator('[role="dialog"]').first().innerText({ timeout: 100 })
        .then(t => /失败|重试|重新验证/i.test(t))
        .catch(() => false);
      if (needsRetry) {
        capStarted = false;
      }
    }

    const cfClicked = hybgzsCfWatchers.has(page) ? false : await tryClickTurnstile(page).catch(() => false);
    if (cfClicked) {
      log('hybgzs', '已自动点击 CF 复选框，等待验证结果。');
    }

    const waitStep = (capClicked || cfClicked || capStarted) ? 800 : 400;
    await Promise.race([
      finalPromise,
      page.waitForTimeout ? page.waitForTimeout(waitStep) : sleep(waitStep),
    ]);
  }

  return { resp, capError: resp ? '' : (capError || '验证自动处理超时，未收到业务响应') };
}

async function waitHybgzsReady(page, { waitMs = 90000 } = {}) {
  const deadline = Date.now() + waitMs;
  let prompted = false;
  do {
    if (isLoginUrl(page.url())) throw new Error('cdk.hybgzs.com 未登录；请运行「重新登录全部网站.cmd」。');
    const stats = await hybgzsStats(page).catch(() => ({ status: 0, data: null }));
    if (stats.status === 401) throw new Error('cdk.hybgzs.com 未登录；请运行「重新登录全部网站.cmd」。');
    if (stats.status === 200 && stats.data?.success === true && stats.data?.data
      && typeof stats.data.data === 'object' && !Array.isArray(stats.data.data)) return stats;
    const error = stats.data?.error?.message || messageOf(stats.data) || `HTTP ${stats.status}`;
    if (/未登录|登录.*(?:失效|过期)|unauthorized/i.test(error)) {
      throw new Error('cdk.hybgzs.com 未登录；请运行「重新登录全部网站.cmd」。');
    }
    if (stats.data && !/人机验证|安全验证|captcha|turnstile|cloudflare/i.test(error)) {
      throw new Error('黑白福利站统计接口未成功：' + error);
    }
    if (Date.now() >= deadline) throw new Error('CF 自动验证或统计接口等待超时。');
    if (!prompted) {
      log('hybgzs', '检测到验证，程序正在当前会话自动处理 CF。');
      prompted = true;
    }
    const clicked = hybgzsCfWatchers.has(page) ? false : await tryClickTurnstile(page);
    await page.waitForTimeout(clicked ? 8000 : 2000);
  } while (true);
}

async function doHybgzsCheckin(page) {
  await page.goto('https://cdk.hybgzs.com/gas-station/checkin', { waitUntil: 'domcontentloaded', timeout: 60000 });
  const btn = page.locator('button').filter({ hasText: /立即签到|^签到$/ }).first();
  await btn.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  if (typeof btn.isVisible === 'function' && !(await btn.isVisible())) return { result: 'fail', message: '未找到签到按钮' };
  const { resp, capError } = await hybgzsCapFlow(page, btn, '/api/checkin');
  if (capError) return { result: 'fail', message: '人机验证获取失败：' + capError };
  if (!resp) return { result: 'fail', message: '人机验证未自动通过（未发起签到请求）' };
  let data = null;
  try { data = await resp.json(); } catch {}
  const status = resp.status();
  if (status >= 200 && status < 300 && data?.success === true) {
    return { result: 'success', message: '签到成功' };
  }
  const err = String(data?.error || data?.message || '');
  if (/已签|签到过|今日已|已完成/.test(err)) return { result: 'done', message: '今日已签到' };
  return { result: 'fail', message: '签到失败：' + (err || ('HTTP ' + status)) };
}

async function doHybgzsWheel(page, spins) {
  await page.goto('https://cdk.hybgzs.com/entertainment/wheel', { waitUntil: 'domcontentloaded', timeout: 60000 });
  const spin = page.locator('[data-testid="wheel-spin-button"]').first();
  await spin.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  if (typeof spin.isVisible === 'function' && !(await spin.isVisible())) return { result: 'fail', message: '未找到抽奖按钮' };

  let remaining = spins;
  const prizes = [];
  while (remaining > 0) {
    const { resp, capError } = await hybgzsCapFlow(page, spin, '/api/wheel');
    if (capError) return { result: 'fail', message: '人机验证获取失败：' + capError };
    if (!resp) return { result: 'fail', message: '抽奖未触发请求（第' + (prizes.length + 1) + '次）' };
    let data = null;
    try { data = await resp.json(); } catch {}
    const status = resp.status();
    const err = String(data?.error || data?.message || '');
    if (status >= 200 && status < 300 && data?.success === true) {
      const prize = data?.data?.prize;
      prizes.push(prize?.name || '奖励');
    } else if (/次数|用完|无.*次/.test(err)) {
      break;
    } else {
      return { result: 'fail', message: '抽奖失败：' + (err || ('HTTP ' + status)) };
    }
    const next = Number(data?.data?.remainingSpins);
    if (Number.isFinite(next) && next >= remaining) {
      return { result: 'fail', message: '转盘剩余次数未减少，停止重复抽奖（已抽 ' + prizes.length + ' 次）' };
    }
    remaining = Number.isFinite(next) ? next : remaining - 1;
    if (remaining > 0) {
      const readyAt = Date.now() + 10000;
      while (!(await spin.isEnabled())) {
        if (Date.now() >= readyAt) return { result: 'fail', message: '转盘动画结束后按钮仍不可用，结束本轮' };
        await page.waitForTimeout(300);
      }
    }
  }
  if (!prizes.length) return { result: 'done', message: '今日免费次数已用完' };
  return { result: 'success', message: '共抽' + prizes.length + '次：' + prizes.join('、') + (remaining > 0 ? '（剩余' + remaining + '次）' : '') };
}

async function hybgzsApi(page, url, opts = {}) {
  const started = Date.now();
  const result = await page.evaluate(async (arg) => {
    const { u, o } = arg;
    try {
      const r = await fetch(u, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...o, signal: AbortSignal.timeout(15000) });
      let data = null; try { data = await r.json(); } catch {}
      return { status: r.status, data };
    } catch (e) { return { status: -1, data: null, error: String(e) }; }
  }, { u: url, o: opts });
  log('hybgzs', `${url}：HTTP ${result.status}，耗时 ${((Date.now() - started) / 1000).toFixed(1)} 秒`);
  if (result.status < 0 || !result.data) {
    throw new Error(`${url} 请求超时、网络异常或未返回 JSON（HTTP ${result.status}），停止本轮以免重复提交。`);
  }
  if (result.status === 401) throw new Error('黑白福利站登录失效，请重新登录。');
  return result;
}

async function doHybgzsGiftbox(page) {
  const st = await hybgzsApi(page, '/api/giftbox/status');
  const d = st.data?.data || {};
  if (d.isActivityEnded) return { parts: ['福袋：活动已结束'] };
  const rem = Number(d.remainingAttempts ?? 0);
  if (rem <= 0) return { parts: ['福袋：今日已开'] };
  const r = await hybgzsApi(page, '/api/giftbox/open', { method: 'POST', body: JSON.stringify({ boxIndex: 0 }) });
  if (r.data?.success) {
    const w = r.data?.data || {};
    let label = '福袋：开启成功';
    if (w.rewardType === 'quota') label += '（额度 +$' + (Number(w.quotaAmount || 0) / 500000).toFixed(2) + '）';
    else if (w.rewardType === 'vip') label += '（VIP +' + (w.vipDays || 0) + '天）';
    else if (w.rewardType === 'card') label += '（卡牌' + (w.cardName ? ' ' + w.cardName : '') + '）';
    return { parts: [label] };
  }
  return { parts: ['福袋：' + String(r.data?.error || '开启失败')] };
}

async function doHybgzsCards(page) {
  const st = await hybgzsApi(page, '/api/cards/draw/status');
  let free = Number(st.data?.limits?.freeRemaining ?? 0);
  if (free <= 0) return { parts: ['抽卡：今日免费次数已用完'] };
  let drawn = 0, legendary = 0, epic = 0, failures = 0;
  while (free > 0) {
    const drawType = free >= 10 ? 'ten' : 'single';
    const drawCount = drawType === 'ten' ? 10 : 1;
    const r = await hybgzsApi(page, '/api/cards/draw', {
      method: 'POST',
      body: JSON.stringify({ type: drawType }),
    });
    if (!r.data?.success) {
      const err = String(r.data?.error?.message || r.data?.error || '失败');
      if (/频繁|稍后|429|limit|rate/i.test(err) && failures < 3) {
        failures++;
        const waitMs = failures * 8000;
        log('hybgzs', `抽卡触发频控（${err}），等待 ${waitMs / 1000} 秒后重试第 ${failures} 次...`);
        await page.waitForTimeout?.(waitMs);
        continue;
      }
      return { parts: ['抽卡：' + err + '（已抽 ' + drawn + ' 次，剩余 ' + free + ' 次）'] };
    }
    failures = 0;
    drawn += drawCount;
    free -= drawCount;
    for (const c of (Array.isArray(r.data.cards) ? r.data.cards : [])) {
      const rar = c?.rarity;
      if (rar === 'legendary' || rar === '传说') legendary++;
      else if (rar === 'epic' || rar === '史诗') epic++;
    }
    if (free > 0) await page.waitForTimeout?.(2500);
  }
  return { parts: ['抽卡：免费抽 ' + drawn + ' 次' + (legendary ? '，传说 ' + legendary : '') + (epic ? '，史诗 ' + epic : '')] };
}

async function fetchJinriShiciNote() {
  const fallback = '这是一条自动漂流的问候，祝你好运连连。';
  try {
    const r = await fetch('https://v1.jinrishici.com/all.json', { signal: AbortSignal.timeout(3000) });
    const d = await r.json();
    const content = String(d?.content || '').trim();
    return (content && content.length >= 5) ? content : fallback;
  } catch {
    return fallback;
  }
}

async function doHybgzsDriftBottle(page) {
  const settings = await hybgzsApi(page, '/api/drift-bottle/settings');
  const usage = settings.data?.data?.usage || {};
  const pickRemaining = Number(usage.pickRemaining ?? 0);
  const parts = [];

  if (pickRemaining <= 0) {
    parts.push('漂流瓶：今日已捡');
    return { ok: true, parts };
  }

  // 丢瓶：捡几次丢几个（解锁捡瓶资格），每瓶 $10、匿名、随机诗；遇冷却/限流等待重试。
  let threw = 0;
  let cooldownWaited = false;
  for (let i = 0; i < pickRemaining; i++) {
    const note = await fetchJinriShiciNote();
    const thr = await hybgzsApi(page, '/api/drift-bottle/throw', {
      method: 'POST',
      body: JSON.stringify({ isAnonymous: true, noteContent: note, amountUsd: 10, cardId: null, cardIsSP: false }),
    });
    if (!thr.data?.success) {
      const err = String(thr.data?.error || '失败');
      if (/频繁|稍后|冷却|限/.test(err) && !cooldownWaited) {
        cooldownWaited = true;
        log('hybgzs', '漂流瓶冷却：等待 60 秒后重试一次。');
        await page.waitForTimeout(60000); i--; continue;
      }
      parts.push('丢瓶：' + err);
      break;
    }
    threw++;
    await page.waitForTimeout?.(2000);
  }
  if (threw > 0) parts.push('丢瓶：成功 ' + threw + ' 次');

  // 捡瓶（每天 1 次；冷却是「等待 1 分钟」）
  let picked = false;
  for (let t = 0; t < 2 && !picked; t++) {
    const pk = await hybgzsApi(page, '/api/drift-bottle/pick', { method: 'POST', body: JSON.stringify({ scope: 'world' }) });
    if (pk.data?.success) { picked = true; parts.push('捡瓶：成功'); break; }
    if (pk.data?.code === 'PICK_COOLDOWN' && !cooldownWaited) {
      cooldownWaited = true;
      log('hybgzs', '捡瓶冷却：等待 60 秒后重试一次。');
      await page.waitForTimeout(60000); continue;
    }
    parts.push('捡瓶：' + String(pk.data?.error || '失败'));
    break;
  }
  if (!picked && !parts.some(p => p.startsWith('捡瓶'))) parts.push('捡瓶：冷却超时未成功');

  return { ok: picked, parts };
}


async function doHybgzsFarm(page) {
  const parts = [];

  const care = await hybgzsApi(page, '/api/farm/care/all', { method: 'POST', body: JSON.stringify({}) });
  if (care.data?.success && Number(care.data?.processed ?? 0) > 0) {
    parts.push('农场照料：处理 ' + care.data.processed + ' 处');
  }

  const crops = await hybgzsApi(page, '/api/farm/crops');
  const cropList = Array.isArray(crops.data?.data) ? crops.data.data : (Array.isArray(crops.data?.crops) ? crops.data.crops : []);
  const mature = cropList.filter(c => c.isMature && !c.isHarvested).length;
  if (mature > 0) {
    let h = await hybgzsApi(page, '/api/farm/harvest-all', { method: 'POST', body: JSON.stringify({ destroyIfFull: false }) });
    if (!h.data?.success && /仓库已满/.test(String(h.data?.error?.message || h.data?.error || ''))) {
      const up = await hybgzsApi(page, '/api/farm/warehouse/upgrade', { method: 'POST' }).catch(() => ({}));
      if (up.data?.success) {
        parts.push('农场仓库：自动扩容升级');
        h = await hybgzsApi(page, '/api/farm/harvest-all', { method: 'POST', body: JSON.stringify({ destroyIfFull: false }) });
      }
    }
    if (h.data?.success) {
      const d = h.data?.data || {};
      const total = d.harvestedBySeedId
        ? Object.values(d.harvestedBySeedId).reduce((s, n) => s + Number(n || 0), 0)
        : (d.harvestedCount ?? mature);
      let label = '农场收菜：收 ' + (d.harvestedCount ?? mature) + ' 块地（+ ' + total + ' 个作物）';
      if (d.experience?.levelUp) label += '，等级升至 ' + d.experience.newLevel;
      parts.push(label);
    } else {
      parts.push('农场收菜：' + String(h.data?.error?.message || h.data?.error || '收获失败'));
    }
  } else {
    parts.push('农场收菜：无成熟作物');
  }

  const pl = await hybgzsApi(page, '/api/farm/plots');
  const nu = pl.data?.data?.nextUnlock;
  if (nu?.canUnlock) {
    const un = await hybgzsApi(page, '/api/farm/plots/unlock', { method: 'POST', body: JSON.stringify({ plotIndex: nu.plotIndex }) });
    if (un.data?.success) {
      parts.push('农场解锁：第 ' + (Number(nu.plotIndex) + 1) + ' 块地已解锁');
    } else {
      parts.push('农场解锁：' + String(un.data?.error?.message || un.data?.error || '失败'));
    }
  }

  const cropsNow = await hybgzsApi(page, '/api/farm/crops');
  const rc = cropsNow.data || {};
  const plantedNow = (Array.isArray(rc.data) ? rc.data : (Array.isArray(rc.crops) ? rc.crops : [])).length;
  const maxSlots = Number(rc.maxSlots ?? rc.baseSlots ?? 0);
  let freeSlots = maxSlots - plantedNow;
  if (freeSlots > 0) {
    const seedsResp = await hybgzsApi(page, '/api/farm/seeds');
    const seedList = Array.isArray(seedsResp.data?.seeds) ? seedsResp.data.seeds : [];
    const rate = s => (Number(s.harvestQuantity || 0) * Number(s.harvestValue || 0)) / Math.max(1, Number(s.growthTime || 1));
    const sorted = seedList.filter(s => s.isEnabled !== false).sort((a, b) => rate(b) - rate(a));

    const inv = await hybgzsApi(page, '/api/farm/inventory');
    const items = Array.isArray(inv.data?.data) ? inv.data.data : (inv.data?.inventory || []);
    const stock = new Map(items.map(it => [String(it.seedId), Number(it.quantity || 0)]));

    const doPlant = async (s, qty) => {
      const p = await hybgzsApi(page, '/api/farm/plant-batch', { method: 'POST', body: JSON.stringify({ seedId: s.id, quantity: qty }) });
      if (!p.data?.success) {
        parts.push('农场种植：' + String(p.data?.error?.message || p.data?.error || '失败'));
        return false;
      }
      const n = Number(p.data?.data?.plantedCount ?? qty);
      freeSlots -= n;
      parts.push('农场种植：' + s.name + ' × ' + n);
      return true;
    };

    for (const s of sorted) {
      if (freeSlots <= 0) break;
      const st = stock.get(String(s.id)) || 0;
      if (st <= 0) continue;
      if (!(await doPlant(s, Math.min(st, freeSlots)))) continue;
    }
    if (freeSlots > 0 && sorted.length > 0) {
      for (const s of sorted) {
        if (freeSlots <= 0) break;
        const ok = await doPlant(s, freeSlots);
        if (ok) break;
      }
    }
    if (freeSlots > 0) parts.push('农场种植：剩 ' + freeSlots + ' 块地空置');
  } else if (plantedNow > 0) {
    parts.push('农场种植：' + plantedNow + ' 块地生长中');
  }

  const en = await hybgzsApi(page, '/api/farm/energy/status');
  const d = en.data?.data || {};
  const energy = Number(d.currentEnergy ?? 0);
  const cost = Number(d.energyCostPerSteal ?? 5);
  const dailyLeft = Number(d.dailyStealLimit ?? 15) - Number(d.dailyStealCount ?? 0);
  let budget = d.canSteal === false ? 0 : Math.min(Math.floor(energy / cost), dailyLeft);
  if (budget > 0) {
    let stolen = 0, stolenCrops = 0, failures = 0;
    const stealDeadline = Date.now() + 45000;
    for (let guard = 0; budget > 0 && guard < 25 && Date.now() < stealDeadline; guard++) {
      const tg = await hybgzsApi(page, '/api/farm/steal/stranger/target', { method: 'POST' });
      const sid = tg.data?.data?.stealSessionId;
      const strangerId = tg.data?.data?.stranger?.id;
      if (!tg.data?.success || !sid || !strangerId) {
        if (++failures >= 3) { parts.push('农场偷菜：连续 3 次获取目标失败，结束本轮'); break; }
        await page.waitForTimeout(2000); continue;
      }
      const au = await hybgzsApi(page, '/api/farm/steal/stranger/auto', {
        method: 'POST',
        body: JSON.stringify({ strangerId, stealSessionId: sid }),
      });
      if (!au.data?.success) {
        const err = String(au.data?.error?.message || au.data?.error || '');
        if (/体力|次数|energy|limit/i.test(err)) break;
        if (++failures >= 3) { parts.push('农场偷菜：连续 3 次失败，结束本轮'); break; }
        await page.waitForTimeout?.(/频繁|稍后/.test(err) ? 6000 : 2500);
        continue;
      }
      failures = 0;
      stolen++;
      stolenCrops += (Array.isArray(au.data?.stolenCrops) ? au.data.stolenCrops : []).reduce((s, c) => s + Number(c.quantity || 0), 0);
      budget--;
      await page.waitForTimeout?.(2500);
    }
    parts.push('农场偷菜：完成 ' + stolen + ' 次' + (stolenCrops ? '（' + stolenCrops + ' 棵）' : ''));
  } else if (dailyLeft <= 0) {
    parts.push('农场偷菜：今日次数已用完');
  } else {
    parts.push('农场偷菜：体力不足（' + energy + '/' + cost + '，今日剩余 ' + dailyLeft + ' 次）');
  }

  return { parts };
}

async function withPageDeadline(page, action, timeoutMs) {
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`黑白福利站执行超过 ${timeoutMs / 1000} 秒，本轮未完成；已停止该页面，继续其他任务。`));
      void page.close().catch(() => {});
    }, timeoutMs);
  });
  try { return await Promise.race([Promise.resolve().then(action), deadline]); }
  finally { clearTimeout(timer); }
}

async function runHybgzs(context) {
  const page = await context.newPage();
  return withPageDeadline(page, () => runHybgzsPage(page), 360000);
}

async function runHybgzsPage(page) {
  const stopCf = watchHybgzsCf(page);
  const started = Date.now();
  const step = async (label, action) => {
    const start = Date.now();
    log('hybgzs', label + '：开始');
    try { return await action(); } finally {
      log('hybgzs', `${label}：耗时 ${((Date.now() - start) / 1000).toFixed(1)} 秒`);
    }
  };
  try {
    await page.goto(URLS.hybgzs, { waitUntil: 'domcontentloaded', timeout: 60000 });
    let stats = await waitHybgzsReady(page);
    const s = stats.data?.data || {};
    const checkinDone = s.checkinStatus?.hasCheckedToday === true;
    const consecutive = s.checkinStatus?.consecutiveDays ?? 0;
    const remainingSpins = Number(s.wheelStatus?.remainingSpins ?? 0);

    const parts = [];
    let failed = false;

    if (checkinDone) {
      parts.push('签到：今日已签到（连续' + consecutive + '天）');
    } else {
      const r = await step('签到', () => doHybgzsCheckin(page));
      parts.push('签到：' + r.message);
      if (r.result === 'fail') failed = true;
    }

    if (remainingSpins <= 0) {
      parts.push('转盘：今日免费次数已用完');
    } else {
      const r = await step('转盘', () => doHybgzsWheel(page, remainingSpins));
      parts.push('转盘：' + r.message);
      if (r.result === 'fail') failed = true;
    }

    const giftbox = await step('福袋', () => doHybgzsGiftbox(page));
    parts.push(...giftbox.parts);

    const cards = await step('抽卡', () => doHybgzsCards(page));
    parts.push(...cards.parts);

    const farm = await step('农场', () => doHybgzsFarm(page));
    parts.push(...farm.parts);

    const driftBottle = await step('漂流瓶', () => doHybgzsDriftBottle(page));
    parts.push(...driftBottle.parts);
    if (!driftBottle.ok) failed = true;

    stats = await hybgzsStats(page);
    const balance = stats.data?.data?.walletBalance;
    const quota = Number.isFinite(balance) ? '钱包余额：$' + (balance / 500000).toFixed(2) : '';

    return {
      ok: !failed,
      message: parts.join('；') + (quota ? '；' + quota : ''),
      quota: quota || '',
    };
  } finally {
    await stopCf();
    await page.close();
    log('hybgzs', `站点任务总耗时 ${((Date.now() - started) / 1000).toFixed(1)} 秒`);
  }
}

if (require.main === module) {
  runServiceStandalone('hybgzs', runHybgzs, { alwaysRun: true });
}

module.exports = {
  hybgzsStats,
  clickWaitPost,
  clickCapStart,
  hybgzsCapFlow,
  waitHybgzsReady,
  doHybgzsCheckin,
  doHybgzsWheel,
  hybgzsApi,
  doHybgzsGiftbox,
  doHybgzsCards,
  fetchJinriShiciNote,
  doHybgzsDriftBottle,
  doHybgzsFarm,
  withPageDeadline,
  runHybgzs,
  runHybgzsPage,
  watchHybgzsCf,
};
