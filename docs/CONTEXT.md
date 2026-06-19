# TimeLens Ambient — Full Project Context

> **Purpose of this document:** Give any AI assistant (Claude, Cursor Agent, etc.) complete, accurate context about the product, design, architecture, and current state. Read this before changing UI, interaction, copy, or features.
>
> **Owner:** College student (CHEN-taeo). Assume limited prior context; explain non-obviously. Silence ≠ understanding.
>
> **Repo:** https://github.com/CHEN-taeo/timelens-ambient  
> **Version:** 0.1.0 (MVP / Stage 1)  
> **Last updated:** 2026-06-16

---

## 1. One-sentence summary

**TimeLens Ambient** is a local-only, always-on **desktop time mirror** — a small glass capsule on screen that reads ActivityWatch, classifies what you are doing, and quietly reflects it back (Meniscus liquid UI + optional Pomodoro), without feeling like a tracker app or dashboard.

---

## 2. What it is NOT vs what it IS

| NOT | IS |
|-----|-----|
| Time-tracking SaaS / dashboard you open in a browser | Ambient HUD glued to the desktop edge |
| Efficiency police / guilt machine | **Warm Restraint** mirror — short, honest, undo-friendly |
| Black-box AI classifier | Rule-based categories with **「因为：…」** explainability |
| Hover-to-open full panel (old idea) | **Peek on hover, Focus on click** (proxemics) |
| Login / cloud / sync (MVP) | All data local; ActivityWatch + localStorage |

**North star (brand):**

> 让用户更像自己，而不是更强烈地意识到有个 App 在监视自己。

English: *Help the user feel more like themselves, not more watched by an app.*

---

## 3. Product evolution (how we got here)

Understanding the history prevents regressions (e.g. re-introducing hover-expand or dashboard KPIs).

1. **ActivityWatch HTML dashboard** — Full charts/cards; user wanted **glanceable, on-screen** presence, not “open browser to see stats.”
2. **Floating HUD capsule** — Electron ghost window, Obsidian Dark glass, Dynamic Island inspiration.
3. **Proxemics protocol** — Ambient / Peek (400ms) / Peek+ (800ms) / Focus (click). **Hover must never open the full Bento panel.**
4. **Science layer** — Dead reckoning color, OODA intent pre-fill, flow dimming, peak-end moments, temporal landmarks (`docs/TIMELENS-SCIENCE.md`).
5. **Meniscus signature (2026 design conference)** — Replace “committee of 8 UI directions” with **one geometric primitive**: glass vessel + liquid level + meniscus curve + tension bead (●) + 1px horizon line.
6. **Dual-channel color** — Liquid hue = **current category**; top horizon line = **dead reckoning / day voyage** (not the same color).
7. **Gravity Pour** — Click Focus triggers ~480ms pour animation (liquid grows downward into Bento), not window teleport.
8. **Redesign v2 (planned, partial)** — Bento should become semantic **现在 / 航程 / 番茄 / 主线** instead of dashboard stats (专注/娱乐/节奏%).

---

## 4. The Meniscus signature (five-year product identity)

The default presentation mode is **`meniscus`**. This is the intended long-term visual identity.

```
┌─────────────────────────────────────────────────────────┐
│  Horizon 1px ── dead reckoning color (day voyage)        │
│  ╭──────────────────────────────────────╮               │
│  │ Liquid fill height ── work-day progress │  glass vessel│
│  │ ~~~ meniscus curve + tension bead ● ~~~│               │
│  ╰──────────────────────────────────────╯               │
│  Liquid hue ── current ActivityWatch category             │
└─────────────────────────────────────────────────────────┘
```

**Legacy modes** (still in code, demoted in settings UI): `lens-ring`, `standard`, `horizon`, `minimal`. Do not treat Lens Ring as product identity.

**Key files:** `MeniscusVessel.jsx`, `meniscusGeometry.js`, `meniscusPhysics.js`, `GravityPour.jsx`, `meniscusPourGeometry.js`

