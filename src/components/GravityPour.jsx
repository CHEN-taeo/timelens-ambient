import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { buildPourPaths } from '../utils/meniscusPourGeometry.js'
import { hexToRgb } from '../utils/meniscusGeometry.js'

const pourSpring = { type: 'spring', stiffness: 340, damping: 32 }

/**
 * Gravity Pour overlay — liquid breaks tension, pours into Bento silhouette.
 */
export default function GravityPour({
  width,
  height,
  pillH,
  fillPct,
  hue,
  glow,
  progress,
  gradientId = 'gravity-pour',
}) {
  const paths = useMemo(
    () => buildPourPaths({ width, height, pillH, fillPct, progress }),
    [width, height, pillH, fillPct, progress]
  )

  const rgb = hexToRgb(hue)
  const strandOpacity = paths.pourT > 0.05 && paths.pourT < 0.9 ? 0.75 - paths.pourT * 0.35 : 0
  const overlayOpacity = progress >= 0.98 ? 0 : 1

  return (
    <motion.svg
      width={width}
      height={height}
      className="pointer-events-none absolute inset-0 z-[15]"
      aria-hidden
      animate={{ opacity: overlayOpacity }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={hue} stopOpacity="0.58" />
          <stop offset="0.45" stopColor={hue} stopOpacity="0.72" />
          <stop offset="1" stopColor={hue} stopOpacity="0.88" />
        </linearGradient>
        <radialGradient id={`${gradientId}-settle`} cx="50%" cy="100%" r="60%">
          <stop offset="0%" stopColor={hue} stopOpacity="0.35" />
          <stop offset="100%" stopColor={hue} stopOpacity="0" />
        </radialGradient>
        <filter id={`${gradientId}-blur`}>
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>

      {/* Caustic pool at pour bottom during settle */}
      {paths.settleT > 0 ? (
        <ellipse
          cx={width * 0.5}
          cy={paths.bottomY}
          rx={width * 0.42}
          ry={6 + paths.settleT * 4}
          fill={`url(#${gradientId}-settle)`}
          filter={`url(#${gradientId}-blur)`}
          opacity={0.65 * (1 - paths.settleT * 0.5)}
        />
      ) : null}

      <motion.path
        fill={`url(#${gradientId})`}
        animate={{ d: paths.body }}
        transition={pourSpring}
        style={{
          filter: `drop-shadow(0 4px 14px rgba(${rgb.r},${rgb.g},${rgb.b},0.28))`,
        }}
      />

      {paths.strand ? (
        <motion.path
          d={paths.strand}
          fill="none"
          stroke={hue}
          strokeWidth={2.5}
          strokeLinecap="round"
          opacity={strandOpacity}
          animate={{ d: paths.strand }}
          transition={pourSpring}
          style={{ filter: `drop-shadow(0 0 6px ${glow})` }}
        />
      ) : null}

      {paths.drip ? (
        <motion.circle
          cx={paths.drip.cx}
          cy={paths.drip.cy}
          r={paths.drip.r}
          fill={hue}
          opacity={0.85}
          animate={{
            cy: [paths.drip.cy, paths.drip.cy + 6, paths.drip.cy],
            opacity: [0.85, 0.35, 0],
          }}
          transition={{ duration: 0.28, ease: [0.34, 1.56, 0.64, 1] }}
        />
      ) : null}

      <motion.path
        fill="none"
        stroke="rgba(255,255,255,0.42)"
        strokeWidth={1}
        animate={{ d: paths.specular }}
        transition={pourSpring}
      />

      {/* Tension bead at meniscus front */}
      {paths.pourT < 0.65 ? (
        <motion.circle
          r={2.6}
          fill="#fff"
          animate={{
            cx: fillPct > 0 ? Math.max(18, Math.min(width - 10, (fillPct / 100) * width)) : width * 0.5,
            cy: pillH * 0.16 + (progress < 0.31 ? progress / 0.31 : 1) * 5 * (1 - paths.pourT),
            opacity: 1 - paths.pourT * 1.2,
          }}
          transition={pourSpring}
          style={{ filter: `drop-shadow(0 0 4px ${glow})` }}
        />
      ) : null}
    </motion.svg>
  )
}
