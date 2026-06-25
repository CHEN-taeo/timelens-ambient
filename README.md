# TimeLens Ambient

A glanceable, always-on **desktop time mirror** — a small bundle of **living silk threads** at the top of your screen. It reads [ActivityWatch](https://activitywatch.net/) to reflect what you're doing (drift / scatter / align), and embeds a **fix coach** when Cursor Agent gets it wrong.

> Default UI: **Thread Field（丝场）**. Meniscus remains available in Settings.

## 30-second start

```powershell
cd timelens-ambient
npm install
npm run dev
```

1. Wait for terminal: `[timelens] dev server → http://localhost:5173`
2. An **Electron** window appears **top-center** (this is the product — not the browser tab)
3. You should see **3–5 threads** leaving a small knot on the left, fanning right
4. **Hover** 400ms → peek line · **Click** → time detail · **Esc** → close
5. **`Ctrl+Shift+U`** only → Agent Fix coach (not on normal click)

### Browser vs Electron

| | Browser `http://127.0.0.1:5173` | Electron (`npm run dev`) |
|--|--------------------------------|---------------------------|
| Purpose | UI preview (darker bg, brighter threads) | **Real desktop overlay** |
| Requires | `npm run dev:vite` or full `npm run dev` | `npm run dev` |
| `ERR_CONNECTION_REFUSED` | **Vite not running** — start dev first | Same — Electron loads Vite in dev |

**Browser-only preview:**

```powershell
npm run dev:vite
```

Then open the URL Vite prints (usually `http://127.0.0.1:5173/`). Add `?threadDebug=1` to see bundle strength β.

### If port 5173 fails

```powershell
npm run dev:clean
npm run dev
```

If 5173 is taken, Vite picks the next port — check `.dev-server-port` or the terminal line.

## What it does

- **Thread Field** — left-anchor fan bundle; β (bundle strength) shifts with focus/scatter/align/tangle
- **ActivityWatch** — classifies app every 5s; entertainment → scatter; 15min flow → align
- **Fix coach** — `Ctrl+Shift+U` → inline fix → XML prompt → clipboard
- **Presentation modes** — Settings: 丝场 (default) or 弯月面 Meniscus

## Prerequisites

1. **ActivityWatch** (`aw-server` on `http://localhost:5600`, `cors_origins = "*"`)
2. Node.js 18+
3. Fix coach (optional): copy `.env.example` → `.env`, set `DEEPSEEK_API_KEY`

## Hotkeys

| Key | Action |
|-----|--------|
| **Ctrl+Shift+T** | Show / hide window |
| **Ctrl+Shift+U** | Fix coach (tangle) |
| **Ctrl+Shift+Q** | Quit |
| **Esc** | Close detail / fix panel |

Drag the thread bundle to move; release snaps to nearest edge.

## Build

```powershell
npm run build
npm run start
```

## Tech

Electron · Vite · React 18 · Canvas 2D · Zustand · DeepSeek (embedded coach)

## Docs

- **`docs/THREAD_FIELD.md`** — Thread Field spec + β table
- **`docs/THREAD_DESIGN_REFS.md`** — design research (bundling, calm tech)
- **`docs/TIMELENS-BRAND.md`** — brand principles
- **`docs/CONTEXT.md`** — project context

## Project layout

```
electron/        main.js, preload.js, coachBridge.mjs
coach/           embedded prompt coach
src/thread/      threadLayout, threadPhysics, threadState
src/components/  ThreadField, ThreadDetail, ThreadFocus (+ Meniscus legacy)
```
