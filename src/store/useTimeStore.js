import { create } from 'zustand'
import {
  CATEGORIES,
  categorizeDetailed,
  addOverride,
  removeOverride,
  correctionTarget,
} from '../utils/rules.js'
import { playComplete } from '../utils/sounds.js'
import { useSettingsStore } from './useSettingsStore.js'

function getPomodoro() {
  return useSettingsStore.getState().getPomodoro()
}
const initialPomodoro = {
  mode: 'idle',
  running: false,
  remaining: 0,
  duration: 0,
  intent: '',
  warning: false,
  deviationStreak: 0,
  distractionSeconds: 0,
  cycleCount: 0,
}

export const useTimeStore = create((set, get) => ({
  connected: false,
  currentActivity: null,
  todayTotals: { totalsByCategory: {}, productiveSeconds: 0, totalSeconds: 0 },
  todaySessions: [],
  dayStrip: [],

  pomodoro: { ...initialPomodoro },
  completedToday: 0,
  interruptionsToday: 0,
  history: [],
  toast: null,
  capsulePulse: false,
  edgeShimmer: false,

  setConnected: (connected) => set({ connected }),
  setCurrentActivity: (currentActivity) => set({ currentActivity }),
  setTodayTotals: (todayTotals) => set({ todayTotals }),
  setTodaySessions: (todaySessions) => set({ todaySessions }),
  setDayStrip: (dayStrip) => set({ dayStrip }),

  clearToast: () => set({ toast: null }),

  triggerPulse: () => {
    set({ capsulePulse: true })
    setTimeout(() => set({ capsulePulse: false }), 420)
  },

  triggerEdgeShimmer: () => {
    set({ edgeShimmer: true })
    setTimeout(() => set({ edgeShimmer: false }), 900)
  },

  showToast: (message, { undoLabel, onUndo, durationMs = 5000 } = {}) => {
    const expiresAt = Date.now() + durationMs
    set({ toast: { message, undoLabel, onUndo, expiresAt } })
    setTimeout(() => {
      const t = get().toast
      if (t && t.expiresAt <= Date.now()) set({ toast: null })
    }, durationMs + 100)
  },

  reclassifyCurrent: (targetKey) => {
    const act = get().currentActivity
    if (!act) return
    const pattern = (act.title || act.app).slice(0, 80).toLowerCase().trim()
    if (!pattern) return

    addOverride(pattern, targetKey)
    const detailed = categorizeDetailed(act.app, act.title)
    set({
      currentActivity: {
        ...act,
        category: detailed.category,
        because: detailed.because,
        ruleIndex: detailed.ruleIndex,
        overridePattern: detailed.overridePattern,
      },
    })

    get().showToast(`已记为「${detailed.category.label}」`, {
      undoLabel: '撤销',
      durationMs: 5000,
      onUndo: () => {
        removeOverride(pattern)
        const base = categorizeDetailed(act.app, act.title)
        set({
          currentActivity: {
            ...act,
            category: base.category,
            because: base.because,
            ruleIndex: base.ruleIndex,
            overridePattern: base.overridePattern,
          },
          toast: null,
        })
      },
    })
  },

  reclassifyToSuggested: () => {
    const key = get().currentActivity?.category?.key
    if (!key) return
    get().reclassifyCurrent(correctionTarget(key))
  },

  startPomodoro: (intent = '') => {
    const POMODORO = getPomodoro()
    set({
      pomodoro: {
        ...initialPomodoro,
        mode: 'focus',
        running: true,
        remaining: POMODORO.focus,
        duration: POMODORO.focus,
        intent: intent || get().currentActivity?.category?.label || '专注',
        cycleCount: get().pomodoro.cycleCount,
      },
    })
  },
  pausePomodoro: () => set((s) => ({ pomodoro: { ...s.pomodoro, running: false } })),
  resumePomodoro: () => set((s) => ({ pomodoro: { ...s.pomodoro, running: true } })),

  stopPomodoro: () => {
    const p = get().pomodoro
    if (p.mode !== 'focus' && p.mode !== 'shortBreak' && p.mode !== 'longBreak') {
      set({ pomodoro: { ...initialPomodoro, cycleCount: p.cycleCount } })
      return
    }
    const snapshot = { ...p }
    const elapsed = p.duration - p.remaining
    if (p.mode === 'focus' && elapsed > 30) {
      get()._logSession('interrupted')
    }
    set({ pomodoro: { ...initialPomodoro, cycleCount: p.cycleCount } })
    if (p.mode === 'focus' && elapsed > 30) {
      get().showToast('番茄已结束', {
        undoLabel: '撤销',
        durationMs: 5000,
        onUndo: () => get()._restorePomodoro(snapshot),
      })
    }
  },

  _restorePomodoro: (snapshot) => {
    set((s) => ({
      pomodoro: snapshot,
      history: s.history.slice(1),
      interruptionsToday: Math.max(0, s.interruptionsToday - 1),
      toast: null,
    }))
  },

  _logSession: (status) => {
    const p = get().pomodoro
    const entry = {
      intent: p.intent,
      startedAt: Date.now() - (p.duration - p.remaining) * 1000,
      durationSec: p.duration - p.remaining,
      status,
      distractionSec: p.distractionSeconds,
    }
    set((s) => {
      const completedToday = status === 'complete' ? s.completedToday + 1 : s.completedToday
      return {
        history: [entry, ...s.history].slice(0, 50),
        completedToday,
        interruptionsToday: status === 'interrupted' ? s.interruptionsToday + 1 : s.interruptionsToday,
      }
    })
    if (status === 'complete') {
      const mins = Math.round(entry.durationSec / 60)
      get().triggerPulse()
      playComplete()
      get().showToast(`+1 🍅 · 完整 · ${mins}min`, { durationMs: 4500 })
      const { completedToday } = get()
      const dailyGoal = useSettingsStore.getState().getDailyPomodoroGoal()
      if (completedToday >= dailyGoal) {
        get().triggerEdgeShimmer()
        get().showToast('今日番茄目标达成 ✦', { durationMs: 4000 })
      }
    }
  },

  tick: () => {
    const POMODORO = getPomodoro()
    const { pomodoro: p, currentActivity } = get()
    if (!p.running || p.mode === 'idle') return

    let warning = p.warning
    let deviationStreak = p.deviationStreak
    let distractionSeconds = p.distractionSeconds

    if (p.mode === 'focus') {
      const catKey = currentActivity?.category?.key
      const offTask =
        catKey === CATEGORIES.entertainment.key || catKey === CATEGORIES.idle.key
      if (offTask) {
        deviationStreak += 1
        distractionSeconds += 1
      } else {
        deviationStreak = 0
      }
      warning = deviationStreak >= POMODORO.warnDeviationSec

      if (deviationStreak >= POMODORO.failDeviationSec) {
        get()._logSession('interrupted')
        get().showToast('偏离较久，番茄已中断', { durationMs: 5000 })
        set({ pomodoro: { ...initialPomodoro, cycleCount: p.cycleCount } })
        return
      }
    }

    const remaining = p.remaining - 1

    if (remaining <= 0) {
      if (p.mode === 'focus') {
        get()._logSession('complete')
        const newCycle = p.cycleCount + 1
        const isLong = newCycle % POMODORO.longBreakEvery === 0
        set({
          pomodoro: {
            ...initialPomodoro,
            mode: isLong ? 'longBreak' : 'shortBreak',
            running: true,
            remaining: isLong ? POMODORO.longBreak : POMODORO.shortBreak,
            duration: isLong ? POMODORO.longBreak : POMODORO.shortBreak,
            intent: isLong ? '长休息' : '短休息',
            cycleCount: newCycle,
          },
        })
      } else {
        set({ pomodoro: { ...initialPomodoro, cycleCount: p.cycleCount } })
      }
      return
    }

    set({
      pomodoro: { ...p, remaining, warning, deviationStreak, distractionSeconds },
    })
  },
}))
