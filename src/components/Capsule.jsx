import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTimeStore } from '../store/useTimeStore.js'
import { CATEGORIES, shortLabel } from '../utils/rules.js'
import { deadReckoning, isFlowState } from '../utils/deadReckoning.js'
import { playConfirm } from '../utils/sounds.js'
import { useLiveClock } from '../hooks/useLiveClock.js'
import { useSettingsStore } from '../store/useSettingsStore.js'
import { computeCompactWidth, EXPANDED_W, EXPANDED_H, PILL_H, MENISCUS_DEW_W } from '../utils/capsuleLayout.js'
import { isWorkDayEnded } from '../utils/settings.js'
import {
  POUR_DURATION_MS,
} from '../utils/meniscusPourGeometry.js'
import LensRing from './LensRing.jsx'
import MeniscusVessel from './MeniscusVessel.jsx'
import GravityPour from './GravityPour.jsx'
import GlowIndicator from './GlowIndicator.jsx'
import BentoBoard from './BentoBoard.jsx'
import FocusBoard from './FocusBoard.jsx'
import PeakToast from './PeakToast.jsx'

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

function shortApp(app = '') {
  const base = app.replace(/\.exe$/i, '').split(/[/\\]/).pop() || app
  return base.length > 14 ? `${base.slice(0, 12)}…` : base
}

const spring = { type: 'spring', stiffness: 300, damping: 28 }
const dropEase = { duration: 0.38, ease: [0.34, 1.56, 0.64, 1] }
const peekEase = { duration: 0.38, ease: [0.25, 0.1, 0.25, 1] }
const PEEK_DELAY_MS = 400
const PEEK_PLUS_DELAY_MS = 800
const FOCUS_MA_MS = 200
const DRAG_W = 8
const CLOSE_W = 28
const RING_W = 28

