#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Typora 快捷键 → Obsidian 导入工具（可视化）

功能：
  1. 含义一致（Obsidian 默认未占用该键）的快捷键默认勾选，自动导入
  2. 含义冲突（Obsidian 默认同键是别的功能）的快捷键由你手动勾选
  3. 每次导入前自动备份 .obsidian/hotkeys.json 到 .obsidian/hotkeys-backups/
  4. 支持从备份一键恢复、或清空为 Obsidian 默认

运行方式（需使用带 tkinter 的 Python，即系统 Python 3.14.6）：
    D:\\devloop-tools\\python\\python.exe typora_to_obsidian.py
    或双击 run.bat
"""

import datetime
import json
import os
import shutil
import tkinter as tk
from tkinter import filedialog, messagebox

# ============================ 配置 ============================
DEFAULT_VAULT = r"D:\d-other\obsidian\store"
BACKUP_DIRNAME = "hotkeys-backups"
MOD_KEYS = ("Ctrl", "Alt", "Shift", "Mod", "Meta", "Cmd")
FONT = ("Microsoft YaHei UI", 10)
FONT_BOLD = ("Microsoft YaHei UI", 10, "bold")
FONT_MONO = ("Consolas", 10)


# ============================ 快捷键解析 ============================
def parse_hotkey(s):
    """'Ctrl+Shift+K' -> (['Ctrl','Shift'], 'K')"""
    parts = [p.strip() for p in s.split("+")]
    key = parts[-1]
    mods = [p for p in parts[:-1] if p in MOD_KEYS]
    return mods, key


def to_obsidian_hotkey(s):
    mods, key = parse_hotkey(s)
    return {"modifiers": mods, "key": key}


# ============================ 映射表 ============================
# key: Typora 快捷键   typora: Typora 中的功能   cmd: Obsidian 命令 ID
# conflict: 是否与 Obsidian 默认同键冲突   obsidian_cmd: 冲突时被覆盖的 Obsidian 原命令
MAPPINGS = []


def _add(key, typora, cmd, conflict=False, obsidian_cmd=None, note=""):
    MAPPINGS.append(dict(key=key, typora=typora, cmd=cmd,
                         conflict=conflict, obsidian_cmd=obsidian_cmd, note=note))


# —— 含义一致 / Obsidian 默认未占用（默认勾选，自动导入）——
_add("Alt+Shift+5", "删除线", "editor:toggle-strikethrough")
_add("Ctrl+Shift+`", "行内代码", "editor:toggle-code")
_add("Ctrl+Shift+Q", "引用块", "editor:toggle-blockquote")
_add("Ctrl+Shift+[", "有序列表", "editor:toggle-numbered-list")
_add("Ctrl+Shift+]", "无序列表", "editor:toggle-bullet-list")
_add("Ctrl+Shift+M", "公式块", "editor:insert-mathblock")
_add("Ctrl+Shift+I", "插入图片", "editor:attach-file", note="对应 Obsidian『插入附件』")
_add("Ctrl+\\", "清除格式", "editor:clear-formatting")
_add("Ctrl+Shift+L", "显示/隐藏侧边栏", "app:toggle-left-sidebar")
_add("Ctrl+Shift+1", "大纲视图", "outline:open", note="需在核心插件里启用 Outline")
_add("F9", "打字机模式", "editor:toggle-typewriter")

# —— 含义冲突（默认不勾选，由你手动选择是否覆盖 Obsidian 默认）——
_add("Ctrl+Shift+K", "代码块", "editor:insert-codeblock", conflict=True,
     note="Obsidian 默认『删除当前行』(框架级，无法解绑)，绑定后可能仍不生效")
_add("Ctrl+T", "插入表格", "editor:insert-table", conflict=True,
     obsidian_cmd="workspace:new-tab", note="Obsidian 默认『新建标签页』")
_add("Ctrl+/", "源码模式", "editor:toggle-source", conflict=True,
     obsidian_cmd="editor:toggle-comments", note="Obsidian 默认『切换注释』")
for i in range(1, 7):
    _add(f"Ctrl+{i}", f"标题 {i}", f"editor:set-heading-{i}", conflict=True,
         obsidian_cmd=f"app:go-to-tab-{i}", note=f"Obsidian 默认『跳转标签页 {i}』")
_add("Ctrl+0", "正文（段落）", "editor:set-heading-0", conflict=True,
     obsidian_cmd="app:go-to-last-tab", note="Obsidian 默认『跳转最后一个标签页』")

# —— 不支持（仅提示，无法导入）——
_add("Ctrl+U", "下划线", None, note="Obsidian 原生无下划线命令，需安装 Underline 插件")
_add("F8", "专注模式", None, note="Obsidian 无专注模式")


# ============================ 核心逻辑 ============================
def hotkeys_path(vault):
    return os.path.join(vault, ".obsidian", "hotkeys.json")


def backup_dir(vault):
    return os.path.join(vault, ".obsidian", BACKUP_DIRNAME)


def load_hotkeys(vault):
    p = hotkeys_path(vault)
    if os.path.exists(p):
        with open(p, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def backup(vault, log):
    """备份当前 hotkeys.json，返回备份文件路径（无原文件则返回 None）"""
    p = hotkeys_path(vault)
    if not os.path.exists(p):
        log("当前无 hotkeys.json（首次导入），无需备份")
        return None
    d = backup_dir(vault)
    os.makedirs(d, exist_ok=True)
    ts = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    dst = os.path.join(d, f"hotkeys.{ts}.json")
    shutil.copy2(p, dst)
    log(f"已备份原文件 -> {dst}")
    return dst


def apply_and_save(vault, selected, log):
    """把勾选的映射合并进 hotkeys.json 并写回"""
    data = load_hotkeys(vault)
    for m in selected:
        cmd = m["cmd"]
        hk = to_obsidian_hotkey(m["key"])
        # 冲突项：先解绑 Obsidian 原命令的同一按键
        if m.get("conflict") and m.get("obsidian_cmd"):
            orig = m["obsidian_cmd"]
            if orig in data:
                keep = [b for b in data[orig]
                        if not (b.get("modifiers") == hk["modifiers"]
                                and b.get("key") == hk["key"])]
                if keep:
                    data[orig] = keep
                else:
                    del data[orig]
        # 绑定新命令（去重）
        arr = data.setdefault(cmd, [])
        if hk not in arr:
            arr.append(hk)
    p = hotkeys_path(vault)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    log(f"已写入 {len(selected)} 条快捷键 -> {p}")


def restore_from_file(vault, backup_file, log):
    with open(backup_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    p = hotkeys_path(vault)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    log(f"已恢复 -> {p}")


def list_backups(vault):
    d = backup_dir(vault)
    if not os.path.isdir(d):
        return []
    files = [f for f in os.listdir(d) if f.endswith(".json")]
    files.sort(reverse=True)  # 新的在前
    return [os.path.join(d, f) for f in files]


# ============================ GUI ============================
class App:
    def __init__(self, root):
        self.root = root
        root.title("Typora 快捷键 → Obsidian 导入工具")
        root.geometry("900x760")
        self.vault_var = tk.StringVar(value=DEFAULT_VAULT)
        self.vars = []  # 与 MAPPINGS 顺序对应的 BooleanVar
        self.build()

    # ---------- 工具 ----------
    def log(self, msg):
        ts = datetime.datetime.now().strftime("%H:%M:%S")
        self.log_text.insert(tk.END, f"[{ts}] {msg}\n")
        self.log_text.see(tk.END)
        try:
            print(f"[{ts}] {msg}")
        except UnicodeEncodeError:
            pass  # 控制台编码不支持特殊字符(如⚠)时忽略，避免闪退

    def vault(self):
        return self.vault_var.get().strip()

    def valid_vault(self):
        v = self.vault()
        return bool(v) and os.path.isdir(os.path.join(v, ".obsidian"))

    # ---------- 界面 ----------
    def build(self):
        # 顶部：vault 路径
        top = tk.Frame(self.root)
        top.pack(fill="x", padx=8, pady=(8, 2))
        tk.Label(top, text="Vault 路径:", font=FONT).pack(side="left")
        ent = tk.Entry(top, textvariable=self.vault_var, font=FONT)
        ent.pack(side="left", fill="x", expand=True, padx=6)
        tk.Button(top, text="浏览…", font=FONT, command=self.browse_vault).pack(side="left")

        # 提示
        tk.Label(self.root,
                 text="✓ 含义一致自动勾选 ｜ 冲突项（与 Obsidian 默认键冲突）请手动勾选 ｜ 导入前自动备份",
                 font=FONT, fg="#555", anchor="w").pack(fill="x", padx=10, pady=(0, 2))

        # 中部：可滚动的映射列表
        mid = tk.Frame(self.root)
        mid.pack(fill="both", expand=True, padx=8, pady=4)
        canvas = tk.Canvas(mid, borderwidth=0, highlightthickness=0)
        vsb = tk.Scrollbar(mid, orient="vertical", command=canvas.yview)
        self.list_frame = tk.Frame(canvas)
        self.list_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all")))
        canvas.create_window((0, 0), window=self.list_frame, anchor="nw")
        canvas.configure(yscrollcommand=vsb.set)
        canvas.pack(side="left", fill="both", expand=True)
        vsb.pack(side="right", fill="y")

        self.build_mapping_rows()

        # 底部：日志
        log_frame = tk.LabelFrame(self.root, text="操作日志", font=FONT)
        log_frame.pack(fill="x", padx=8, pady=(0, 2))
        self.log_text = tk.Text(log_frame, height=6, font=("Consolas", 9), wrap="word")
        self.log_text.pack(fill="x", padx=4, pady=4)

        # 按钮行
        btns = tk.Frame(self.root)
        btns.pack(fill="x", padx=8, pady=(0, 8))
        tk.Button(btns, text="导入所选", font=FONT, command=self.do_import).pack(side="left", padx=3)
        tk.Button(btns, text="恢复备份…", font=FONT, command=self.do_restore).pack(side="left", padx=3)
        tk.Button(btns, text="清空为 Obsidian 默认", font=FONT, command=self.do_reset).pack(side="left", padx=3)
        tk.Button(btns, text="退出", font=FONT, command=self.root.destroy).pack(side="right", padx=3)

        self.log("已加载映射表，共 %d 条" % len(MAPPINGS))
        if self.valid_vault():
            cur = load_hotkeys(self.vault())
            n = len(cur) if isinstance(cur, dict) else 0
            self.log(f"检测到 vault，当前已有 {n} 个自定义快捷键")
        else:
            self.log("⚠ 默认 vault 路径无效，请点击『浏览…』选择你的 Obsidian 库目录")

    def build_mapping_rows(self):
        # 分组：自动导入
        tk.Label(self.list_frame, text="自动导入（含义一致，默认全选）",
                 font=FONT_BOLD, fg="#1a7f37", anchor="w").pack(fill="x", pady=(6, 2))
        for m in MAPPINGS:
            if m["conflict"] or m["cmd"] is None:
                continue
            self.vars.append(tk.BooleanVar(value=True))
            self._row(m, self.vars[-1])

        # 分组：冲突，需手动选择
        tk.Label(self.list_frame, text="需手动选择（与 Obsidian 默认键冲突）",
                 font=FONT_BOLD, fg="#b35900", anchor="w").pack(fill="x", pady=(12, 2))
        for m in MAPPINGS:
            if not m["conflict"]:
                continue
            self.vars.append(tk.BooleanVar(value=False))
            self._row(m, self.vars[-1])

        # 分组：不支持
        tk.Label(self.list_frame, text="不支持导入（仅提示）",
                 font=FONT_BOLD, fg="#888", anchor="w").pack(fill="x", pady=(12, 2))
        for m in MAPPINGS:
            if m["cmd"] is not None:
                continue
            self.vars.append(tk.BooleanVar(value=False))
            tk.Label(self.list_frame,
                     text=f"✗  {m['key']:<14} {m['typora']}  —  {m['note']}",
                     font=FONT, fg="#888", anchor="w").pack(fill="x")

    def _row(self, m, var):
        text = f"{m['key']:<14} {m['typora']}"
        cb = tk.Checkbutton(self.list_frame, text=text, variable=var,
                            font=FONT, anchor="w")
        cb.pack(fill="x")
        if m.get("note"):
            tk.Label(self.list_frame, text="      " + m["note"],
                     font=FONT, fg="#888", anchor="w").pack(fill="x")

    # ---------- 动作 ----------
    def browse_vault(self):
        d = filedialog.askdirectory(title="选择 Obsidian 库目录（含 .obsidian 的文件夹）")
        if d:
            self.vault_var.set(d)
            self.log(f"已切换 vault -> {d}")

    def do_import(self):
        if not self.valid_vault():
            messagebox.showerror("错误", "vault 路径无效：未找到 .obsidian 目录")
            return
        selected = [m for m, var in zip(MAPPINGS, self.vars) if m["cmd"] and var.get()]
        if not selected:
            messagebox.showinfo("提示", "没有勾选任何快捷键")
            return
        ok = messagebox.askyesno(
            "确认导入",
            f"将导入 {len(selected)} 条快捷键，并先自动备份现有 hotkeys.json。\n\n继续？")
        if not ok:
            return
        backup(self.vault(), self.log)
        apply_and_save(self.vault(), selected, self.log)
        self.log("完成。若 Obsidian 未自动重载，请重启 Obsidian 生效。")
        messagebox.showinfo("完成", "导入完成，原文件已备份。")

    def do_restore(self):
        if not self.valid_vault():
            messagebox.showerror("错误", "vault 路径无效")
            return
        files = list_backups(self.vault())
        if not files:
            messagebox.showinfo("提示", "没有找到备份文件")
            return
        win = tk.Toplevel(self.root)
        win.title("选择要恢复的备份")
        win.geometry("560x320")
        tk.Label(win, text="选择一个备份文件恢复（新的在前）：",
                 font=FONT, anchor="w").pack(fill="x", padx=10, pady=6)
        lb = tk.Listbox(win, font=("Consolas", 9))
        lb.pack(fill="both", expand=True, padx=10)
        for f in files:
            lb.insert(tk.END, os.path.basename(f))

        def do():
            sel = lb.curselection()
            if not sel:
                messagebox.showinfo("提示", "请先选择要恢复的备份")
                return
            target = files[sel[0]]
            if not messagebox.askyesno("确认",
                                       f"恢复前会先备份当前文件。\n恢复: {os.path.basename(target)}"):
                return
            backup(self.vault(), self.log)
            restore_from_file(self.vault(), target, self.log)
            self.log("恢复完成。请重启 Obsidian 生效。")
            win.destroy()

        tk.Button(win, text="恢复所选", font=FONT, command=do).pack(pady=8)

    def do_reset(self):
        if not self.valid_vault():
            messagebox.showerror("错误", "vault 路径无效")
            return
        if not messagebox.askyesno("确认",
                                   "将清空所有自定义快捷键，恢复 Obsidian 默认（先备份当前文件）。\n\n继续？"):
            return
        backup(self.vault(), self.log)
        p = hotkeys_path(self.vault())
        with open(p, "w", encoding="utf-8") as f:
            json.dump({}, f, indent=2)
        self.log("已清空自定义快捷键 -> 恢复 Obsidian 默认")


def main():
    root = tk.Tk()
    App(root)
    root.mainloop()


if __name__ == "__main__":
    main()
