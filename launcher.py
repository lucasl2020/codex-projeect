#!/usr/bin/env python3
# -*- coding: utf-8 -*-
r"""
Codex 工具箱 —— 免环境独立运行桌面启动器
统一管理并一键启动 D:\codex-projeect 下所有工具（已排除验证码识别）：
1. AI 模型接口测试台 (ai-model-tester)
2. 卡网管理与比价面板 (crawler)
3. CSV 手机号转 MD5 (md5处理程序)
4. Typora 转 Obsidian 迁移 (typora-to-obsidian)
5. TRAE / WorkBuddy 每日签到 (trae-auto-checkin)
6. WorkBuddy 派猫旅行自动脚本 (workbuddy派遣)
7. Codex++ 配置查看器 (显示codex配置信息)
"""

from __future__ import annotations

import os
import sys
import time
import socket
import subprocess
import webbrowser
import threading
import tkinter as tk
from tkinter import ttk, messagebox

# 确定运行基准目录
if getattr(sys, "frozen", False):
    BASE_DIR = os.path.dirname(os.path.abspath(sys.executable))
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def is_port_in_use(port: int, host: str = "127.0.0.1") -> bool:
    """检查指定端口是否已被监听"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.4)
        return s.connect_ex((host, port)) == 0


class ToolManager:
    """后台进程与工具状态管理"""
    def __init__(self):
        self.procs: dict[str, subprocess.Popen] = {}

    def is_running(self, key: str, port: int | None = None) -> bool:
        proc = self.procs.get(key)
        if proc is not None and proc.poll() is None:
            return True
        if port is not None and is_port_in_use(port):
            return True
        return False

    def stop_tool(self, key: str):
        proc = self.procs.get(key)
        if proc is not None:
            try:
                # 在 Windows 上强制终止进程树
                subprocess.run(
                    ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    check=False
                )
            except Exception:
                try:
                    proc.kill()
                except Exception:
                    pass
            self.procs.pop(key, None)

    def stop_all(self):
        for key in list(self.procs.keys()):
            self.stop_tool(key)


class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Codex 工具箱 - 独立便携管理中心")
        self.geometry("920x680")
        self.minsize(840, 600)
        self.configure(bg="#f4f6f9")

        self.mgr = ToolManager()

        # 配置字体与样式
        self.font_title = ("Microsoft YaHei UI", 16, "bold")
        self.font_subtitle = ("Microsoft YaHei UI", 9)
        self.font_card_title = ("Microsoft YaHei UI", 12, "bold")
        self.font_text = ("Microsoft YaHei UI", 9)
        self.font_btn = ("Microsoft YaHei UI", 9)
        self.font_badge = ("Microsoft YaHei UI", 8, "bold")

        self._init_ui()
        self._start_monitor_loop()
        self.protocol("WM_DELETE_WINDOW", self._on_close)

    def _init_ui(self):
        # 顶部 Header
        header = tk.Frame(self, bg="#1e293b", height=78)
        header.pack(fill=tk.X, side=tk.TOP)
        header.pack_propagate(False)

        title_box = tk.Frame(header, bg="#1e293b")
        title_box.pack(side=tk.LEFT, padx=24, pady=12)

        lbl_title = tk.Label(
            title_box,
            text="🧰 Codex 工具箱",
            font=self.font_title,
            fg="#ffffff",
            bg="#1e293b"
        )
        lbl_title.pack(anchor="w")

        lbl_sub = tk.Label(
            title_box,
            text="无需配置开发环境 · 开箱即用绿色便携工具集合（已排除验证码识别模块）",
            font=self.font_subtitle,
            fg="#94a3b8",
            bg="#1e293b"
        )
        lbl_sub.pack(anchor="w")

        # 顶部右侧快捷按钮
        btn_box = tk.Frame(header, bg="#1e293b")
        btn_box.pack(side=tk.RIGHT, padx=20, pady=18)

        btn_open_root = tk.Button(
            btn_box,
            text="📁 打开根目录",
            font=self.font_btn,
            bg="#334155",
            fg="#f8fafc",
            relief=tk.FLAT,
            padx=10,
            pady=4,
            cursor="hand2",
            activebackground="#475569",
            activeforeground="#ffffff",
            command=lambda: os.startfile(BASE_DIR)
        )
        btn_open_root.pack(side=tk.RIGHT, padx=4)

        # 中间可滚动卡片列表
        container = tk.Frame(self, bg="#f4f6f9")
        container.pack(fill=tk.BOTH, expand=True, padx=16, pady=12)

        self.canvas = tk.Canvas(container, bg="#f4f6f9", highlightthickness=0)
        scrollbar = ttk.Scrollbar(container, orient="vertical", command=self.canvas.yview)
        self.scrollable_frame = tk.Frame(self.canvas, bg="#f4f6f9")

        self.scrollable_frame.bind(
            "<Configure>",
            lambda e: self.canvas.configure(scrollregion=self.canvas.bbox("all"))
        )

        self.canvas_window = self.canvas.create_window((0, 0), window=self.scrollable_frame, anchor="nw")
        self.canvas.bind(
            "<Configure>",
            lambda e: self.canvas.itemconfig(self.canvas_window, width=e.width)
        )
        self.canvas.configure(yscrollcommand=scrollbar.set)

        self.canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        # 鼠标滚轮绑定
        self.bind_all("<MouseWheel>", self._on_mousewheel)

        # 底部状态栏
        self.status_bar = tk.Frame(self, bg="#e2e8f0", height=28)
        self.status_bar.pack(fill=tk.X, side=tk.BOTTOM)
        self.status_bar.pack_propagate(False)

        self.status_lbl = tk.Label(
            self.status_bar,
            text="就绪 · 所有程序均已打包内置所需运行时",
            font=self.font_subtitle,
            fg="#475569",
            bg="#e2e8f0"
        )
        self.status_lbl.pack(side=tk.LEFT, padx=16, pady=4)

        self.card_widgets = {}
        self._build_cards()

    def _on_mousewheel(self, event):
        self.canvas.yview_scroll(int(-1 * (event.delta / 120)), "units")

    def _build_cards(self):
        tools = [
            {
                "id": "ai-model-tester",
                "title": "🎯 AI 模型接口测试台",
                "type": "web",
                "port": 8787,
                "url": "http://127.0.0.1:8787",
                "desc": "拉取主流 AI 供应商（OpenAI/Claude/Gemini/DeepSeek 等）模型列表，支持勾选并发测速测通或定时巡检。",
                "dir": "ai-model-tester",
                "run_cmd": self._cmd_ai_model_tester,
            },
            {
                "id": "crawler",
                "title": "🕷️ 卡网管理面板与商品比价",
                "type": "web",
                "port": 3780,
                "url": "http://127.0.0.1:3780",
                "desc": "管理卡网/导航站 URL，定时/手动爬取商品并按店铺分组比价（内置独立 Chromium 浏览器，零外部依赖）。",
                "dir": "crawler",
                "run_cmd": self._cmd_crawler,
            },
            {
                "id": "md5-tool",
                "title": "🔑 CSV 手机号转 MD5 处理工具",
                "type": "gui",
                "desc": "超大 CSV 高性能流式清洗转换：手机号转 32 位小写 MD5、手机号行删除、按 MD5/手机号去重（支持图形界面与命令行）。",
                "dir": "md5处理程序",
                "actions": [
                    ("🖥️ 打开图形界面 (GUI)", self._cmd_md5_gui),
                    ("⌨️ 打开命令行 (CLI)", self._cmd_md5_cli),
                ],
            },
            {
                "id": "typora-obsidian",
                "title": "📝 Typora 快捷键 → Obsidian 迁移工具",
                "type": "gui",
                "desc": "可视化将 Typora 习惯快捷键无缝导入至 Obsidian，智能冲突检测并自动备份原 hotkeys.json。",
                "dir": "typora-to-obsidian",
                "actions": [
                    ("🚀 启动迁移工具", self._cmd_typora),
                ],
            },
            {
                "id": "trae-checkin",
                "title": "📅 TRAE Work CN / WorkBuddy 每日自动签到",
                "type": "cli",
                "desc": "自动复用本机已登录账号凭据，一键完成 TRAE Work CN 与 WorkBuddy 每日积分自动签到。",
                "dir": "trae-auto-checkin",
                "actions": [
                    ("⚡ 一键执行签到", self._cmd_trae_checkin),
                ],
            },
            {
                "id": "workbuddy-travel",
                "title": "🐱 WorkBuddy 成长计划 · 派猫旅行",
                "type": "cli",
                "desc": "直接调用 WorkBuddy 后端完成猫咪自动派遣旅行、查询状态并领取旅行奖励，无需常驻浏览器。",
                "dir": "workbuddy派遣",
                "actions": [
                    ("🐾 立即派猫/领奖", self._cmd_workbuddy_travel),
                ],
            },
            {
                "id": "view-codex",
                "title": "⚙️ Codex++ 供应商配置查看器",
                "type": "cli",
                "desc": "查看 Codex++ 供应商配置、模型映射与修复状态，内置 Windows 原生脚本执行器。",
                "dir": "显示codex配置信息",
                "actions": [
                    ("🔍 查看配置信息", self._cmd_view_codex),
                ],
            },
        ]

        for item in tools:
            self._render_card(item)

    def _render_card(self, item: dict):
        card = tk.Frame(self.scrollable_frame, bg="#ffffff", bd=1, relief=tk.SOLID)
        card.pack(fill=tk.X, pady=6, padx=6)

        # 内部留白
        inner = tk.Frame(card, bg="#ffffff", padx=16, pady=12)
        inner.pack(fill=tk.X)

        # 头部：标题与状态标签
        header_row = tk.Frame(inner, bg="#ffffff")
        header_row.pack(fill=tk.X)

        lbl_title = tk.Label(
            header_row,
            text=item["title"],
            font=self.font_card_title,
            fg="#0f172a",
            bg="#ffffff"
        )
        lbl_title.pack(side=tk.LEFT)

        badge = tk.Label(
            header_row,
            text="● 就绪",
            font=self.font_badge,
            fg="#059669",
            bg="#ecfdf5",
            padx=8,
            pady=2
        )
        badge.pack(side=tk.RIGHT)

        # 描述文本
        lbl_desc = tk.Label(
            inner,
            text=item["desc"],
            font=self.font_text,
            fg="#64748b",
            bg="#ffffff",
            justify=tk.LEFT,
            wraplength=760
        )
        lbl_desc.pack(anchor="w", pady=(6, 10))

        # 按钮动作行
        action_row = tk.Frame(inner, bg="#ffffff")
        action_row.pack(fill=tk.X)

        tool_id = item["id"]
        widgets = {"badge": badge, "buttons": {}}

        # Web 类服务卡片：启动/停止/打开浏览器
        if item["type"] == "web":
            btn_start = tk.Button(
                action_row,
                text="▶ 启动服务",
                font=self.font_btn,
                bg="#2563eb",
                fg="#ffffff",
                relief=tk.FLAT,
                padx=14,
                pady=4,
                cursor="hand2",
                activebackground="#1d4ed8",
                activeforeground="#ffffff",
                command=lambda it=item: self._start_web_service(it)
            )
            btn_start.pack(side=tk.LEFT, padx=(0, 6))
            widgets["buttons"]["start"] = btn_start

            btn_open = tk.Button(
                action_row,
                text="🌐 打开网页",
                font=self.font_btn,
                bg="#0284c7",
                fg="#ffffff",
                relief=tk.FLAT,
                padx=12,
                pady=4,
                cursor="hand2",
                activebackground="#0369a1",
                activeforeground="#ffffff",
                command=lambda u=item["url"]: webbrowser.open(u)
            )
            btn_open.pack(side=tk.LEFT, padx=6)
            widgets["buttons"]["open"] = btn_open

            btn_stop = tk.Button(
                action_row,
                text="⏹ 停止",
                font=self.font_btn,
                bg="#dc2626",
                fg="#ffffff",
                relief=tk.FLAT,
                padx=12,
                pady=4,
                cursor="hand2",
                activebackground="#b91c1c",
                activeforeground="#ffffff",
                state=tk.DISABLED,
                command=lambda it=item: self._stop_web_service(it)
            )
            btn_stop.pack(side=tk.LEFT, padx=6)
            widgets["buttons"]["stop"] = btn_stop

        # GUI / CLI 类卡片
        elif "actions" in item:
            for text, cmd_func in item["actions"]:
                btn = tk.Button(
                    action_row,
                    text=text,
                    font=self.font_btn,
                    bg="#0f766e" if ("GUI" in text or "迁移" in text) else "#3b82f6",
                    fg="#ffffff",
                    relief=tk.FLAT,
                    padx=12,
                    pady=4,
                    cursor="hand2",
                    activebackground="#115e59",
                    activeforeground="#ffffff",
                    command=cmd_func
                )
                btn.pack(side=tk.LEFT, padx=(0, 8))

        # 打开所在目录按钮
        target_dir = os.path.join(BASE_DIR, item["dir"])
        btn_dir = tk.Button(
            action_row,
            text="📂 打开目录",
            font=self.font_btn,
            bg="#f1f5f9",
            fg="#475569",
            relief=tk.FLAT,
            padx=10,
            pady=4,
            cursor="hand2",
            activebackground="#e2e8f0",
            activeforeground="#1e293b",
            command=lambda p=target_dir: self._open_dir(p)
        )
        btn_dir.pack(side=tk.RIGHT)

        self.card_widgets[tool_id] = widgets

    def _open_dir(self, path: str):
        if os.path.exists(path):
            os.startfile(path)
        else:
            messagebox.showwarning("提示", f"对应目录暂未找到：\n{path}")

    # ==================== Web 服务控制 ====================
    def _start_web_service(self, item: dict):
        tool_id = item["id"]
        port = item.get("port")
        url = item["url"]

        if is_port_in_use(port):
            messagebox.showinfo("提示", f"{item['title']} 对应端口 ({port}) 已经在运行中！\n即将为您在浏览器打开页面。")
            webbrowser.open(url)
            return

        def run_thread():
            self._set_status(f"正在启动 {item['title']}...")
            cmd = item["run_cmd"]()
            cwd = os.path.join(BASE_DIR, item["dir"])
            try:
                proc = subprocess.Popen(
                    cmd,
                    cwd=cwd,
                    shell=True,
                    creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0
                )
                self.mgr.procs[tool_id] = proc

                # 等待服务端口建立
                started = False
                for _ in range(40):
                    time.sleep(0.3)
                    if is_port_in_use(port):
                        started = True
                        break
                    if proc.poll() is not None:
                        break

                if started:
                    self._set_status(f"✓ {item['title']} 启动成功，端口: {port}")
                    webbrowser.open(url)
                else:
                    self._set_status(f"⚠ {item['title']} 启动超时或退出，请查看对应目录日志")
            except Exception as e:
                self._set_status(f"启动失败: {e}")
                messagebox.showerror("启动失败", f"无法启动 {item['title']}:\n{e}")

        threading.Thread(target=run_thread, daemon=True).start()

    def _stop_web_service(self, item: dict):
        tool_id = item["id"]
        self.mgr.stop_tool(tool_id)
        self._set_status(f"已停止 {item['title']}")

    # ==================== 具体指令定位 ====================
    def _cmd_ai_model_tester(self) -> str:
        d = os.path.join(BASE_DIR, "ai-model-tester")
        node = os.path.join(d, "node.exe")
        if os.path.exists(node):
            return f'"{node}" server.mjs'
        return "node server.mjs"

    def _cmd_crawler(self) -> str:
        d = os.path.join(BASE_DIR, "crawler")
        start_cmd = os.path.join(d, "start.cmd")
        if os.path.exists(start_cmd):
            return f'"{start_cmd}"'
        node = os.path.join(d, "node.exe")
        if os.path.exists(node):
            return f'"{node}" scripts\\one-click.mjs'
        return "node scripts\\one-click.mjs"

    def _cmd_md5_gui(self):
        d = os.path.join(BASE_DIR, "md5处理程序")
        exe = os.path.join(d, "csv_phone_to_md5_gui.exe")
        if os.path.exists(exe):
            subprocess.Popen([exe], cwd=d)
            return
        pyw = os.path.join(d, "csv_phone_to_md5_gui.pyw")
        if os.path.exists(pyw):
            subprocess.Popen([sys.executable, pyw], cwd=d)
            return
        messagebox.showerror("错误", f"未找到可执行文件：\n{exe}")

    def _cmd_md5_cli(self):
        d = os.path.join(BASE_DIR, "md5处理程序")
        exe = os.path.join(d, "csv_phone_to_md5.exe")
        if os.path.exists(exe):
            cmd = f'start cmd /k "chcp 65001 >nul & echo [CSV 手机号转 MD5 命令行工具] & "{exe}" -h"'
            os.system(cmd)
            return
        py = os.path.join(d, "csv_phone_to_md5.py")
        if os.path.exists(py):
            cmd = f'start cmd /k "chcp 65001 >nul & "{sys.executable}" "{py}" -h"'
            os.system(cmd)
            return
        messagebox.showerror("错误", f"未找到可执行文件：\n{exe}")

    def _cmd_typora(self):
        d = os.path.join(BASE_DIR, "typora-to-obsidian")
        exe = os.path.join(d, "typora_to_obsidian.exe")
        if os.path.exists(exe):
            subprocess.Popen([exe], cwd=d)
            return
        py = os.path.join(d, "typora_to_obsidian.py")
        if os.path.exists(py):
            subprocess.Popen([sys.executable, py], cwd=d)
            return
        messagebox.showerror("错误", f"未找到可执行文件：\n{exe}")

    def _cmd_trae_checkin(self):
        d = os.path.join(BASE_DIR, "trae-auto-checkin")
        exe = os.path.join(d, "trae_checkin.exe")
        if os.path.exists(exe):
            cmd = f'start cmd /k "chcp 65001 >nul & title TRAE 每日签到 & cd /d "{d}" & "{exe}" & echo. & echo 执行完毕。按任意键关闭 & pause >nul"'
            os.system(cmd)
            return
        py = os.path.join(d, "trae_checkin.py")
        if os.path.exists(py):
            cmd = f'start cmd /k "chcp 65001 >nul & title TRAE 每日签到 & cd /d "{d}" & "{sys.executable}" "{py}" & echo. & echo 执行完毕。按任意键关闭 & pause >nul"'
            os.system(cmd)
            return
        messagebox.showerror("错误", f"未找到可执行文件：\n{exe}")

    def _cmd_workbuddy_travel(self):
        d = os.path.join(BASE_DIR, "workbuddy派遣")
        start_cmd = os.path.join(d, "start.cmd")
        if os.path.exists(start_cmd):
            os.system(f'start cmd /k "cd /d "{d}" & "{start_cmd}""')
            return
        bat = os.path.join(d, "growth-travel.bat")
        if os.path.exists(bat):
            os.system(f'start cmd /k "cd /d "{d}" & "{bat}""')
            return
        node = os.path.join(d, "node.exe")
        if os.path.exists(node):
            cmd = f'start cmd /k "chcp 65001 >nul & title WorkBuddy 派猫旅行 & cd /d "{d}" & "{node}" growth-travel.js & pause"'
            os.system(cmd)
            return
        messagebox.showerror("错误", f"未找到启动脚本：\n{d}")

    def _cmd_view_codex(self):
        d = os.path.join(BASE_DIR, "显示codex配置信息")
        cmd_file = os.path.join(d, "view-codex-config.cmd")
        if os.path.exists(cmd_file):
            os.system(f'start cmd /k "cd /d "{d}" & "{cmd_file}""')
            return
        messagebox.showerror("错误", f"未找到配置文件：\n{cmd_file}")

    # ==================== 状态巡检循环 ====================
    def _start_monitor_loop(self):
        def loop():
            while True:
                try:
                    # 检查 AI Model Tester (8787)
                    ai_run = self.mgr.is_running("ai-model-tester", 8787)
                    self._update_web_badge("ai-model-tester", ai_run, 8787)

                    # 检查 Crawler (3780)
                    crawler_run = self.mgr.is_running("crawler", 3780)
                    self._update_web_badge("crawler", crawler_run, 3780)
                except Exception:
                    pass
                time.sleep(1.2)

        threading.Thread(target=loop, daemon=True).start()

    def _update_web_badge(self, tool_id: str, running: bool, port: int):
        widgets = self.card_widgets.get(tool_id)
        if not widgets:
            return

        def update():
            badge = widgets["badge"]
            btns = widgets["buttons"]
            if running:
                badge.configure(text=f"● 运行中 (端口 {port})", fg="#15803d", bg="#dcfce7")
                if "start" in btns:
                    btns["start"].configure(state=tk.DISABLED)
                if "stop" in btns:
                    btns["stop"].configure(state=tk.NORMAL)
            else:
                badge.configure(text="● 就绪", fg="#059669", bg="#ecfdf5")
                if "start" in btns:
                    btns["start"].configure(state=tk.NORMAL)
                if "stop" in btns:
                    btns["stop"].configure(state=tk.DISABLED)

        self.after(0, update)

    def _set_status(self, text: str):
        self.after(0, lambda: self.status_lbl.configure(text=text))

    def _on_close(self):
        # 关闭时检查是否有子服务运行
        if any(proc.poll() is None for proc in self.mgr.procs.values()):
            if messagebox.askyesno("提示", "当前有后台服务正在运行，退出工具箱时是否同时关闭这些后台服务？"):
                self.mgr.stop_all()
        self.destroy()


def main():
    app = App()
    app.mainloop()


if __name__ == "__main__":
    main()
