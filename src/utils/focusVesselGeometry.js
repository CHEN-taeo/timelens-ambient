import { CATEGORIES } from './rules.js'

/** Meiping cross-section control points [y, halfWidth] */
export const VESSEL_PTS = [
  [8, 30], [26, 22], [64, 34], [124, 128], [168, 150],
  [258, 136], [328, 106], [360, 80], [380, 56], [392, 34], [398, 6],
]

export const VESSEL_CX = 320
export const VESSEL_LIP_JOIN = VESSEL_Y_TOP + 10
export const VESSEL_MAX_R = 154
export const VESSEL_Y_TOP = 8
export const VESSEL_Y_BOT = 398
export const VESSEL_LIP_R = 30
export const STACK_TOP = 116
export const STACK_BOT = VESSEL_Y_BOT - 4

/** Bottom → top sediment stack */
export const STACK_ORDER = [
  'idle',
  'neutral',
  'entertainment',
  'comms',
  'learning',
  'ai',
  'project',
  'coding',
]

export const LEGEND_ORDER = ['coding', 'project', 'learning', 'ai', 'comms', 'entertainment', 'neutral', 'idle']

export function halfW(y, pts = VESSEL_PTS) {
  if (y <= pts[0][0]) return pts[0][1]
  if (y >= pts[pts.length - 1][0]) return pts[pts.length - 1][1]
  let i = 0
  while (i < pts.length - 1 && y > pts[i + 1][0]) i++
  const p0 = pts[i - 1] || pts[i]
  const p1 = pts[i]
  const p2 = pts[i + 1]
  const p3 = pts[i + 2] || pts[i + 1]
  const t = (y - p1[0]) / (p2[0] - p1[0])
  const t2 = t * t
  const t3 = t2 * t
  return (
    0.5 *
    (2 * p1[1] +
      (-p0[1] + p2[1]) * t +
      (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
      (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
  )
}

export function buildVesselPath(cx = VESSEL_CX) {
  const lipJoin = VESSEL_Y_TOP + 10
  let d = `M ${cx - VESSEL_LIP_R + 4},${VESSEL_Y_TOP + 2} Q ${cx - VESSEL_LIP_R - 0.5},${VESSEL_Y_TOP + 5} ${cx - VESSEL_LIP_R},${lipJoin} `
  for (let y = lipJoin; y <= VESSEL_Y_BOT; y += 1) {
    d += `L ${(cx - halfW(y)).toFixed(2)},${y} `
  }
  d += `Q ${cx},${(VESSEL_Y_BOT + 3).toFixed(1)} ${(cx + halfW(VESSEL_Y_BOT)).toFixed(2)},${VESSEL_Y_BOT} `
  for (let y = VESSEL_Y_BOT; y >= lipJoin; y -= 1) {
    d += `L ${(cx + halfW(y)).toFixed(2)},${y} `
  }
  d += `Q ${cx + VESSEL_LIP_R + 0.5},${VESSEL_Y_TOP + 5} ${cx + VESSEL_LIP_R - 4},${VESSEL_Y_TOP + 2} Z`
  return d
}

export function lamePath(cx0, cy0, a, b, n, steps, grav = 0) {
  let d = ''
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2
    const ct = Math.cos(t)
    const stn = Math.sin(t)
    const x = cx0 + a * Math.sign(ct) * Math.abs(ct) ** (2 / n)
    let y = cy0 + b * Math.sign(stn) * Math.abs(stn) ** (2 / n)
    if (grav && stn > 0) y += grav * stn * stn
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
  }
  return `${d}Z`
}

export function lameTopArc(cx0, cy0, a, b, n, steps) {
  let d = ''
  for (let i = 0; i <= steps; i++) {
    const t = Math.PI + (i / steps) * Math.PI
    const ct = Math.cos(t)
    const stn = Math.sin(t)
    const x = cx0 + a * Math.sign(ct) * Math.abs(ct) ** (2 / n)
    const y = cy0 + b * Math.sign(stn) * Math.abs(stn) ** (2 / n)
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
  }
  return d
}

export function mixHex(a, b, t) {
  const p = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
  const [r1, g1, b1] = p(a)
  const [r2, g2, b2] = p(b)
  const m = (x, y) => Math.round(x + (y - x) * t)
  return `#${[m(r1, r2), m(g1, g2), m(b1, b2)].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

export function fmtDuration(seconds = 0) {
  const mins = Math.round(seconds / 60)
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function buildBands(totalsByCategory = {}) {
  const used = STACK_ORDER.filter((k) => (totalsByCategory[k] || 0) > 0)
  const total = used.reduce((s, k) => s + (totalsByCategory[k] || 0), 0)
  const stackH = STACK_BOT - STACK_TOP
  const band = {}
  let yc = STACK_BOT

  if (total <= 0) {
    band.neutral = { y0: STACK_TOP, y1: STACK_BOT, mid: (STACK_TOP + STACK_BOT) / 2, seconds: 0 }
    return { band, used: ['neutral'], total: 0 }
  }

  used.forEach((k) => {
    const h = Math.max(7, ((totalsByCategory[k] || 0) / total) * stackH)
    band[k] = {
      y0: yc - h,
      y1: yc,
      mid: yc - h / 2,
      seconds: totalsByCategory[k] || 0,
    }
    yc -= h
  })

  return { band, used, total }
}

export function buildStreamPaths(cx, y0, y1) {
  const len = y1 - y0
  const mk = (amp, phase) => {
    let d = `M${cx},${y0}`
    for (let i = 1; i <= 28; i++) {
      const t = i / 28
      const y = y0 + t * len
      const taper = 1 - t * 0.35
      const wob =
        Math.sin(t * 11 + phase) * amp * taper +
        Math.sin(t * 23 + phase * 1.7) * amp * 0.35 * taper
      d += ` L${(cx + wob).toFixed(2)},${y.toFixed(2)}`
    }
    return d
  }
  return { core: mk(1.1, 0.4), inner: mk(0.55, 1.2), dust: mk(2.2, 2.6) }
}

export function buildMeniscus(cx, stackTop, mHw) {
  let meni = `M${(cx - mHw).toFixed(1)},${stackTop}`
  for (let i = 1; i <= 40; i++) {
    const xr = i / 40
    const xx = cx - mHw + xr * mHw * 2
    const yy = stackTop - Math.sin(xr * Math.PI) * 1.2 - Math.cos((xr - 0.5) * Math.PI) ** 2.2 * 6
    meni += ` L${xx.toFixed(1)},${yy.toFixed(1)}`
  }
  return meni
}

export function buildNowLabel(cx, labelY, hue, appLabel) {
  const outerWallX = cx - halfW(labelY)
  const labelW = 76
  const labelH = 18
  const wallD = (halfW(labelY + 0.75) - halfW(labelY - 0.75)) / 1.5
  const skew = Math.max(-5.5, Math.min(5.5, wallD * 2.4))
  const lip = 1.5
  const text = `now · ${appLabel}`
  return {
    outerWallX,
    anchor: { x: outerWallX - lip, y: labelY },
    skew,
    labelW,
    labelH,
    text,
    clipW: outerWallX + 0.5,
  }
}

export function buildVesselModel({ totalsByCategory = {}, currentCategory = 'coding', appLabel = '—' }) {
  const cx = VESSEL_CX
  const { band, used, total } = buildBands(totalsByCategory)
  const catMeta = CATEGORIES[currentCategory] || CATEGORIES.neutral
  const hue = catMeta.color
  const vessel = buildVesselPath(cx)
  const lipJoin = VESSEL_Y_TOP + 10
  const lipCy = VESSEL_Y_TOP + 7.5
  const lipA = VESSEL_LIP_R - 1.5
  const lipB = 6.8
  const lipShell = lamePath(cx, lipCy, lipA, lipB, 4, 56, 0.55)
  const lipArc = lameTopArc(cx, lipCy, lipA - 0.4, lipB - 0.5, 4, 28)
  const mHw = halfW(STACK_TOP) - 4
  const meniscus = buildMeniscus(cx, STACK_TOP, mHw)
  const streamY0 = lipJoin + 1
  const streamY1 = STACK_TOP + 1
  const streamLen = Math.ceil(streamY1 - streamY0 + 18)
  const streams = buildStreamPaths(cx, streamY0, streamY1)
  const labelY = STACK_TOP + 14
  const nowLabel = buildNowLabel(cx, labelY, hue, appLabel)
  const nowLead = `M${cx},${(STACK_TOP - 6).toFixed(1)} Q ${(cx - 24).toFixed(1)},${((STACK_TOP + labelY) / 2).toFixed(1)} ${nowLabel.outerWallX.toFixed(1)},${nowLabel.anchor.y.toFixed(1)}`

  let seed = 7
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }

  const strata = []
  used.forEach((k) => {
    const meta = CATEGORIES[k] || CATEGORIES.neutral
    const b = band[k]
    const h = b.y1 - b.y0
    strata.push({ type: 'rect', y0: b.y0, h, fill: meta.color, opacity: 0.48 })
    for (let yy = b.y0; yy < b.y1; yy += 1.1) {
      const hw = halfW(yy) - 2
      if (hw < 4) continue
      const x0 = cx - hw
      const xW = hw * 2
      const deep = mixHex(meta.color, '#050508', 0.45)
      const lite = mixHex(meta.color, '#ffffff', 0.34)
      const col = rnd() > 0.86 ? '#fff' : rnd() > 0.52 ? lite : rnd() > 0.42 ? meta.color : deep
      strata.push({
        type: 'line',
        x1: x0,
        x2: x0 + xW,
        y: yy,
        stroke: col,
        strokeWidth: 0.45 + rnd() * 0.5,
        opacity: 0.18 + rnd() * 0.4,
      })
    }
  })

  const legend = LEGEND_ORDER.filter((k) => (totalsByCategory[k] || 0) > 0).map((k) => ({
    key: k,
    label: CATEGORIES[k]?.label || k,
    color: CATEGORIES[k]?.color || '#888',
    seconds: totalsByCategory[k] || 0,
  }))

  const date = new Date()
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return {
    cx,
    vessel,
    lipShell,
    lipArc,
    lipCy,
    lipA,
    lipB,
    lipJoin,
    meniscus,
    streams,
    streamLen,
    strata,
    band,
    used,
    total,
    hue,
    nowLabel,
    nowLead,
    legend,
    dateStr: `${months[date.getMonth()]} ${date.getDate()}, ${days[date.getDay()]}`,
    totalFmt: fmtDuration(total),
  }
}
