import { categorizeDetailed } from './rules.js'

function shortApp(app = '') {
  const base = app.replace(/\.exe$/i, '').split(/[/\\]/).pop() || app
  return base.length > 11 ? `${base.slice(0, 9)}…` : base
}

function eventHour(ev) {
  const d = new Date(ev.timestamp)
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600
}

/** AW 事件 → 按时间顺序的 session 层（与网页 focus-ui 一致） */
export function sessionsFromEvents(events) {
  const sorted = [...(events || [])]
    .filter((e) => (e.duration || 0) > 0)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

  const sessions = []
  let cur = null

  for (const ev of sorted) {
    const app = ev.data?.app || ''
    const title = ev.data?.title || ''
    const detailed = categorizeDetailed(app, title)
    const catKey = detailed.category.key
    const mins = Math.min(24 * 60, Math.max(0, (ev.duration || 0) / 60))
    const t = eventHour(ev)
    const because = detailed.because

    if (cur && cur.cat === catKey && Math.abs(t - cur.endT) < 0.08) {
      cur.mins += mins
      cur.endT = t + mins / 60
      if (app) cur.app = shortApp(app)
    } else {
      if (cur) sessions.push(cur)
      cur = {
        cat: catKey,
        mins,
        t,
        endT: t + mins / 60,
        app: shortApp(app),
        because,
      }
    }
  }

  if (cur) {
    cur.now = true
    sessions.push(cur)
  }
  return sessions
}

export function totalsMinutesFromSessions(sessions = []) {
  const t = {}
  sessions.forEach((s) => {
    const mins = Math.min(24 * 60, Math.max(0, Number(s.mins) || 0))
    t[s.cat] = (t[s.cat] || 0) + mins
  })
  return t
}