export default function Capsule() {
  const [peek, setPeek] = useState(false)
  const [peekPlus, setPeekPlus] = useState(false)
  const [focus, setFocus] = useState(false)
  const [expanding, setExpanding] = useState(false)
  const [anchorPos, setAnchorPos] = useState({ x: 0, y: 12, screenX: 0, screenY: 12 })
  const [hovering, setHovering] = useState(false)
  const [pomoFloat, setPomoFloat] = useState(false)
  const [pourProgress, setPourProgress] = useState(0)
  const [pointerBias, setPointerBias] = useState(0)

  const now = useLiveClock()
  const getProductiveGoalSeconds = useSettingsStore((s) => s.getProductiveGoalSeconds)
  const getWorkDay = useSettingsStore((s) => s.getWorkDay)
  const presentationMode = useSettingsStore((s) => s.settings.presentationMode)
  const settingsSnapshot = useSettingsStore((s) => s.settings)
  const pillRef = useRef(null)
  const peekTimer = useRef(null)
  const peekPlusTimer = useRef(null)
  const focusTimer = useRef(null)

  const {
    connected,
    currentActivity,
    todayTotals,
    pomodoro,
    toast,
    clearToast,
    startPomodoro,
    capsulePulse,
    edgeShimmer,
  } = useTimeStore()

  const cat = currentActivity?.category || CATEGORIES.neutral
  const inFocus = pomodoro.mode === 'focus'
  const inBreak = pomodoro.mode === 'shortBreak' || pomodoro.mode === 'longBreak'
  const inPomodoro = inFocus || inBreak
  const warning = pomodoro.warning && inFocus

  const glowColor = warning ? CATEGORIES.entertainment.glow : inBreak ? CATEGORIES.project.glow : cat.glow
  const edgeColor = warning ? '#FCA5A5' : inBreak ? '#6EE7B7' : cat.color

  const sessionSeconds =
    currentActivity?.startedAt
      ? Math.max(0, Math.round((Date.now() - currentActivity.startedAt) / 1000))
      : 0

  const sessionMins =
    currentActivity?.startedAt
      ? Math.max(0, Math.round((Date.now() - currentActivity.startedAt) / 60000))
      : 0

  const flowActive = isFlowState({
    sessionSeconds,
    productive: cat.productive,
    inPomodoro,
  })

  const dr = deadReckoning({
    productiveSeconds: todayTotals.productiveSeconds || 0,
    flowActive,
    now,
    dailyGoalSeconds: getProductiveGoalSeconds(),
    ...getWorkDay(),
  })
  const dotColor = warning ? edgeColor : dr.color
  const dotGlow = warning ? glowColor : dr.glow

  let timeText = '—'
  if (connected && inPomodoro) timeText = mmss(pomodoro.remaining)
  else if (connected) timeText = fmt(todayTotals.productiveSeconds)

  const label = shortLabel(cat.key)
  const appShort = shortApp(currentActivity?.app || '')

  const expanded = focus || expanding
  const driftMins = warning ? Math.max(1, Math.round(pomodoro.deviationStreak / 60)) : 0
  const workDayEnded = isWorkDayEnded(now, settingsSnapshot)
  const isEntertainment = cat.key === 'entertainment'
  const entertainmentRipple = isEntertainment && sessionSeconds > 45 && !flowActive

  const signatureHue = warning ? '#FCA5A5' : dotColor
  const signatureGlow = warning ? 'rgba(252,165,165,0.45)' : dotGlow
  const fillPct = dr.markPct
  const goalReached = dr.mode === 'goal'

  const useMeniscus = presentationMode === 'meniscus'
  const useLensSignature = !useMeniscus

  const liquidHue = signatureHue
  const liquidGlow = signatureGlow
  const horizonHue = dr.color

  const showBoard = useMeniscus ? expanded : focus && !expanding
  const showPourOverlay = !useMeniscus && expanded && pourProgress < 0.99
  const boardFade = useMeniscus
    ? expanding
      ? Math.min(1, pourProgress * 1.8)
      : 1
    : 1

  let signatureState = 'ambient'
  if (expanded) signatureState = 'focus'
  else if (useMeniscus && workDayEnded) signatureState = 'settle'
  else if (presentationMode === 'minimal' && !expanded) signatureState = 'minimal'
  else if (flowActive && !peek && !peekPlus) signatureState = 'minimal'
  else if (peekPlus || peek) signatureState = 'peek'

  const showSplitTrailing =
    useLensSignature && (connected || peek) && signatureState !== 'minimal'
  const showSplitLeading = peek || peekPlus || (inFocus && warning) || (!connected && peek)
  const showMeniscusPeek = useMeniscus && !expanded && (peek || peekPlus) && !focus && !flowActive
  const dewW = MENISCUS_DEW_W

  const compactW = useMemo(
    () =>
      computeCompactWidth({
        presentationMode,
        peek,
        peekPlus,
        timeText,
        label,
        appShort,
        warning,
        connected,
        signatureState,
      }),
    [
      presentationMode,
      peek,
      peekPlus,
      timeText,
      label,
      appShort,
      warning,
      connected,
      signatureState,
    ]
  )

  const contentWidth = expanded ? EXPANDED_W - DRAG_W - CLOSE_W : compactW - DRAG_W

  useEffect(() => {
    if (!capsulePulse) return
    setPomoFloat(true)
    const t = setTimeout(() => setPomoFloat(false), 1300)
    return () => clearTimeout(t)
  }, [capsulePulse])

  const clearTimers = useCallback(() => {
    clearTimeout(peekTimer.current)
    clearTimeout(peekPlusTimer.current)
    clearTimeout(focusTimer.current)
  }, [])

  const fitCompact = useCallback(
    (w) => {
      if (!window.timelens?.fitWindow) return
      window.timelens.fitWindow(w ?? compactW, PILL_H)
    },
    [compactW]
  )

  const openFocus = useCallback(async () => {
    try {
      const anchor = await window.timelens?.getAnchor?.()
      if (anchor) setAnchorPos(anchor)
    } catch {
      /* keep last anchor */
    }
    window.timelens?.setWindowMode?.('expanded')
    playConfirm()
    setPourProgress(0)
    setExpanding(true)
    setFocus(true)
    const ms = presentationMode === 'meniscus' ? POUR_DURATION_MS : FOCUS_MA_MS
    focusTimer.current = setTimeout(() => {
      setExpanding(false)
      setPourProgress(1)
    }, ms)
  }, [presentationMode])

  const closeFocus = useCallback(() => {
    clearTimers()
    setFocus(false)
    setPeek(false)
    setPeekPlus(false)
    setExpanding(false)
    setPourProgress(0)
    window.timelens?.setWindowMode?.('compact', compactW, PILL_H, anchorPos.screenX, anchorPos.screenY)
  }, [clearTimers, anchorPos.screenX, anchorPos.screenY, compactW])

  const handleEnter = () => {
    if (focus || flowActive) return
    setHovering(true)
    clearTimeout(peekTimer.current)
    clearTimeout(peekPlusTimer.current)
    peekTimer.current = setTimeout(() => setPeek(true), PEEK_DELAY_MS)
    peekPlusTimer.current = setTimeout(() => setPeekPlus(true), PEEK_PLUS_DELAY_MS)
  }

  const handleLeave = () => {
    if (focus) return
    setHovering(false)
    setPointerBias(0)
    clearTimeout(peekTimer.current)
    clearTimeout(peekPlusTimer.current)
    setPeek(false)
    setPeekPlus(false)
  }

  const handleMeniscusPointerMove = (e) => {
    if (!useMeniscus || expanded || focus || flowActive) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    setPointerBias(Math.max(-1, Math.min(1, (x / Math.max(rect.width, 1)) * 2 - 1)))
  }

  const handlePillClick = (e) => {
    if (expanding || focus) return
    e.stopPropagation()
    clearTimers()
    setPeek(true)
    openFocus()
  }

  const handleDotClick = (e) => {
    e.stopPropagation()
    if (!connected || inPomodoro) return
    if (pomodoro.mode === 'idle') {
      const intent =
        currentActivity?.title?.slice(0, 40) || currentActivity?.category?.label || '专注'
      startPomodoro(intent)
    }
  }

  useEffect(() => {
    if (!expanding || presentationMode !== 'meniscus') return
    const start = performance.now()
    let raf
    const tick = (now) => {
      const p = Math.min(1, (now - start) / POUR_DURATION_MS)
      setPourProgress(p)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [expanding, presentationMode])

  useEffect(() => {
    if (expanded || !useMeniscus) return
    const extra = showMeniscusPeek ? (peekPlus ? 132 : 96) : 0
    fitCompact(compactW + extra)
  }, [expanded, useMeniscus, showMeniscusPeek, peekPlus, compactW, fitCompact])

  useEffect(() => {
    if (expanded) return
    if (useMeniscus && (peek || peekPlus)) return
    fitCompact(compactW)
  }, [expanded, compactW, fitCompact, useMeniscus, peek, peekPlus])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && (focus || expanding)) closeFocus()
      else if (e.key === 'Escape') clearToast()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [focus, expanding, closeFocus, clearToast])

  useEffect(() => () => clearTimers(), [clearTimers])

  useEffect(() => {
    const root = document.documentElement
    const body = document.body
    const appRoot = document.getElementById('root')
    if (expanded) {
      root.style.width = '100%'
      root.style.height = '100%'
      body.style.width = '100%'
      body.style.height = '100%'
      appRoot?.classList.add('timelens-overlay')
    } else {
      root.style.width = 'fit-content'
      root.style.height = 'fit-content'
      body.style.width = 'fit-content'
      body.style.height = 'fit-content'
      appRoot?.classList.remove('timelens-overlay')
    }
    return () => {
      root.style.width = ''
      root.style.height = ''
      body.style.width = ''
      body.style.height = ''
      appRoot?.classList.remove('timelens-overlay')
    }
  }, [expanded])

  const renderSplitCapsule = () => {
    if (!connected && peekPlus) {
      return (
        <span className="truncate text-[11px] text-txt-muted/60">
          示例 · 编程 · 2h14m
        </span>
      )
    }
    if (!connected && peek) {
      return <span className="text-[11px] text-txt-muted">未连接</span>
    }
    if (inFocus && warning) {
      return (
        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
          <span className="truncate text-[10px] text-[#F59E0B]">有点偏航</span>
          <span className="shrink-0 text-[11px] font-medium text-txt-primary tnum">{timeText}</span>
        </div>
      )
    }

    const showCat = showSplitLeading && (peek || peekPlus)
    const showPlus = peekPlus && connected

    return (
      <div className="flex min-w-0 items-center gap-1.5">
        {showCat ? (
          <>
            <motion.span
              className="overflow-hidden whitespace-nowrap text-[11px] text-txt-secondary"
              animate={{ maxWidth: 88, opacity: 1 }}
              transition={peekEase}
            >
              {label}
            </motion.span>
            {showPlus ? (
              <>
                <span className="text-[10px] text-txt-muted"> · </span>
                <motion.span
                  className="truncate text-[11px] text-txt-secondary"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={peekEase}
                >
                  {appShort}
                </motion.span>
                {sessionMins > 0 ? (
                  <span className="text-[11px] text-txt-muted tnum"> · {sessionMins}min</span>
                ) : null}
              </>
            ) : (
              <span className="text-[10px] text-txt-muted"> · </span>
            )}
          </>
        ) : null}
        {showSplitTrailing ? (
          <span className="shrink-0 text-[11px] font-medium text-txt-primary tnum">{timeText}</span>
        ) : null}
      </div>
    )
  }

  const expandedTitle = inPomodoro
    ? pomodoro.intent || (inBreak ? '休息' : '专注')
    : currentActivity?.app?.replace(/\.exe$/i, '') || label

  const horizonW = expanded ? EXPANDED_W : compactW

  const capsuleCard = (
    <div className="relative">
      <AnimatePresence>
        {pomoFloat ? (
          <motion.div
            key="pomo-float"
            initial={{ opacity: 0, y: 0, x: '-50%' }}
            animate={{ opacity: [0, 1, 0], y: [0, -18, -22] }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="pointer-events-none absolute left-1/2 top-0 z-40 whitespace-nowrap text-[12px] text-[#f0a030]"
          >
            +1 🍅
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.div
        transition={
          useMeniscus && expanding
            ? { duration: POUR_DURATION_MS / 1000, ease: [0.34, 1.56, 0.64, 1] }
            : spring
        }
        animate={{
          width: expanded ? EXPANDED_W : compactW,
          height: expanded ? EXPANDED_H : PILL_H,
          borderRadius: expanded ? 16 : useMeniscus ? 0 : 999,
          scale: capsulePulse ? [1, 1.05, 0.98, 1] : 1,
          opacity:
            useMeniscus && signatureState === 'minimal' && !expanded
              ? 0.24
              : flowActive && !expanded && signatureState === 'minimal' && !useMeniscus
                ? 0.28
                : 1,
        }}
        className={`relative flex flex-col backdrop-blur-[24px] backdrop-saturate-150 ${edgeShimmer ? 'edge-shimmer' : ''} ${
          useMeniscus && !expanded ? 'meniscus-dock overflow-visible border-0 bg-transparent shadow-none backdrop-blur-none' : 'overflow-hidden border'
        } ${useMeniscus && !expanded ? '' : ''}`}
        style={{
          background: useMeniscus && !expanded
            ? 'transparent'
            : expanded
              ? 'rgba(10,10,16,0.94)'
              : 'rgba(10,10,16,0.55)',
          borderColor: useMeniscus && !expanded
            ? 'transparent'
            : expanded
              ? 'rgba(255,255,255,0.10)'
              : 'rgba(255,255,255,0.08)',
          boxShadow: useMeniscus && !expanded
            ? 'none'
            : expanded
              ? `0 0 0 1px rgba(255,255,255,0.05), 0 16px 40px rgba(0,0,0,0.55), 0 0 16px ${useMeniscus ? liquidGlow : signatureGlow}`
              : `0 0 0 1px rgba(255,255,255,0.04), 0 0 10px ${useMeniscus ? liquidGlow : signatureGlow}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {useLensSignature ? (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-[25] h-px"
            style={{
              background: `linear-gradient(90deg, transparent 5%, ${signatureHue} 50%, transparent 95%)`,
              opacity: presentationMode === 'horizon' ? 0.7 : expanded ? 0.55 : 0.42,
            }}
          />
        ) : null}

        {showPourOverlay ? (
          <GravityPour
            width={EXPANDED_W}
            height={EXPANDED_H}
            pillH={PILL_H}
            fillPct={fillPct}
            hue={liquidHue}
            glow={liquidGlow}
            progress={pourProgress}
            gradientId="gravity-pour"
          />
        ) : null}

        <AnimatePresence>
          {expanding && !useMeniscus ? (
            <motion.div
              key="pour-drip"
              initial={{ height: 0, opacity: 0.8 }}
              animate={{ height: 14, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.38, ease: [0.34, 1.56, 0.64, 1] }}
              className="pointer-events-none absolute left-1/2 top-full z-30 w-[3px] -translate-x-1/2 rounded-full"
              style={{
                background: `linear-gradient(to bottom, ${signatureHue}, transparent)`,
              }}
            />
          ) : null}
        </AnimatePresence>

        <div
          ref={pillRef}
          className={`relative z-20 flex shrink-0 items-stretch ${expanded ? 'border-b border-white/[0.06]' : ''}`}
          style={{ height: PILL_H }}
        >
          <div
            className="drag flex shrink-0 cursor-grab items-center justify-center opacity-40 hover:opacity-70"
            style={{ width: DRAG_W }}
            title="拖动"
          >
            <span className="text-[8px] leading-none text-txt-muted">⋮</span>
          </div>

          {useMeniscus ? (
            <div
              className={`no-drag relative flex min-w-0 flex-1 items-center ${expanded ? 'justify-center' : ''}`}
              style={{ width: expanded ? contentWidth : dewW }}
              onMouseMove={handleMeniscusPointerMove}
              onMouseLeave={() => setPointerBias(0)}
            >
              <div className="relative shrink-0" style={{ width: dewW, height: PILL_H }}>
                <MeniscusVessel
                  width={dewW}
                  height={PILL_H}
                  fillPct={fillPct}
                  hue={liquidHue}
                  horizonHue={horizonHue}
                  glow={liquidGlow}
                  visualState={expanded ? 'focus' : signatureState}
                  categoryKey={cat.key}
                  productiveSeconds={todayTotals.productiveSeconds || 0}
                  sessionSeconds={sessionSeconds}
                  warning={warning}
                  entertainment={entertainmentRipple}
                  flow={flowActive && !expanded}
                  hovered={hovering && signatureState === 'ambient' && !expanded}
                  peek={peek && !peekPlus}
                  peekPlus={peekPlus}
                  wetBias={pointerBias}
                  gradientId={expanded ? 'meniscus-expanded' : 'meniscus-compact'}
                />
                {!expanded && !flowActive ? (
                  <button
                    type="button"
                    onClick={handleDotClick}
                    className="no-drag absolute z-20 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{ left: '61.8%', top: '42%' }}
                    title={connected ? '单击开始番茄' : 'ActivityWatch 未连接'}
                    aria-label="开始番茄"
                  />
                ) : null}
                <button
                  type="button"
                  onClick={expanded ? closeFocus : handlePillClick}
                  className="no-drag absolute inset-0 z-10 rounded-[18px]"
                  title={expanded ? '单击收起' : connected ? '单击展开' : '查看连接状态'}
                  aria-label={expanded ? '收起' : '展开'}
                />
              </div>
              {showMeniscusPeek ? (
                <motion.div
                  className={`meniscus-peek pointer-events-none absolute left-full top-1/2 z-30 flex h-[30px] -translate-y-1/2 items-center whitespace-nowrap rounded-[15px] border border-white/[0.1] bg-[rgba(18,18,28,0.82)] px-3 text-[12px] text-txt-primary ${peekPlus ? 'peek-plus' : ''}`}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 12 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={peekEase}
                >
                  {!connected && peekPlus ? (
                    <span className="text-txt-muted/60">示例 · 编程 · 2h14m</span>
                  ) : !connected && peek ? (
                    <span className="text-txt-muted">未连接</span>
                  ) : inFocus && warning ? (
                    <span className="tnum">
                      {label} · {sessionMins}m
                      <span className="text-[#F59E0B]"> · 有点偏航</span>
                    </span>
                  ) : peekPlus ? (
                    <>
                      {label} · {sessionMins}m
                      <span className="meniscus-peek-sub ml-2 text-[11px] text-txt-secondary">{appShort}</span>
                    </>
                  ) : (
                    <span className="tnum">
                      {label} · {sessionMins}m
                    </span>
                  )}
                </motion.div>
              ) : null}
            </div>
          ) : (
            <div className="relative flex min-w-0 shrink-0 items-center" style={{ width: contentWidth }}>
              {(presentationMode === 'lens-ring' ||
                presentationMode === 'horizon' ||
                presentationMode === 'minimal') && (
                <LensRing
                  width={RING_W}
                  height={PILL_H}
                  progressPct={fillPct}
                  hue={signatureHue}
                  glow={signatureGlow}
                  visualState={signatureState}
                  warning={warning}
                  flow={flowActive && !expanded}
                  showArc={presentationMode !== 'horizon' && signatureState !== 'minimal'}
                  showGoalMarker={goalReached}
                  horizonWidth={presentationMode === 'horizon' ? horizonW : undefined}
                />
              )}
              {presentationMode === 'standard' && (
                <div className="flex shrink-0 items-center pl-1">
                  <GlowIndicator
                    color={signatureHue}
                    glow={signatureGlow}
                    warning={warning}
                    flow={flowActive && !expanded}
                    size={7}
                    colorTransitionMs={500}
                  />
                </div>
              )}

              {!expanded ? (
                <>
                  <button
                    type="button"
                    onClick={handleDotClick}
                    className="no-drag absolute left-[8px] top-0 z-10 h-full w-[22px]"
                    title={connected ? '单击开始番茄' : 'ActivityWatch 未连接'}
                    aria-label="开始番茄"
                  />
                  <button
                    type="button"
                    onClick={handlePillClick}
                    className="no-drag relative z-10 flex min-w-0 shrink-0 items-center overflow-hidden pl-0.5 pr-1.5"
                    style={{
                      marginLeft:
                        presentationMode === 'standard' ? 4 : presentationMode === 'minimal' ? RING_W : 0,
                    }}
                    title={connected ? '单击展开' : '查看连接状态'}
                  >
                    {signatureState === 'minimal' ? null : (
                      <motion.div
                        className="min-w-0 flex-1"
                        initial={false}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...peekEase, delay: showSplitLeading ? 0.2 : 0 }}
                      >
                        {renderSplitCapsule()}
                      </motion.div>
                    )}
                  </button>
                </>
              ) : (
                <div className="pointer-events-none flex min-w-0 flex-1 items-center gap-2 px-2">
                  <LensRing
                    width={RING_W}
                    height={PILL_H}
                    progressPct={fillPct}
                    hue={signatureHue}
                    glow={signatureGlow}
                    visualState="focus"
                    warning={warning}
                    showArc
                    showGoalMarker={goalReached}
                  />
                  <span className="truncate text-[11px] text-txt-secondary">{expandedTitle}</span>
                </div>
              )}
            </div>
          )}

          {expanded ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                closeFocus()
              }}
              className="no-drag flex shrink-0 items-center justify-center text-[11px] text-txt-muted hover:text-txt-primary"
              style={{ width: CLOSE_W }}
              title="收起"
            >
              ✕
            </button>
          ) : null}
        </div>

        {useMeniscus && expanded ? (
          <motion.div
            className="pointer-events-none absolute z-[24] w-[3px] -translate-x-1/2 rounded-full"
            style={{
              left: DRAG_W + contentWidth / 2,
              top: PILL_H - 1,
              background: `linear-gradient(to bottom, color-mix(in srgb, ${liquidHue} 88%, transparent), transparent)`,
            }}
            initial={false}
            animate={{
              height: expanding ? 8 + pourProgress * 10 : 10,
              opacity: expanding ? 0.35 + pourProgress * 0.4 : 0.55,
            }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />
        ) : null}

      <AnimatePresence initial={false}>
        {showBoard ? (
          <motion.div
            key="board-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: EXPANDED_H - PILL_H,
              opacity: boardFade,
              y: 0,
            }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.28, ease: 'easeIn' } }}
            transition={
              useMeniscus && expanding
                ? { duration: 0.55, ease: [0.32, 1.22, 0.46, 1] }
                : dropEase
            }
            className="no-drag relative z-[12] min-h-0 flex-1 overflow-hidden"
          >
            {!connected ? (
              <DisconnectedPanel />
            ) : useMeniscus ? (
              <FocusBoard open={boardFade > 0.12} />
            ) : (
              <BentoBoard embedded />
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {toast ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30">
            <PeakToast
              toast={toast}
              onDismiss={clearToast}
              onUndo={toast.onUndo ? () => toast.onUndo() : undefined}
            />
          </div>
        ) : null}
      </AnimatePresence>
    </motion.div>
    </div>
  )

  if (expanded) {
    return (
      <div className="fixed inset-0 z-0 bg-black/12" onClick={closeFocus} role="presentation">
        <div
          className="absolute z-10"
          style={{ left: anchorPos.x, top: anchorPos.y, width: EXPANDED_W, height: EXPANDED_H }}
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          {capsuleCard}
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative overflow-visible"
      style={{ width: compactW, height: PILL_H }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {capsuleCard}
    </div>
  )
}

function DisconnectedPanel() {
  return (
    <div className="flex h-full flex-col gap-2.5 p-3 pb-2">
      <div className="px-0.5 text-[11px] font-medium text-txt-primary">TimeLens · 离线</div>
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-3">
        <div className="text-[12px] text-txt-secondary">ActivityWatch 未连接</div>
        <div className="mt-1.5 text-[10px] leading-relaxed text-txt-muted">
          请确认 aw-qt 或 aw-server 正在运行
        </div>
        <div className="mt-2 rounded-lg border border-dashed border-white/[0.08] px-2.5 py-2">
          <div className="text-[10px] text-txt-muted">连接后你会看到：</div>
          <div className="mt-1 text-[11px] text-txt-muted/50">● 编程 · 2h14m</div>
        </div>
      </div>
      <div className="mt-auto text-[10px] text-txt-muted">点击外部或 Esc 收起</div>
    </div>
  )
}
