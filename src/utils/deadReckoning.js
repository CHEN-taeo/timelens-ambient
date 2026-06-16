/**
 * Dead reckoning — dot + day marker follow real clock (prototype-aligned).
 * Reference: timelens_interactive_prototype.html updateDR()
 */

const FLOW = { color: '#3A3A52', glow: 'rgba(58,58,82,0.22)' }
const GOAL = { color: '#30B060', glow: 'rgba(48,176,96,0.42)' }

/** Color bands by time-of-day (minutes since midnight). */
export function timeOfDayColor(now = new Date()) {
  const mins = now.getHours() * 60 + now.getMinutes()
  if (mins < 660) return { color: '#4A7CFF', glow: 'rgba(74,124,255,0.38)' } // before 11:00
  if (mins < 780) return { color: '#90A8FF', glow: 'rgba(144,168,255,0.38)' } // before 13:00
  if (mins < 900) return { color: '#F0A030', glow: 'rgba(240,160,48,0.38)' } // before 15:00
  if (mins < 1020) return { color: '#C07018', glow: 'rgba(192,112,24,0.40)' } // before 17:00
  return GOAL
}

/** Marker position on 09:00–18:00 day strip (2–97%). */
export function dayMarkPercent(now = new Date(), startMin = 9 * 60, endMin = 18 * 60) {
  const mins = now.getHours() * 60 + now.getMinutes()
  const pct = ((mins - startMin) / (endMin - startMin)) * 100
  return Math.max(2, Math.min(97, pct))
}

export function formatClock(now = new Date()) {
  const h = now.getHours()
  const m = now.getMinutes()
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** @param {{ productiveSeconds?: number, dailyGoalSeconds?: number, now?: Date, flowActive?: boolean, startMin?: number, endMin?: number }} opts */
export function deadReckoning({
  productiveSeconds = 0,
  dailyGoalSeconds = 4 * 3600,
  now = new Date(),
  flowActive = false,
  startMin = 9 * 60,
  endMin = 18 * 60,
}) {
  const markPct = dayMarkPercent(now, startMin, endMin)
  if (flowActive) {
    return { ...FLOW, mode: 'flow', markPct, clock: formatClock(now) }
  }

  const progress = dailyGoalSeconds > 0 ? productiveSeconds / dailyGoalSeconds : 0
  if (progress >= 0.88) {
    return { ...GOAL, mode: 'goal', markPct, clock: formatClock(now) }
  }

  const tod = timeOfDayColor(now)
  return {
    ...tod,
    mode: 'timeofday',
    markPct,
    clock: formatClock(now),
  }
}

/** 15+ min continuous productive same-window focus (ActivityWatch session proxy). */
export function isFlowState({ sessionSeconds = 0, productive = false, inPomodoro = false }) {
  return productive && !inPomodoro && sessionSeconds >= 15 * 60
}
