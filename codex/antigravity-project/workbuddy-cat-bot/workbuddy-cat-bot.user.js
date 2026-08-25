// ==UserScript==
// @name         WorkBuddy 猫猫旅行全生命周期自动托管 v6.3
// @namespace    http://tampermonkey.net/
// @version      6.3
// @description  派遣→到期自动领取→再派遣 全自动循环；自动关闭弹窗；跨iframe；短文本防误点
// @match        https://www.workbuddy.cn/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const HUD_ID = "wb-cat-bot-hud";

    // ========== 可配置按钮文案（按站点实际按钮调整） ==========
    const CONFIG = {
        dispatchEntry: ['派猫猫旅行', '去旅行', '立即出发', '出发', '派遣猫猫', '立即派遣', '去逛逛', '派猫猫'],
        dispatchConfirm: ['确定派出', '立即派出', '确认派出', '立即出发', '确定出发', '出发'],
        claim: ['领取', '领取奖励', '一键领取', '收获', '开心收下'],
        settlement: ['开心收下', '收下', '确定', '知道了', '确认'],
        // 旅行状态关键词
        travelKeywords: ['距离回家', '旅行中', '采风中', '归来', '倒计时'],
        // 轮询间隔(ms) 与 页面防假死刷新(ms)
        pollIntervalMs: 2500,
        refreshAfterMs: 25 * 60 * 1000,
    };

    // ========== HUD UI ==========
    const panel = document.createElement('div');
    panel.id = HUD_ID;
    panel.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; z-index: 9999999;
        background: rgba(15, 23, 42, 0.95); color: #fff; border-radius: 12px;
        padding: 16px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 13px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); width: 320px;
        backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.15); line-height: 1.6;
    `;
    panel.innerHTML = `
        <div style="font-weight:bold; font-size:14px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
            <span style="color:#38bdf8;">🐱 猫猫旅行全流程托管</span>
            <span style="font-size:11px; padding:2px 8px; border-radius:4px; background:#0284c7; color:#fff;">v6.3 穿Shadow</span>
        </div>
        <div style="font-size:12px; color:#cbd5e1; margin-bottom:10px; background:rgba(0,0,0,0.35); padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
            <div>当前阶段: <b id="flow-stage" style="color:#fcd34d;">初始化识别中...</b></div>
            <div>旅行状态: <span id="flow-timer" style="color:#60a5fa;">检测中...</span></div>
        </div>
        <div style="font-size:11px; color:#64748b; margin-bottom:4px;">📜 流程执行日志:</div>
        <div id="flow-logs" style="font-size:11px; color:#94a3b8; max-height:100px; overflow-y:auto; border-top:1px solid #334155; padding-top:6px;"></div>
    `;
    document.body.appendChild(panel);

    function addLog(msg, color = "#94a3b8") {
        const time = new Date().toLocaleTimeString();
        const logBox = document.getElementById('flow-logs');
        if (logBox) {
            logBox.innerHTML = `<div style="color:${color}; margin-bottom:3px;">[${time}] ${msg}</div>` + logBox.innerHTML;
        }
    }

    function setStage(text, color = "#fcd34d") {
        const stageEl = document.getElementById('flow-stage');
        if (stageEl) { stageEl.innerText = text; stageEl.style.color = color; }
    }
    function setTimer(text, color = "#60a5fa") {
        const timerEl = document.getElementById('flow-timer');
        if (timerEl) { timerEl.innerText = text; timerEl.style.color = color; }
    }

    const sleep = ms => new Promise(r => setTimeout(r, ms));

    function isClickable(el) {
        if (!el) return false;
        try {
            const rects = el.getClientRects();
            if (rects.length === 0 || rects[0].width <= 0 || rects[0].height <= 0) return false;
        } catch (e) { return false; }
        if (el.closest('#' + HUD_ID)) return false;
        const marker = el.getAttribute('disabled');
        if (el.disabled || marker !== null || el.getAttribute('aria-disabled') === 'true') return false;
        const s = (el.ownerDocument.defaultView || window).getComputedStyle(el);
        if (s.display === 'none' || s.visibility === 'hidden' || s.pointerEvents === 'none') return false;
        if (s.cursor === 'not-allowed' || parseFloat(s.opacity) < 0.6) return false;
        if (el.classList.contains('disabled') || el.closest('.disabled, [disabled]')) return false;
        return true;
    }

    // 提取文本（排除隐藏，避免误判嵌套子元素中的大量文案）
    function textOf(el) { return (el.innerText || el.textContent || '').trim(); }

    // 收集主文档 + 所有同源 iframe 的 contentDocument(跨域 iframe 无法访问)
    function allDocs() {
        const docs = [document];
        try { document.querySelectorAll('iframe').forEach(fr => { try { if (fr.contentDocument) docs.push(fr.contentDocument); } catch (e) {} }); } catch (e) {}
        return docs;
    }
    function qsaAll(selector) {
        const out = [];
        const walk = root => {
            try { root.querySelectorAll(selector).forEach(el => out.push(el)); } catch (e) {}
            try { root.querySelectorAll('*').forEach(el => { if (el.shadowRoot) walk(el.shadowRoot); }); } catch (e) {}
        };
        for (const d of allDocs()) walk(d);
        return out;
    }

    // 黑名单：这些按钮绝对不能误点(盲盒/抽奖/任务入口等)
    const BLOCKLIST = ['领取礼物','开启盲盒','立即抽奖','去完成','查看 Buddy 图鉴','立即查看','查看'];

    // 真实点击：先滚动可见、聚焦，再 .click()；失败则派发完整指针事件序列
    function realClick(el) {
        if (!el) return;
        try { el.scrollIntoView({ block: 'center' }); } catch (e) {}
        try { el.focus({ preventScroll: true }); } catch (e) {}
        try { el.click(); return; } catch (e) {}
        try {
            const r = el.getBoundingClientRect();
            const x = r.left + r.width / 2, y = r.top + r.height / 2;
            const opts = { bubbles: true, cancelable: true, clientX: x, clientY: y, view: el.ownerDocument.defaultView };
            const Ctor = window.PointerEvent || window.MouseEvent;
            for (const t of ['pointerdown','mousedown','pointerup','mouseup','click']) {
                el.dispatchEvent(new Ctor(t, opts));
            }
        } catch (e) { try { el.click(); } catch (_) {} }
    }

    // 查找按钮：仅精确匹配自身文案较短的可点击元素，黑名单按钮直接跳过
    function findButton(names) {
        const els = qsaAll('button, div[role="button"], a, span, div')
            .filter(el => isClickable(el) && textOf(el).length <= 12 && !BLOCKLIST.includes(textOf(el)));
        for (const name of names) {
            const exact = els.filter(el => textOf(el) === name);
            if (exact.length) return exact[exact.length - 1];
        }
        return null;
    }

    // 诊断：idle 时把所有候选按钮(含 Shadow DOM 内)文案打到 HUD(节流 10s)，去重截断
    let lastDump = 0;
    function dumpButtons() {
        if (Date.now() - lastDump < 10000) return;
        lastDump = Date.now();
        const seen = new Set();
        const samples = qsaAll('button, div[role="button"], a, span, div')
            .filter(el => { try { return isClickable(el); } catch (e) { return false; } })
            .map(el => textOf(el).replace(/\s+/g, ' ').trim().slice(0, 24))
            .filter(t => { if (!t || seen.has(t)) return false; seen.add(t); return true; })
            .slice(0, 40);
        addLog(`[诊断] 候选按钮: ${JSON.stringify(samples)}`, '#fbbf24');
    }

    // 抓取倒计时：返回解析后的剩余秒数，null 表示未检测到旅行
    function getRemainingSeconds() {
        const all = qsaAll('div, span, p')
            .filter(el => { try { if (el.closest('#' + HUD_ID)) return false; const r = el.getClientRects(); return r.length > 0 && r[0].width > 0; } catch (e) { return false; } });
        for (const el of all) {
            const t = textOf(el);
            if (!CONFIG.travelKeywords.some(k => t.includes(k))) continue;
            // mm:ss(:ss)
            let m = t.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
            if (m) {
                // hh:mm:ss 有三段 → 时:分:秒；否则视为 mm:ss 分:秒
                if (m[3]) {
                    return parseInt(m[1],10)*3600 + parseInt(m[2],10)*60 + parseInt(m[3],10);
                }
                return parseInt(m[1],10)*60 + parseInt(m[2],10);
            }
            // 中文 "X小时Y分Z秒"
            m = t.match(/(?:(\d+)小时)?(\d+)分(\d+)秒/);
            if (m) {
                const h = m[1] ? parseInt(m[1],10) : 0;
                const mi = parseInt(m[2],10);
                const s = parseInt(m[3],10);
                return h*3600 + mi*60 + s;
            }
            // 中文 "X分Y秒"
            m = t.match(/(\d+)分(\d+)秒/);
            if (m) return parseInt(m[1],10)*60 + parseInt(m[2],10);
        }
        return null;
    }

    // 尝试关闭弹窗右上角的 ✕
    function tryCloseModal() {
        const closeBtns = qsaAll('button, svg, div, span')
            .filter(el => { try { if (el.closest('#' + HUD_ID)) return false; const r = el.getClientRects(); return r.length > 0 && r[0].width > 0; } catch (e) { return false; } });
        for (const el of closeBtns) {
            const ariaLabel = el.getAttribute('aria-label') || '';
            const className = typeof el.className === 'string' ? el.className : '';
            const text = textOf(el);
            if (text === '✕' || text === '×' || text === 'X' || text === 'x' ||
                ariaLabel.toLowerCase().includes('close') || ariaLabel.includes('关闭') ||
                className.toLowerCase().includes('close')) {
                const target = el.tagName.toLowerCase() === 'svg' ? el.parentElement : el;
                if (target) { realClick(target); addLog("🧹 已自动关闭旅行展示弹窗", "#94a3b8"); }
                return true;
            }
        }
        return false;
    }

    let isBusy = false;

    async function processWorkflow() {
        if (isBusy) return;

        // ---- 1. 优先检测出发确认弹窗 ----
        const confirmBtn = findButton(CONFIG.dispatchConfirm);
        if (confirmBtn) {
            isBusy = true;
            setStage("【第 1 阶段】检测到出发弹窗，正在确认...", "#f59e0b");
            addLog(`🛫 点击弹窗 [${textOf(confirmBtn)}]`, "#38bdf8");
            realClick(confirmBtn);
            await sleep(1500);
            tryCloseModal();
            await sleep(1000);
            // 刚派出，立即刷新状态，下一轮进入旅行中
            isBusy = false;
            return;
        }

        // ---- 2. 检测旅行状态 ----
        const remaining = getRemainingSeconds();
        if (remaining !== null) {
            const fmt = m => { const mm = String(Math.floor(m/60)).padStart(2,'0'); const ss = String(m%60).padStart(2,'0'); return `${mm}:${ss}`; };
            if (remaining > 0) {
                setStage("【第 2 阶段】旅行中", "#60a5fa");
                setTimer(`距离回家: ${fmt(remaining)}`, "#60a5fa");
                // 顺带关闭挂着的大展示弹窗
                const isPopupOpen = qsaAll('div, span, p')
                    .some(e => textOf(e).includes('正在') && textOf(e).includes('采风中'));
                if (isPopupOpen) tryCloseModal();
                return;
            }
            // remaining === 0：已到期，落到领取逻辑
            setStage("已到期，检测领取中...", "#f59e0b");
        } else {
            setTimer("未在旅行中/已到期", "#94a3b8");
        }

        const allButtons = Array.from(document.querySelectorAll('button, div[role="button"], a, span, div'))
            .filter(el => isClickable(el));

        // ---- 3. 领取阶段 ----
        const claimBtn = findButton(CONFIG.claim);
        if (claimBtn) {
            isBusy = true;
            setStage("【第 3 阶段】发现奖励，正在领取...", "#34d399");
            addLog(`🎁 步骤 1/2: 点击 [${textOf(claimBtn)}]`, "#34d399");
            realClick(claimBtn);
            await sleep(1500);
            const settlementBtns = qsaAll('button, div[role="button"]')
                .filter(b => isClickable(b) && CONFIG.settlement.includes(textOf(b)));
            if (settlementBtns.length > 0) {
                realClick(settlementBtns[settlementBtns.length - 1]);
                addLog(`✨ 步骤 2/2: 点击结算 [${textOf(settlementBtns[settlementBtns.length - 1])}]`, "#34d399");
            }
            await sleep(1000);
            tryCloseModal();
            await sleep(1500);
            isBusy = false;
            return;
        }

        // ---- 4. 派遣入口 ----
        const dispatchBtn = findButton(CONFIG.dispatchEntry);
        if (dispatchBtn) {
            isBusy = true;
            setStage("【第 4 阶段】发现派遣入口，正在打开...", "#f59e0b");
            addLog(`🚀 步骤 1/2: 点击 [${textOf(dispatchBtn)}]`, "#f59e0b");
            realClick(dispatchBtn);
            await sleep(1200);
            const confirmBtn2 = findButton(CONFIG.dispatchConfirm);
            if (confirmBtn2) {
                realClick(confirmBtn2);
                addLog(`🛫 步骤 2/2: 点击 [${textOf(confirmBtn2)}]`, "#38bdf8");
                await sleep(1500);
                tryCloseModal();
            }
            await sleep(1500);
            isBusy = false;
            return;
        }

        // ---- 5. 待命中 ----
        setStage("待命中 (暂无可操作项目)", "#94a3b8");
        dumpButtons();
    }

    // 每 2.5 秒轮询
    setInterval(processWorkflow, CONFIG.pollIntervalMs);
    // 初次立即跑一次
    setTimeout(processWorkflow, 800);
    // 25 分钟刷新防假死
    setTimeout(() => location.reload(), CONFIG.refreshAfterMs);
})();