---

## 5. Interaction states (state machine)

| State | Trigger | Window | Liquid / visual | Text |
|-------|---------|--------|-----------------|------|
| **Minimal** | Flow 15+ min same productive app | Fixed 168×36 | Shrinks to breathing ● | None |
| **Ambient** | Default | Fixed 168×36 | Narrow liquid ~92px, quiet opacity | **Zero text** (Meniscus) |
| **Peek** | Hover 400ms | No resize | Wet ~108px, meniscus tilts toward cursor | `编程 · 43m` |
| **Peek+** | Hover 800ms | No resize | Wet ~136px | + app name / session duration |
| **Focus** | Click pill | 320×236 expanded | Gravity Pour 480ms → Bento | 2×2 embedded panel |
| **Settle** | After work-day end (settings) | Fading | Empty glass + crystal on horizon | Farewell line (planned) |

**Rules (non-negotiable):**

- Hover **never** opens full Bento.
- Click opens Focus (200ms Ma pause, then pour for Meniscus).
- Drag only via dedicated **`⋮` handle** — not whole pill (`-webkit-app-region: drag` on click area breaks clicks).
- Esc / ✕ / click-outside (expanded overlay) collapses Focus.
- Avoid resizing Electron window during hover peek (causes mouse loss); inner liquid width animates instead.

**Ma timings:**

| Moment | Delay |
|--------|-------|
| Hover → Peek | 400ms |
| Hover → Peek+ | 800ms |
| Click → Focus expand | 200ms then pour |
| Bento layer stagger | 0 / 80 / 160 / 240ms |
| Pomodoro deviation warning | ≥90s continuous off-task |
| Pomodoro auto-fail | ≥5min continuous off-task |

**Spring reference:** `stiffness: 280–300, damping: 22–28`

---

## 6. Focus panel (Bento) — current vs target

### Current implementation (`BentoBoard.jsx`, `embedded=true`)

- Top: disclosure label + weather + ⚙ 校准
- Optional mainline strip
- Row: `DeadReckoningBar` | stats grid (专注 / 娱乐 / 节奏%)
- Row: current app + classify correction | Pomodoro (OODA intent + ring)

### Target redesign v2 (agreed direction, not fully built)

Four semantic quadrants — **mirror, not dashboard**:

| Quadrant | Content |
|----------|---------|
| **现在** | Current app, session duration, `因为：…`, undo reclassify |
| **航程** | Day strip + voyage copy (vs yesterday / goal), **no「节奏%」** |
| **番茄** | OODA pre-filled intent, timer, gentle `有点偏航` |
| **主线** | One daily mainline sentence + progress |

---

## 7. Design tokens (Obsidian Dark · Warm Restraint)

```css
--bg-canvas:    #07080C;
--bg-glass:     rgba(13, 13, 20, 0.82);
--blur:         blur(20px) saturate(180%);
--border:       rgba(255, 255, 255, 0.08);
--accent:       #7C3AED;   /* use <10% — ● accent + top edge only */
```

**Typography:** Inter (UI) + JetBrains Mono (`tabular-nums` for time).

**Compact dimensions (Meniscus):**

| Constant | Value | File |
|----------|-------|------|
| Window width | 168px | `capsuleLayout.js` `MENISCUS_W` |
| Pill height | 36px | `PILL_H` |
| Liquid ambient | 92px | `MENISCUS_LIQUID_AMBIENT` |
| Liquid hover | 108px | `MENISCUS_LIQUID_HOVER` |
| Liquid peek | 122px | `MENISCUS_LIQUID_PEEK` |
| Liquid peek+ | 136px | `MENISCUS_LIQUID_PEEK_PLUS` |
| Expanded | 320×236 | `EXPANDED_W`, `EXPANDED_H` |

**Category colors** (`rules.js` → `CATEGORIES`):

