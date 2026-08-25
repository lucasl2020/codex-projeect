"""
WorkBuddy 猫猫旅行后台自动托管 (Playwright + Edge)

用法(四选一):
  python cat_bot.py --connect  # 推荐: 接管你已登录的 Edge(默认配置) 跑自动化，无需重复登录
  python cat_bot.py --login    # 备选: 用独立 profile 登录一次并保存(之后 --run 无头跑)
  python cat_bot.py --run      # 备选: 独立 profile 无头循环跑
  python cat_bot.py --once    # 诊断: 跑一轮后退出(打印按钮诊断)

依赖: pip install playwright (已装)
"""
import argparse, os, sys, time, re, subprocess
from datetime import datetime

# 强制控制台 UTF-8 输出，避免 Windows GBK 中文乱码
try:
    sys.stdout.reconfigure(errors='replace')
    sys.stderr.reconfigure(errors='replace')
except Exception:
    pass

BASE = os.path.dirname(os.path.abspath(__file__))
USER_DATA_DIR = os.path.join(BASE, "edge-profile")
TARGET_URL = "https://www.workbuddy.cn/profile/growth-center"
EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

# 按钮文案（与油猴脚本保持一致；站点改文案就改这）
DISPATCH_ENTRY   = ["派猫猫旅行","去旅行","立即出发","出发","派遣猫猫","立即派遣","去逛逛","派猫猫"]
DISPATCH_CONFIRM = ["确定派出","立即派出","确认派出","立即出发","确定出发","出发"]
CLAIM            = ["领取","领取奖励","一键领取","收获","开心收下"]
SETTLEMENT       = ["开心收下","收下","确定","知道了","确认"]
TRAVEL_KEYWORDS  = ["距离回家","旅行中","采风中","归来","倒计时"]

POLL_SECONDS = 3          # 轮询间隔
LOG = True


def log(msg):
    if LOG:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)


def _all_frames(page):
    """返回页面所有 frame(含主 frame)，用于跨 iframe 查找按钮/文本。"""
    try:
        return list(page.frames)
    except Exception:
        return [page]


_FIND_CLICK_JS = """(texts) => {
    const docs=[document];try{document.querySelectorAll('iframe').forEach(fr=>{try{if(fr.contentDocument)docs.push(fr.contentDocument);}catch(e){}});}catch(e){}const textOf=el=>(el.innerText||el.textContent||'').trim();const BL=['领取礼物','开启盲盒','立即抽奖','去完成','查看','立即查看'];const realClick=el=>{try{el.scrollIntoView({block:'center'});}catch(e){}try{el.click();return;}catch(e){}try{const r=el.getBoundingClientRect();const x=r.left+r.width/2,y=r.top+r.height/2;const o={bubbles:true,cancelable:true,clientX:x,clientY:y};const C=window.PointerEvent||window.MouseEvent;['pointerdown','mousedown','pointerup','mouseup','click'].forEach(t=>el.dispatchEvent(new C(t,o)));}catch(e){try{el.click();}catch(_){}}};const isClickable=el=>{try{if(!el)return false;const rc=el.getClientRects();if(rc.length===0||rc[0].width<=0||rc[0].height<=0)return false;if(el.disabled||el.getAttribute('aria-disabled')==='true')return false;const s=(el.ownerDocument.defaultView||window).getComputedStyle(el);if(s.display==='none'||s.visibility==='hidden'||s.pointerEvents==='none')return false;if(parseFloat(s.opacity)<0.6)return false;return true;}catch(e){return false;}};
    for (const d of docs) {
        let els;
        try { els = Array.from(d.querySelectorAll('button, div[role=\"button\"], a, span, div')); } catch (e) { continue; }
        els = els.filter(el => isClickable(el) && textOf(el).length <= 12 && !BL.includes(textOf(el)));
        for (const name of texts) {
            const m = els.filter(el => textOf(el) === name);
            if (m.length) { realClick(m[m.length - 1]); return name; }
        }
    }
    return null;
}
"""


def click_first(page, selectors_text, scope=None):
    """在所有 frame 中按文案顺序找第一个可见且文案较短的元素并点击。返回是否成功。"""
    root = scope or page
    try:
        res = root.evaluate(_FIND_CLICK_JS, list(selectors_text))
        if res:
            log(f"点击 [{res}]")
            return True
    except Exception:
        pass
    return False


def remaining_seconds(page):
    """扫描所有 frame 的文本找倒计时，返回剩余秒数；找不到返回 None。"""
    body = ""
    for fr in _all_frames(page):
        try:
            body += fr.locator("body").inner_text() + "\n"
        except Exception:
            continue
    if not body:
        return None
    m = re.search(r"(距离回家|倒计时|归来|旅行中|采风中)[^\n]*?(\d{1,2}:\d{2}(?::\d{2})?)", body)
    if m:
        t = m.group(2)
        parts = t.split(":")
        if len(parts) == 3:
            return int(parts[0])*3600 + int(parts[1])*60 + int(parts[2])
        return int(parts[0])*60 + int(parts[1])
    m = re.search(r"(?:(\d+)小时)?(\d+)分(\d+)秒", body)
    if m:
        h = int(m.group(1) or 0); mi = int(m.group(2)); s = int(m.group(3))
        return h*3600 + mi*60 + s
    return None


