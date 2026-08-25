# -*- coding: utf-8 -*-
import io, sys
p = r"D:\codex-projeect\codex\antigravity-project\workbuddy-cat-bot\workbuddy-cat-bot.user.js"
s = io.open(p, encoding="utf-8-sig", newline="").read()
R = []

# 1) qsaAll 递归穿透 Shadow DOM
old_q = "    function qsaAll(selector) {\n        const out = [];\n        for (const d of allDocs()) { try { d.querySelectorAll(selector).forEach(el => out.push(el)); } catch (e) {} }\n        return out;\n    }"
new_q = "    function qsaAll(selector) {\n        const out = [];\n        const walk = root => {\n            try { root.querySelectorAll(selector).forEach(el => out.push(el)); } catch (e) {}\n            try { root.querySelectorAll('*').forEach(el => { if (el.shadowRoot) walk(el.shadowRoot); }); } catch (e) {}\n        };\n        for (const d of allDocs()) walk(d);\n        return out;\n    }"
R.append(("qsaAll", old_q, new_q))

# 2) dumpButtons 查所有标签(含 span/div)+短文本,用 qsaAll(已穿 Shadow)
old_d = "    // 诊断：idle 时把各 frame 真实按钮文案打到 HUD(节流 10s)，便于核对按钮文案\n    let lastDump = 0;\n    function dumpButtons() {\n        if (Date.now() - lastDump < 10000) return;\n        lastDump = Date.now();\n        const docs = allDocs();\n        docs.forEach((d, i) => {\n            let els;\n            try { els = Array.from(d.querySelectorAll('button, div[role=\"button\"], a')); } catch (e) { return; }\n            const samples = els.filter(el => { try { return isClickable(el); } catch (e) { return false; } })\n                .map(el => textOf(el)).filter(t => t).slice(0, 20);\n            addLog(`[诊断] frame${i} 按钮样本: ${JSON.stringify(samples)}`, '#fbbf24');\n        });\n    }"
new_d = "    // 诊断：idle 时把所有候选按钮(含 Shadow DOM 内)文案打到 HUD(节流 10s)\n    let lastDump = 0;\n    function dumpButtons() {\n        if (Date.now() - lastDump < 10000) return;\n        lastDump = Date.now();\n        const samples = qsaAll('button, div[role=\"button\"], a, span, div')\n            .filter(el => { try { return isClickable(el) && textOf(el).length > 0 && textOf(el).length <= 15; } catch (e) { return false; } })\n            .map(el => textOf(el)).slice(0, 40);\n        addLog(`[诊断] 候选按钮: ${JSON.stringify(samples)}`, '#fbbf24');\n    }"
R.append(("dumpButtons", old_d, new_d))

# 3) 版本号 6.2 -> 6.3
R.append(("name", "自动托管 v6.2", "自动托管 v6.3"))
R.append(("ver", "// @version      6.2", "// @version      6.3"))
R.append(("badge", "v6.2 防误点", "v6.3 穿Shadow"))

ok = True
for name, old, new in R:
    n = s.count(old)
    if n != 1:
        print(f"[{name}] match={n} SKIP", flush=True); ok = False; continue
    s = s.replace(old, new, 1); print(f"[{name}] applied", flush=True)
if ok:
    io.open(p, "w", encoding="utf-8", newline="").write(s); print("written ok", flush=True)
else:
    sys.exit(1)