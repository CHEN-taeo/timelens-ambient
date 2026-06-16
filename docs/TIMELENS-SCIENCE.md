# TimeLens — Science & Design Reference

> Companion to `TIMELENS-BRAND.md` and `timelens_science_design.html`.
> Implements pre-attentive encoding, OODA Orient, and peak-end acoustics.

---

## Interaction states (confirmed intent before information)

| State | UI | Cognitive load |
|-------|-----|----------------|
| **Ambient** | `● 43m` — color + number only | ~1 chunk, periphery |
| **Peek** (400ms dwell) | `● 编程 · 43m` | ~2 chunks, no click |
| **Peek+** (800ms) | `● 编程 · Cursor · 36min` | Reference context |
| **Focus** (click) | Liquid-drop Bento | Intent confirmed |

Esc / ✕ to collapse. No click-outside dismiss (user stays in control of position).

---

## 1. Dead reckoning color (highest transfer value)

**Anchor:** Pre-attentive color processing ~200ms (Treisman & Gelade, 1980); warm/cool valence without reading.

**Metaphor:** Ship navigator — position from speed + heading, no GPS. The ● encodes **time-of-day × daily progress** in one hue.

| Color | Meaning |
|-------|---------|
| `#4A7CFF` cool blue | Morning, low accumulation |
| `#F0A030` amber | Afternoon, hours building |
| `#C87820` deep amber | Behind expected curve |
| `#30B060` green | Daily goal reached |
| `#3A3A52` near-dark | Flow — 15+ min same productive app |

**Implementation:** `src/utils/deadReckoning.js` → `GlowIndicator` in compact/peek. Category text appears at Peek; color stays dead reckoning until warning (off-task).

**Robotics transfer:** Elder care HUDs — color warmth readable before text registers.

---

## 2. OODA Orient — confirm, don’t decide

**Anchor:** Boyd OODA loop — **Orient** is the expensive step. Pre-select likely Pomodoro intent from:

1. Current productive window title  
2. Recent complete session at similar time-of-day (±2h)  
3. Dominant productive category today  
4. Category label fallback  

**Implementation:** `src/utils/oodaIntent.js` → BentoBoard pre-fills intent with hint: *已根据当前窗口选好 · 确认即可*

User presses Enter or **专注 25:00** — no blank-slate decision.

---

## 3. Flow mode (Csikszentmihalyi, 1990)

**Behavior:** 15+ min continuous productive same-app → capsule **dims to ~22% opacity** (near-invisible). Re-entering flow after interruption ≈ 23 min cost (Mark, 2015).

**Signal:** ActivityWatch session duration + productive category, not pomodoro active.

**Implementation:** `isFlowState()` in `deadReckoning.js` → Capsule opacity.

---

## 4. Three signature sounds (opt-in, default off)

| Sound | When | Character |
|-------|------|-----------|
| **confirm** | Focus opens | Single soft Ma tick (~392Hz, 100ms) |
| **complete** | +1 🍅 peak | Two-note ascending chime |
| **landmark** | Fresh-start pulse | Quiet triangle bell |

**Toggle:** `localStorage timelens-sounds = 'on' | 'off'` (default **off** — Warm Restraint).

**Implementation:** `src/utils/sounds.js`

---

## 5. Temporal landmark (Milkman et al., 2014)

**Behavior:** One border pulse, no text — Monday 8–11, 1st of month, ~13:00 post-lunch. Goal pursuit spikes at “new beginning” markers.

**Implementation:** `checkTemporalLandmark()` + `edge-shimmer` CSS + optional `playLandmark()`.

---

## 6. Backlog (documented, not MVP)

| Idea | Anchor | Notes |
|------|--------|-------|
| **Witness dot** | Zajonc, 1965 — social facilitation | 1px edge dot; one partner sees focus state |
| **Calendar collision** | Stage 2 | Amber breathe, not modal |

---

## Gap checklist (doc → product)

- [x] Hover / click boundary (Peek vs Focus, dedicated drag handle)
- [x] Window expand in place (pre-size before liquid drop)
- [x] Dead reckoning ● color
- [x] OODA intent pre-selection
- [x] Flow dimming
- [x] Signature sounds (opt-in)
- [ ] Witness dot (Stage 2)
- [ ] Google Calendar Orient layer

---

*Source mockup: `timelens_science_design.html` · TimeLens Ambient*
