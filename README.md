# TimeLens Ambient

A glanceable, always-on **desktop time mirror** — a small bundle of **living silk threads** at the top of your screen. It reads [ActivityWatch](https://activitywatch.net/) to reflect what you're doing (drift / scatter / align), and embeds a **fix coach** when Cursor Agent gets it wrong — no bottle UI, no dots, no full-screen panel.

> MVP / Stage 2 — **Thread Field** is the default identity. Meniscus legacy UI remains in repo but is not mounted.

## What it does

- **Thread Field** — 3–5 short threads sized by φ, always visible top-center; breathe at low opacity, scatter when distracted, tangle on fix.
- **ActivityWatch** — classifies current app every 5s; entertainment → scatter; 15min flow → align; Cursor foreground → brighter present mode.
- **Fix coach (embedded)** — `Ctrl+Shift+U` opens inline fix flow → structured XML prompt → clipboard → paste into Glass Agent chat.
- **Pomodoro** — still runs in background store; deviation streak increases scatter weight.

## Prerequisites

1. **ActivityWatch** running (`aw-server` on `http://localhost:5600`, `cors_origins = "*"`).
2. Node.js 18+.
3. For fix prompts: copy `.env.example` → `.env` and set `DEEPSEEK_API_KEY`.

## Run (development)

```bash
npm install
npm run dev
```

Transparent Electron window (~184×40) appears **top-center**. Hover threads for peek text; click or `Ctrl+Shift+U` for fix.

### Hotkeys

| Key | Action |
|-----|--------|
| **Ctrl+Shift+T** | Show / hide threads |
| **Ctrl+Shift+U** | Undo step / fix (tangle + coach) |
| **Ctrl+Shift+Q** | Quit |

Drag the thread bundle to move; release snaps to nearest screen edge (top/bottom/left/right).

## Build

```bash
npm run build
npm run start
```

## Tech

Electron · Vite · React 18 · Canvas 2D · Zustand · DeepSeek (embedded coach)

## Docs

- **`docs/THREAD_FIELD.md`** — Thread Field spec (default UI)
- **`docs/CONTEXT.md`** — full project context
- **`docs/TIMELENS-BRAND.md`** — brand principles

## Project layout

```
electron/        main.js, preload.js, coachBridge.mjs
coach/           embedded prompt coach (from cursor-prompt-coach)
src/thread/      threadLayout, threadPhysics, threadState
src/components/  ThreadField, ThreadFocus (+ legacy Meniscus/Capsule)
src/store/       awService, useTimeStore, useThreadStore
```

## Roadmap

- **Stage 2** — Google Calendar intent alignment + conflict warnings.
- **Stage 3** — AI category correction, daily mood report, weekly insights,
  settings panel.
