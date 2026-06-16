/**
 * Meniscus path geometry — liquid fill + curved leading surface.
 * fillPct: 0–100 (work-day progress from dead reckoning markPct)
 */

export function buildMeniscusPaths({
  width,
  height,
  fillPct,
  ripple = 0,
  flat = false,
  noise = 0,
  noisePhase = 0,
  wetBias = 0,
  wetStretch = 0,
}) {
  const W = width
  const H = height
  const stretch = Math.max(0, wetStretch)
  const fillX = Math.max(14, Math.min(W - 4, (fillPct / 100) * W + stretch))
  const baseY = H * 0.38
  const r = Math.min(14, fillX * 0.09)
  const jitter = noise > 0 ? meniscusEdgeJitter(noisePhase, noise) : 0
  const ry = flat ? 0.55 : 2 + Math.abs(ripple) * 1.2 + Math.abs(jitter) * 0.35

  const bias = Math.max(-1, Math.min(1, wetBias))
  const cp1x = fillX - r * 1.4 + bias * 2.5
  const cp2x = fillX - r * 0.35 + bias * 5
  const leadY = (flat ? baseY - 3 : H * 0.2 + ripple) + jitter - Math.abs(bias) * 0.4
  const midY = (flat ? baseY - 2 : baseY - 1 + ripple * 0.4) + jitter * 0.45 + bias * 0.6

  const body = [
    `M0,${H}`,
    `L0,${baseY}`,
    `Q${cp1x},${midY} ${cp2x},${leadY}`,
    `Q${fillX - 2},${leadY + ry} ${fillX},${baseY + 1 + jitter * 0.2}`,
    `L${fillX},${H}`,
    'Z',
  ].join(' ')

  const specular = [
    `M0,${baseY}`,
    `Q${cp1x},${midY} ${cp2x},${leadY}`,
    `Q${fillX - 2},${leadY + ry} ${fillX},${baseY + 1 + jitter * 0.2}`,
  ].join(' ')

  return {
    fillX,
    bodyPath: body,
    specularPath: specular,
    highlightX: fillX,
    highlightY: leadY + ry * 0.5,
    causticsCx: fillX * 0.45,
    causticsCy: H - 1,
  }
}

function meniscusEdgeJitter(phase, intensity) {
  return (
    (Math.sin(phase * 4.1) * 0.55 +
      Math.sin(phase * 8.3 + 1.2) * 0.3 +
      Math.sin(phase * 13.7 + 2.4) * 0.15) *
    intensity
  )
}

/** Minimal state — surface-tension bead only */
export function beadPosition(fillPct, width) {
  const fillX = Math.max(14, Math.min(width - 6, (fillPct / 100) * width))
  return { cx: fillX, cy: 8 }
}

/** Parse #RRGGBB to rgb parts for SVG filters */
export function hexToRgb(hex) {
  const h = String(hex || '#4A7CFF').replace('#', '')
  const n = parseInt(h.length === 3 ? h.replace(/./g, (c) => c + c) : h, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}
