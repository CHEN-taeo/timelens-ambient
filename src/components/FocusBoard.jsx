import { useState, useEffect, useRef, useMemo } from 'react'
import { useTimeStore } from '../store/useTimeStore.js'
import { CATEGORIES, correctionTarget } from '../utils/rules.js'
import { suggestPomodoroIntent } from '../utils/oodaIntent.js'
import { totalsMinutesFromSessions } from '../utils/sessionUtils.js'
import { useSettingsStore } from '../store/useSettingsStore.js'
import FocusMeiping from './FocusMeiping.jsx'
import FocusLegend from './FocusLegend.jsx'
import SettingsPanel from './SettingsPanel.jsx'

const PRODUCTIVE_GOAL_SEC = 4 * 3600

function fmtDur(sec = 0) {
  const m = Math.round(sec / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const r = m % 60
  return r > 0 ? `${h}h ${r}m` : `${h}h`
}

function mmss(seconds = 0) {
  const s = Math.max(0, Math.round(seconds))
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
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

function DayStrip({ strip }) {
  if (!strip?.length) return <div className="fp-ripple" />
  return (
    <div className="fp-ripple">
      {strip.map((slot, i) => {
        const c = slot.dominant ? CATEGORIES[slot.dominant] : null
        const op = slot.total > 0 ? 0.75 : 0.2
        const bg = c ? c.color : 'rgba(255,255,255,0.05)'
        return <span key={i} style={{ background: bg, opacity: op }} />
      })}
    </div>
  )
}

/** 四柱镜 + 梅瓶 — 与网页 focus-ui / focus-stage 同构 */
export default function FocusBoard() {
  const {
    connected,
    currentActivity,
    todayTotals,
    todaySessions,
    dayStrip,
    pomodoro,
    completedToday,
    startPomodoro,
    pausePomodoro,
    resumePomodoro,
    stopPomodoro,
    reclassifyToSuggested,
    history,
  } = useTimeStore()

  const [intentDraft, setIntentDraft] = useState('')
  const [intentEdited, setIntentEdited] = useState(false)
  const [editingIntent, setEditingIntent] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const oodaSeeded = useRef(false)
  const intentRef = useRef(null)

  const dailyGoal = useSettingsStore((s) => s.getDailyPomodoroGoal())
  const focusMin = useSettingsStore((s) => s.settings.pomodoroFocusMin)
  const mainline = useSettingsStore((s) => s.getMainline())

  const cat = currentActivity?.category || CATEGORIES.neutral
  const inFocus = pomodoro.mode === 'focus'
  const inBreak = pomodoro.mode === 'shortBreak' || pomodoro.mode === 'longBreak'
  const inPomodoro = inFocus || inBreak

  const sessionMins =
    currentActivity?.startedAt
      ? Math.max(0, Math.round((Date.now() - currentActivity.startedAt) / 60000))
      : 0

  const altKey = correctionTarget(cat.key)
  const altCat = CATEGORIES[altKey]
  const canCorrect = ['entertainment', 'neutral', 'comms'].includes(cat.key) && altCat
  const devMin = Math.max(1, Math.round(pomodoro.deviationStreak / 60))

  const productive = todayTotals.productiveSeconds || 0
  const goalPct = Math.min(100, Math.round((productive / PRODUCTIVE_GOAL_SEC) * 100))

  const sessions = todaySessions?.length
    ? todaySessions
    : [
        {
          cat: cat.key,
          mins: Math.max(sessionMins, 1),
          t: new Date().getHours() + new Date().getMinutes() / 60,
          app: shortApp(currentActivity?.app || cat.label),
          now: true,
          because: currentActivity?.because || '',
        },
      ]

  const categoryTotalsMinutes = useMemo(() => {
    const fromTotals = {}
    Object.entries(todayTotals.totalsByCategory || {}).forEach(([k, sec]) => {
      if (sec > 0) fromTotals[k] = sec / 60
    })
    if (Object.keys(fromTotals).length) return fromTotals
    return totalsMinutesFromSessions(sessions)
  }, [todayTotals.totalsByCategory, sessions])

  const nowMeta = {
    key: cat.key,
    color: cat.color,
    app: shortApp(currentActivity?.app || '—'),
    label: cat.label,
    sessionMins,
    because: currentActivity?.because || '',
  }

  useEffect(() => {
    if (pomodoro.mode !== 'idle') return
    if (oodaSeeded.current && intentEdited) return
    setIntentDraft(suggestPomodoroIntent({ currentActivity, history, todayTotals }))
    oodaSeeded.current = true
  }, [pomodoro.mode, currentActivity, history, todayTotals, intentEdited])

  useEffect(() => {
    if (pomodoro.mode === 'idle') return
    oodaSeeded.current = false
    setIntentEdited(false)
    setEditingIntent(false)
  }, [pomodoro.mode])

  useEffect(() => {
    if (editingIntent && intentRef.current) intentRef.current.focus()
  }, [editingIntent])

  const startRound = () => {
    startPomodoro(intentDraft.trim())
    setIntentDraft('')
    setEditingIntent(false)
  }

  if (showSettings) {
    return <SettingsPanel onBack={() => setShowSettings(false)} />
  }

  return (
    <>
      <span className={`aw-badge ${connected ? 'on' : ''}`}>
        {connected ? 'AW 已连接' : '演示数据'}
      </span>

      <div className="focus-vessel-wrap relative w-full shrink-0 tl-focus-vessel-slot">
        <FocusMeiping
          sessions={sessions}
          categoryTotalsMinutes={categoryTotalsMinutes}
          nowMeta={nowMeta}
          iceberg
        />
        <FocusLegend categoryTotalsMinutes={categoryTotalsMinutes} />
      </div>

      <div className="focus-pillars no-drag">
        <div className="fp-col" style={{ '--fp-accent': cat.color }}>
          <span className="fp-glyph">●</span>
          <div className="fp-title">{nowMeta.app}</div>
          <div className="fp-sub">
            {cat.label} · {sessionMins}m
          </div>
          {canCorrect ? (
            <button type="button" className="fp-link" onClick={() => reclassifyToSuggested()}>
              其实是{altCat.label}
            </button>
          ) : currentActivity?.because ? (
            <div className="fp-because" title={currentActivity.because}>
              {currentActivity.because}
            </div>
          ) : (
            <span className="fp-spacer" />
          )}
        </div>

        <div className="fp-col" style={{ '--fp-accent': '#90A8FF' }}>
          <span className="fp-glyph">〜</span>
          <div className="fp-title tnum">{fmtDur(productive)}</div>
          <div className="fp-sub">{voyageLine(productive)}</div>
          <div className="fp-goal">
            <i style={{ width: `${goalPct}%` }} />
          </div>
          <DayStrip strip={dayStrip} />
        </div>

        <div
          className={`fp-col ${inPomodoro ? 'active' : ''} ${pomodoro.warning && inFocus ? 'warn' : ''}`}
          style={{ '--fp-accent': pomodoro.warning && inFocus ? '#FCA5A5' : '#A78BFA' }}
        >
          <span className="fp-glyph">🍅</span>
          {pomodoro.mode === 'idle' ? (
            editingIntent ? (
              <>
                <input
                  ref={intentRef}
                  className="fp-inp"
                  value={intentDraft}
                  onChange={(e) => {
                    setIntentEdited(true)
                    setIntentDraft(e.target.value)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') startRound()
                    if (e.key === 'Escape') setEditingIntent(false)
                  }}
                  placeholder="这一轮…"
                />
                <button type="button" className="fp-go" onClick={startRound}>
                  ▶ {focusMin}min
                </button>
              </>
            ) : (
              <>
                <button type="button" className="fp-title" onClick={startRound}>
                  {intentDraft || cat.label}
                </button>
                <div className="fp-row">
                  <button type="button" className="fp-go" onClick={startRound}>
                    ▶ {focusMin}min
                  </button>
                  <button type="button" className="fp-muted" onClick={() => setEditingIntent(true)}>
                    改
                  </button>
                </div>
                <div className="fp-muted tnum">
                  {'🍅'.repeat(Math.min(completedToday, 8))}
                  {completedToday < dailyGoal ? ` +${dailyGoal - completedToday}` : ''}
                </div>
              </>
            )
          ) : (
            <div className="fp-pomo-run">
              <div className="fp-ring">
                <span className="tnum">{mmss(pomodoro.remaining)}</span>
              </div>
              <div className="fp-pomo-meta">
                <div className="fp-title">{pomodoro.intent || '专注'}</div>
                {pomodoro.warning && inFocus ? (
                  <div className="fp-warn">有点偏航 · {devMin}min</div>
                ) : null}
                <div className="fp-row">
                  <button
                    type="button"
                    className="fp-muted"
                    onClick={pomodoro.running ? pausePomodoro : resumePomodoro}
                  >
                    {pomodoro.running ? '停' : '续'}
                  </button>
                  <button type="button" className="fp-muted" onClick={stopPomodoro}>
                    结束
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="fp-col" style={{ '--fp-accent': '#7C3AED' }}>
          <div className="fp-head">
            <span className="fp-glyph">◎</span>
            <button
              type="button"
              className="fp-gear"
              title="校准"
              onClick={() => setShowSettings(true)}
            >
              ⚙
            </button>
          </div>
          {mainline ? (
            <div className="fp-mainline">{mainline}</div>
          ) : (
            <button type="button" className="fp-link" onClick={() => setShowSettings(true)}>
              写一句今日主线
            </button>
          )}
          <div className="fp-sub">
            {inPomodoro ? (inBreak ? '休息' : '番茄航行') : '今日一句'}
          </div>
        </div>
      </div>

      <div
        className="stage-cap"
        dangerouslySetInnerHTML={{
          __html: `梅瓶 · 流沙沉积一日 &nbsp;·&nbsp; 悬浮岛即瓶口 &nbsp;·&nbsp; <em>now · ${nowMeta.app}</em>`,
        }}
      />
    </>
  )
}
