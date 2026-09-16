# Typora 快捷键 → Obsidian 可视化迁移工具

专为 Markdown 重度用户打造的可视化快捷键迁移工具。帮助习惯了 **Typora** 快捷键排版的用户，一键将熟悉的快捷键方案无缝导入到 **Obsidian** 仓库中，消除跨软件编辑的肌肉记忆切换痛苦。

---

## 🌟 核心特性

1. **智能冲突识别分类**：
   - **含义一致/无冲突项**（默认勾选）：例如 `Ctrl+1~6` 对应多级标题、`Alt+Shift+5` 删除线、`Ctrl+Shift+\`` 行内代码、`Ctrl+B` 加粗等，无脑一键导入。
   - **按键冲突项**（醒目黄色提示）：例如 `Ctrl+Shift+K`（Typora 为代码块，Obsidian 默认被占用），明确列出原冲突功能，由用户自主决定是否覆盖。
2. **全自动版本备份保障**：
   - 每次写入前，自动将现有的 `.obsidian/hotkeys.json` 备份至 `.obsidian/hotkeys-backups/` 目录下，并以时间戳命名。
   - 提供“从备份恢复”和“恢复 Obsidian 原生默认”功能，绝对安全无后顾之忧。
3. **直观 GUI 交互**：
   - 支持自动读取或浏览选择任意 Obsidian Vault 库目录。
   - 快捷键列表实时搜索与分类过滤。

---

## 🖥️ 快速使用指南

### 1. 一键运行（免配置环境）
- 双击根目录的 **`run.bat`** 启动。
- 或在打包好的发布版本中双击 **`release\typora-to-obsidian\typora_to_obsidian.exe`**。

### 2. 源码模式启动
```bash
python typora_to_obsidian.py
```

### 3. 操作步骤
1. 点击顶部“浏览”按钮，选择你的 Obsidian 库（Vault）根路径。
2. 程序会自动检测该库下的 `.obsidian/hotkeys.json` 当前配置。
3. 在列表中勾选你希望启用的快捷键映射。
4. 点击底部“🚀 一键导入到 Obsidian”即可完成无缝迁移。
5. 重启或在 Obsidian 中按 `Ctrl+R` 重载即可体验 Typora 般行云流水的输入感受！

---

## 📋 常见快捷键映射对照表

| 按键组合 | Typora 功能 | 对应 Obsidian 命令 ID | 冲突状态 |
| :--- | :--- | :--- | :--- |
| `Ctrl + 1 ~ 6` | 1 ~ 6 级标题 | `editor:set-heading-1 ~ 6` | 默认安全导入 |
| `Ctrl + 0` | 正文段落 | `editor:set-heading-0` | 默认安全导入 |
| `Alt + Shift + 5` | 删除线 | `editor:toggle-strikethrough` | 默认安全导入 |
| `Ctrl + Shift + \`` | 行内代码 | `editor:toggle-code` | 默认安全导入 |
| `Ctrl + K` | 插入超链接 | `editor:insert-link` | 默认安全导入 |
| `Ctrl + Shift + I` | 插入图片 | `editor:insert-embed` | 默认安全导入 |
| `Ctrl + B` | 粗体 | `editor:toggle-bold` | 默认安全导入 |
| `Ctrl + I` | 斜体 | `editor:toggle-italics` | 默认安全导入 |
| `Ctrl + T` | 插入表格 | `table:insert` | 默认安全导入 |
| `Ctrl + Shift + M` | 插入数学公式 | `editor:insert-math` | 默认安全导入 |
| `Ctrl + Shift + K` | 插入代码块 | `editor:insert-codeblock` | ⚠️ 冲突提示 (需手动确认) |
| `Ctrl + D` | 选中当前词 | `editor:select-word` | ⚠️ 冲突提示 (需手动确认) |
