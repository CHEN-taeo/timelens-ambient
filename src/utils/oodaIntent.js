/**
 * OODA Orient — pre-select the most likely Pomodoro target so the user
 * confirms rather than decides (Boyd decision loop).
 */

import { CATEGORIES } from './rules.js'
import { effectiveMainline } from './settings.js'

function dominantProductiveKey(totalsByCategory = {}) {  let best = null
  let max = 0
  for (const [key, sec] of Object.entries(totalsByCategory)) {
    if (!CATEGORIES[key]?.productive || sec <= max) continue
    max = sec
    best = key
  }
  return best
}

/**
 * @param {{
 *   currentActivity?: { title?: string, app?: string, category?: { key?: string, label?: string, productive?: boolean } },
 *   history?: Array<{ intent?: string, startedAt?: number, status?: string }>,
 *   hour?: number,
 *   todayTotals?: { totalsByCategory?: Record<string, number> },
 * }} ctx
 */
export function suggestPomodoroIntent(ctx) {
  const {
    currentActivity,
    history = [],
    hour = new Date().getHours(),
    todayTotals = {},
  } = ctx

  const mainline = effectiveMainline()
  if (mainline) return mainline.slice(0, 48)

  const cat = currentActivity?.category
  if (cat?.productive && currentActivity?.title?.trim()) {
    const t = currentActivity.title.trim()
    if (t.length > 3) return t.slice(0, 48)
  }

  if (cat?.productive && currentActivity?.app) {
    const app = currentActivity.app.replace(/\.exe$/i, '').trim()
    if (app) return app.slice(0, 48)
  }

  for (const h of history) {
    if (h.status !== 'complete' || !h.intent?.trim()) continue
    const hHour = new Date(h.startedAt).getHours()
    if (Math.abs(hHour - hour) <= 2) return h.intent.trim().slice(0, 48)
  }

  const dom = dominantProductiveKey(todayTotals.totalsByCategory)
  if (dom && CATEGORIES[dom]) return CATEGORIES[dom].label

  return cat?.label || '专注'
}

export function oodaHint(suggested, userEdited) {
  if (userEdited || !suggested) return null
  return '已根据当前窗口选好 · 确认即可'
}
