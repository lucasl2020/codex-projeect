const fs = require('node:fs');
const path = require('node:path');
const {
  ROOT,
  URLS,
  log,
  parseJson,
  runServiceStandalone,
} = require('./common');

const HVOY_HOLE_HELPER = path.join(ROOT, '_hole_x.py');
const HVOY_BG_PATH = path.join(ROOT, '_hv_bg.jpg');
const HVOY_PIECE_PATH = path.join(ROOT, '_hv_piece.png');

function hvDetectHole(bgPath, piecePath) {
  const { execFileSync } = require('node:child_process');
  try {
    const out = execFileSync(process.env.PYTHON_PATH || 'python', [HVOY_HOLE_HELPER, bgPath, piecePath], {
      encoding: 'utf8', windowsHide: true, timeout: 30000,
    });
    const line = String(out).split('\n').find(l => l.startsWith('{'));
    return line ? parseJson(line) : null;
  } catch {
    return null;
  }
}

async function hvDragSlider(page, fromX, fromY, toX) {
  const D = toX - fromX;
  await page.mouse.move(fromX, fromY, { steps: 6 });
  await page.waitForTimeout(120 + Math.random() * 160);
  await page.mouse.down();
  await page.waitForTimeout(80 + Math.random() * 80);
  const N = 40;
  let lastX = fromX;
  for (let i = 1; i <= N; i++) {
    const t = i / N;
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const x = fromX + D * ease;
    const y = fromY + (Math.random() - 0.5) * 2.2;
    await page.mouse.move(x, y, { steps: 1 + Math.floor(Math.random() * 3) });
    await page.waitForTimeout(6 + Math.random() * 14);
    lastX = x;
  }
  await page.mouse.move(lastX - 2 - Math.random() * 2, fromY, { steps: 2 });
  await page.waitForTimeout(40 + Math.random() * 60);
  await page.mouse.move(toX, fromY, { steps: 2 });
  await page.waitForTimeout(120 + Math.random() * 120);
  await page.mouse.up();
}

