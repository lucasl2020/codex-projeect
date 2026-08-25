# -*- coding: utf-8 -*-
import sys, tempfile
sys.path.insert(0, "workbuddy-cat-bot")
import cat_bot
results = []
def check(name, ok, extra=""): results.append((name, ok, extra))
profile = tempfile.mkdtemp(prefix="catbot-test-")
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(user_data_dir=profile, channel="msedge", headless=True, executable_path=cat_bot.EDGE_PATH)
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    page.set_content("<html><body><button>派猫猫旅行</button><button>确定派出</button><button>领取</button><button>开心收下</button><button>✕</button></body></html>")
    check("dispatch-confirm priority -> sent", cat_bot.handle(page)["stage"]=="sent")
    page.set_content("<html><body><button>领取</button><button>开心收下</button></body></html>")
    check("claim -> claimed", cat_bot.handle(page)["stage"]=="claimed")
    page.set_content("<html><body><button>派猫猫旅行</button></body></html>")
    check("dispatch entry -> opened_dispatch", cat_bot.handle(page)["stage"]=="opened_dispatch")
    page.set_content("<html><body><div>没有按钮</div></body></html>")
    check("no button -> idle", cat_bot.handle(page)["stage"]=="idle")
    page.set_content("<html><body><div>距离回家: 2小时30分15秒</div></body></html>")
    check("cn 2h30m15s=9015", cat_bot.remaining_seconds(page)==9015)
    page.set_content("<html><body><div>旅行中 00:12</div></body></html>")
    check("mm:ss 00:12=12", cat_bot.remaining_seconds(page)==12)
    page.set_content("<html><body><div>倒计时 01:00:00</div></body></html>")
    check("hh:mm:ss 01:00:00=3600", cat_bot.remaining_seconds(page)==3600)
    page.set_content("<html><body><div>啥也没</div></body></html>")
    check("no timer->None", cat_bot.remaining_seconds(page) is None)
    ctx.close()
failed=sum(1 for _,ok,_ in results if not ok)
for name,ok,extra in results:
    print(("[PASS] " if ok else "[FAIL] ")+name)
print("\n全部通过" if failed==0 else str(failed)+"项失败")
sys.exit(1 if failed else 0)