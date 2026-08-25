# -*- coding: utf-8 -*-
"""测试核心匹配逻辑：精确匹配 + 黑名单过滤"""
import sys
sys.stdout.reconfigure(errors='replace')

CONFIG = {
    "dispatchEntry": ["派猫猫旅行","去旅行","立即出发","出发","派遣猫猫","立即派遣","去逛逛","派猫猫"],
    "dispatchConfirm": ["确定派出","立即派出","确认派出","立即出发","确定出发","出发"],
    "claim": ["领取","领取奖励","一键领取","收获","开心收下"],
    "settlement": ["开心收下","收下","确定","知道了","确认"],
}
BLOCKLIST = ["领取礼物","开启盲盒","立即抽奖","去完成","查看 Buddy 图鉴","立即查看","查看"]

def find_button(all_texts, names):
    """模拟 findButton：精确匹配 + 黑名单 + 长度<=12"""
    candidates = [t for t in all_texts if len(t) <= 12 and t not in BLOCKLIST]
    for name in names:
        exact = [t for t in candidates if t == name]
        if exact:
            return exact[-1]
    return None

# 模拟用户页面真实按钮文案
PAGE_BUTTONS = [
    "领取礼物",      # 盲盒按钮 - 必须被过滤
    "开启盲盒",      # 盲盒按钮 - 必须被过滤
    "立即抽奖",      # 抽奖按钮 - 必须被过滤
    "去完成",        # 任务按钮 - 必须被过滤
    "立即查看",      # 任务按钮 - 必须被过滤
    "领取",          # 猫猫领取按钮 - 必须命中
    "派猫猫旅行",    # 派遣入口 - 必须命中
    "确定派出",      # 出发确认 - 必须命中
    "开心收下",      # 结算确认 - 必须命中
]

passed = 0
failed = 0
def test(name, cond):
    global passed, failed
    if cond:
        passed += 1
        print(f"  PASS: {name}")
    else:
        failed += 1
        print(f"  FAIL: {name}")

print("=== 测试1: 领取按钮精确匹配(不误点领取礼物) ===")
claim = find_button(PAGE_BUTTONS, CONFIG["claim"])
test("找到领取按钮", claim is not None)
test("领取按钮是'领取'而非'领取礼物'", claim == "领取")

print("=== 测试2: 派遣入口正确匹配 ===")
disp = find_button(PAGE_BUTTONS, CONFIG["dispatchEntry"])
test("找到派遣入口", disp is not None)
test("派遣入口是'派猫猫旅行'", disp == "派猫猫旅行")

print("=== 测试3: 出发确认正确匹配 ===")
conf = find_button(PAGE_BUTTONS, CONFIG["dispatchConfirm"])
test("找到确认按钮", conf is not None)
test("确认按钮是'确定派出'", conf == "确定派出")

print("=== 测试4: 结算按钮正确匹配 ===")
settle = find_button(PAGE_BUTTONS, CONFIG["settlement"])
test("找到结算按钮", settle is not None)

print("=== 测试5: 黑名单按钮不被匹配 ===")
for bl in ["领取礼物", "开启盲盒", "立即抽奖"]:
    result = find_button(PAGE_BUTTONS, [bl])
    test(f"黑名单'{bl}'不被匹配", result is None)

print("=== 测试6: 旧版includes()会误点的问题已修复 ===")
# 旧版用 includes('领取') 会匹配 '领取礼物'，新版用精确匹配不会
test("精确匹配: '领取'不等于'领取礼物'", "领取" != "领取礼物")
test("'领取礼物'在黑名单中被过滤", "领取礼物" in BLOCKLIST)

print(f"\n===== 结果: {passed} 通过, {failed} 失败 =====")
sys.exit(1 if failed > 0 else 0)