async function hvSolveCaptcha(page) {
  const block = page.locator('.tencent-captcha-dy__slider-block');
  await block.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  if (!(await block.count())) return false;

  const geo = await page.evaluate(() => {
    const q = s => document.querySelector(s);
    const bg = q('.tencent-captcha-dy__verify-bg-img');
    const fg = q('.tencent-captcha-dy__fg-item');
    const bl = q('.tencent-captcha-dy__slider-block');
    if (!bg || !fg || !bl) return null;
    const bgm = getComputedStyle(bg).backgroundImage.match(/url\(["']?(.*?)["']?\)/);
    const fgm = getComputedStyle(fg).backgroundImage.match(/url\(["']?(.*?)["']?\)/);
    const rect = e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
    return {
      bgUrl: bgm ? bgm[1] : null,
      pieceUrl: fgm ? fgm[1] : null,
      bgRect: rect(bg), fgRect: rect(fg), blockRect: rect(bl),
      fgLeft: parseFloat(getComputedStyle(fg).left) || 0,
    };
  });
  if (!geo || !geo.bgUrl) return false;

  const bgResp = await page.request.get(geo.bgUrl).catch(() => null);
  if (!bgResp || !bgResp.ok()) return false;
  fs.writeFileSync(HVOY_BG_PATH, await bgResp.body());

  let hasPiece = false;
  if (geo.pieceUrl) {
    const pieceResp = await page.request.get(geo.pieceUrl).catch(() => null);
    if (pieceResp && pieceResp.ok()) {
      fs.writeFileSync(HVOY_PIECE_PATH, await pieceResp.body());
      hasPiece = true;
    }
  }

  const hole = hvDetectHole(HVOY_BG_PATH, hasPiece ? HVOY_PIECE_PATH : null);
  if (!hole || hole.error || !hole.cx || !hole.W) {
    log('hvoy', '缺口识别失败：' + JSON.stringify(hole));
    return false;
  }
  log('hvoy', `缺口定位 method=${hole.method} cx=${hole.cx} cy=${hole.cy} conf=${hole.conf ?? '-'}`);

  const scale = geo.bgRect.w / hole.W;
  const drag = hole.cx * scale - (geo.fgLeft + geo.fgRect.w / 2);
  if (drag <= 0 || drag > geo.bgRect.w) {
    log('hvoy', `拖拽距离越界：${drag.toFixed(1)}px`);
    return false;
  }
  log('hvoy', `拖拽 ${drag.toFixed(1)}px（scale=${scale.toFixed(4)}）`);

  const bx = geo.blockRect.x + geo.blockRect.w / 2;
  const by = geo.blockRect.y + geo.blockRect.h / 2;
  await hvDragSlider(page, bx, by, bx + drag);
  return true;
}

async function dismissHvoyNotice(page) {
  const notice = page.locator('[role="dialog"][aria-labelledby="region-restriction-notice-title"]');
  if (!(await notice.isVisible())) return false;
  await notice.getByRole('button', { name: '我知道了', exact: true }).click({ timeout: 3000 });
  await notice.waitFor({ state: 'hidden', timeout: 3000 });
  log('hvoy', '已关闭地区限制说明弹窗');
  return true;
}

async function clickHvoyButton(page, button) {
  await dismissHvoyNotice(page);
  try {
    await button.click({ timeout: 5000 });
  } catch (error) {
    if (!(await dismissHvoyNotice(page))) throw error;
    await button.click({ timeout: 5000 });
  }
}

async function runHvoy(context) {
  const page = await context.newPage();
  try {
    await page.goto(URLS.hvoy, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await dismissHvoyNotice(page);
    const before = await page.evaluate(async () => {
      const session = await fetch('/__free-token/session', { credentials: 'include', signal: AbortSignal.timeout(10000) }).then(r => r.json()).catch(() => null);
      const st = await fetch('/__free-token/daily-check-in', { credentials: 'include', signal: AbortSignal.timeout(10000) }).then(r => r.json()).catch(() => null);
      return { session, st };
    });

    if (!before.session || before.session.authenticated !== true) {
      throw new Error('hvoy 未登录；请先运行「重新登录全部网站.cmd」。');
    }
    if (before.st && before.st.checkedIn === true) {
      const points = before.session.user?.pointsBalance;
      const quota = Number.isFinite(points) ? '积分：' + points : '';
      return { ok: true, message: '今日已签到' + (quota ? '；' + quota : ''), quota: quota || '' };
    }

    const btn = page.locator('button').filter({ hasText: /每日签到/ }).first();
    await clickHvoyButton(page, btn);
    await page.waitForTimeout(1500);
    const confirm = page.locator('button').filter({ hasText: /确认签到|立即签到/ }).first();
    if (await confirm.isVisible()) await clickHvoyButton(page, confirm);

    let solved = false;
    for (let i = 0; i < 2 && !solved; i++) {
      solved = await hvSolveCaptcha(page);
      if (!solved) {
        const refresh = page.locator('[class*="refresh"]').first();
        if (await refresh.count()) await refresh.click({ timeout: 3000 }).catch(() => {});
        await page.waitForTimeout(2500);
      }
    }

    const beforePoints = before.session.user?.pointsBalance;
    const deadline = Date.now() + 12000;
    let points = null;
    let done = false;
    while (Date.now() < deadline) {
      const cur = await page.evaluate(async () => {
        const session = await fetch('/__free-token/session', { credentials: 'include' }).then(r => r.json()).catch(() => null);
        const st = await fetch('/__free-token/daily-check-in', { credentials: 'include' }).then(r => r.json()).catch(() => null);
        return { points: session?.user?.pointsBalance, checkedIn: st?.checkedIn === true };
      }).catch(() => null);
      if (cur && (cur.checkedIn || (Number.isFinite(cur.points) && Number.isFinite(beforePoints) && cur.points > beforePoints))) {
        points = cur.points;
        done = true;
        break;
      }
      await page.waitForTimeout(800);
    }

    if (!done) {
      throw new Error('hvoy 签到未确认（滑块可能未通过）。' + (solved ? '已尝试拖动。' : '滑块未出现。'));
    }
    const quota = '积分：' + points;
    return { ok: true, message: '签到成功；' + quota, quota };
  } finally {
    await page.close();
  }
}

if (require.main === module) {
  runServiceStandalone('hvoy', runHvoy);
}

module.exports = {
  HVOY_HOLE_HELPER,
  HVOY_BG_PATH,
  HVOY_PIECE_PATH,
  hvDetectHole,
  hvDragSlider,
  hvSolveCaptcha,
  dismissHvoyNotice,
  clickHvoyButton,
  runHvoy,
};
