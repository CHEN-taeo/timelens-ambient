import { useState, useRef, useEffect, useCallback } from 'react'
import { useTimeStore } from '../store/useTimeStore.js'
import { CATEGORIES, shortLabel } from '../utils/rules.js'
import { deadReckoning, isFlowState } from '../utils/deadReckoning.js'
import { playConfirm } from '../utils/sounds.js'
import { useLiveClock } from '../hooks/useLiveClock.js'
import { useMeniscusLayout } from '../hooks/useMeniscusLayout.js'
import { useSettingsStore } from '../store/useSettingsStore.js'
import { meniscusLayoutCssVars } from '../utils/meniscusScreenLayout.js'
import { focusMeipingLipOuterPx } from '../utils/focusMeipingBuild.js'
import { isWorkDayEnded } from '../utils/settings.js'
import MeniscusVessel from './MeniscusVessel.jsx'
import IcebergNeck from './IcebergNeck.jsx'
import FocusBoard from './FocusBoard.jsx'
import PeakToast from './PeakToast.jsx'

const MA = { peek: 400, peekPlus: 800, focus: 200, pour: 480, close: 360 }
const BACKDROP_ARM_MS = 520

function shortApp(app = '') {
  const base = app.replace(/\.exe$/i, '').split(/[/\\]/).pop() || app
  return base.length > 14 ? `${base.slice(0, 12)}…` : base
}