| Key | Label | Color | Productive |
|-----|-------|-------|------------|
| project | 项目开发 | #6EE7B7 | yes |
| coding | 编程开发 | #818CF8 | yes |
| learning | 学习资料 | #FCD34D | yes |
| ai | AI 工具 | #67E8F9 | yes |
| comms | 沟通协作 | #F9A8D4 | no |
| entertainment | 娱乐摸鱼 | #FCA5A5 | no |
| neutral | 系统/其他 | #A0A0B8 | no |
| idle | 空闲 | #505068 | no |

**Dead reckoning colors** (`deadReckoning.js`) — for **horizon / ● in legacy modes**:

| Condition | Color |
|-----------|-------|
| Morning | #4A7CFF |
| Midday | #90A8FF → #F0A030 |
| Afternoon | #C07018 |
| Goal reached (≥88% productive goal) | #30B060 |
| Flow (15+ min same productive app) | #3A3A52 |

---

## 8. Copy & tone (镜子，不是法官)

| Scene | Preferred | Avoid |
|-------|-----------|-------|
| Off-task during pomodoro | `有点偏航 · 2min` | `偏离` / `摸鱼` / modal |
| Flow peek | `已入流 · 43m` | — |
| Pomodoro interrupt | Toast + `撤销 5s` | Confirm dialog |
| Classification | `因为：bilibili.com · 规则 #7` | Black-box AI |
| Settings | `校准 TimeLens` | `个性化` |
| Day end (Settle, planned) | Concrete farewell with hours + mainline | Efficiency score |

---

## 9. Three-layer product stack

```
Layer 1 — 感知 (ActivityWatch)     Real behavior, no judgment
Layer 2 — 意图 (mainline + Pomodoro + Calendar*)  Plan vs reality
Layer 3 — 镜子 (explain + peak-end + Ma)          Help user see themselves

* Google Calendar = Stage 2, not in MVP
```

---

## 10. Peak-end moments (only two peaks worth polishing)

### Peak 1 — 被看见 (Seen)

System accurately reflects: app + duration + intent. One light line, not a notification.

Example: `TimeLens 设计 · 已 36min` or Peek line with category.

### Peak 2 — 完整的一轮 (Complete pomodoro)

300ms pause → capsule pulse → `+1 🍅 · 完整 · 25min` → 5s undo.

### End — 告别 (Settle)

After work-day end: specific warm line, stop refreshing, ● slow breathing / empty glass.

Example: `今天主线 62%，编程 4h12m，比昨天多 42min。晚安。`

---

## 11. Science-backed behaviors

See `docs/TIMELENS-SCIENCE.md` for citations.

| Mechanism | Implementation |
|-----------|----------------|
| Pre-attentive color (dead reckoning) | `deadReckoning.js`, horizon line, legacy `GlowIndicator` |
| OODA Orient (pre-fill pomodoro intent) | `oodaIntent.js` → BentoBoard |
| Flow dimming (~22% opacity) | `isFlowState()` → Capsule |
| Progressive disclosure (day1/week1/month1) | `disclosure.js` |
| Temporal landmark pulse | `sounds.js` `checkTemporalLandmark()` |
| Signature sounds (opt-in, default off) | confirm / complete / landmark → `sounds.js` |

---

## 12. Technical stack

| Layer | Technology |
|-------|------------|
| Shell | Electron 32 — transparent, frameless, always-on-top, skipTaskbar, system tray |
| UI | React 18, Vite 5, Tailwind CSS 3 |
| Motion | Framer Motion 11 — spring, pour, peek text surface |
| State | Zustand 4 — `useTimeStore`, `useSettingsStore` |
| Data source | ActivityWatch REST `http://localhost:5600` |
| Persistence | localStorage (`timelens-settings`, overrides, disclosure tier) |

**Prerequisites:**

1. ActivityWatch running (`aw-server` on port 5600)
2. `aw-server.toml`: `cors_origins = "*"`
3. Node.js 18+

