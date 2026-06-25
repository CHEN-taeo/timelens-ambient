import { CATEGORIES } from '../utils/rules.js'
import { isFlowState } from '../utils/deadReckoning.js'

/** Map ActivityWatch + pomodoro + thread store → physics targets. */
export function deriveThreadTargets({
  currentActivity,
  connected,
  pomodoro,
  phase,
  cursorForeground,
  visibility,
}) {
  const cat = currentActivity?.category || 'neutral'
  const meta = CATEGORIES[cat] || CATEGORIES.neutral
  const sessionSeconds = currentActivity?.startedAt
    ? Math.max(0, Math.round((Date.now() - currentActivity.startedAt) / 1000))
    : (currentActivity?.sessionSeconds ?? 0)
  const inPomodoro = pomodoro?.running && pomodoro?.mode === 'focus'
  const flow = isFlowState({
    sessionSeconds,
    productive: meta.productive,
    inPomodoro,
  })

  let scatterAmount = 0
  let alignAmount = 0
  let tangleAmount = 0

  if (phase === 'tangle' || phase === 'untangle') {
    tangleAmount = phase === 'untangle' ? 0.25 : 1
  }

  if (cat === 'entertainment' || pomodoro?.warning) {
    scatterAmount = Math.max(scatterAmount, cat === 'entertainment' ? 0.85 : 0.5)
  }
  if (pomodoro?.deviationStreak >= 90) {
    scatterAmount = Math.max(scatterAmount, Math.min(0.75, pomodoro.deviationStreak / 300))
  }

  if (flow) alignAmount = 0.9

  /** Holten-style bundle strength β ∈ [0,1] — 左结右扇的「束紧程度」 */
  let bundleStrength = 0.45
  if (cursorForeground) bundleStrength = 0.5
  if (alignAmount >= 0.5) bundleStrength = 0.75
  if (scatterAmount >= 0.35) bundleStrength = Math.min(bundleStrength, 0.32)
  if (scatterAmount >= 0.6) bundleStrength = 0.22
  if (phase === 'tangle') bundleStrength = 0.88
  if (phase === 'untangle') bundleStrength = 0.55

  if (visibility === 'ghost') {
    return {
      scatterAmount,
      alignAmount,
      tangleAmount,
      bundleStrength,
      categoryColor: meta.color,
      peekLine: '',
      peekLineLong: '',
      opacity: 0.02,
    }
  }

  const opacity =
    phase === 'tangle' || scatterAmount > 0.5
      ? 0.26
      : cursorForeground
        ? 0.18
        : 0.14

  const label = connected
    ? `${meta.label} · ${Math.floor(sessionSeconds / 60)}m`
    : '未连接 ActivityWatch'

  const peekLineLong = connected
    ? `${currentActivity?.app || ''} · ${label}`
    : label

  return {
    scatterAmount,
    alignAmount,
    tangleAmount,
    bundleStrength,
    categoryColor: meta.color,
    peekLine: label,
    peekLineLong,
    opacity,
  }
}

export function isCursorApp(appName = '') {
  return /cursor/i.test(appName)
}
