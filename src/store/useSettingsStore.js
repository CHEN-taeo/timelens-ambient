import { create } from 'zustand'
import {
  loadSettings,
  saveSettings,
  setMainline,
  effectiveMainline,
  pomodoroConfig,
  productiveGoalSeconds,
  workDayMinutes,
} from '../utils/settings.js'

export const useSettingsStore = create((set, get) => ({
  settings: loadSettings(),

  hydrate: () => set({ settings: loadSettings() }),

  patch: (partial) => {
    const settings = saveSettings({ ...get().settings, ...partial })
    set({ settings })
    return settings
  },

  setMainline: (text) => {
    const settings = setMainline(text)
    set({ settings })
    return settings
  },

  getMainline: () => effectiveMainline(get().settings),

  getPomodoro: () => pomodoroConfig(get().settings),

  getProductiveGoalSeconds: () => productiveGoalSeconds(get().settings),

  getWorkDay: () => workDayMinutes(get().settings),

  getDailyPomodoroGoal: () => get().settings.dailyPomodoroGoal,
}))
