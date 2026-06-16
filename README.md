# TimeLens Ambient

A glanceable, always-on **desktop time-awareness capsule** powered by your local
[ActivityWatch](https://activitywatch.net/). It sits at the top-right of your
screen as a half-transparent Obsidian-Dark glass pill, and expands into a Bento
dashboard on hover — with a built-in, ActivityWatch-aware Pomodoro timer.

> MVP / Stage 1. No login, no cloud, no Google Calendar yet — all data stays local.

## What it does

- **Live capsule** — reads your current window from ActivityWatch every 5s,
  classifies it (coding / learning / AI / comms / entertainment / idle) and
  shows a breathing status dot in the matching color.
- **Hover to expand** — a fluid spring animation opens a Bento board: today's
  focus vs. entertainment time, productivity %, current app, a 24h time strip,
  and the Pomodoro panel.
- **Smart Pomodoro** — 25 / 5 / 15 with a long break every 4 rounds. Each round
  binds to a one-line *intent*. While focusing, it watches ActivityWatch:
  drifting to entertainment turns the ring/border amber and counts as
  distraction; >5 min continuous drift auto-fails the round.

## Prerequisites

1. **ActivityWatch is running** (`aw-qt` + `aw-server` on `http://localhost:5600`).
2. `aw-server.toml` has `cors_origins = "*"` so the app can read the API.
3. Node.js 18+.

## Run (development)

```bash
npm install
npm run dev
```

This starts Vite (port 5173) and launches the transparent Electron window.

The capsule appears **top-center** as a tiny pill (~32px tall). The Electron
window **hugs the capsule** in compact mode; pre-allocates space when expanded.

### Interaction (brand-aligned)

| Gesture | Action |
|---------|--------|
| **Hover 400ms** | Peek only — `● 编程 · 43m` (no full panel) |
| **Click pill text** | Focus — 200ms Ma pause, then liquid expand |
| **Click ● dot** | Start 25min pomodoro instantly |
| **Drag `⋮` handle** | Move window (not the whole pill) |
| **Esc / click header** | Collapse Focus |
| **End pomodoro** | Toast with 5s undo — no modal |

- **Ctrl+Shift+T** — show / hide
- **Ctrl+Shift+Q** — quit
- Drag anywhere on the pill to move it

## Build the renderer

```bash
npm run build   # outputs dist/
npm run start   # runs Electron against the built files
```

## Tech

Electron · Vite · React 18 · Tailwind CSS · Framer Motion · Zustand

## Design & brand

All UI, interaction, copy, and feature decisions follow **`docs/TIMELENS-BRAND.md`**
(Warm Restraint · ambient capsule · dot-as-product · proxemics · Ma · peak-end).


## Project layout

```
electron/        main.js (ghost window + tray + shortcuts), preload.js
src/
  store/         awService.js (ActivityWatch API), useTimeStore.js (Zustand + Pomodoro)
  utils/         rules.js (classification engine)
  components/    Capsule, BentoBoard, PomodoroRing, GlowIndicator
```

## Roadmap

- **Stage 2** — Google Calendar intent alignment + conflict warnings.
- **Stage 3** — AI category correction, daily mood report, weekly insights,
  settings panel.
