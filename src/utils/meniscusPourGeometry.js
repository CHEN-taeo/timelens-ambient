/**
 * Gravity Pour — SVG paths for meniscus → Bento expansion.
 * progress 0→1 over ~480ms:
 *   0.00–0.31 tension break · 0.31–0.83 pour · 0.83–1.00 settle
 */

function clamp01(v) {
  return Math.max(0, Math.min(1, v))
}

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

export function buildPourPaths({ width: W, height: H, pillH, fillPct, progress = 0 }) {
  const fillX = Math.max(18, Math.min(W - 10, (fillPct / 100) * W))
  const breakT = clamp01(progress / 0.31)
  const pourT = clamp01((progress - 0.31) / 0.52)
  const settleT = clamp01((progress - 0.83) / 0.17)

  const baseY = pillH * 0.36
  const dent = breakT * 5 * (1 - pourT * 0.92)
  const leadY = pillH * 0.16 + dent
  const r = Math.min(12, fillX * 0.08)
  const cp1x = fillX - r * 1.35
  const cp2x = fillX - r * 0.32
  const br = 14

  const bottomY = pillH + (H - pillH) * easeOutCubic(pourT)
  const rightEdge = fillX + (W - fillX) * easeInOutCubic(pourT)
  const ripple = settleT > 0 ? Math.sin(settleT * Math.PI) * 2.5 * (1 - settleT) : 0

  const specular = [
    `M 0,${baseY}`,
    `Q ${cp1x},${baseY - 2 + dent * 0.45} ${cp2x},${leadY}`,
    `Q ${fillX - 2},${leadY + 2.2} ${fillX},${baseY + 1}`,
    pourT > 0.08 ? `L ${rightEdge},${baseY + 2}` : '',
  ]
    .filter(Boolean)
    .join(' ')

  if (pourT < 0.02) {
    const body = [
      `M 0,${pillH}`,
      `L 0,${baseY}`,
      `Q ${cp1x},${baseY - 1 + dent * 0.35} ${cp2x},${leadY}`,
      `Q ${fillX - 2},${leadY + 2.4} ${fillX},${baseY + 1}`,
      `L ${fillX},${pillH}`,
      'Z',
    ].join(' ')
    return { body, specular, strand: null, drip: null, settleT, bottomY: pillH, pourT }
  }

  const body = [
    `M 0,${bottomY + ripple}`,
    `L 0,${baseY}`,
    `Q ${cp1x},${baseY - 2 + dent * 0.25} ${cp2x},${leadY}`,
    `Q ${fillX - 2},${leadY + 2.5} ${fillX},${baseY + 1}`,
    `L ${rightEdge},${baseY + 2}`,
    `L ${rightEdge},${bottomY - br + ripple}`,
    `Q ${rightEdge},${bottomY + ripple} ${rightEdge - br},${bottomY + ripple}`,
    `L ${br},${bottomY + ripple}`,
    `Q 0,${bottomY + ripple} 0,${bottomY - br + ripple}`,
    'Z',
  ].join(' ')

  const strandX = fillX - 1
  const midY = pillH + (bottomY - pillH) * 0.55
  const strand =
    pourT > 0.04 && pourT < 0.88
      ? `M ${strandX},${pillH} C ${strandX - 3},${pillH + (midY - pillH) * 0.4} ${strandX + 5},${midY} ${strandX},${bottomY - br - 6}`
      : null

  const drip =
    pourT > 0.12 && pourT < 0.75
      ? { cx: strandX, cy: bottomY - br - 2, r: 2 + pourT * 2 }
      : null

  return { body, specular, strand, drip, settleT, bottomY, pourT }
}

export const POUR_DURATION_MS = 480
export const POUR_BREAK_END = 0.31
export const POUR_POUR_END = 0.83
export const POUR_BOARD_START = 0.72
