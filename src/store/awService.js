// ActivityWatch API client.
// Talks to the local aw-server (default http://localhost:5600). aw-server must
// have `cors_origins = "*"` set so the renderer can fetch it.

import { categorizeDetailed, categorize } from '../utils/rules.js'

const AW_BASE = 'http://localhost:5600/api/0'

let cachedWindowBucket = null
let cachedAfkBucket = null

async function getJSON(url, options) {
  const res = await fetch(url, options)
  if (!res.ok) throw new Error(`AW ${res.status} ${res.statusText}`)
  return res.json()
}

// Discover the window + afk buckets (named like aw-watcher-window_HOSTNAME).
export async function resolveBuckets() {
  if (cachedWindowBucket) return { windowBucket: cachedWindowBucket, afkBucket: cachedAfkBucket }
  const buckets = await getJSON(`${AW_BASE}/buckets/`)
  const ids = Object.keys(buckets)
  cachedWindowBucket = ids.find((id) => id.startsWith('aw-watcher-window')) || null
  cachedAfkBucket = ids.find((id) => id.startsWith('aw-watcher-afk')) || null
  if (!cachedWindowBucket) throw new Error('aw-watcher-window bucket not found')
  return { windowBucket: cachedWindowBucket, afkBucket: cachedAfkBucket }
}

// The most recent window event = what you are doing right now.
export async function getCurrentActivity() {
  const { windowBucket } = await resolveBuckets()
  const events = await getJSON(`${AW_BASE}/buckets/${windowBucket}/events?limit=1`)
  if (!events || events.length === 0) return null
  const ev = events[0]
  const app = ev.data?.app || 'Unknown'
  const title = ev.data?.title || ''
  const { category, because, ruleIndex, overridePattern } = categorizeDetailed(app, title)
  const startedAt = new Date(ev.timestamp).getTime()
  return { app, title, category, because, ruleIndex, overridePattern, startedAt }
}

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

// Sum today's window-event durations grouped by TimeLens category.
// Returns { totalsByCategory: {key: seconds}, productiveSeconds, totalSeconds }.
export async function getTodayTotals() {
  const { windowBucket } = await resolveBuckets()
  const start = startOfToday().toISOString()
  const end = new Date().toISOString()
  const events = await getJSON(
    `${AW_BASE}/buckets/${windowBucket}/events?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&limit=100000`
  )

  const totalsByCategory = {}
  let productiveSeconds = 0
  let totalSeconds = 0

  for (const ev of events) {
    const dur = ev.duration || 0
    if (dur <= 0) continue
    const cat = categorize(ev.data?.app || '', ev.data?.title || '')
    totalsByCategory[cat.key] = (totalsByCategory[cat.key] || 0) + dur
    totalSeconds += dur
    if (cat.productive) productiveSeconds += dur
  }

  return { totalsByCategory, productiveSeconds, totalSeconds }
}

// Hourly active seconds for the last 24h, as a simple 24-slot array, each slot
// carrying the dominant category for that hour (for the time-strip viz).
export async function getDayStrip() {
  const { windowBucket } = await resolveBuckets()
  const start = startOfToday().toISOString()
  const end = new Date().toISOString()
  const events = await getJSON(
    `${AW_BASE}/buckets/${windowBucket}/events?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&limit=100000`
  )

  // For each hour 0..23, accumulate seconds per category, then pick dominant.
  const hours = Array.from({ length: 24 }, () => ({ total: 0, byCat: {} }))
  for (const ev of events) {
    const dur = ev.duration || 0
    if (dur <= 0) continue
    const h = new Date(ev.timestamp).getHours()
    const cat = categorize(ev.data?.app || '', ev.data?.title || '')
    hours[h].total += dur
    hours[h].byCat[cat.key] = (hours[h].byCat[cat.key] || 0) + dur
  }

  return hours.map((slot) => {
    let dominant = null
    let max = 0
    for (const [key, sec] of Object.entries(slot.byCat)) {
      if (sec > max) {
        max = sec
        dominant = key
      }
    }
    return { total: slot.total, dominant }
  })
}

export async function pingAW() {
  try {
    await getJSON(`${AW_BASE}/info`)
    return true
  } catch {
    return false
  }
}
