import { motion } from 'framer-motion'

// Breathing status dot. Dead reckoning hue in ambient; faster pulse when warning.
export default function GlowIndicator({
  color,
  glow,
  warning = false,
  flow = false,
  size = 10,
  colorTransitionMs = 0,
}) {
  const breathDuration = warning ? 0.9 : flow ? 4.2 : 2.4
  const breathScale = warning ? [1, 1.25, 1] : flow ? [1, 1.04, 1] : [1, 1.12, 1]
  const baseOpacity = flow ? [0.35, 0.55, 0.35] : warning ? [0.4, 1, 0.4] : [0.55, 1, 0.55]
  const colorStyle = colorTransitionMs > 0 ? { transition: `background ${colorTransitionMs}ms ease` } : {}

  return (
    <span
      className="no-drag relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <motion.span
        className="absolute inset-0 rounded-full"
        style={{ background: color, ...colorStyle }}
        animate={{ opacity: baseOpacity, scale: breathScale }}
        transition={{
          duration: breathDuration,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.span
        className="absolute rounded-full"
        style={{
          inset: -size * 0.6,
          background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`,
        }}
        animate={{ opacity: warning ? [0.3, 0.8, 0.3] : flow ? [0.12, 0.28, 0.12] : [0.25, 0.55, 0.25] }}
        transition={{
          duration: breathDuration,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </span>
  )
}
