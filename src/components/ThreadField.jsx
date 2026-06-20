import { useEffect, useRef, useCallback } from 'react'
import { computeThreadLayout } from '../thread/threadLayout.js'
import {
  createThreadEngine,
  stepEngine,
  drawThreadField,
} from '../thread/threadPhysics.js'
import { deriveThreadTargets, isCursorApp } from '../thread/threadState.js'
import { useThreadStore } from '../store/useThreadStore.js'
import { useTimeStore } from '../store/useTimeStore.js'
import ThreadDetail from './ThreadDetail.jsx'
import ThreadFocus from './ThreadFocus.jsx'

const PEEK_MS = 400
const PEEK_PLUS_MS = 800
const DRAG_THRESHOLD = 5

export default function ThreadField() {
  const canvasRef = useRef(null)
  const engineRef = useRef(null)
  const layoutRef = useRef(null)
  const workAreaRef = useRef({ width: 1920, height: 1080 })
  const hoverTimer = useRef(null)
  const hoverPlusTimer = useRef(null)
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, winX: 0, winY: 0 })
  const isElectron = typeof window !== 'undefined' && !!window.timelens

  const phase = useThreadStore((s) => s.phase)
  const focusOpen = useThreadStore((s) => s.focusOpen)
  const detailOpen = useThreadStore((s) => s.detailOpen)
  const peekLevel = useThreadStore((s) => s.peekLevel)
  const visibility = useThreadStore((s) => s.visibility)
  const sweepTrigger = useThreadStore((s) => s.sweepTrigger)
  const setPeekLevel = useThreadStore((s) => s.setPeekLevel)
  const setDetailOpen = useThreadStore((s) => s.setDetailOpen)
  const toggleDetail = useThreadStore((s) => s.toggleDetail)
  const setCursorForeground = useThreadStore((s) => s.setCursorForeground)
  const triggerFix = useThreadStore((s) => s.triggerFix)
  const consumeSweepTrigger = useThreadStore((s) => s.consumeSweepTrigger)

  const currentActivity = useTimeStore((s) => s.currentActivity)
  const connected = useTimeStore((s) => s.connected)
  const pomodoro = useTimeStore((s) => s.pomodoro)

  const panelOpen = detailOpen || focusOpen

  const syncWindow = useCallback((layout) => {
    if (!window.timelens?.fitWindow) return
    window.timelens.fitWindow(layout.windowW, layout.windowH, true, 0, layout.windowW)
  }, [])

  const rebuildLayout = useCallback(() => {
    const { width, height } = workAreaRef.current
    const layout = computeThreadLayout(width, height, { detailOpen, fixOpen: focusOpen })
    layoutRef.current = layout
    if (
      !engineRef.current ||
      engineRef.current.threads.length !== layout.threadCount
    ) {
      engineRef.current = createThreadEngine(layout)
    }
    syncWindow(layout)
    return layout
  }, [detailOpen, focusOpen, syncWindow])

  useEffect(() => {
    window.timelens?.getWorkArea?.().then((wa) => {
      if (wa) workAreaRef.current = wa
      rebuildLayout()
    })
    if (!window.timelens) rebuildLayout()
  }, [rebuildLayout])

  useEffect(() => {
    rebuildLayout()
  }, [detailOpen, focusOpen, rebuildLayout])

  useEffect(() => {
    const app = currentActivity?.app || ''
    setCursorForeground(isCursorApp(app))
  }, [currentActivity, setCursorForeground])

  useEffect(() => {
    const onFix = () => triggerFix()
    const unsub = window.timelens?.onTriggerFix?.(onFix)
    return () => unsub?.()
  }, [triggerFix])

  useEffect(() => {
    let raf = 0
    let last = performance.now()

    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const layout = layoutRef.current || rebuildLayout()
      const engine = engineRef.current
      const canvas = canvasRef.current
      if (!engine || !canvas) {
        raf = requestAnimationFrame(tick)
        return
      }

      const targets = deriveThreadTargets({
        currentActivity,
        connected,
        pomodoro,
        phase,
        cursorForeground: useThreadStore.getState().cursorForeground,
        visibility,
      })

      stepEngine(engine, dt, {
        tangleAmount: targets.tangleAmount,
        scatterAmount: targets.scatterAmount,
        alignAmount: targets.alignAmount,
        mouseX: engine.mouseX,
        mouseY: engine.mouseY,
        sweepTrigger: consumeSweepTrigger() || sweepTrigger,
      })

      const ctx = canvas.getContext('2d')
      canvas.width = layout.windowW
      canvas.height = layout.bundleH + layout.padY * 2
      const drawOpacity = isElectron ? targets.opacity : Math.max(targets.opacity, 0.38)
      drawThreadField(ctx, engine, layout, {
        opacity: drawOpacity,
        categoryColor: targets.categoryColor,
        clipHeight: layout.bundleH + layout.padY * 2,
      })

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [
    currentActivity,
    connected,
    pomodoro,
    phase,
    visibility,
    sweepTrigger,
    rebuildLayout,
    consumeSweepTrigger,
    isElectron,
  ])

  const setMousePassthrough = useCallback((passthrough) => {
    window.timelens?.setMousePassthrough?.(passthrough)
  }, [])

  useEffect(() => {
    if (!isElectron) return
    if (panelOpen) setMousePassthrough(false)
    else setMousePassthrough(true)
  }, [panelOpen, isElectron, setMousePassthrough])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (focusOpen) useThreadStore.getState().closeFix()
        else if (detailOpen) setDetailOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [detailOpen, focusOpen, setDetailOpen])

  const handleMouseMove = (e) => {
    const layout = layoutRef.current
    const engine = engineRef.current
    if (!layout || !engine) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    engine.mouseX = e.clientX - rect.left
    engine.mouseY = e.clientY - rect.top

    const inBundle =
      e.clientX - rect.left >= layout.anchorX - 10 &&
      e.clientX - rect.left <= layout.windowW &&
      e.clientY - rect.top >= layout.padY &&
      e.clientY - rect.top <= layout.bundleH + layout.padY

    if (isElectron) {
      setMousePassthrough(!inBundle && !panelOpen)
    }

    if (dragging.current || panelOpen) return

    if (inBundle) {
      if (!hoverTimer.current) {
        hoverTimer.current = setTimeout(() => setPeekLevel(1), PEEK_MS)
      }
      if (!hoverPlusTimer.current) {
        hoverPlusTimer.current = setTimeout(() => setPeekLevel(2), PEEK_PLUS_MS)
      }
    } else {
      clearTimeout(hoverTimer.current)
      clearTimeout(hoverPlusTimer.current)
      hoverTimer.current = null
      hoverPlusTimer.current = null
      setPeekLevel(0)
    }
  }

  const handleMouseLeave = () => {
    clearTimeout(hoverTimer.current)
    clearTimeout(hoverPlusTimer.current)
    hoverTimer.current = null
    hoverPlusTimer.current = null
    setPeekLevel(0)
    if (isElectron && !panelOpen) setMousePassthrough(true)
    if (engineRef.current) {
      engineRef.current.mouseX = -9999
      engineRef.current.mouseY = -9999
    }
  }

  const handlePointerDown = async (e) => {
    if (e.button !== 0) return
    if (focusOpen) return
    const anchor = await window.timelens?.getAnchor?.()
    dragging.current = true
    dragStart.current = {
      x: e.screenX,
      y: e.screenY,
      winX: anchor?.screenX ?? 0,
      winY: anchor?.screenY ?? 0,
    }
  }

  useEffect(() => {
    const onUp = (e) => {
      if (!dragging.current) return
      dragging.current = false
      const dx = e.screenX - dragStart.current.x
      const dy = e.screenY - dragStart.current.y
      const moved = Math.abs(dx) + Math.abs(dy)

      if (moved < DRAG_THRESHOLD) {
        if (!focusOpen) toggleDetail()
        return
      }

      window.timelens?.moveWindow?.(
        dragStart.current.winX + dx,
        dragStart.current.winY + dy,
      )
    }
    window.addEventListener('mouseup', onUp)
    return () => window.removeEventListener('mouseup', onUp)
  }, [focusOpen, toggleDetail])

  const targets = deriveThreadTargets({
    currentActivity,
    connected,
    pomodoro,
    phase,
    cursorForeground: useThreadStore.getState().cursorForeground,
    visibility,
  })

  const peekText =
    !panelOpen && (peekLevel >= 2 ? targets.peekLineLong : peekLevel >= 1 ? targets.peekLine : '')

  return (
    <div
      className={`thread-root no-drag${isElectron ? '' : ' thread-root--preview'}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onPointerDown={handlePointerDown}
    >
      <canvas ref={canvasRef} className="thread-canvas" aria-label="时间丝线" />
      {peekText ? (
        <div className="thread-peek" aria-live="polite">
          {peekText}
        </div>
      ) : null}
      <ThreadDetail />
      {focusOpen ? <ThreadFocus /> : null}
      {!isElectron ? (
        <p className="thread-preview-hint">浏览器预览 · 桌面请用 Electron 窗口（npm run dev）</p>
      ) : null}
    </div>
  )
}