export default function MeniscusCapsule() {
  const [peek, setPeek] = useState(false)
  const [peekPlus, setPeekPlus] = useState(false)
  const [focus, setFocus] = useState(false)
  const [pouring, setPouring] = useState(false)
  const [closing, setClosing] = useState(false)
  const [backdropArmed, setBackdropArmed] = useState(false)
  const [anchorPos, setAnchorPos] = useState({ x: 0, y: 12, screenX: 0, screenY: 12 })
  const [hovering, setHovering] = useState(false)
  const [pointerBias, setPointerBias] = useState(0)
  const [pomoFloat, setPomoFloat] = useState(false)
  const [crystalToast, setCrystalToast] = useState(false)

  const peekTimer = useRef(null)
  const peekPlusTimer = useRef(null)
  const maTimer = useRef(null)
  const closeTimer = useRef(null)
  const openGuardUntil = useRef(0)

  const now = useLiveClock()
  const layout = useMeniscusLayout()
  const layoutVars = meniscusLayoutCssVars(layout)
  const { dewW, dockH, shellW, expandedW, expandedH, peekExtra, peekPlusExtra, dragW, neckBridgeH } =
    layout
  const lipOuterPx = focusMeipingLipOuterPx(expandedW)
  const getProductiveGoalSeconds = useSettingsStore((s) => s.getProductiveGoalSeconds)
  const getWorkDay = useSettingsStore((s) => s.getWorkDay)
  const settingsSnapshot = useSettingsStore((s) => s.settings)

  const {
    connected,
    currentActivity,
    todayTotals,
    pomodoro,
    toast,
    clearToast,
    capsulePulse,
  } = useTimeStore()

  const cat = currentActivity?.category || CATEGORIES.neutral
  const inFocus = pomodoro.mode === 'focus'
  const inBreak = pomodoro.mode === 'shortBreak' || pomodoro.mode === 'longBreak'
  const inPomodoro = inFocus || inBreak
  const warning = pomodoro.warning && inFocus

  const sessionSeconds =
    currentActivity?.startedAt
      ? Math.max(0, Math.round((Date.now() - currentActivity.startedAt) / 1000))
      : 0
  const sessionMins =
    currentActivity?.startedAt
      ? Math.max(0, Math.round((Date.now() - currentActivity.startedAt) / 60000))
      : 0

  const flowActive = isFlowState({ sessionSeconds, productive: cat.productive, inPomodoro })

  const dr = deadReckoning({
    productiveSeconds: todayTotals.productiveSeconds || 0,
    flowActive,
    now,
    dailyGoalSeconds: getProductiveGoalSeconds(),
    ...getWorkDay(),
  })

  const workDayEnded = isWorkDayEnded(now, settingsSnapshot)
  const isEntertainment = cat.key === 'entertainment'
  const entertainmentRipple = isEntertainment && sessionSeconds > 45 && !flowActive

  const liquidHue = entertainmentRipple ? '#F0A030' : cat.color
  const liquidGlow = cat.glow
  const horizonHue = dr.color
  const fillPct = dr.markPct

  const label = shortLabel(cat.key)
  const appShort = shortApp(currentActivity?.app || '')

  const expanded = focus || pouring || closing

  let signatureState = 'ambient'
  if (expanded) signatureState = 'focus'
  else if (workDayEnded) signatureState = 'settle'
  else if (peekPlus || peek) signatureState = 'peek'

  const clearPeekTimers = useCallback(() => {
    clearTimeout(peekTimer.current)
    clearTimeout(peekPlusTimer.current)
  }, [])

  const clearMaTimers = useCallback(() => {
    clearTimeout(maTimer.current)
    clearTimeout(closeTimer.current)
  }, [])

  const fitCompact = useCallback(
    (w) => {
      if (!window.timelens?.fitWindow) return
      window.timelens.fitWindow(w ?? shellW, dockH, true, dragW, dewW)
    },
    [shellW, dockH, dragW, dewW]
  )

  const openFocus = useCallback(() => {
    if (focus || pouring || closing || Date.now() < openGuardUntil.current) return

    openGuardUntil.current = Date.now() + BACKDROP_ARM_MS + 120
    setBackdropArmed(false)

    clearPeekTimers()
    setPeek(false)
    setPeekPlus(false)
    setClosing(false)
    setPouring(true)
    setFocus(true)
    playConfirm()

    window.timelens?.getAnchor?.().then((next) => {
      if (next) setAnchorPos(next)
      window.timelens?.setWindowMode?.('expanded')
    }).catch(() => {
      window.timelens?.setWindowMode?.('expanded')
    })

    maTimer.current = setTimeout(() => setPouring(false), MA.focus)
  }, [focus, pouring, closing, clearPeekTimers])

  const closeFocus = useCallback(() => {
    if (!focus && !pouring && !closing) return
    if (closing) return
    if (Date.now() < openGuardUntil.current) return

    clearPeekTimers()
    clearMaTimers()
    setBackdropArmed(false)
    setPouring(false)
    setFocus(false)
    setClosing(true)

    closeTimer.current = setTimeout(() => {
      setClosing(false)
      window.timelens?.setWindowMode?.('compact', shellW, dockH, null, null, dragW, dewW)
      window.timelens?.fitWindow?.(shellW, dockH, true, dragW, dewW)
    }, MA.close)
  }, [focus, pouring, closing, clearPeekTimers, clearMaTimers, shellW, dockH, dragW, dewW])

  const handleBackdropPointerUp = useCallback(
    (e) => {
      if (!backdropArmed) return
      if (e.target !== e.currentTarget) return
      closeFocus()
    },
    [backdropArmed, closeFocus]
  )

  const handleEnter = () => {
    if (expanded || flowActive) return
    setHovering(true)
    clearPeekTimers()
    peekTimer.current = setTimeout(() => setPeek(true), MA.peek)
    peekPlusTimer.current = setTimeout(() => setPeekPlus(true), MA.peekPlus)
  }

  const handleLeave = () => {
    if (expanded) return
    setHovering(false)
    setPointerBias(0)
    clearPeekTimers()
    setPeek(false)
    setPeekPlus(false)
  }

  const handlePointerMove = (e) => {
    if (flowActive || expanded) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / Math.max(rect.width, 1)
    setPointerBias(Math.max(-1, Math.min(1, x * 2 - 1)))
  }

  const handleHitPointerDown = (e) => {
    e.stopPropagation()
  }

  const handleHitClick = (e) => {
    e.preventDefault()
    e.stopPropagation()

    const rect = e.currentTarget.getBoundingClientRect()
    const xr = (e.clientX - rect.left) / Math.max(rect.width, 1)
    const yr = (e.clientY - rect.top) / Math.max(rect.height, 1)
    const onBead =
      !expanded && !flowActive && xr > 0.52 && xr < 0.72 && yr > 0.22 && yr < 0.62

    if (onBead) {
      handleCrystal(e)
      return
    }
    if (expanded) {
      if (Date.now() < openGuardUntil.current) return
      closeFocus()
      return
    }
    openFocus()
  }

  const handleCrystal = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (flowActive || expanded) return
    setCrystalToast(true)
    setPeekPlus(true)
    setTimeout(() => setCrystalToast(false), 1600)
  }

  useEffect(() => {
    if (!capsulePulse) return
    setPomoFloat(true)
    const t = setTimeout(() => setPomoFloat(false), 1300)
    return () => clearTimeout(t)
  }, [capsulePulse])

  useEffect(() => {
    if (!focus) {
      setBackdropArmed(false)
      return
    }
    const t = setTimeout(() => setBackdropArmed(true), BACKDROP_ARM_MS)
    return () => clearTimeout(t)
  }, [focus])

  useEffect(() => {
    if (!window.timelens?.fitWindow) return
    fitCompact(shellW)
    window.timelens.getAnchor?.().then((next) => {
      if (next) setAnchorPos(next)
    }).catch(() => {})
  }, [shellW, dockH, fitCompact])

  useEffect(() => {
    if (expanded) return
    const peekW = peekPlus ? peekPlusExtra : peek ? peekExtra : 0
    fitCompact(shellW + peekW)
  }, [expanded, peek, peekPlus, shellW, peekExtra, peekPlusExtra, fitCompact])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && expanded) closeFocus()
      else if (e.key === 'Escape') clearToast()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [expanded, closeFocus, clearToast])

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

  useEffect(
    () => () => {
      clearPeekTimers()
      clearMaTimers()
    },
    [clearPeekTimers, clearMaTimers]
  )

  const stageOpen = focus || closing
  const stageClass = [
    'focus-stage',
    'focus-stage--iceberg',
    pouring ? 'pouring' : '',
    stageOpen ? 'open' : '',
    closing ? 'closing' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const shellClass = ['timelens-shell', expanded ? 'is-expanded' : 'is-compact'].join(' ')

  return (
    <div
      className={shellClass}
      style={
        expanded
          ? layoutVars
          : { ...layoutVars, width: shellW, minWidth: shellW, height: dockH }
      }
    >
      {expanded ? (
        <div
          className="wallpaper focus-backdrop fixed inset-0 z-0"
          style={{ pointerEvents: backdropArmed ? 'auto' : 'none' }}
          onPointerUp={handleBackdropPointerUp}
          role="presentation"
        />
      ) : null}

      <div
        className={`timelens-desktop ${expanded ? 'focus-mode is-overlay focus-mode--iceberg' : ''}`}
        style={
          expanded
            ? { top: layout.topMargin, width: expandedW, '--tl-lip-outer-w': `${lipOuterPx}px` }
            : undefined
        }
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {!expanded ? (
          <div className="meniscus-drag-strip drag" title="拖动" aria-hidden />
        ) : null}

        <div
          className="dock-slot no-drag"
          style={{ width: dewW, height: dockH }}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          onMouseMove={handlePointerMove}
          onPointerUp={(e) => {
            if (expanded) return
            if (e.target.closest('.meniscus-bead-hit')) return
            if (e.target.closest('.hit')) return
            openFocus()
          }}
        >
          <MeniscusVessel
            width={dewW}
            height={dockH}
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
            steady={0.82}
            gradientId={expanded ? 'meniscus-expanded' : 'meniscus-compact'}
            onBeadClick={handleCrystal}
          />
          <button
            type="button"
            className="hit"
            onPointerDown={handleHitPointerDown}
            onClick={handleHitClick}
            aria-label={expanded ? '收起' : '展开'}
          />
          <div
            className={`peek ${peek && !expanded ? 'show' : ''} ${peekPlus && !expanded ? 'peek-plus' : ''}`}
          >
            {!connected && peekPlus ? (
              <span>示例 · 编程 · 2h14m</span>
            ) : !connected && peek ? (
              '未连接'
            ) : inFocus && warning ? (
              <span className="tnum">
                {label} · {sessionMins}m <span className="warn-peek">· 有点偏航</span>
              </span>
            ) : peekPlus ? (
              <>
                {label} · {sessionMins}m
                <span className="sub">{appShort}</span>
              </>
            ) : peek ? (
              <span className="tnum">
                {label} · {sessionMins}m
              </span>
            ) : null}
          </div>
          <div className="dock-pour" style={{ '--pour-hue': liquidHue }} aria-hidden />
          {pomoFloat || crystalToast ? <div className="crystal-toast">+1 🍅</div> : null}
        </div>

        {expanded ? (
          <IcebergNeck
            dewW={dewW}
            stageW={expandedW}
            height={neckBridgeH}
            hue={liquidHue}
            lipOuterW={lipOuterPx}
          />
        ) : null}

        <div className={stageClass} data-view="A">
          <button type="button" className="stage-x" onClick={closeFocus} aria-label="收起">
            ✕
          </button>
          {connected ? <FocusBoard /> : <DisconnectedStage onClose={closeFocus} />}
        </div>
      </div>

      {toast ? (
        <div className="tl-toast-host">
          <PeakToast
            toast={toast}
            onDismiss={clearToast}
            onUndo={toast.onUndo ? () => toast.onUndo() : undefined}
          />
        </div>
      ) : null}
    </div>
  )
}

function DisconnectedStage({ onClose }) {
  return (
    <>
      <span className="aw-badge">演示数据</span>
      <div className="view-a flex w-full items-center justify-center p-6 text-center tl-focus-vessel-slot">
        <div>
          <div className="text-[12px] text-txt-secondary">ActivityWatch 未连接</div>
          <div className="mt-2 text-[10px] text-txt-muted">请确认 aw-qt 或 aw-server 正在运行</div>
          <button type="button" className="fp-link mt-4" onClick={onClose}>
            收起
          </button>
        </div>
      </div>
      <div className="focus-pillars no-drag opacity-50">
        <div className="fp-col">
          <span className="fp-glyph">●</span>
          <div className="fp-sub">示例 · 编程</div>
        </div>
      </div>
    </>
  )
}
