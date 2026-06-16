/**
 * SVG arc path for Lens Ring — day progress as sweep around the breathing dot.
 * Arc spans ~120° opening to the right (navigation-star feel).
 */

const TAU = Math.PI * 2

export function lensRingArc({
  cx = 14,
  cy = 16,
  r = 11,
  progressPct = 50,
  startAngle = Math.PI * 0.72,
  sweep = Math.PI * 0.85,
}) {
  const t = Math.max(0, Math.min(100, progressPct)) / 100
  const endAngle = startAngle + sweep * t
  const x1 = cx + r * Math.cos(startAngle)
  const y1 = cy + r * Math.sin(startAngle)
  const x2 = cx + r * Math.cos(endAngle)
  const y2 = cy + r * Math.sin(endAngle)
  const large = sweep * t > Math.PI ? 1 : 0
  const d =
    t <= 0.001
      ? ''
      : `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`
  return { d, endX: x2, endY: y2, cx, cy, r }
}

/** Goal marker ✦ position at arc end (100% = full sweep) */
export function goalMarkerPosition(cx, cy, r, startAngle, sweep) {
  const endAngle = startAngle + sweep
  return {
    x: cx + r * Math.cos(endAngle),
    y: cy + r * Math.sin(endAngle),
  }
}
