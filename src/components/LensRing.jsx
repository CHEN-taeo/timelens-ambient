import { motion } from 'framer-motion'
import { lensRingArc, goalMarkerPosition } from '../utils/lensRingGeometry.js'
import GlowIndicator from './GlowIndicator.jsx'

const ringSpring = { type: 'spring', stiffness: 380, damping: 32 }

/**
 * Lens Ring — dot + day arc + horizon (TimeLens 五年签名).
 *
 * @param {'minimal'|'ambient'|'peek'|'focus'|'sleep'} visualState
 */
export default function LensRing({
  width = 28,
  height = 32,
  progressPct = 50,
  hue = '#4A7CFF',
  glow = 'rgba(74,124,255,0.38)',
  visualState = 'ambient',
  warning = false,
  flow = false,
  showArc = true,
  showGoalMarker = false,
  horizonWidth,
}) {
  const cx = 14
  const cy = height / 2 + 1
  const r = 11
  const startAngle = Math.PI * 0.72
  const sweep = Math.PI * 0.85

  const arc = lensRingArc({ cx, cy, r, progressPct, startAngle, sweep })
  const goal = goalMarkerPosition(cx, cy, r, startAngle, sweep)

  const isMinimal = visualState === 'minimal' || visualState === 'sleep'
  const isSleep = visualState === 'sleep'
  const arcVisible = showArc && !isMinimal && arc.d

  const hw = horizonWidth ?? width

  return (
    <div className="relative shrink-0" style={{ width, height }}>
      {/* Horizon — full capsule width when provided */}
      {horizonWidth ? (
        <div
          className="pointer-events-none absolute left-0 top-0 z-0 h-px"
          style={{
            width: hw,
            marginLeft: -(horizonWidth - width) / 2,
            background: `linear-gradient(90deg, transparent 8%, ${hue} 50%, transparent 92%)`,
            opacity: isSleep ? 0.15 : 0.45,
          }}
        />
      ) : (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${hue}, transparent)`,
            opacity: 0.35,
          }}
        />
      )}

      <svg width={width} height={height} className="relative z-[1]" aria-hidden>
        {arcVisible ? (
          <>
            <path
              d={arc.d}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={2.5}
              strokeLinecap="round"
              opacity={0.5}
            />
            <motion.path
              d={arc.d}
              fill="none"
              stroke={hue}
              strokeWidth={2.5}
              strokeLinecap="round"
              initial={false}
              animate={{ d: arc.d, stroke: hue }}
              transition={ringSpring}
              opacity={isSleep ? 0.2 : 0.85}
            />
            {showGoalMarker && progressPct >= 88 ? (
              <circle cx={goal.x} cy={goal.y} r={1.5} fill={hue} opacity={0.9} />
            ) : null}
          </>
        ) : null}
      </svg>

      <div className="absolute left-[7px] top-1/2 z-[2] -translate-y-1/2">
        {isMinimal ? (
          <motion.div
            animate={{ opacity: isSleep ? [0.2, 0.35, 0.2] : flow ? [0.35, 0.55, 0.35] : [0.55, 1, 0.55] }}
            transition={{ duration: isSleep ? 5 : flow ? 4.2 : 2.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <GlowIndicator
              color={hue}
              glow={glow}
              warning={warning}
              flow={flow || isSleep}
              size={isMinimal && !isSleep ? 6 : 7}
              colorTransitionMs={500}
            />
          </motion.div>
        ) : (
          <GlowIndicator
            color={hue}
            glow={glow}
            warning={warning}
            flow={flow}
            size={7}
            colorTransitionMs={500}
          />
        )}
      </div>
    </div>
  )
}