**Commands:**

```bash
npm install
npm run dev          # Vite + Electron (auto port fallback 5173–5177)
npm run dev:clean    # Kill dev ports
npm run build        # → dist/
npm run start        # Electron production
```

**Hotkeys (Electron):** `Ctrl+Shift+T` show/hide · `Ctrl+Shift+Q` quit

**Dev note:** After `electron/main.js` changes, restart Electron. Vite HMR handles renderer.

---

## 13. Repository layout

```
timelens-ambient/
├── electron/
│   ├── main.js          Ghost window, tray, IPC, expanded overlay mode
│   └── preload.js       timelens.* bridge (fitWindow, setWindowMode, sounds)
├── scripts/
│   └── wait-dev-server.mjs   Waits for .dev-server-port before Electron
├── src/
│   ├── App.jsx          AW poll 5s, totals 30s, pomodoro tick 1s
│   ├── components/
│   │   ├── Capsule.jsx           State machine, Meniscus, Pour, peek/focus
│   │   ├── MeniscusVessel.jsx      SVG liquid, optics, physics
│   │   ├── GravityPour.jsx       Focus expand pour overlay
│   │   ├── BentoBoard.jsx        Expanded 2×2 + full panel + Settings
│   │   ├── SettingsPanel.jsx     校准 TimeLens
│   │   ├── PomodoroRing.jsx
│   │   ├── GlowIndicator.jsx     Legacy ● indicator
│   │   ├── LensRing.jsx          Legacy alternate presentation
│   │   ├── DeadReckoningBar.jsx
│   │   └── PeakToast.jsx         Undo toasts
│   ├── store/
│   │   ├── awService.js          ActivityWatch API client
│   │   ├── useTimeStore.js       Activity + pomodoro state machine
│   │   └── useSettingsStore.js   Settings hydrate/patch
│   └── utils/
│       ├── rules.js              Classification + user overrides
│       ├── deadReckoning.js      Day voyage color + flow detection
│       ├── oodaIntent.js         Pomodoro intent suggestion
│       ├── settings.js           Defaults + work day + settle
│       ├── capsuleLayout.js      Window/liquid dimensions
│       ├── meniscusGeometry.js   SVG path math + wetBias
│       ├── meniscusPhysics.js    Viscosity profiles (ambient/flow/warning/entertainment)
│       ├── meniscusPourGeometry.js  POUR_DURATION_MS=480
│       ├── disclosure.js         Progressive UI tiers
│       └── sounds.js             Optional Ma sounds
├── docs/
│   ├── CONTEXT.md         ← this file
│   ├── TIMELENS-BRAND.md  Design north star (some dims outdated — see §16)
│   └── TIMELENS-SCIENCE.md Science reference
├── vite.config.mjs        Dev port plugin, host 127.0.0.1
└── .cursor/rules/         timelens-brand.mdc, user-collaboration.mdc (local)
```

---

## 14. Data flow

```
ActivityWatch (localhost:5600)
    │
    ├─ getCurrentActivity() every 5s ──► current window (app, title, startedAt)
    │                                      │
    │                                      ▼
    │                                 rules.js categorizeDetailed()
    │                                 (+ user overrides in localStorage)
    │                                      │
    ├─ getTodayTotals() every 30s ────────┼──► useTimeStore (Zustand)
    └─ getDayStrip() ─────────────────────┘         │
                                                   ▼
                                            Capsule.jsx
                                              ├─ MeniscusVessel (liquid + horizon)
                                              ├─ deadReckoning() → horizonHue
                                              ├─ cat.color → liquidHue
                                              └─ BentoBoard when Focus

Pomodoro tick (1s) in useTimeStore:
  - Countdown, pause/resume/stop
  - Watch current category during focus → warning at 90s, fail at 300s off-task
  - complete → PeakToast with undo
```

---

## 15. Settings (localStorage `timelens-settings`)

