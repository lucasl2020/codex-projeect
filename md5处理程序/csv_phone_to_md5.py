#!/usr/bin/env python3
"""流式处理 CSV：手机号转 MD5 / 删除手机号行，并可按 MD5 或手机号去重。

直接双击或不带参数运行时打开图形界面；带参数运行时使用命令行模式。
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import itertools
import multiprocessing as mp
import os
import re
import sys
from pathlib import Path

MD5_RE = re.compile(r"^[0-9a-fA-F]{32}$")
MOBILE_RE = re.compile(r"^1[3-9]\d{9}$")
DEFAULT_WORKERS = min(8, max(1, (os.cpu_count() or 2) - 1))
FONT_UI = ("Microsoft YaHei UI", 10)
FONT_TITLE = ("Microsoft YaHei UI", 18, "bold")
FONT_SUB = ("Microsoft YaHei UI", 9)
COLOR_BG = "#f4f7fb"
COLOR_CARD = "#ffffff"
COLOR_BORDER = "#d7e0ec"
COLOR_PRIMARY = "#2563eb"
COLOR_PRIMARY_DARK = "#1d4ed8"
COLOR_TEXT = "#0f172a"
COLOR_MUTED = "#64748b"
COLOR_LOG_BG = "#0b1220"
COLOR_LOG_FG = "#e2e8f0"


def normalize_mobile(value: str) -> str | None:
    """返回规范化后的 11 位大陆手机号；不是手机号则返回 None。"""
    mobile = re.sub(r"[\s()-]", "", value.strip())
    if mobile.startswith("+86"):
        mobile = mobile[3:]
    elif mobile.startswith("86") and len(mobile) == 13:
        mobile = mobile[2:]
    return mobile if MOBILE_RE.fullmatch(mobile) else None


def classify_value(value: str) -> tuple[str, str | None]:
    """返回 (kind, normalized)。kind: md5 / phone / other。"""
    text = value.strip()
    if MD5_RE.fullmatch(text):
        return "md5", text.lower()

    mobile = normalize_mobile(value)
    if mobile is not None:
        return "phone", mobile

    return "other", None


def process_batch(
    task: tuple[list[list[str]], int, str],
) -> tuple[list[tuple[list[str], str, str | None]], tuple[int, int, int, int, int]]:
    """处理一批行。

    每条输出记录为 (row, origin_kind, origin_normalized)，便于后续按原始类型去重。
    """
    rows, column_index, action = task
    output_items: list[tuple[list[str], str, str | None]] = []
    converted = deleted = existing_md5 = unchanged = missing_column = 0

    for row in rows:
        if column_index >= len(row):
            missing_column += 1
            output_items.append((row, "other", None))
            continue

        kind, normalized = classify_value(row[column_index])
        if kind == "md5":
            existing_md5 += 1
            output_items.append((row, kind, normalized))
            continue

        if kind == "other":
            unchanged += 1
            output_items.append((row, kind, normalized))
            continue

        assert normalized is not None
        if action == "delete":
            deleted += 1
            continue

        row[column_index] = hashlib.md5(normalized.encode("utf-8")).hexdigest()
        converted += 1
        output_items.append((row, kind, normalized))

    return output_items, (converted, deleted, existing_md5, unchanged, missing_column)


def iter_batches(rows, batch_size: int):
    batch: list[list[str]] = []
    for row in rows:
        batch.append(row)
        if len(batch) >= batch_size:
            yield batch
            batch = []
    if batch:
        yield batch


def resolve_column(column: str, header: list[str] | None) -> int:
    if column.isdigit():
        return int(column)
    if header is None:
        raise ValueError("使用无表头模式时，目标列必须是从 0 开始的列序号")
    try:
        return header.index(column)
    except ValueError as exc:
        raise ValueError(f"找不到列名 {column!r}，现有列：{header}") from exc


def build_dedupe_keys(
    row: list[str],
    column_index: int,
    origin_kind: str,
    origin_normalized: str | None,
    action: str,
    dedupe_md5: bool,
    dedupe_phone: bool,
) -> list[str]:
    keys: list[str] = []
    if origin_kind == "phone" and dedupe_phone and origin_normalized is not None:
        keys.append(f"phone:{origin_normalized}")
    if origin_kind == "md5" and dedupe_md5 and origin_normalized is not None:
        keys.append(f"md5:{origin_normalized}")
    if (
        origin_kind == "phone"
        and action == "convert"
        and dedupe_md5
        and column_index < len(row)
    ):
        keys.append(f"md5:{row[column_index].strip().lower()}")
    return keys


def apply_dedupe(
    items: list[tuple[list[str], str, str | None]],
    column_index: int,
    action: str,
    seen: set[str],
    dedupe_md5: bool,
    dedupe_phone: bool,
) -> tuple[list[list[str]], int, int]:
    if not dedupe_md5 and not dedupe_phone:
        return [row for row, _, _ in items], 0, 0

    kept: list[list[str]] = []
    dropped_md5 = dropped_phone = 0
    for row, origin_kind, origin_normalized in items:
        keys = build_dedupe_keys(
            row,
            column_index,
            origin_kind,
            origin_normalized,
            action,
            dedupe_md5,
            dedupe_phone,
        )
        if not keys:
            kept.append(row)
            continue
        if any(key in seen for key in keys):
            if origin_kind == "phone" and dedupe_phone:
                dropped_phone += 1
            else:
                dropped_md5 += 1
            continue
        seen.update(keys)
        kept.append(row)
    return kept, dropped_md5, dropped_phone


def parse_args(argv=None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="将 CSV 中的手机号转换为 MD5，或删除手机号所在整行；可按 MD5/手机号去重。"
    )
    parser.add_argument("input", type=Path, help="输入 CSV 文件")
    parser.add_argument("output", type=Path, help="输出 CSV 文件")
    parser.add_argument(
        "--column",
        default="0",
        help="要处理的列名或从 0 开始的列序号，默认：0",
    )
    parser.add_argument(
        "--action",
        choices=("convert", "delete"),
        default="convert",
        help="处理方式：convert=转为 MD5，delete=删除手机号整行；默认：convert",
    )
    parser.add_argument(
        "--dedupe-md5",
        action="store_true",
        help="按目标列中的 MD5 去重，仅保留首次出现",
    )
    parser.add_argument(
        "--dedupe-phone",
        action="store_true",
        help="按目标列中的手机号去重，仅保留首次出现",
    )
    parser.add_argument(
        "--no-header",
        action="store_true",
        help="输入文件没有表头；此时 --column 必须使用列序号",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=DEFAULT_WORKERS,
        help=f"工作进程数，默认：{DEFAULT_WORKERS}；设为 1 可禁用多进程",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=50_000,
        help="每批处理的行数，默认：50000",
    )
    parser.add_argument(
        "--encoding",
        default="utf-8-sig",
        help="CSV 编码，默认：utf-8-sig",
    )
    parser.add_argument(
        "--progress-every",
        type=int,
        default=1_000_000,
        help="每处理多少行输出一次进度，默认：1000000；设为 0 可关闭",
    )
    return parser.parse_args(argv)


def run(args: argparse.Namespace) -> None:
    input_path = args.input.resolve()
    output_path = args.output.resolve()

    if input_path == output_path:
        raise ValueError("输入文件和输出文件不能是同一个文件")
    if args.workers < 1:
        raise ValueError("--workers 必须大于等于 1")
    if args.batch_size < 1:
        raise ValueError("--batch-size 必须大于等于 1")
    if args.progress_every < 0:
        raise ValueError("--progress-every 不能小于 0")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = output_path.with_name(output_path.name + ".tmp")
    totals = [0, 0, 0, 0, 0]
    total_rows = 0
    next_progress = args.progress_every or None
    dedupe_md5 = bool(args.dedupe_md5)
    dedupe_phone = bool(args.dedupe_phone)
    seen_keys: set[str] = set()
    dropped_md5 = dropped_phone = 0

    try:
        with (
            input_path.open("r", encoding=args.encoding, newline="") as source,
            temp_path.open("w", encoding=args.encoding, newline="") as target,
        ):
            reader = csv.reader(source)
            writer = csv.writer(target)

            first_row = next(reader, None)
            if first_row is None:
                column_index = resolve_column(args.column, None)
                rows = iter(())
            elif args.no_header:
                column_index = resolve_column(args.column, None)
                rows = itertools.chain([first_row], reader)
            else:
                column_index = resolve_column(args.column, first_row)
                writer.writerow(first_row)
                rows = reader

            tasks = (
                (batch, column_index, args.action)
                for batch in iter_batches(rows, args.batch_size)
            )

            if args.workers == 1:
                results = map(process_batch, tasks)
                pool = None
            else:
                pool = mp.Pool(processes=args.workers)
                # imap 按输入顺序返回每批结果，输出行顺序不会改变。
                results = pool.imap(process_batch, tasks, chunksize=1)

            try:
                for processed_items, counts in results:
                    if dedupe_md5 or dedupe_phone:
                        processed_rows, batch_drop_md5, batch_drop_phone = apply_dedupe(
                            processed_items,
                            column_index,
                            args.action,
                            seen_keys,
                            dedupe_md5,
                            dedupe_phone,
                        )
                        dropped_md5 += batch_drop_md5
                        dropped_phone += batch_drop_phone
                    else:
                        processed_rows = [row for row, _, _ in processed_items]

                    writer.writerows(processed_rows)
                    total_rows += sum(counts)
                    totals = [a + b for a, b in zip(totals, counts)]
                    if next_progress is not None and total_rows >= next_progress:
                        print(f"已处理 {total_rows:,} 行...", flush=True)
                        next_progress += args.progress_every
            except Exception:
                if pool is not None:
                    pool.terminate()
                    pool.join()
                raise
            else:
                if pool is not None:
                    pool.close()
                    pool.join()

        temp_path.replace(output_path)
    except Exception:
        temp_path.unlink(missing_ok=True)
        raise

    converted, deleted, existing_md5, unchanged, missing_column = totals
    output_rows = total_rows - deleted - dropped_md5 - dropped_phone
    print(f"完成，共处理 {total_rows:,} 行：")
    print(f"  手机号转 MD5：{converted:,}")
    print(f"  删除手机号行：{deleted:,}")
    print(f"  已有 MD5 并保留：{existing_md5:,}")
    print(f"  未识别并保留：{unchanged:,}")
    print(f"  缺少目标列并保留：{missing_column:,}")
    print(f"  去重删除 MD5：{dropped_md5:,}")
    print(f"  去重删除手机号：{dropped_phone:,}")
    print(f"  输出数据行：{output_rows:,}")
    print(f"输出文件：{output_path}", flush=True)


def launch_gui() -> None:
    """打开无需第三方依赖的 Tkinter 桌面界面。"""
    import queue
    import subprocess
    import threading
    import tkinter as tk
    from tkinter import filedialog, messagebox, ttk

    root = tk.Tk()
    root.title("CSV 手机号处理工具")
    root.geometry("920x780")
    root.minsize(860, 700)
    root.configure(bg=COLOR_BG)

    input_var = tk.StringVar()
    output_var = tk.StringVar()
    column_var = tk.StringVar(value="0")
    header_var = tk.BooleanVar(value=True)
    action_var = tk.StringVar(value="convert")
    dedupe_md5_var = tk.BooleanVar(value=False)
    dedupe_phone_var = tk.BooleanVar(value=False)
    encoding_var = tk.StringVar(value="utf-8-sig")
    workers_var = tk.StringVar(value=str(DEFAULT_WORKERS))
    batch_var = tk.StringVar(value="50000")
    status_var = tk.StringVar(value="请选择输入 CSV 文件")
    rows_var = tk.StringVar(value="已处理：0 行")
    events: queue.Queue = queue.Queue()
    current_process = {"value": None}

    style = ttk.Style(root)
    # Windows ??????? ??clam ??????????? ??
    for theme_name in ("vista", "xpnative", "winnative", "default"):
        if theme_name in style.theme_names():
            try:
                style.theme_use(theme_name)
                break
            except tk.TclError:
                continue

    style.configure("App.TFrame", background=COLOR_BG)
    style.configure("Card.TFrame", background=COLOR_CARD)
    style.configure("Card.TLabelframe", background=COLOR_CARD)
    style.configure(
        "Card.TLabelframe.Label",
        background=COLOR_CARD,
        foreground=COLOR_TEXT,
        font=("Microsoft YaHei UI", 11, "bold"),
    )
    style.configure("Title.TLabel", background=COLOR_BG, foreground=COLOR_TEXT, font=FONT_TITLE)
    style.configure("Subtitle.TLabel", background=COLOR_BG, foreground=COLOR_MUTED, font=FONT_SUB)
    style.configure("Card.TLabel", background=COLOR_CARD, foreground=COLOR_TEXT, font=FONT_UI)
    style.configure("Hint.TLabel", background=COLOR_CARD, foreground=COLOR_MUTED, font=FONT_SUB)
    style.configure("Status.TLabel", background=COLOR_CARD, foreground=COLOR_TEXT, font=FONT_UI)
    style.configure("Meta.TLabel", background=COLOR_CARD, foreground=COLOR_MUTED, font=FONT_SUB)
    style.configure("TCheckbutton", background=COLOR_CARD, foreground=COLOR_TEXT, font=FONT_UI)
    style.configure("TRadiobutton", background=COLOR_CARD, foreground=COLOR_TEXT, font=FONT_UI)
    style.map(
        "TCheckbutton",
        background=[("active", COLOR_CARD), ("selected", COLOR_CARD)],
        foreground=[("disabled", COLOR_MUTED)],
    )
    style.map(
        "TRadiobutton",
        background=[("active", COLOR_CARD), ("selected", COLOR_CARD)],
        foreground=[("disabled", COLOR_MUTED)],
    )
    style.configure("TEntry", fieldbackground="#ffffff", foreground=COLOR_TEXT)
    style.configure("TCombobox", fieldbackground="#ffffff", foreground=COLOR_TEXT)
    style.configure(
        "Primary.TButton",
        font=("Microsoft YaHei UI", 11, "bold"),
        padding=(18, 10),
    )
    style.configure(
        "Ghost.TButton",
        font=FONT_UI,
        padding=(10, 6),
    )
    style.configure("Horizontal.TProgressbar", troughcolor="#e2e8f0", background=COLOR_PRIMARY)

    container = ttk.Frame(root, style="App.TFrame", padding=18)
    container.pack(fill="both", expand=True)
    container.columnconfigure(0, weight=1)
    container.rowconfigure(3, weight=1)

    header = ttk.Frame(container, style="App.TFrame")
    header.grid(row=0, column=0, sticky="ew", pady=(0, 12))
    ttk.Label(header, text="CSV 手机号处理工具", style="Title.TLabel").grid(
        row=0, column=0, sticky="w"
    )
    ttk.Label(
        header,
        text="支持手机号转 MD5、删除手机号行，以及按 MD5 / 手机号去重。输出顺序与原文件一致。",
        style="Subtitle.TLabel",
    ).grid(row=1, column=0, sticky="w", pady=(4, 0))

    files = ttk.LabelFrame(container, text=" 1. 文件 ", style="Card.TLabelframe", padding=14)
    files.grid(row=1, column=0, sticky="ew")
    files.columnconfigure(1, weight=1)

    ttk.Label(files, text="输入 CSV", style="Card.TLabel").grid(row=0, column=0, sticky="w", pady=6)
    input_entry = ttk.Entry(files, textvariable=input_var)
    input_entry.grid(row=0, column=1, sticky="ew", padx=10, pady=6)

    ttk.Label(files, text="输出 CSV", style="Card.TLabel").grid(row=1, column=0, sticky="w", pady=6)
    output_entry = ttk.Entry(files, textvariable=output_var)
    output_entry.grid(row=1, column=1, sticky="ew", padx=10, pady=6)

    settings = ttk.LabelFrame(container, text=" 2. 处理设置 ", style="Card.TLabelframe", padding=14)
    settings.grid(row=2, column=0, sticky="ew", pady=12)
    for col in (1, 3):
        settings.columnconfigure(col, weight=1)

    header_check = ttk.Checkbutton(settings, text="CSV 第一行是表头", variable=header_var)
    header_check.grid(row=0, column=0, columnspan=2, sticky="w", pady=(0, 8))

    ttk.Label(settings, text="处理方式", style="Card.TLabel").grid(row=1, column=0, sticky="w", pady=6)
    action_box = ttk.Frame(settings, style="Card.TFrame")
    action_box.grid(row=1, column=1, columnspan=3, sticky="w", padx=8, pady=6)
    ttk.Radiobutton(
        action_box,
        text="手机号转为 MD5",
        variable=action_var,
        value="convert",
    ).pack(side="left", padx=(0, 18))
    ttk.Radiobutton(
        action_box,
        text="删除手机号所在整行",
        variable=action_var,
        value="delete",
    ).pack(side="left")

    ttk.Label(settings, text="去重选项", style="Card.TLabel").grid(row=2, column=0, sticky="w", pady=6)
    dedupe_box = ttk.Frame(settings, style="Card.TFrame")
    dedupe_box.grid(row=2, column=1, columnspan=3, sticky="w", padx=8, pady=6)
    ttk.Checkbutton(dedupe_box, text="按 MD5 去重", variable=dedupe_md5_var).pack(
        side="left", padx=(0, 18)
    )
    ttk.Checkbutton(dedupe_box, text="按手机号去重", variable=dedupe_phone_var).pack(side="left")

    ttk.Label(settings, text="目标列", style="Card.TLabel").grid(row=3, column=0, sticky="w", pady=6)
    column_combo = ttk.Combobox(settings, textvariable=column_var)
    column_combo.grid(row=3, column=1, sticky="ew", padx=(8, 18), pady=6)

    ttk.Label(settings, text="文件编码", style="Card.TLabel").grid(row=3, column=2, sticky="w", pady=6)
    encoding_combo = ttk.Combobox(
        settings,
        textvariable=encoding_var,
        values=("utf-8-sig", "utf-8", "gb18030", "gbk"),
        state="readonly",
        width=14,
    )
    encoding_combo.grid(row=3, column=3, sticky="ew", padx=8, pady=6)

    ttk.Label(settings, text="进程数", style="Card.TLabel").grid(row=4, column=0, sticky="w", pady=6)
    workers_spin = ttk.Spinbox(settings, from_=1, to=128, textvariable=workers_var)
    workers_spin.grid(row=4, column=1, sticky="ew", padx=(8, 18), pady=6)

    ttk.Label(settings, text="每批行数", style="Card.TLabel").grid(row=4, column=2, sticky="w", pady=6)
    batch_entry = ttk.Entry(settings, textvariable=batch_var)
    batch_entry.grid(row=4, column=3, sticky="ew", padx=8, pady=6)

    ttk.Label(
        settings,
        text="可单独或同时勾选去重；去重基于原始值，仅保留首次出现，顺序不变。",
        style="Hint.TLabel",
    ).grid(row=5, column=0, columnspan=4, sticky="w", pady=(8, 0))

    progress_frame = ttk.LabelFrame(
        container, text=" 3. 运行状态 ", style="Card.TLabelframe", padding=14
    )
    progress_frame.grid(row=3, column=0, sticky="nsew")
    progress_frame.columnconfigure(0, weight=1)
    progress_frame.rowconfigure(2, weight=1)

    status_row = ttk.Frame(progress_frame, style="Card.TFrame")
    status_row.grid(row=0, column=0, sticky="ew")
    status_row.columnconfigure(0, weight=1)
    ttk.Label(status_row, textvariable=status_var, style="Status.TLabel").grid(
        row=0, column=0, sticky="w"
    )
    ttk.Label(status_row, textvariable=rows_var, style="Meta.TLabel").grid(
        row=0, column=1, sticky="e"
    )

    progress = ttk.Progressbar(progress_frame, mode="indeterminate")
    progress.grid(row=1, column=0, sticky="ew", pady=10)

    log_frame = ttk.Frame(progress_frame, style="Card.TFrame")
    log_frame.grid(row=2, column=0, sticky="nsew")
    log_frame.columnconfigure(0, weight=1)
    log_frame.rowconfigure(0, weight=1)
    log_text = tk.Text(
        log_frame,
        height=12,
        wrap="word",
        state="disabled",
        bg=COLOR_LOG_BG,
        fg=COLOR_LOG_FG,
        insertbackground=COLOR_LOG_FG,
        relief="flat",
        borderwidth=0,
        font=("Consolas", 10),
        padx=10,
        pady=10,
    )
    log_text.grid(row=0, column=0, sticky="nsew")
    scrollbar = ttk.Scrollbar(log_frame, orient="vertical", command=log_text.yview)
    scrollbar.grid(row=0, column=1, sticky="ns")
    log_text.configure(yscrollcommand=scrollbar.set)

    buttons = ttk.Frame(container, style="App.TFrame")
    buttons.grid(row=4, column=0, sticky="e", pady=(14, 0))

    def append_log(text: str) -> None:
        log_text.configure(state="normal")
        log_text.insert("end", text)
        log_text.see("end")
        log_text.configure(state="disabled")

    def read_columns(show_error: bool = True) -> None:
        path = Path(input_var.get().strip())
        if not path.is_file():
            return
        if not header_var.get():
            column_combo.configure(values=tuple(str(i) for i in range(20)))
            column_var.set("0")
            return
        try:
            with path.open("r", encoding=encoding_var.get(), newline="") as source:
                header = next(csv.reader(source), None)
            if header is None:
                raise ValueError("CSV 文件为空")
            choices = tuple(f"{index}: {name}" for index, name in enumerate(header))
            column_combo.configure(values=choices)
            column_var.set(choices[0] if choices else "0")
            status_var.set(f"已读取 {len(header)} 个列名，请选择目标列")
        except (OSError, UnicodeError, csv.Error, ValueError) as exc:
            if show_error:
                messagebox.showerror("读取失败", f"无法读取 CSV 表头：\n{exc}")

    def choose_input() -> None:
        path = filedialog.askopenfilename(
            title="选择输入 CSV",
            filetypes=(("CSV 文件", "*.csv"), ("所有文件", "*.*")),
        )
        if not path:
            return
        input_var.set(path)
        input_path = Path(path)
        output_var.set(str(input_path.with_name(input_path.stem + "_result.csv")))
        read_columns()

    def choose_output() -> None:
        path = filedialog.asksaveasfilename(
            title="选择输出 CSV",
            defaultextension=".csv",
            filetypes=(("CSV 文件", "*.csv"), ("所有文件", "*.*")),
        )
        if path:
            output_var.set(path)

    def selected_column() -> str:
        value = column_var.get().strip()
        prefix, separator, _ = value.partition(":")
        return prefix.strip() if separator and prefix.strip().isdigit() else value

    def set_running(running: bool) -> None:
        start_button.configure(state="disabled" if running else "normal")
        if running:
            progress.start(12)
        else:
            progress.stop()

    def read_process_output(process) -> None:
        try:
            assert process.stdout is not None
            for line in process.stdout:
                events.put(("log", line))
            events.put(("done", process.wait()))
        except Exception as exc:
            events.put(("error", str(exc)))

    def start_processing() -> None:
        input_text = input_var.get().strip()
        output_text = output_var.get().strip()
        column = selected_column()

        try:
            input_path = Path(input_text).resolve()
            output_path = Path(output_text).resolve()
            workers = int(workers_var.get())
            batch_size = int(batch_var.get())
            if not input_path.is_file():
                raise ValueError("请选择有效的输入 CSV 文件")
            if not output_text:
                raise ValueError("请选择输出 CSV 文件")
            if input_path == output_path:
                raise ValueError("输入文件和输出文件不能相同")
            if not column:
                raise ValueError("请选择目标列")
            if workers < 1:
                raise ValueError("进程数必须大于等于 1")
            if batch_size < 1:
                raise ValueError("每批行数必须大于等于 1")
        except ValueError as exc:
            messagebox.showwarning("参数有误", str(exc))
            return

        python_executable = Path(sys.executable)
        console_python = python_executable.with_name("python.exe")
        if python_executable.name.lower() == "pythonw.exe" and console_python.exists():
            python_executable = console_python

        command = [
            str(python_executable),
            str(Path(__file__).resolve()),
            str(input_path),
            str(output_path),
            "--column",
            column,
            "--action",
            action_var.get(),
            "--workers",
            str(workers),
            "--batch-size",
            str(batch_size),
            "--encoding",
            encoding_var.get(),
            "--progress-every",
            str(max(10_000, min(batch_size, 100_000))),
        ]
        if not header_var.get():
            command.append("--no-header")
        if dedupe_md5_var.get():
            command.append("--dedupe-md5")
        if dedupe_phone_var.get():
            command.append("--dedupe-phone")

        env = os.environ.copy()
        env["PYTHONIOENCODING"] = "utf-8"
        env["PYTHONUTF8"] = "1"

        try:
            process = subprocess.Popen(
                command,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                encoding="utf-8",
                errors="replace",
                bufsize=1,
                env=env,
                creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
            )
        except OSError as exc:
            messagebox.showerror("启动失败", str(exc))
            return

        current_process["value"] = process
        log_text.configure(state="normal")
        log_text.delete("1.0", "end")
        log_text.configure(state="disabled")
        status_var.set("正在处理，请勿关闭窗口……")
        rows_var.set("已处理：0 行")
        action_text = "删除手机号所在整行" if action_var.get() == "delete" else "手机号转为 MD5"
        dedupe_parts = []
        if dedupe_md5_var.get():
            dedupe_parts.append("MD5")
        if dedupe_phone_var.get():
            dedupe_parts.append("手机号")
        dedupe_text = "、".join(dedupe_parts) if dedupe_parts else "关闭"
        append_log(
            f"输入：{input_path}\n输出：{output_path}\n处理方式：{action_text}\n去重：{dedupe_text}\n\n"
        )
        set_running(True)
        threading.Thread(
            target=read_process_output,
            args=(process,),
            daemon=True,
        ).start()

    def poll_events() -> None:
        try:
            while True:
                kind, value = events.get_nowait()
                if kind == "log":
                    append_log(value)
                    match = re.search(r"(?:已处理|完成，共处理) ([\d,]+) 行", value)
                    if match:
                        rows_var.set(f"已处理：{match.group(1)} 行")
                elif kind == "done":
                    current_process["value"] = None
                    set_running(False)
                    if value == 0:
                        status_var.set("处理完成，输出文件已生成")
                        messagebox.showinfo("处理完成", "CSV 已处理完成。")
                    else:
                        status_var.set("处理失败，请查看运行日志")
                        messagebox.showerror("处理失败", "请查看界面中的运行日志。")
                elif kind == "error":
                    current_process["value"] = None
                    set_running(False)
                    status_var.set("读取运行结果失败")
                    append_log(f"\n错误：{value}\n")
        except queue.Empty:
            pass
        root.after(100, poll_events)

    def on_close() -> None:
        process = current_process["value"]
        if process is not None and process.poll() is None:
            if not messagebox.askyesno("任务正在运行", "任务尚未完成，确定退出吗？"):
                return
            process.terminate()
        root.destroy()

    ttk.Button(files, text="浏览…", style="Ghost.TButton", command=choose_input).grid(
        row=0, column=2, pady=6
    )
    ttk.Button(files, text="浏览…", style="Ghost.TButton", command=choose_output).grid(
        row=1, column=2, pady=6
    )
    ttk.Button(
        settings, text="重新读取列名", style="Ghost.TButton", command=read_columns
    ).grid(row=0, column=3, sticky="e", padx=8, pady=(0, 8))
    header_check.configure(command=read_columns)
    encoding_combo.bind("<<ComboboxSelected>>", lambda _event: read_columns(False))

    start_button = ttk.Button(
        buttons, text="开始处理", style="Primary.TButton", command=start_processing
    )
    start_button.pack(side="right")

    root.protocol("WM_DELETE_WINDOW", on_close)
    root.after(100, poll_events)
    root.mainloop()


def main() -> None:
    if len(sys.argv) == 1 or sys.argv[1:] == ["--gui"]:
        launch_gui()
        return

    try:
        run(parse_args())
    except (OSError, UnicodeError, csv.Error, ValueError) as exc:
        print(f"错误：{exc}", file=sys.stderr, flush=True)
        raise SystemExit(1)


if __name__ == "__main__":
    mp.freeze_support()
    main()