def close_modal(page):
    """尝试在所有 frame 中点 ✕/close 关闭弹窗。"""
    sels = ['button:has-text("✕")', 'button:has-text("×")', '[aria-label*="close" i]',
            '[aria-label*="关闭"]', '.close', 'svg[class*="close" i]']
    for fr in _all_frames(page):
        for sel in sels:
            try:
                loc = fr.locator(sel).first
                if loc.is_visible():
                    loc.click(timeout=800)
                    log("[!] 关闭弹窗")
                    return True
            except Exception:
                continue
    return False


_HAS_BTN_JS = """(texts) => {
    const docs=[document];try{document.querySelectorAll('iframe').forEach(fr=>{try{if(fr.contentDocument)docs.push(fr.contentDocument);}catch(e){}});}catch(e){}const textOf=el=>(el.innerText||el.textContent||'').trim();const BL=['领取礼物','开启盲盒','立即抽奖','去完成','查看','立即查看'];const isClickable=el=>{try{if(!el)return false;const rc=el.getClientRects();if(rc.length===0||rc[0].width<=0||rc[0].height<=0)return false;if(el.disabled||el.getAttribute('aria-disabled')==='true')return false;const s=(el.ownerDocument.defaultView||window).getComputedStyle(el);if(s.display==='none'||s.visibility==='hidden'||s.pointerEvents==='none')return false;if(parseFloat(s.opacity)<0.6)return false;return true;}catch(e){return false;}};
    for (const d of docs) {
        let els;
        try { els = Array.from(d.querySelectorAll('button, div[role=\"button\"], a, span, div')); } catch (e) { continue; }
        els = els.filter(el => isClickable(el) && textOf(el).length <= 12 && !BL.includes(textOf(el)));
        for (const name of texts) {
            if (els.some(el => textOf(el) === name)) return true;
        }
    }
    return false;
}
"""


def any_visible(page, texts):
    """任一 frame 中是否存在可见且文案较短的含文案按钮。"""
    try:
        return bool(page.evaluate(_HAS_BTN_JS, list(texts)))
    except Exception:
        return False


def dump_buttons(page):
    """诊断: 打印标题、frame 数及各 frame 可见按钮文案样本，便于排查文案不匹配。"""
    try:
        title = page.title()
    except Exception:
        title = "?"
    frames = _all_frames(page)
    log(f"[诊断] 标题={title!r} frame数={len(frames)}")
    for i, fr in enumerate(frames):
        try:
            url = fr.url
        except Exception:
            url = "?"
        samples = []
        for tag in ["button", "[role='button']", "a", "div"]:
            try:
                cnt = fr.locator(tag).count()
            except Exception:
                cnt = 0
            cap = 8 if tag != "div" else 25
            for j in range(min(cnt, cap)):
                try:
                    el = fr.locator(tag).nth(j)
                    if el.is_visible():
                        txt = (el.inner_text() or "").strip().replace("\n", " ")[:20]
                        if txt and (tag != "div" or len(txt) <= 12):
                            samples.append(txt)
                except Exception:
                    continue
        log(f"  frame{i} url={url[:60]} 按钮样本={samples}")


def handle(page):
    """执行一轮状态机，返回状态标记。"""
    # 1. 出发确认弹窗
    if click_first(page, DISPATCH_CONFIRM):
        time.sleep(1.5); close_modal(page); time.sleep(1.0)
        return {"stage": "sent"}
    # 2. 领取
    if click_first(page, CLAIM):
        log("[*] 领取中...")
        time.sleep(1.5)
        if not click_first(page, SETTLEMENT):
            close_modal(page)
        time.sleep(1.0); close_modal(page); time.sleep(1.5)
        return {"stage": "claimed"}
    # 3. 派猫猫入口
    if click_first(page, DISPATCH_ENTRY):
        time.sleep(1.5)
        if click_first(page, DISPATCH_CONFIRM):
            time.sleep(1.5); close_modal(page); time.sleep(1.0)
            return {"stage": "sent"}
        close_modal(page)
        return {"stage": "opened_dispatch"}
    dump_buttons(page)
    return {"stage": "idle"}


