# Thread Field（丝场）— Product Spec

> **Status:** Default UI for TimeLens Ambient (2026-06)  
> **Replaces:** Meniscus 水瓶 / 露珠 / bead / Bento 全屏 Focus（App 入口已切换，旧组件保留为 legacy）

---

## One metaphor

屏幕上一小束 **活着的短丝** — 照你在时间里的状态，也照 Agent 是否听对。不用点开 App，不用水瓶、不用圆点。

---

## States

| Phase | 触发 | 视觉 |
|-------|------|------|
| **Drift** | 默认 | 轻微驻波漂游 |
| **Scatter** | AW 娱乐 / 番茄偏航 | 无理数频比去同步 |
| **Tangle** | `Ctrl+Shift+U` | 结附近缠结 + Fix 面板 |
| **Untangle** | 复制 prompt 后 | 水平亮扫 ~300ms |
| **Align** | 入流 15min+ | 振幅趋同、几乎齐丝 |

---

## Layout（φ 定标）

实现：`src/thread/threadLayout.js`

- `L = min(144, workArea.width / φ²)`，φ ≈ 1.618
- 根数 `n = 5`（宽 < 1400 → 3）
- 左端 **结（anchor）聚合**，丝向右扇形散开；长短 Fib 参差
- Ambient 窗：`宽 L+40`，`高` 由扇形展开 + 波幅余量计算
- 设计参考：`docs/THREAD_DESIGN_REFS.md`

## Bundle strength β（束强度）

实现：`deriveThreadTargets()` → `stepEngine()` → `sampleThreadPoint()`  
Holten 式连续参数：β 越高，丝在结附近收得越紧、梢端才扇开。

| 状态 | β 约 | 视觉 |
|------|------|------|
| Drift | 0.45 | 左结右扇，可数 3–5 根 |
| Cursor 前台 | 0.50 | 略亮、略束 |
| Align 入流 | 0.75 | 梢端趋同 |
| Scatter 偏航 | 0.22–0.32 | 扇形加大、频比去同步 |
| Tangle Fix | 0.88 | 拉回结附近 |
| Untangle | 0.55 | 亮扫后渐回 Drift |

开发调试：浏览器打开 `?threadDebug=1` 显示当前 β。

- Focus（fix）：`高 + L/φ`（≈+168px），**宽不变**
- 位置：工作区 **水平居中**，距顶 `max(12, H×0.012)`

---

## Visibility

| Mode | Opacity | 条件 |
|------|---------|------|
| Ghost | ~0.02 | 窗口 hidden / 需隐身 |
| Breath | 0.04–0.08 | 默认 |
| Present | 0.12–0.25 | Cursor 前台或缠/散 |

Peek 文案只在缝间，≤半行；400ms / 800ms 两级。

---

## Fix 流（Glass Agent 主路径）

1. Agent 做错 → **`Ctrl+Shift+U`** → Tangle + 窗高展开
2. 缝内：错类（六选一）→ 一句话描述 → 边界选项
3. 内嵌 `coach/` → DeepSeek → XML prompt → **主进程剪贴板**
4. Untangle 动画 → 窗收回 → 用户 `Ctrl+V` 到 Agent
5. 同 session `fixRound++`，带「上次未完全生效」上下文

六类 fix：`scope` / `wrong` / `misread` / `plan_drift` / `regression` / `partial`

---

## Architecture

```
electron/main.js     小窗顶中、click-through、热键、coach IPC
electron/coachBridge.mjs
coach/*              从 cursor-prompt-coach 移植
src/thread/*         layout / physics / state
src/components/      ThreadField.jsx, ThreadFocus.jsx
src/store/           useThreadStore.js + useTimeStore (AW)
```

---

## Hotkeys

| 快捷键 | 动作 |
|--------|------|
| `Ctrl+Shift+T` | 显隐丝束 |
| `Ctrl+Shift+U` | 撤步 / Fix（Tangle） |
| `Ctrl+Shift+Q` | 退出 |

---

## Config

项目根 `.env`：

```
DEEPSEEK_API_KEY=sk-...
```

未配置时 Fix 流会提示「未配置 DEEPSEEK_API_KEY」。

---

## Acceptance (MVP)

1. 开机后可见丝在顶中飘动（Breath）
2. bilibili 等 → Scatter 可辨
3. `Ctrl+Shift+U` → 缠 → 2 题+ → 复制 XML → 梳收回
4. 无水瓶、无圆点、无全屏面板
5. Cursor Glass 可用（不装扩展）
6. AW 未连接：仍 Drift，Peek 提示未连接

---

## Legacy

Meniscus / Capsule / BentoBoard 文件仍在仓库，**App 不再引用**。`presentationMode` 默认 `thread`；旧值 `meniscus` 仅 settings 兼容。
