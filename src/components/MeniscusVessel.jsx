import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { buildMeniscusPaths, beadPosition, hexToRgb } from '../utils/meniscusGeometry.js'
import { resolveMeniscusPhysics, springFromPhysics } from '../utils/meniscusPhysics.js'

/**
 * Meniscus — TimeLens signature form (optics + fluid physics).
 * fillPct = work-day progress · hue = category · tension bead = ●
 *
 * @param {'minimal'|'ambient'|'peek'|'focus'|'settle'} visualState
 */
export default function MeniscusVessel({
  width,
  height,
  fillPct = 50,
  hue = '#4A7CFF',
  horizonHue,
  glow = 'rgba(74,124,255,0.38)',
  visualState = 'ambient',
  warning = false,
  entertainment = false,
  flow = false,
  hovered = false,
  wetBias = 0,
  wetStretch = 0,
  gradientId = 'meniscus-liquid',
}) {
  const [ripple, setRipple] = useState(0)
  const [noisePhase, setNoisePhase] = useState(0)
  const hoverRippleRef = useRef(0)
  const rafRef = useRef(null)

  const physics = useMemo(
    () =>
      resolveMeniscusPhysics({
        visualState,
        flow,
        warning,
        entertainment,
        hovered,
      }),
    [visualState, flow, warning, entertainment, hovered]
  )

  const liquidSpring = useMemo(() => springFromPhysics(physics), [physics])

  useEffect(() => {
    let frame = 0
    let last = performance.now()

    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      frame += dt * 60

      if (physics.noise) {
        setNoisePhase((p) => p + dt * (physics.rippleHz || 0.85) * 9)
      }

      const amp = physics.rippleAmp ?? 0
      if (amp > 0) {
        const wave = Math.sin(frame * (physics.rippleHz || 0.5) * 2.8) * amp
        setRipple(wave + hoverRippleRef.current * 0.35)
      } else if (hoverRippleRef.current > 0.01) {
        hoverRippleRef.current *= 0.88
        setRipple(hoverRippleRef.current)
      } else {
        setRipple(0)
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [physics])

  useEffect(() => {
    if (!hovered || physics.flat) return
    hoverRippleRef.current = 1.1
    const t = setTimeout(() => {
      hoverRippleRef.current = 0
    }, 420)
    return () => clearTimeout(t)
  }, [hovered, physics.flat])

  const paths = useMemo(
    () =>
      buildMeniscusPaths({
        width,
        height,
        fillPct,
        ripple,
        flat: physics.flat,
        noise: physics.noise ? physics.rippleAmp : 0,
        noisePhase,
        wetBias,
        wetStretch,
      }),
    [width, height, fillPct, ripple, physics, noisePhase, wetBias, wetStretch]
  )

  const isMinimal = visualState === 'minimal'
  const isSettle = visualState === 'settle'
  const isAmbientQuiet = visualState === 'ambient' && !hovered
  const showLiquid = !isMinimal && !isSettle
  const bead = beadPosition(fillPct, width)
  const rgb = hexToRgb(hue)
  const horizon = horizonHue || hue
  const horizonRgb = hexToRgb(horizon)
  const beadId = `${gradientId}-bead`
  const causticsId = `${gradientId}-caustics`
  const liquidDeepId = `${gradientId}-deep`

  return (
    <svg
      width={width}
      height={height}
      className="pointer-events-none absolute inset-0"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0"
            stopColor={hue}
            stopOpacity={isSettle ? 0.08 : isAmbientQuiet ? 0.32 : flow ? 0.42 : 0.48}
          />
          <stop
            offset="0.55"
            stopColor={hue}
            stopOpacity={isSettle ? 0.06 : isAmbientQuiet ? 0.38 : flow ? 0.58 : 0.44}
          />
          <stop
            offset="1"
            stopColor={hue}
            stopOpacity={isSettle ? 0.04 : isAmbientQuiet ? 0.46 : flow ? 0.78 : 0.52}
          />
        </linearGradient>

        <linearGradient id={liquidDeepId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={hue} stopOpacity="0" />
          <stop offset="1" stopColor={hue} stopOpacity={flow ? 0.35 : 0.22} />
        </linearGradient>

        <radialGradient id={beadId} cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="42%" stopColor="#ffffff" stopOpacity="0.82" />
          <stop offset="100%" stopColor={hue} stopOpacity="0.15" />
        </radialGradient>

        <radialGradient id={causticsId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={hue} stopOpacity={flow ? 0.45 : 0.38} />
          <stop offset="55%" stopColor={hue} stopOpacity="0.12" />
          <stop offset="100%" stopColor={hue} stopOpacity="0" />
        </radialGradient>

        <filter id={`${gradientId}-caustic-blur`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.65 0`}
          />
        </filter>
      </defs>

      {/* Caustics — light pool under liquid */}
      {showLiquid ? (
        <motion.ellipse
          cx={paths.causticsCx}
          cy={paths.causticsCy}
          rx={Math.max(12, paths.fillX * 0.38)}
          ry={flow ? 3.5 : 5}
          fill={`url(#${causticsId})`}
          filter={`url(#${gradientId}-caustic-blur)`}
          animate={{ cx: paths.causticsCx, rx: Math.max(12, paths.fillX * 0.38) }}
          transition={liquidSpring}
          opacity={flow ? 0.55 : 0.72}
        />
      ) : null}

      {/* Vessel floor refraction line */}
      <line
        x1={0}
        y1={height - 0.5}
        x2={width}
        y2={height - 0.5}
        stroke={`rgba(${rgb.r},${rgb.g},${rgb.b},0.18)`}
        strokeWidth={1}
      />

      {/* Horizon — dead reckoning day climate (dual-channel color) */}
      <line
        x1={0}
        y1={1}
        x2={width}
        y2={1}
        stroke={horizon}
        strokeWidth={1}
        opacity={isSettle ? 0.18 : hovered ? 0.42 : 0.35}
      />

      {showLiquid ? (
        <g opacity={isAmbientQuiet ? 0.92 : 1}>
          <motion.path
            fill={`url(#${gradientId})`}
            animate={{ d: paths.bodyPath }}
            transition={liquidSpring}
            style={{
              filter: `drop-shadow(0 3px 8px rgba(${rgb.r},${rgb.g},${rgb.b},${flow ? 0.28 : 0.22}))`,
            }}
          />
          {/* Deep liquid body tint */}
          <motion.path
            fill={`url(#${liquidDeepId})`}
            animate={{ d: paths.bodyPath }}
            transition={liquidSpring}
            opacity={0.55}
          />
          {/* Meniscus specular highlight */}
          <motion.path
            fill="none"
            stroke="rgba(255,255,255,0.38)"
            strokeWidth={warning ? 1.2 : 1}
            animate={{ d: paths.specularPath }}
            transition={liquidSpring}
            opacity={isAmbientQuiet ? 0.55 : flow ? 0.55 : 0.85}
          />
          {/* Tension bead — asymmetric droplet */}
          <motion.circle
            r={flow ? 2.2 : warning ? 2.8 : 2.6}
            fill={`url(#${beadId})`}
            animate={{
              cx: paths.highlightX,
              cy: paths.highlightY,
              opacity: warning ? [0.65, 1, 0.65] : flow ? [0.45, 0.62, 0.45] : [0.8, 1, 0.8],
            }}
            transition={{
              cx: liquidSpring,
              cy: liquidSpring,
              opacity: {
                duration: warning ? 0.65 : flow ? 5.5 : 2.6,
                repeat: Infinity,
                ease: 'easeInOut',
              },
            }}
            style={{
              filter: `drop-shadow(0 0 4px ${glow}) drop-shadow(-1px -1px 0 rgba(255,255,255,0.35))`,
            }}
          />
        </g>
      ) : null}

      {isMinimal ? (
        <motion.circle
          cx={bead.cx}
          cy={bead.cy}
          r={3}
          fill={`url(#${beadId})`}
          animate={{ opacity: [0.5, 0.88, 0.5], scale: [1, 1.03, 1] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ filter: `drop-shadow(0 0 6px ${glow})` }}
        />
      ) : null}

      {isSettle ? (
        <>
          <line
            x1={width * 0.08}
            y1={height * 0.48}
            x2={width * 0.92}
            y2={height * 0.48}
            stroke={`rgba(${horizonRgb.r},${horizonRgb.g},${horizonRgb.b},0.22)`}
            strokeWidth={1}
          />
          <circle
            cx={width * 0.88}
            cy={height * 0.48}
            r={2.5}
            fill={horizon}
            opacity={0.85}
            style={{ filter: `drop-shadow(0 0 6px ${glow})` }}
          />
        </>
      ) : null}
    </svg>
  )
}
