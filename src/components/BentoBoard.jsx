import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { useTimeStore } from '../store/useTimeStore.js'
import { CATEGORIES, correctionTarget } from '../utils/rules.js'
import { suggestPomodoroIntent, oodaHint } from '../utils/oodaIntent.js'
import {
  showDayStrip,
  showHistory,
  showInsights,
  disclosureLabel,
} from '../utils/disclosure.js'
import PomodoroRing from './PomodoroRing.jsx'
import GlowIndicator from './GlowIndicator.jsx'
import DeadReckoningBar from './DeadReckoningBar.jsx'
import SettingsPanel from './SettingsPanel.jsx'
import { useSettingsStore } from '../store/useSettingsStore.js'

function fmt(seconds = 0) {
  const s = Math.max(0, Math.round(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function mmss(seconds = 0) {
  const s = Math.max(0, Math.round(seconds))
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

const fade = {
  hidden: { opacity: 0, y: 8 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.06 + i * 0.06, duration: 0.26, ease: 'easeOut' },
  }),
}

function timeWeather(entertainmentSec, productiveSec) {
  const ent = entertainmentSec || 0
  const prod = productiveSec || 0
  if (prod > 2 * 3600 && ent < 1800) return '☀ 专注晴'
  if (ent > 3600) return '⛅ 有娱乐云'
  if (prod > ent) return '🌤 节奏平稳'
  return '🌙 收工前'
}

function DayStrip({ strip }) {
  if (!strip?.length) return <div className="h-2 w-full rounded-full bg-white/5" />
  const max = Math.max(...strip.map((s) => s.total), 1)
  return (
    <div className="flex h-7 w-full items-end gap-[2px]">
      {strip.map((slot, i) => {
        const c = slot.dominant ? CATEGORIES[slot.dominant] : null
        const h = slot.total > 0 ? 20 + (slot.total / max) * 80 : 8
        return (
          <div
            key={i}
            className="flex-1 rounded-[2px]"
            style={{
              height: `${h}%`,
              background: c ? c.color : 'rgba(255,255,255,0.06)',
              opacity: slot.total > 0 ? 0.85 : 0.35,
            }}
            title={`${i}:00`}
          />
        )
      })}
    </div>
  )
}

function weekInsight(totalsByCategory = {}, totalSeconds = 0) {
  if (totalSeconds <= 0) return '数据积累中 — 继续用几天会有洞察'
  const entries = Object.entries(totalsByCategory).sort((a, b) => b[1] - a[1])
  const [topKey, topSec] = entries[0] || []
  const pct = Math.round((topSec / totalSeconds) * 100)
  const label = topKey ? CATEGORIES[topKey]?.label || topKey : '其他'
  return `今日 ${pct}% 时间在「${label}」`
}

export default function BentoBoard({ embedded = false }) {
  const {
    currentActivity,
    todayTotals,
    dayStrip,
    pomodoro,
    completedToday,
    interruptionsToday,
    history,
    startPomodoro,
    pausePomodoro,
    resumePomodoro,
    stopPomodoro,
    reclassifyToSuggested,
    edgeShimmer,
  } = useTimeStore()

  const [intent, setIntent] = useState('')
  const [intentEdited, setIntentEdited] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const oodaSeeded = useRef(false)

  const dailyGoal = useSettingsStore((s) => s.getDailyPomodoroGoal())
  const focusMin = useSettingsStore((s) => s.settings.pomodoroFocusMin)
  const mainline = useSettingsStore((s) => s.getMainline())
  useEffect(() => {
    if (pomodoro.mode !== 'idle') return
    if (oodaSeeded.current && intentEdited) return
    const suggested = suggestPomodoroIntent({
      currentActivity,
      history,
      todayTotals,
    })
    setIntent(suggested)
    oodaSeeded.current = true
  }, [pomodoro.mode, currentActivity, history, todayTotals, intentEdited])

  useEffect(() => {
    if (pomodoro.mode === 'idle') return
    oodaSeeded.current = false
    setIntentEdited(false)
  }, [pomodoro.mode])

  const oodaLabel = oodaHint(intent, intentEdited)

  const productive = todayTotals.productiveSeconds || 0
  const total = todayTotals.totalSeconds || 0
  const entertainment = todayTotals.totalsByCategory?.entertainment || 0
  const productivity = total > 0 ? Math.round((productive / total) * 100) : 0

  const cat = currentActivity?.category || CATEGORIES.neutral
  const inFocus = pomodoro.mode === 'focus'
  const inBreak = pomodoro.mode === 'shortBreak' || pomodoro.mode === 'longBreak'
  const inPomodoro = inFocus || inBreak
  const ringProgress = pomodoro.duration > 0 ? pomodoro.remaining / pomodoro.duration : 0
  const weather = timeWeather(entertainment, productive)

  const sessionMins =
    currentActivity?.startedAt
      ? Math.max(0, Math.round((Date.now() - currentActivity.startedAt) / 60000))
      : 0

  const altKey = correctionTarget(cat.key)
  const altCat = CATEGORIES[altKey]
  const correctableKeys = new Set(['entertainment', 'neutral', 'comms'])
  const canCorrect = correctableKeys.has(cat.key) && altCat && !currentActivity?.overridePattern

  let motionIdx = 0
  const nextIdx = () => motionIdx++

  if (showSettings) {
    return <SettingsPanel onBack={() => setShowSettings(false)} />
  }

  if (embedded) {
    return (
      <div
        className="no-drag grid h-full grid-cols-2 grid-rows-[auto_1fr_1fr] gap-1.5 p-2 pt-1"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="col-span-2 flex items-center justify-between px-0.5">
          <span className="text-[9px] text-txt-muted">{disclosureLabel()}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-txt-muted">{weather}</span>
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="rounded px-1 text-[10px] text-txt-muted hover:bg-white/5"
              title="校准 TimeLens"
            >
              ⚙
            </button>
          </div>
        </div>

        {mainline ? (
          <div className="col-span-2 truncate rounded-md border border-accent/15 bg-accent/5 px-2 py-0.5 text-[10px] text-txt-primary">
            {mainline}
          </div>
        ) : null}

        <DeadReckoningBar compact />
        <div
          className={`grid grid-cols-3 gap-0.5 ${edgeShimmer ? 'goal-shimmer rounded-lg p-0.5' : ''}`}
        >
          <Stat label="专注" value={fmt(productive)} accent="#6EE7B7" compact />
          <Stat label="娱乐" value={fmt(entertainment)} accent="#FCA5A5" compact />
          <Stat label="节奏" value={`${productivity}%`} accent="#A78BFA" compact />
        </div>

        <div className="flex min-h-0 flex-col justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1.5">
          <div className="mb-0.5 flex items-center gap-1">
            <GlowIndicator color={cat.color} glow={cat.glow} warning={pomodoro.warning} size={6} />
            <span className="truncate text-[10px] text-txt-secondary">{cat.label}</span>
          </div>
          <div className="truncate text-[10px] text-txt-primary">
            {currentActivity?.app?.replace(/\.exe$/i, '') || '等待…'}
          </div>
          {canCorrect && altCat ? (
            <button
              type="button"
              onClick={() => reclassifyToSuggested()}
              className="mt-1 truncate text-left text-[9px] text-accent-bright/80 hover:underline"
            >
              → {altCat.label}
            </button>
          ) : null}
        </div>

        <div className="flex min-h-0 flex-col justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] p-1.5">
          {pomodoro.mode === 'idle' ? (
            <>
              <input
                value={intent}
                onChange={(e) => {
                  setIntentEdited(true)
                  setIntent(e.target.value)
                }}
                placeholder={intent || cat.label}
                className="mb-1 w-full rounded border border-white/[0.08] bg-black/40 px-1.5 py-1 text-[10px] text-txt-primary outline-none focus:border-accent/40"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    startPomodoro(intent.trim())
                    setIntent('')
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  startPomodoro(intent.trim())
                  setIntent('')
                }}
                className="rounded bg-accent/90 py-1 text-[10px] font-medium text-white hover:bg-accent"
              >
                专注 {String(focusMin).padStart(2, '0')}:00
              </button>
              <div className="mt-1 flex justify-between text-[8px] text-txt-muted tnum">
                <span>{'🍅'.repeat(completedToday)}</span>
                <span>
                  {completedToday}/{dailyGoal}
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
                <PomodoroRing
                  progress={ringProgress}
                  size={48}
                  stroke={3}
                  color={inBreak ? '#6EE7B7' : '#7C3AED'}
                  warning={pomodoro.warning && inFocus}
                />
                <span className="absolute text-[11px] font-semibold text-txt-primary tnum">
                  {mmss(pomodoro.remaining)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[10px] text-txt-primary">
                  {pomodoro.intent || '专注'}
                </div>
                <div className="mt-1 flex gap-1">
                  <button
                    type="button"
                    onClick={pomodoro.running ? pausePomodoro : resumePomodoro}
                    className="rounded border border-white/10 px-1.5 py-0.5 text-[9px] text-txt-muted"
                  >
                    {pomodoro.running ? '暂停' : '继续'}
                  </button>
                  <button
                    type="button"
                    onClick={stopPomodoro}
                    className="rounded border border-white/10 px-1.5 py-0.5 text-[9px] text-txt-muted"
                  >
                    结束
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className="no-drag flex h-full flex-col gap-2 p-3 pb-2"
      onClick={(e) => e.stopPropagation()}
    >
      <motion.div
        variants={fade}
        initial="hidden"
        animate="show"
        custom={nextIdx()}
        className="flex w-full items-center justify-between px-0.5 py-0.5"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-accent-bright">◆</span>
          <span className="text-[11px] font-medium text-txt-primary">TimeLens</span>
        </div>
        <span className="text-[10px] text-txt-muted">{weather}</span>
      </motion.div>

      {mainline ? (
        <motion.div
          variants={fade}
          initial="hidden"
          animate="show"
          custom={nextIdx()}
          className="rounded-lg border border-accent/20 bg-accent/5 px-2.5 py-1.5"
        >
          <div className="text-[9px] text-accent-bright/70">今日主线</div>
          <div className="truncate text-[11px] text-txt-primary">{mainline}</div>
        </motion.div>
      ) : null}

      <motion.div variants={fade} initial="hidden" animate="show" custom={nextIdx()}>
        <DeadReckoningBar />
      </motion.div>

      <motion.div
        variants={fade}
        initial="hidden"
        animate="show"
        custom={nextIdx()}
        className={`grid grid-cols-3 gap-1 ${edgeShimmer ? 'goal-shimmer rounded-xl p-0.5' : ''}`}
      >
        <Stat label="专注" value={fmt(productive)} accent="#6EE7B7" />
        <Stat label="娱乐" value={fmt(entertainment)} accent="#FCA5A5" />
        <Stat label="节奏" value={`${productivity}%`} accent="#A78BFA" />
      </motion.div>

      {!inPomodoro ? (
        <motion.div
          variants={fade}
          initial="hidden"
          animate="show"
          custom={nextIdx()}
          className="rounded-xl border border-white/[0.06] bg-white/[0.025] px-2.5 py-2"
        >
          <div className="mb-1 flex items-center gap-1.5">
            <GlowIndicator color={cat.color} glow={cat.glow} warning={false} size={7} />
            <span className="text-[10px] font-medium text-txt-secondary">{cat.label}</span>
            {sessionMins > 0 ? (
              <span className="ml-auto text-[10px] text-txt-muted tnum">{sessionMins}min</span>
            ) : null}
          </div>
          <div className="truncate text-[11px] text-txt-primary">
            {currentActivity?.app?.replace(/\.exe$/i, '') || '等待 ActivityWatch…'}
          </div>
          {currentActivity?.because ? (
            <div className="mt-1 line-clamp-2 text-[10px] leading-snug text-txt-muted" title={currentActivity.because}>
              {currentActivity.because}
              {currentActivity.ruleIndex ? ` · #${currentActivity.ruleIndex}` : ''}
            </div>
          ) : null}
          {canCorrect && altCat ? (
            <button
              type="button"
              onClick={() => reclassifyToSuggested()}
              className="mt-2 w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-2 py-1.5 text-[10px] text-txt-secondary transition-colors hover:border-accent/40 hover:text-accent-bright"
            >
              这不是{cat.label.includes('摸鱼') ? '摸鱼' : cat.label.slice(0, 2)} → 记为「{altCat.label}」
            </button>
          ) : null}
          {currentActivity?.overridePattern ? (
            <div className="mt-1.5 text-[10px] text-accent-bright/70">✓ 已记住你的分类偏好</div>
          ) : null}
        </motion.div>
      ) : (
        <motion.div
          variants={fade}
          initial="hidden"
          animate="show"
          custom={nextIdx()}
          className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-2.5 py-2"
        >
          <GlowIndicator color={cat.color} glow={cat.glow} warning={pomodoro.warning} size={7} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[11px] text-txt-primary">
              {currentActivity?.app?.replace(/\.exe$/i, '') || cat.label}
            </div>
            <div className="text-[10px] text-txt-muted">当前窗口 · {cat.label}</div>
          </div>
          {canCorrect && altCat ? (
            <button
              type="button"
              onClick={() => reclassifyToSuggested()}
              className="shrink-0 rounded-md border border-white/[0.08] px-1.5 py-0.5 text-[9px] text-txt-muted hover:border-accent/40 hover:text-accent-bright"
            >
              纠正
            </button>
          ) : null}
        </motion.div>
      )}

      {showDayStrip() ? (
        <motion.div
          variants={fade}
          initial="hidden"
          animate="show"
          custom={nextIdx()}
          className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-2.5 py-2"
        >
          <div className="mb-1.5 flex justify-between text-[10px] text-txt-muted">
            <span>今日时间线</span>
            <span>0–24h</span>
          </div>
          <DayStrip strip={dayStrip} />
        </motion.div>
      ) : null}

      <motion.div
        variants={fade}
        initial="hidden"
        animate="show"
        custom={nextIdx()}
        className="relative min-h-[128px] flex-1 rounded-xl border border-white/[0.06] bg-white/[0.025] p-2"
      >
        {pomodoro.mode === 'idle' ? (
          <div className="flex h-full flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-txt-muted">开始一轮专注</span>
              {oodaLabel ? (
                <span className="truncate text-[9px] text-accent-bright/70">{oodaLabel}</span>
              ) : null}
            </div>
            <input
              value={intent}
              onChange={(e) => {
                setIntentEdited(true)
                setIntent(e.target.value)
              }}
              placeholder={cat.productive ? `当前：${cat.label}` : '这一轮想专注做什么？'}
              className="w-full rounded-lg border border-white/[0.08] bg-black/40 px-2.5 py-1.5 text-[12px] text-txt-primary outline-none placeholder:text-txt-muted focus:border-accent/50"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  startPomodoro(intent.trim())
                  setIntent('')
                }
              }}
            />
            <button
              type="button"
              onClick={() => {
                startPomodoro(intent.trim())
                setIntent('')
              }}
              className="rounded-lg bg-accent/90 py-1.5 text-[12px] font-medium text-white hover:bg-accent"
            >
              {intent.trim() ? `确认 · ${String(focusMin).padStart(2, '0')}:00` : `专注 ${String(focusMin).padStart(2, '0')}:00`}            </button>
            <div className="mt-auto flex items-center justify-between pt-1 text-[10px] text-txt-muted tnum">
              <span>{'🍅'.repeat(completedToday)}{'○'.repeat(Math.max(0, dailyGoal - completedToday))}</span>
              <span>
                {completedToday}/{dailyGoal}
                {showHistory() ? ` · 中断 ${interruptionsToday}` : ''}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center py-1">
            <div className="relative flex h-[100px] w-[100px] items-center justify-center">
              <PomodoroRing
                progress={ringProgress}
                size={100}
                stroke={3.5}
                color={inBreak ? '#6EE7B7' : '#7C3AED'}
                warning={pomodoro.warning && inFocus}
              />
              <div className="flex flex-col items-center">
                <span className="text-[22px] font-semibold leading-none text-txt-primary tnum">
                  {mmss(pomodoro.remaining)}
                </span>
                <span className="mt-1 max-w-[90px] truncate text-[10px] text-txt-muted">
                  {inBreak ? (pomodoro.mode === 'longBreak' ? '长休息' : '短休息') : pomodoro.intent || '专注'}
                </span>
                {pomodoro.warning && inFocus ? (
                  <span className="mt-0.5 text-[9px] text-[#F59E0B]">有点偏航 · {fmt(pomodoro.deviationStreak)}</span>
                ) : null}
              </div>
            </div>
            <div className="mt-2.5 flex gap-1.5">
              {pomodoro.running ? (
                <button
                  type="button"
                  onClick={pausePomodoro}
                  className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] text-txt-secondary hover:bg-white/5"
                >
                  暂停
                </button>
              ) : (
                <button
                  type="button"
                  onClick={resumePomodoro}
                  className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] text-txt-secondary hover:bg-white/5"
                >
                  继续
                </button>
              )}
              <button
                type="button"
                onClick={stopPomodoro}
                className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] text-txt-muted hover:bg-white/5"
              >
                结束
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {showInsights() ? (
        <motion.div
          variants={fade}
          initial="hidden"
          animate="show"
          custom={nextIdx()}
          className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2 text-[10px] text-txt-muted"
        >
          {weekInsight(todayTotals.totalsByCategory, total)}
        </motion.div>
      ) : null}

      {showHistory() && history.length > 0 && pomodoro.mode === 'idle' ? (
        <motion.div variants={fade} initial="hidden" animate="show" custom={nextIdx()} className="max-h-14 overflow-y-auto">
          {history.slice(0, 2).map((h, i) => (
            <div key={i} className="flex justify-between py-0.5 text-[10px]">
              <span className="truncate text-txt-secondary">
                {h.status === 'complete' ? '🍅' : '·'} {h.intent || '专注'}
              </span>
              <span className="text-txt-muted tnum">{fmt(h.durationSec)}</span>
            </div>
          ))}
        </motion.div>
      ) : null}
    </div>
  )
}

function Stat({ label, value, accent, compact = false }) {
  return (
    <div
      className={`rounded-lg border border-white/[0.06] bg-white/[0.025] ${compact ? 'px-1 py-1' : 'px-2 py-1.5'}`}
    >
      <div className={`tracking-wide text-txt-muted ${compact ? 'text-[8px]' : 'text-[9px]'}`}>
        {label}
      </div>
      <div
        className={`font-semibold tnum ${compact ? 'text-[10px]' : 'mt-0.5 text-[12px]'}`}
        style={{ color: accent }}
      >
        {value}
      </div>
    </div>
  )
}
