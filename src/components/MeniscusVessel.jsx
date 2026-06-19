import { useEffect, useId, useRef, useState } from 'react'
import {
  computeDewBarFrame,
  DEW_H,
  DEW_W,
  productiveFillP,
  tideFraction,
} from '../utils/meniscusDewBar.js'

/**
 * 横露珠 — 与 docs/prototype/lens-dew-bar.js 同构 SVG
 */
export default function MeniscusVessel({
  width = DEW_W,
  height = DEW_H,
  fillPct = 50,
  hue = '#818CF8',
  horizonHue,
  glow = 'rgba(129,140,248,0.4)',
  visualState = 'ambient',
  categoryKey = 'coding',
  productiveSeconds = 0,
  sessionSeconds = 0,
  warning = false,
  entertainment = false,
  flow = false,
  hovered = false,
  peek = false,
  peekPlus = false,
  wetBias = 0,
  steady = 0.82,
  gradientId: gradientIdProp,
  onBeadClick,
}) {
  const reactId = useId().replace(/:/g, '')
  const gradientId = gradientIdProp || `dew-${reactId}`

  const phaseRef = useRef(0)
  const wetBiasRef = useRef(wetBias)
  const breathRef = useRef(0)
  const crystalRef = useRef(0)
  const cryOnRef = useRef(false)
  const settleRef = useRef({ mode: 'none', t: 0, evap: 0 })
  const prevEntertainment = useRef(false)

  const [frame, setFrame] = useState(() =>
    computeDewBarFrame({ width, height, hue, catKey: categoryKey })
  )

  const isSettle = visualState === 'settle'
  const isMinimal = visualState === 'minimal' && width < 64
  const isFocus = visualState === 'focus'

  useEffect(() => {
    if (entertainment && !prevEntertainment.current) {
      cryOnRef.current = true
      crystalRef.current = 0.001
    }
    prevEntertainment.current = entertainment
  }, [entertainment])

  useEffect(() => {
    if (isSettle) {
      settleRef.current = { mode: 'evaporating', t: 0, evap: productiveFillP(productiveSeconds) }
    } else {
      settleRef.current = { mode: 'none', t: 0, evap: 0 }
    }
  }, [isSettle, productiveSeconds])

  useEffect(() => {
    wetBiasRef.current = wetBias
  }, [wetBias])

  useEffect(() => {
    let raf
    let last = performance.now()

    const tick = (nowMs) => {
      const dt = Math.min(0.05, (nowMs - last) / 1000)
      last = nowMs
      phaseRef.current += dt

      if (breathRef.current > 0) {
        breathRef.current += dt / 2.2
        if (breathRef.current >= 1) breathRef.current = 0
      }

      if (cryOnRef.current) {
        crystalRef.current += dt / 1.5
        if (crystalRef.current >= 1) {
          cryOnRef.current = false
          crystalRef.current = 0
        }
      }

      const settle = settleRef.current
      if (settle.mode === 'evaporating') {
        settle.t += dt / 3.8
        if (settle.t >= 1) settle.mode = 'ended'
      }

      wetBiasRef.current += (wetBias - wetBiasRef.current) * Math.min(1, dt * (hovered ? 6 : 10))

      let prox = 'ambient'
      if (peekPlus) prox = 'peekPlus'
      else if (peek) prox = 'peek'

      const fillP = productiveFillP(productiveSeconds) || fillPct / 100

      setFrame(
        computeDewBarFrame({
          width,
          height,
          hue,
          catKey: categoryKey,
          fillP,
          tideP: tideFraction(new Date()),
          steady,
          flow,
          focus: isFocus,
          hover: hovered,
          prox,
          wetBias: wetBiasRef.current,
          phase: phaseRef.current,
          breath: breathRef.current,
          settle: settle.mode,
          settleT: settle.t,
          evap: settle.evap,
          cryOn: cryOnRef.current,
          crystal: crystalRef.current,
        })
      )

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [
    width,
    height,
    hue,
    categoryKey,
    productiveSeconds,
    sessionSeconds,
    fillPct,
    flow,
    isFocus,
    hovered,
    peek,
    peekPlus,
    wetBias,
    steady,
    warning,
  ])

  const gid = gradientId
  const clipId = `${gid}-clip`
  const voyage = horizonHue || frame.voyage

  if (isMinimal) {
    return (
      <svg width={width} height={height} className="meniscus-dew-svg block" aria-hidden>
        <circle
          cx={width * 0.618}
          cy={height * 0.45}
          r={3}
          fill={hue}
          opacity={0.75}
          style={{ filter: `drop-shadow(0 0 6px ${glow})` }}
        />
      </svg>
    )
  }

  return (
    <svg
      width={width}
      height={height}
      className="meniscus-dew-svg block"
      aria-hidden
      style={{ filter: isFocus ? 'drop-shadow(0 2px 12px rgba(0,0,0,0.35))' : undefined }}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={frame.shell} />
        </clipPath>
        <linearGradient id={`${gid}-glass`} x1="6%" y1="0%" x2="94%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.16)" />
          <stop offset="38%" stopColor="rgba(255,255,255,0.03)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.22)" />
        </linearGradient>
        <radialGradient id={`${gid}-fresnel`} cx="24%" cy="22%" r="62%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
          <stop offset="48%" stopColor="rgba(255,255,255,0.05)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <linearGradient id={`${gid}-specGrad`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={width} y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
          <stop offset="38%" stopColor="rgba(255,255,255,0.38)" />
          <stop offset="72%" stopColor="rgba(255,255,255,0.12)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
        </linearGradient>
        <linearGradient id={`${gid}-rim`} x1="4%" y1="0%" x2="96%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.42)" />
          <stop offset="55%" stopColor="rgba(255,255,255,0.1)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.06)" />
        </linearGradient>
        <linearGradient id={`${gid}-liq`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={hue} stopOpacity={frame.op} />
          <stop offset="0.45" stopColor={hue} stopOpacity={frame.op} />
          <stop offset="1" stopColor={hue} stopOpacity={Math.min(1, frame.op + 0.06)} />
        </linearGradient>
        <linearGradient id={`${gid}-liqDeep`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={hue} stopOpacity="0" />
          <stop offset="1" stopColor={hue} stopOpacity={frame.liqDeepOpacity} />
        </linearGradient>
        <linearGradient id={`${gid}-poolWash`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={hue} stopOpacity={frame.poolWash.pw0} />
          <stop offset="0.55" stopColor={hue} stopOpacity={frame.poolWash.pw1} />
          <stop offset="1" stopColor={frame.poolWash.pw2Color} stopOpacity={frame.poolWash.pw2} />
        </linearGradient>
        <radialGradient id={`${gid}-beadG`} cx="34%" cy="28%" r="68%">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="42%" stopColor="#fff" stopOpacity="0.92" />
          <stop offset="100%" stopColor={hue} stopOpacity="0.5" />
        </radialGradient>
        <filter id={`${gid}-hzGlow`} x="-10%" y="-200%" width="120%" height="500%">
          <feGaussianBlur stdDeviation="1.1" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`${gid}-glow`}>
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`${gid}-specSoft`}>
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>

      <path d={frame.shell} fill={frame.shellTint} opacity={frame.shellOpacity} />

      <g clipPath={`url(#${clipId})`}>
        {frame.showLiquid ? (
          <>
            <rect x="0" y={frame.poolTop} width={width} height={frame.poolHeight} fill={`url(#${gid}-poolWash)`} />
            <path d={frame.liquidPath} fill={`url(#${gid}-liqDeep)`} />
            <path d={frame.liquidPath} fill={`url(#${gid}-liq)`} />
            {!isFocus ? (
              <line
                x1="5"
                y1={frame.tideY}
                x2={width - 5}
                y2={frame.tideY}
                stroke={frame.ghostStroke}
                strokeWidth="1.15"
                strokeDasharray="4 3"
                opacity={frame.ghostOpacity}
              />
            ) : null}
            <line
              x1="5"
              y1={frame.baseY}
              x2={width - 5}
              y2={frame.baseY}
              stroke={voyage}
              strokeWidth="1.35"
              opacity={frame.hzOpacity}
              filter={`url(#${gid}-hzGlow)`}
            />
            <path
              d={frame.surfaceLine}
              fill="none"
              stroke="rgba(255,255,255,0.28)"
              strokeWidth={isFocus ? 2.65 : 2.4}
              filter={`url(#${gid}-specSoft)`}
              opacity={isFocus ? Math.min(1, frame.specSoftOpacity + 0.18) : frame.specSoftOpacity}
            />
            <path
              d={frame.surfaceLine}
              fill="none"
              stroke={`url(#${gid}-specGrad)`}
              strokeWidth={isFocus ? 1.2 : 1.05}
              strokeLinecap="round"
              opacity={isFocus ? Math.min(1, frame.specOpacity + 0.1) : frame.specOpacity}
            />
          </>
        ) : null}
      </g>

      <path d={frame.shell} fill={`url(#${gid}-glass)`} pointerEvents="none" />
      <ellipse
        cx={frame.fresnelCx}
        cy={frame.fresnelCy}
        rx={frame.fresnelRx}
        ry={frame.fresnelRy}
        fill={`url(#${gid}-fresnel)`}
        pointerEvents="none"
        clipPath={`url(#${clipId})`}
        opacity={frame.fresnelOpacity}
      />
      <path d={frame.shell} fill="none" stroke={`url(#${gid}-rim)`} strokeWidth="1.05" pointerEvents="none" />

      {frame.showLiquid && frame.beadVisible ? (
        <circle
          cx={frame.beadCx}
          cy={frame.beadCy}
          r="3.3"
          fill={`url(#${gid}-beadG)`}
          opacity={frame.beadOpacity}
          style={{ filter: `url(#${gid}-glow) ${frame.beadGlow}` }}
          pointerEvents="none"
        />
      ) : null}

      {onBeadClick && frame.showLiquid && frame.beadVisible ? (
        <circle
          cx={frame.beadCx}
          cy={frame.beadCy}
          r="9"
          fill="transparent"
          className="meniscus-bead-hit"
          style={{ cursor: 'pointer', pointerEvents: 'all' }}
          onClick={(e) => {
            e.stopPropagation()
            cryOnRef.current = true
            crystalRef.current = 0.001
            onBeadClick(e)
          }}
        />
      ) : null}

      {frame.crystalOpacity > 0 ? (
        <polygon
          points={frame.crystalPoints}
          fill={frame.crystalFill}
          opacity={frame.crystalOpacity}
          pointerEvents="none"
        />
      ) : null}
    </svg>
  )
}
