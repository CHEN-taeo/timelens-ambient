/**
 * User preferences — persisted locally (`timelens-settings`).
 */

const STORAGE_KEY = 'timelens-settings'

export const DEFAULT_SETTINGS = {
  dailyPomodoroGoal: 6,
  productiveGoalHours: 4,
  workDayStartHour: 9,
  workDayStartMin: 0,
  workDayEndHour: 18,
  workDayEndMin: 0,
  pomodoroFocusMin: 25,
  pomodoroShortBreakMin: 5,
  pomodoroLongBreakMin: 15,
  pomodoroLongBreakEvery: 4,
  mainline: '',
  mainlineDate: '',
  /** meniscus (default) | lens-ring | minimal | standard | horizon */
  presentationMode: 'meniscus',
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

function normalize(raw) {
  const s = { ...DEFAULT_SETTINGS, ...raw }
  s.dailyPomodoroGoal = clamp(Number(s.dailyPomodoroGoal) || 6, 1, 20)
  s.productiveGoalHours = clamp(Number(s.productiveGoalHours) || 4, 1, 12)
  s.workDayStartHour = clamp(Number(s.workDayStartHour) ?? 9, 0, 23)
  s.workDayStartMin = clamp(Number(s.workDayStartMin) ?? 0, 0, 59)
  s.workDayEndHour = clamp(Number(s.workDayEndHour) ?? 18, 1, 24)
  s.workDayEndMin = clamp(Number(s.workDayEndMin) ?? 0, 0, 59)
  s.pomodoroFocusMin = clamp(Number(s.pomodoroFocusMin) || 25, 5, 90)
  s.pomodoroShortBreakMin = clamp(Number(s.pomodoroShortBreakMin) || 5, 1, 30)
  s.pomodoroLongBreakMin = clamp(Number(s.pomodoroLongBreakMin) || 15, 5, 60)
  s.pomodoroLongBreakEvery = clamp(Number(s.pomodoroLongBreakEvery) || 4, 2, 8)
  s.mainline = String(s.mainline || '').slice(0, 120)
  s.mainlineDate = String(s.mainlineDate || '')
  const modes = ['lens-ring', 'meniscus', 'minimal', 'standard', 'horizon']
  s.presentationMode = modes.includes(s.presentationMode) ? s.presentationMode : 'meniscus'
  return s
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return normalize(raw ? JSON.parse(raw) : {})
  } catch {
    return normalize({})
  }
}

export function saveSettings(settings) {
  const next = normalize(settings)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

/** Mainline intent for today only — resets when the calendar day changes. */
export function effectiveMainline(settings = loadSettings()) {
  if (settings.mainlineDate !== todayKey()) return ''
  return settings.mainline
}

export function setMainline(text) {
  const s = loadSettings()
  s.mainline = String(text || '').slice(0, 120)
  s.mainlineDate = todayKey()
  return saveSettings(s)
}

export function workDayMinutes(settings = loadSettings()) {
  const start = settings.workDayStartHour * 60 + settings.workDayStartMin
  const end = settings.workDayEndHour * 60 + settings.workDayEndMin
  return { startMin: start, endMin: Math.max(start + 60, end) }
}

/** After configured work-day end — meniscus enters Settle (empty glass). */
export function isWorkDayEnded(now = new Date(), settings = loadSettings()) {
  const { endMin } = workDayMinutes(settings)
  const mins = now.getHours() * 60 + now.getMinutes()
  return mins >= endMin
}

export function formatClockLabel(hour, min = 0) {
  return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

export function pomodoroConfig(settings = loadSettings()) {
  return {
    focus: settings.pomodoroFocusMin * 60,
    shortBreak: settings.pomodoroShortBreakMin * 60,
    longBreak: settings.pomodoroLongBreakMin * 60,
    longBreakEvery: settings.pomodoroLongBreakEvery,
    warnDeviationSec: 90,
    failDeviationSec: 300,
  }
}

export function productiveGoalSeconds(settings = loadSettings()) {
  return settings.productiveGoalHours * 3600
}
