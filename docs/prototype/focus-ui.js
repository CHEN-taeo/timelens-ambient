/**
 * Focus 四柱镜 + 番茄 + ActivityWatch（网页原型）
 */
import { categorizeDetailed, CATEGORIES, correctionTarget } from '../../src/utils/rules.js'

const AW_BASE = 'http://localhost:5600/api/0'
const PRODUCTIVE_GOAL_SEC = 4 * 3600
const POMO_FOCUS_SEC = 25 * 60
const OVERRIDE_KEY = 'timelens-proto-overrides'
const POMO_DONE_KEY = 'timelens-proto-pomo-done'

function fmtDur(sec = 0) {
  const m = Math.round(sec / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const r = m % 60
  return r > 0 ? `${h}h ${r}m` : `${h}h`
}

function mmss(sec = 0) {
  const s = Math.max(0, Math.round(sec))
  const m = Math.floor(s / 60)
  const ss = s % 60
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

function shortApp(app = '') {
  const base = app.replace(/\.exe$/i, '').split(/[/\\]/).pop() || app
  return base.length > 11 ? `${base.slice(0, 9)}…` : base
}

function voyageLine(prodSec) {
  const left = Math.max(0, PRODUCTIVE_GOAL_SEC - prodSec)
  if (prodSec >= PRODUCTIVE_GOAL_SEC) return '今日航程已满'
  if (left < 3600) return `还差 ${Math.round(left / 60)}min`
  const h = Math.floor(left / 3600)
  const m = Math.round((left % 3600) / 60)
  return m > 0 ? `还差 ${h}h${m}m` : `还差 ${h}h`
}

function mockDayStrip(sessions) {
  const hours = Array.from({ length: 24 }, () => ({ total: 0, dominant: null, byCat: {} }))
  sessions.forEach((s) => {
    const h = Math.floor(s.t || 0)
    const mins = s.mins || 0
    hours[h].total += mins
    hours[h].byCat[s.cat] = (hours[h].byCat[s.cat] || 0) + mins
  })
  return hours.map((slot) => {
    let dominant = null
    let max = 0
    Object.entries(slot.byCat).forEach(([k, v]) => {
      if (v > max) {
        max = v
        dominant = k
      }
    })
    return { total: slot.total * 60, dominant }
  })
}

function productiveSeconds(totalsByCategory = {}) {
  return Object.entries(totalsByCategory).reduce((sum, [k, sec]) => {
    return CATEGORIES[k]?.productive ? sum + sec : sum
  }, 0)
}

function loadOverrides() {
  try {
    return JSON.parse(localStorage.getItem(OVERRIDE_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveOverrides(o) {
  localStorage.setItem(OVERRIDE_KEY, JSON.stringify(o))
}

function eventHour(ev) {
  const d = new Date(ev.timestamp)
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600
}

/** AW 事件 → 按时间顺序的 session 层（供梅瓶沉积） */
function sessionsFromEvents(events, overrides = {}) {
  const sorted = [...(events || [])]
    .filter((e) => (e.duration || 0) > 0)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

  const sessions = []
  let cur = null

  for (const ev of sorted) {
    const app = ev.data?.app || ''
    const title = ev.data?.title || ''
    const detailed = categorizeDetailed(app, title)
    let catKey = detailed.category.key
    const ov = overrides[app.toLowerCase()]
    if (ov && CATEGORIES[ov]) catKey = ov

    const mins = (ev.duration || 0) / 60
    const t = eventHour(ev)
    const because = ov
      ? `已改为${CATEGORIES[ov]?.label || ov}`
      : detailed.because

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

export function createFocusUI({ el, onSync, getSt, onPomoComplete, showToast }) {
  const state = {
    source: 'mock',
    connected: false,
    sessions: [],
    totalsByCategory: {},
    dayStrip: [],
    current: null,
    overrides: loadOverrides(),
    mainline: localStorage.getItem('timelens-proto-mainline') || '',
    pomodoro: {
      mode: 'idle',
      running: false,
      remaining: 0,
      duration: POMO_FOCUS_SEC,
      intent: '',
      warning: false,
      deviationSec: 0,
    },
    completedToday: Number(localStorage.getItem(POMO_DONE_KEY) || '2') || 0,
    dailyGoal: 6,
    editingIntent: false,
    intentDraft: '',
    intentEdited: false,
  }

  let bucketId = null
  let pomoIv = null
  let toastTimer = null

  function toast(msg, undoFn) {
    if (showToast) {
      showToast(msg, undoFn)
      return
    }
    const root = el('tlToast')
    if (!root) return
    clearTimeout(toastTimer)
    root.innerHTML = `<span>${msg}</span>${undoFn ? '<button type="button" class="tl-undo" data-a="undo">撤销</button>' : ''}`
    root.classList.add('show')
    const undoBtn = root.querySelector('[data-a="undo"]')
    if (undoBtn && undoFn) {
      undoBtn.onclick = (e) => {
        e.stopPropagation()
        undoFn()
        root.classList.remove('show')
      }
    }
    toastTimer = setTimeout(() => root.classList.remove('show'), undoFn ? 5000 : 3200)
  }

  function totalsFromSessions(sessions) {
    const t = {}
    sessions.forEach((s) => {
      t[s.cat] = (t[s.cat] || 0) + (s.mins || 0) * 60
    })
    return t
  }

  function getCategoryTotalsMinutes() {
    if (state.source === 'aw') {
      const t = {}
      Object.entries(state.totalsByCategory).forEach(([k, sec]) => {
        t[k] = sec / 60
      })
      return t
    }
    const agg = {}
    state.sessions.forEach((s) => {
      agg[s.cat] = (agg[s.cat] || 0) + (s.mins || 0)
    })
    return agg
  }

  function getSessions() {
    return state.sessions
  }

  function getNowMeta() {
    if (state.current?.category) {
      const cat = state.current.category
      return {
        key: cat.key,
        label: cat.label,
        app: shortApp(state.current.app || '—'),
        color: cat.color,
        because: state.current.because ? `因为：${state.current.because}` : '',
        sessionMins: state.current.startedAt
          ? Math.max(0, Math.round((Date.now() - state.current.startedAt) / 60000))
          : 0,
      }
    }
    const s = state.sessions.find((x) => x.now) || state.sessions[state.sessions.length - 1]
    if (!s) {
      return { key: 'coding', label: '编程开发', app: 'Cursor', color: '#818CF8', because: '', sessionMins: 0 }
    }
    const cat = CATEGORIES[s.cat] || CATEGORIES.neutral
    return {
      key: s.cat,
      label: cat.label,
      app: shortApp(s.app || cat.label),
      color: cat.color,
      because: s.because ? `因为：${s.because}` : '',
      sessionMins: Math.round(s.mins || 0),
    }
  }

  function applyCurrentOverride(catKey) {
    const app = state.current?.app || ''
    if (!app) return
    const prev = state.overrides[app.toLowerCase()] || null
    state.overrides[app.toLowerCase()] = catKey
    saveOverrides(state.overrides)
    if (state.current) {
      state.current.category = CATEGORIES[catKey]
      state.current.because = `已改为${CATEGORIES[catKey]?.label || catKey}`
    }
    const nowS = state.sessions.find((x) => x.now)
    if (nowS) {
      nowS.cat = catKey
      nowS.because = state.current?.because || ''
    }
    state.totalsByCategory = totalsFromSessions(state.sessions)
    return prev
  }

  async function resolveBucket() {
    if (bucketId) return bucketId
    const res = await fetch(`${AW_BASE}/buckets/`)
    if (!res.ok) throw new Error('buckets')
    const buckets = await res.json()
    bucketId = Object.keys(buckets).find((id) => id.startsWith('aw-watcher-window')) || null
    if (!bucketId) throw new Error('no window bucket')
    return bucketId
  }

  async function pollAW() {
    try {
      const ping = await fetch(`${AW_BASE}/info`)
      if (!ping.ok) throw new Error('offline')
      const bid = await resolveBucket()
      const now = new Date().toISOString()
      const start = new Date()
      start.setHours(0, 0, 0, 0)

      const [curEv, dayEv] = await Promise.all([
        fetch(`${AW_BASE}/buckets/${bid}/events?limit=1`).then((r) => r.json()),
        fetch(
          `${AW_BASE}/buckets/${bid}/events?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(now)}&limit=100000`
        ).then((r) => r.json()),
      ])

      const totalsByCategory = {}
      for (const ev of dayEv || []) {
        const dur = ev.duration || 0
        if (dur <= 0) continue
        const app = ev.data?.app || ''
        const detailed = categorizeDetailed(app, ev.data?.title || '')
        let key = detailed.category.key
        const ov = state.overrides[app.toLowerCase()]
        if (ov && CATEGORIES[ov]) key = ov
        totalsByCategory[key] = (totalsByCategory[key] || 0) + dur
      }

      let current = null
      if (curEv?.[0]) {
        const ev = curEv[0]
        const app = ev.data?.app || 'Unknown'
        const detailed = categorizeDetailed(app, ev.data?.title || '')
        let cat = detailed.category
        const ov = state.overrides[app.toLowerCase()]
        if (ov && CATEGORIES[ov]) cat = CATEGORIES[ov]
        current = {
          app,
          title: ev.data?.title || '',
          category: cat,
          because: ov ? `已改为${cat.label}` : detailed.because,
          startedAt: new Date(ev.timestamp).getTime(),
        }
      }

      const hours = Array.from({ length: 24 }, () => ({ total: 0, byCat: {} }))
      for (const ev of dayEv || []) {
        const dur = ev.duration || 0
        if (dur <= 0) continue
        const h = new Date(ev.timestamp).getHours()
        const app = ev.data?.app || ''
        const detailed = categorizeDetailed(app, ev.data?.title || '')
        let key = detailed.category.key
        const ov = state.overrides[app.toLowerCase()]
        if (ov && CATEGORIES[ov]) key = ov
        hours[h].total += dur
        hours[h].byCat[key] = (hours[h].byCat[key] || 0) + dur
      }
      const dayStrip = hours.map((slot) => {
        let dominant = null
        let max = 0
        Object.entries(slot.byCat).forEach(([k, v]) => {
          if (v > max) {
            max = v
            dominant = k
          }
        })
        return { total: slot.total, dominant }
      })

      state.source = 'aw'
      state.connected = true
      state.totalsByCategory = totalsByCategory
      state.dayStrip = dayStrip
      state.current = current
      state.sessions = sessionsFromEvents(dayEv, state.overrides)
      tickPomodoroDeviation()
    } catch {
      state.connected = false
      if (state.source === 'aw') state.source = 'mock'
    }
    render()
    onSync?.()
  }

  function useMock(sessions) {
    state.sessions = sessions.map((s, i, arr) => ({
      ...s,
      now: s.now ?? i === arr.length - 1,
      because: s.because || '',
    }))
    state.totalsByCategory = totalsFromSessions(state.sessions)
    state.dayStrip = mockDayStrip(state.sessions)
    state.source = 'mock'
    const nowS = state.sessions.find((s) => s.now)
    if (nowS) {
      const cat = CATEGORIES[nowS.cat]
      state.current = {
        app: nowS.app || cat?.label || 'App',
        category: cat,
        because: nowS.because || '演示数据',
        startedAt: Date.now() - (nowS.mins || 1) * 60000,
      }
    }
  }

  function tickPomodoroDeviation() {
    const p = state.pomodoro
    if (p.mode !== 'focus' || !state.current) return
    const productive = state.current.category?.productive
    if (!productive) {
      p.deviationSec += 1
      p.warning = p.deviationSec >= 90
    } else {
      p.deviationSec = 0
      p.warning = false
    }
  }

  function startPomodoro(intent) {
    const p = state.pomodoro
    p.mode = 'focus'
    p.running = true
    p.duration = POMO_FOCUS_SEC
    p.remaining = POMO_FOCUS_SEC
    p.intent = intent || getNowMeta().label
    p.deviationSec = 0
    p.warning = false
    state.editingIntent = false
    clearInterval(pomoIv)
    pomoIv = setInterval(() => {
      if (!p.running || p.mode !== 'focus') return
      p.remaining = Math.max(0, p.remaining - 1)
      tickPomodoroDeviation()
      if (p.remaining <= 0) {
        p.mode = 'idle'
        p.running = false
        state.completedToday += 1
        localStorage.setItem(POMO_DONE_KEY, String(state.completedToday))
        clearInterval(pomoIv)
        onPomoComplete?.()
        toast('+1 🍅 · 完整 · 25min')
        const st = getSt?.()
        if (st) {
          st.cryOn = true
          st.crystal = 0.001
        }
      }
      render()
    }, 1000)
    render()
  }

  function stopPomodoro() {
    clearInterval(pomoIv)
    state.pomodoro = {
      mode: 'idle',
      running: false,
      remaining: 0,
      duration: POMO_FOCUS_SEC,
      intent: '',
      warning: false,
      deviationSec: 0,
    }
    render()
  }

  function renderDayStrip(strip) {
    if (!strip?.length) return '<div class="fp-ripple"></div>'
    return `<div class="fp-ripple">${strip
      .map((slot) => {
        const c = slot.dominant ? CATEGORIES[slot.dominant] : null
        const op = slot.total > 0 ? 0.75 : 0.2
        const bg = c ? c.color : 'rgba(255,255,255,0.05)'
        return `<span style="background:${bg};opacity:${op}"></span>`
      })
      .join('')}</div>`
  }

  function render() {
    const root = el('focusPillars')
    const badge = el('awBadge')
    if (badge) {
      badge.textContent = state.connected ? 'AW 已连接' : '演示数据'
      badge.classList.toggle('on', state.connected)
    }
    if (!root) return

    const now = getNowMeta()
    const cat = CATEGORIES[now.key] || CATEGORIES.neutral
    const prod = productiveSeconds(state.totalsByCategory)
    const goalPct = Math.min(100, Math.round((prod / PRODUCTIVE_GOAL_SEC) * 100))
    const altKey = correctionTarget(now.key)
    const altCat = CATEGORIES[altKey]
    const canCorrect = ['entertainment', 'neutral', 'comms'].includes(now.key) && altCat
    const p = state.pomodoro
    const devMin = Math.max(1, Math.round(p.deviationSec / 60))

    const pomoBlock =
      p.mode === 'idle'
        ? state.editingIntent
          ? `<input class="fp-inp" id="fpIntent" value="${state.intentDraft.replace(/"/g, '&quot;')}" placeholder="这一轮…"/>
             <button type="button" class="fp-go" data-a="start-pomo">▶ 25min</button>`
          : `<button type="button" class="fp-title" data-a="start-pomo">${state.intentDraft || now.label}</button>
             <div class="fp-row"><button type="button" class="fp-go" data-a="start-pomo">▶ 25min</button>
             <button type="button" class="fp-muted" data-a="edit-intent">改</button></div>
             <div class="fp-muted tnum">${'🍅'.repeat(Math.min(state.completedToday, 8))}${state.completedToday < state.dailyGoal ? ` +${state.dailyGoal - state.completedToday}` : ''}</div>`
        : `<div class="fp-pomo-run">
             <div class="fp-ring"><span class="tnum">${mmss(p.remaining)}</span></div>
             <div class="fp-pomo-meta">
               <div class="fp-title">${p.intent || '专注'}</div>
               ${p.warning ? `<div class="fp-warn">有点偏航 · ${devMin}min</div>` : ''}
               <div class="fp-row">
                 <button type="button" class="fp-muted" data-a="pause-pomo">${p.running ? '停' : '续'}</button>
                 <button type="button" class="fp-muted" data-a="stop-pomo">结束</button>
               </div>
             </div>
           </div>`

    root.innerHTML = `
      <div class="fp-col" style="--fp-accent:${cat.color}">
        <span class="fp-glyph">●</span>
        <div class="fp-title">${now.app}</div>
        <div class="fp-sub">${now.label} · ${now.sessionMins}m</div>
        ${
          canCorrect
            ? `<button type="button" class="fp-link" data-a="correct">其实是${altCat.label}</button>`
            : now.because
              ? `<div class="fp-because" title="${now.because.replace(/"/g, '&quot;')}">${now.because}</div>`
              : '<span class="fp-spacer"></span>'
        }
      </div>
      <div class="fp-col" style="--fp-accent:#90A8FF">
        <span class="fp-glyph">〜</span>
        <div class="fp-title tnum">${fmtDur(prod)}</div>
        <div class="fp-sub">${voyageLine(prod)}</div>
        <div class="fp-goal"><i style="width:${goalPct}%"></i></div>
        ${renderDayStrip(state.dayStrip)}
      </div>
      <div class="fp-col ${p.mode !== 'idle' ? 'active' : ''} ${p.warning ? 'warn' : ''}" style="--fp-accent:${p.warning ? '#FCA5A5' : '#A78BFA'}">
        <span class="fp-glyph">🍅</span>
        ${pomoBlock}
      </div>
      <div class="fp-col" style="--fp-accent:#7C3AED">
        <div class="fp-head"><span class="fp-glyph">◎</span><button type="button" class="fp-gear" data-a="settings" title="校准">⚙</button></div>
        ${
          state.mainline
            ? `<div class="fp-mainline">${state.mainline.replace(/</g, '&lt;')}</div>`
            : `<button type="button" class="fp-link" data-a="mainline">写一句今日主线</button>`
        }
        <div class="fp-sub">${p.mode !== 'idle' ? (p.mode === 'focus' ? '番茄航行' : '休息') : '今日一句'}</div>
      </div>`
  }

  function bind() {
    const root = el('focusPillars')
    if (!root) return
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-a]')
      if (!btn) return
      e.stopPropagation()
      const a = btn.dataset.a
      if (a === 'start-pomo') {
        startPomodoro(state.intentDraft || getNowMeta().label)
      } else if (a === 'edit-intent') {
        state.editingIntent = true
        if (!state.intentDraft) state.intentDraft = getNowMeta().label
        render()
        el('fpIntent')?.focus()
      } else if (a === 'pause-pomo') {
        state.pomodoro.running = !state.pomodoro.running
        render()
      } else if (a === 'stop-pomo') stopPomodoro()
      else if (a === 'correct') {
        const altKey = correctionTarget(getNowMeta().key)
        const altCat = CATEGORIES[altKey]
        if (!altCat) return

        if (state.source === 'aw' && state.current?.app) {
          const prev = applyCurrentOverride(altKey)
          toast(`其实是${altCat.label}`, () => {
            if (prev) state.overrides[state.current.app.toLowerCase()] = prev
            else delete state.overrides[state.current.app.toLowerCase()]
            saveOverrides(state.overrides)
            pollAW()
          })
        } else {
          const s = state.sessions.find((x) => x.now)
          const prevCat = s?.cat
          if (s) {
            s.cat = altKey
            s.because = `已改为${altCat.label}`
          }
          if (state.current) state.current.category = altCat
          state.totalsByCategory = totalsFromSessions(state.sessions)
          toast(`其实是${altCat.label}`, () => {
            if (s && prevCat) {
              s.cat = prevCat
              s.because = ''
              if (state.current) state.current.category = CATEGORIES[prevCat]
              state.totalsByCategory = totalsFromSessions(state.sessions)
              render()
              onSync?.()
            }
          })
        }
        render()
        onSync?.()
      } else if (a === 'mainline' || a === 'settings') {
        const v = prompt('今日主线（一句话）', state.mainline)
        if (v !== null) {
          state.mainline = v.trim()
          localStorage.setItem('timelens-proto-mainline', state.mainline)
          render()
        }
      }
    })
    root.addEventListener('keydown', (e) => {
      if (e.target.id !== 'fpIntent') return
      if (e.key === 'Enter') {
        state.intentDraft = e.target.value
        state.editingIntent = false
        startPomodoro(state.intentDraft)
      }
      if (e.key === 'Escape') state.editingIntent = false
    })
    root.addEventListener('input', (e) => {
      if (e.target.id === 'fpIntent') {
        state.intentDraft = e.target.value
        state.intentEdited = true
      }
    })
  }

  function seedIntent() {
    if (!state.intentEdited) state.intentDraft = getNowMeta().label
  }

  return {
    state,
    useMock,
    pollAW,
    render,
    bind,
    seedIntent,
    getCategoryTotalsMinutes,
    getNowMeta,
    getSessions,
    toast,
  }
}