def run_loop(page):
    """每轮导航到目标页并执行一次完整状态机，检测到旅行中则进入长等待。"""
    while True:
        try:
            page.goto(TARGET_URL, timeout=30000, wait_until="domcontentloaded")
            time.sleep(2)
            res = handle(page)
        except Exception as e:
            log(f"[ERR] 页面操作失败: {e}")
            time.sleep(10)
            continue

        stage = res["stage"]
        if stage == "sent":
            log("已完成派遣，等待旅行结束...")
        elif stage == "claimed":
            log("已领取奖励")
        elif stage in ("opened_dispatch",):
            log("已打开派遣入口")
        else:  # idle
            log("待命中（无派/领入口）")

        # 结合页面倒计时决定等待时长；找不到则用固定轮询间隔
        secs = remaining_seconds(page)
        if secs is None or secs <= 0:
            wait = 30   # 待命中: 30s 轮询，避免频繁刷新
        else:
            wait = min(max(secs, 10), 60 * 60)   # 至少 10s，至多 1 小时
        log(f"[..] 休息 {wait}s 后再次检测")
        for _ in range(int(wait // POLL_SECONDS)):
            time.sleep(POLL_SECONDS)
            # 检测到可领取/派遣时提前行动(跨所有 frame)
            try:
                if any_visible(page, CLAIM) or any_visible(page, DISPATCH_ENTRY):
                    break
            except Exception:
                break


def _edge_running():
    """用 PowerShell 检测 msedge 进程(比 tasklist 可靠)。"""
    try:
        r = subprocess.run(
            ["powershell", "-NoProfile", "-Command",
             "(Get-Process msedge -ErrorAction SilentlyContinue | Measure-Object).Count"],
            capture_output=True, text=True, timeout=8)
        return int((r.stdout or "0").strip() or "0") > 0
    except Exception:
        return False


def connect_edge(p, port=9222):
    import urllib.request, json as _json
    url = f"http://127.0.0.1:{port}"

    # A. 先连已在跑的调试端口
    try:
        return p.chromium.connect_over_cdp(url)
    except Exception:
        pass

    # B. 有普通 Edge 在跑(占用 profile)，自动关闭后用调试端口重启(标签页会自动恢复)
    if _edge_running():
        print("检测到 Edge 正在运行，将关闭并以调试端口重启 Edge(标签页会自动恢复)...", flush=True)
        subprocess.run(["taskkill", "/IM", "msedge.exe", "/F", "/T"],
                       capture_output=True, timeout=15)
        time.sleep(2)

    # C. 拉起带调试端口的 Edge(加载默认 profile = 你的登录态)
    print(f"启动 Edge(调试端口 {port})，加载你已登录的浏览器数据...", flush=True)
    subprocess.Popen(
        [EDGE_PATH, f"--remote-debugging-port={port}", "--no-first-run", "--no-default-browser-check"],
        close_fds=True)

    # D. 轮询连接，最多 40 秒
    devurl = f"http://127.0.0.1:{port}/json/version"
    for i in range(40):
        time.sleep(1)
        try:
            with urllib.request.urlopen(devurl, timeout=2) as r:
                _json.loads(r.read())
            return p.chromium.connect_over_cdp(url)
        except Exception:
            if i in (5, 15, 30):
                print(f"  等待 Edge 就绪... ({i+1}s)", flush=True)
            continue
    st = "运行中" if _edge_running() else "未运行"
    raise RuntimeError(f"无法连接 Edge 调试端口。Edge 进程状态: {st}。请确认 Edge 已启动且无残留进程。")
def main():
    ap = argparse.ArgumentParser(description="WorkBuddy 猫猫旅行后台托管")
    ap.add_argument("--connect", action="store_true", help="推荐: 接管已登录的 Edge 跑自动化")
    ap.add_argument("--login", action="store_true", help="独立 profile 登录一次并保存")
    ap.add_argument("--run", action="store_true", help="独立 profile 无头循环")
    ap.add_argument("--headful", action="store_true", help="(独立profile) 有头调试")
    ap.add_argument("--once", action="store_true", help="独立 profile 跑一轮后退出(诊断用)")
    args = ap.parse_args()

    from playwright.sync_api import sync_playwright

    if args.connect:
        with sync_playwright() as p:
            browser = connect_edge(p)
            ctx = browser.contexts[0]
            page = ctx.new_page()
            page.goto(TARGET_URL, wait_until="domcontentloaded")
            if args.once:
                time.sleep(3); dump_buttons(page); res = handle(page); log(f"[once] 结果={res['stage']}"); time.sleep(3)
            else:
                log("已接管已登录的 Edge，开始自动托管循环 (Ctrl+C 退出，Edge 保持开启)")
                try:
                    run_loop(page)
                except KeyboardInterrupt:
                    print("\n已停止脚本(Edge 保持开启)")
        return

    if not (args.login or args.run or args.once):
        print("请指定模式: --connect / --login / --run / --once"); sys.exit(1)

    headless = not (args.login or args.headful)
    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(
            channel="msedge", headless=headless,
            executable_path=EDGE_PATH, user_data_dir=USER_DATA_DIR, no_viewport=True,
        )
        page = ctx.pages[0] if ctx.pages else ctx.new_page()
        page.goto(TARGET_URL, wait_until="domcontentloaded")
        if args.login:
            print("已打开可视窗口，请手动登录，登录完成后关闭窗口即结束。")
            page.wait_for_event("close")
        elif args.once:
            time.sleep(3)
            dump_buttons(page)
            res = handle(page)
            log(f"[once] 结果={res['stage']}")
            time.sleep(3)
        else:
            time.sleep(2)
            log("开始后台自动托管循环 (Ctrl+C 退出)")
            try:
                run_loop(page)
            except KeyboardInterrupt:
                print("\n已停止")
        ctx.close()


if __name__ == "__main__":
    main()
