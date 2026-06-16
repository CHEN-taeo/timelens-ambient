const FIRST_USE_KEY = 'timelens-first-use'

/** @returns {'day1' | 'week1' | 'month1'} */
export function getDisclosureTier() {
  let first = localStorage.getItem(FIRST_USE_KEY)
  if (!first) {
    first = String(Date.now())
    localStorage.setItem(FIRST_USE_KEY, first)
  }
  const days = (Date.now() - Number(first)) / 86_400_000
  if (days < 1) return 'day1'
  if (days < 7) return 'week1'
  return 'month1'
}

export function showDayStrip() {
  return getDisclosureTier() !== 'day1'
}

export function showHistory() {
  return getDisclosureTier() !== 'day1'
}

export function showInsights() {
  return getDisclosureTier() === 'month1'
}

export function disclosureLabel() {
  const t = getDisclosureTier()
  if (t === 'day1') return '第 1 天 · 专注节奏'
  if (t === 'week1') return '本周 · 时间分布'
  return '深度 · 周洞察'
}