| Field | Default | Purpose |
|-------|---------|---------|
| presentationMode | `meniscus` | UI signature |
| dailyPomodoroGoal | 6 | 🍅 target |
| productiveGoalHours | 4 | DR goal band |
| workDayStart/End | 09:00–18:00 | Fill % + Settle |
| pomodoroFocusMin | 25 | Focus duration |
| mainline | '' | Daily one-line intent (resets daily) |

User classification overrides: `rules.js` loadOverrides / addOverride / removeOverride.

---

## 16. Implementation status vs docs (important for AI)

| Topic | Code truth | Doc drift |
|-------|------------|-----------|
| Pill height | 36px | `TIMELENS-BRAND.md` still says 32px |
| Default UI | Meniscus | README still mentions hover-expand dashboard |
| Color model | Dual channel (liquid=cat, horizon=DR) | Brand checklist says ● = DR only |
| Bento content | Dashboard stats | Redesign v2 = 现在/航程/番茄/主线 |
| Gravity Pour | Forward pour on open | Reverse pour on close **not done** |
| Settle emotion | Partial (empty glass SVG) | Full evaporation + farewell **not done** |
| Google Calendar | Not implemented | Stage 2 roadmap |
| Lens Ring | In code, hidden from settings picker | Demoted |

**When editing:** Prefer aligning code + `TIMELENS-BRAND.md` + README together.

---

## 17. Roadmap

| Stage | Scope |
|-------|-------|
| **1 (current MVP)** | AW capsule, Meniscus, Peek/Focus, Pomodoro + deviation, rules + undo, settings, GitHub publish |
| **1.5 (next polish)** | Bento v2 semantics, Pour reverse, Settle farewell, brand doc sync |
| **2** | Google Calendar light collision (amber horizon breathe, no modal) |
| **3** | Explainable AI classify assist, weekly insights (progressive disclosure already gates these) |

**Explicitly NOT MVP:** login, cloud sync, Kanban/todo, white dashboard, modal confirms, black-box AI copy.

---

## 18. Constraints & known pitfalls

1. **Electron transparent window** — Empty areas may show white bars if window much larger than pill; keep compact window tight (168×36 Meniscus).
2. **drag vs click** — Never put `-webkit-app-region: drag` on clickable pill body.
3. **CORS** — ActivityWatch must allow browser origin.
4. **Port 5173** — Use `npm run dev:clean` or auto fallback via `.dev-server-port`.
5. **Brand bans:** modal during focus, red scare copy, hover full expand, whole-capsule drag, frequent resize during animation.

---

## 19. Instructions for AI assistants

### Before coding

1. Read `docs/TIMELENS-BRAND.md` and this file.
2. List missing info (goal, scope, repro, permissions); wait for user if task is large.
3. Match **Warm Restraint** — minimal diff, no dashboard creep, no new modals.
4. Owner is a college student — explain jargon; don’t assume silence means understanding.

### Model hints

| Task | Suggested model/mode |
|------|---------------------|
| Meniscus animation / SVG physics | Thinking / deep reasoning |
| Small bugfix / copy tweak | Fast / Composer |
| Security audit | Dedicated review agent + Semgrep |
| Product redesign doc | Thinking |

### Vertical tools to use when relevant

- `gh` CLI for GitHub
- Playwright for E2E (if added)
- ActivityWatch must be running to test live data

---

## 20. Document index

| File | Role |
|------|------|
| `docs/CONTEXT.md` | **This file** — full AI context |
| `docs/TIMELENS-BRAND.md` | Design constitution (update Meniscus + 36px when editing) |
| `docs/TIMELENS-SCIENCE.md` | UX science mapping |
| `README.md` | User-facing quick start (needs sync with Meniscus interaction) |
| `C:\Users\chent\CLAUDE.md` | Global user env + collaboration rules |

---

*TimeLens Ambient — 有品位的安静伴侣。The signature is the meniscus, not the dashboard.*
