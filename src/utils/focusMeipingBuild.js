/**
 * 梅瓶 Focus 剖面 SVG — 自 docs/prototype/lens-dew-bar.js buildFocusU 移植
 * 返回 SVG 内层 HTML 字符串（无 DOM）
 */

import { mixHex } from './meniscusDewBar.js'

export const FOCUS_VESSEL_W = 640
export const FOCUS_VESSEL_H = 420
/** 梅瓶剖面：瓶口接缝 y（与 lens-dew-bar.js lipJoin 一致） */
export const FOCUS_Y_TOP = 8
export const FOCUS_LIP_JOIN = FOCUS_Y_TOP + 10
/** 沉积起始 y — 略上移，短颈丰肩（宋梅瓶口颈肩比 ≈ 1:1.2:3） */
export const FOCUS_STACK_TOP = 104
export const FOCUS_NECK_VIEW_H = FOCUS_VESSEL_H - FOCUS_LIP_JOIN

/** 侧视轮廓控制点 [y, halfWidth] — 与 buildFocusMeipingSvg 共用 */
export const FOCUS_VESSEL_PTS = [
  [FOCUS_Y_TOP, 30], [22, 26], [52, 42], [112, 132], [168, 150],
  [258, 136], [328, 106], [360, 80], [380, 56], [392, 34], [398, 6],
]

/** 侧视轮廓 half-width（设计坐标 px） */
export function focusMeipingHalfW(y) {
  const pts = FOCUS_VESSEL_PTS
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
  return 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
}

/** 瓶口外径（设计坐标）— 用于 HTML 颈桥与 SVG 肩线对齐 */
export function focusMeipingLipOuterW() {
  return focusMeipingHalfW(FOCUS_LIP_JOIN) * 2
}

/** 按舞台宽缩放瓶口外径到屏幕 px */
export function focusMeipingLipOuterPx(stageW = FOCUS_VESSEL_W) {
  return Math.round(stageW * (focusMeipingLipOuterW() / FOCUS_VESSEL_W))
}

const FOCUS_SKY = false

const LAYER = {
  coding: { en: 'Coding', hue: '#818CF8' },
  project: { en: 'Project', hue: '#6EE7B7' },
  entertainment: { en: 'Distraction', hue: '#FCA5A5' },
  comms: { en: 'Meetings', hue: '#F9A8D4' },
  learning: { en: 'Learning', hue: '#FCD34D' },
  ai: { en: 'AI', hue: '#67E8F9' },
  neutral: { en: 'Other', hue: '#A0A0B8' },
  idle: { en: 'Idle', hue: '#505068' },
}

function safeLegendMin(m) {
  const n = Number(m) || 0
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.min(24 * 60, Math.round(n))
}

function fmtMin(m) {
  const mins = Math.max(0, Math.round(Number(m) || 0))
  if (mins >= 24 * 60) {
    const h = Math.floor(mins / 60)
    const mm = mins % 60
    return mm > 0 ? `${h}h${String(mm).padStart(2, '0')}m` : `${h}h`
  }
  const h = Math.floor(mins / 60)
  const mm = mins % 60
  return h ? `${h}h${String(mm).padStart(2, '0')}m` : `${mm}m`
}

/** 流沙柱：颈口漏斗 → 落点溅散；椭圆颗粒 + 暖色高光 */
function buildSandCascade(cx, y0, y1, hue, sunHue, rnd, count) {
  const len = y1 - y0
  const cols = (rndFn) => {
    const r = rndFn()
    if (r > 0.88) return '#fff'
    if (r > 0.72) return mixHex(hue, sunHue, 0.28 + rndFn() * 0.22)
    if (r > 0.48) return mixHex(hue, '#ffffff', 0.22 + rndFn() * 0.28)
    if (r > 0.22) return hue
    return mixHex(hue, '#050508', 0.38 + rndFn() * 0.2)
  }
  let g = ''
  for (let i = 0; i < count; i++) {
    const t = rnd()
    const y = y0 + t * len
    const funnel = 0.28 + Math.sin(t * Math.PI) * 0.62 + Math.pow(1 - t, 2.4) * 0.38
    const spread = funnel * (1.8 + rnd() * 5.2)
    const x = cx + (rnd() - 0.5) * spread * 2
    const rx = 0.22 + rnd() * 1.05
    const ry = rx * (0.42 + rnd() * 0.48)
    const rot = (rnd() * 160 - 80).toFixed(1)
    const op = (0.18 + rnd() * 0.62).toFixed(2)
    const delay = (t * 2.4 + rnd() * 0.55).toFixed(2)
    const dur = (1.6 + rnd() * 1.8).toFixed(2)
    const dx = ((rnd() - 0.5) * 5).toFixed(1)
    g +=
      `<ellipse class="fa-sand" style="animation-delay:${delay}s;animation-duration:${dur}s;--dx:${dx}px" ` +
      `transform="rotate(${rot} ${x.toFixed(2)} ${y.toFixed(2)})" cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" ` +
      `rx="${rx.toFixed(2)}" ry="${ry.toFixed(2)}" fill="${cols(rnd)}" opacity="${op}"/>`
  }
  return g
}

function buildSandCrater(cx, stackTop, mHw, hue, sunHue, rnd) {
  let g = ''
  let dune = `M${(cx - mHw * 0.42).toFixed(1)},${stackTop}`
  for (let i = 1; i <= 36; i++) {
    const xr = i / 36
    const xx = cx - mHw * 0.58 + xr * mHw * 1.16
    const pile = Math.pow(Math.cos((xr - 0.5) * Math.PI), 2.05) * 10.5
    const ripple = Math.sin(xr * Math.PI * 7.2) * 0.55
    dune += ` L${xx.toFixed(1)},${(stackTop - pile - ripple - rnd() * 1.2).toFixed(2)}`
  }
  dune += ` L${(cx + mHw * 0.58).toFixed(1)},${stackTop} Z`
  g += `<path class="sand-dune" d="${dune}" fill="url(#u-sand-dune)" opacity="0.72"/>`
  for (let i = 0; i < 48; i++) {
    const ang = rnd() * Math.PI * 2
    const dist = Math.pow(rnd(), 0.55) * mHw * 0.52
    const x = cx + Math.cos(ang) * dist
    const y = stackTop - rnd() * 11 - Math.abs(Math.cos(ang)) * 4
    const rx = 0.2 + rnd() * 0.75
    const col = rnd() > 0.5 ? mixHex(hue, sunHue, rnd() * 0.35) : mixHex(hue, '#fff', rnd() * 0.3)
    const delay = (0.75 + rnd() * 0.9).toFixed(2)
    g +=
      `<ellipse class="fa-sand-grit" style="animation-delay:${delay}s" cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" ` +
      `rx="${rx.toFixed(2)}" ry="${(rx * 0.55).toFixed(2)}" fill="${col}" opacity="${(0.2 + rnd() * 0.5).toFixed(2)}"/>`
  }
  return g
}

function buildStreamPaths(cx, y0, y1) {
  const len = y1 - y0
  const mk = (amp, phase) => {
    let d = `M${cx},${y0}`
    for (let i = 1; i <= 28; i++) {
      const t = i / 28
      const y = y0 + t * len
      const taper = 1 - t * 0.35
      const wob = Math.sin(t * 11 + phase) * amp * taper + Math.sin(t * 23 + phase * 1.7) * amp * 0.35 * taper
      d += ` L${(cx + wob).toFixed(2)},${y.toFixed(2)}`
    }
    return d
  }
  return { core: mk(1.1, 0.4), inner: mk(0.55, 1.2), dust: mk(2.2, 2.6) }
}

function buildVesselGlass(vessel, cx, yTop, yBot, maxR, band, halfW, rnd) {
  const gx1 = cx - maxR + 8
  const gy1 = yTop
  const gx2 = cx + maxR - 6
  const gy2 = yBot
  const frostW = (gx2 - gx1).toFixed(1)
  const frostH = (gy2 - gy1).toFixed(1)
  let ambient = ''
  Object.keys(band).forEach((k) => {
    const b = band[k]
    const meta = LAYER[b.cat || k] || LAYER.idle
    const hw = halfW(b.mid) * 0.55
    ambient += `<ellipse cx="${cx}" cy="${b.mid.toFixed(1)}" rx="${hw.toFixed(1)}" ry="${((b.y1 - b.y0) * 0.42).toFixed(1)}" fill="${meta.hue}" opacity="${(0.05 + rnd() * 0.04).toFixed(3)}"/>`
  })
  ambient += `<ellipse cx="${(cx - 48).toFixed(1)}" cy="178" rx="38" ry="92" fill="#a8b4ff" opacity="0.045"/>`
  ambient += `<ellipse cx="${(cx + 36).toFixed(1)}" cy="248" rx="22" ry="58" fill="#7c3aed" opacity="0.03"/>`

  const refract =
    `<g class="vessel-refract" opacity="0.92">` +
    `<rect x="${gx1}" y="${gy1}" width="${frostW}" height="${frostH}" fill="url(#u-refract-fill)" filter="url(#u-glass-refract)"/>` +
    `</g>`

  const inner =
    `<path d="${vessel}" fill="url(#u-glass-tint)" opacity="0.88"/>` +
    `<path d="${vessel}" fill="url(#u-glass-sheen)" opacity="0.58"/>` +
    `<rect x="${gx1}" y="${gy1}" width="${frostW}" height="${frostH}" fill="url(#u-frost-matte)" opacity="0.26" filter="url(#u-frost-blur)"/>` +
    `<rect x="${gx1}" y="${gy1}" width="${frostW}" height="${frostH}" fill="#fff" opacity="0.13" filter="url(#u-glass-grain-fine)"/>` +
    `<rect x="${gx1}" y="${gy1}" width="${frostW}" height="${frostH}" fill="#dfe2f0" opacity="0.09" filter="url(#u-glass-grain-coarse)" style="mix-blend-mode:overlay"/>` +
    `<path d="${vessel}" fill="rgba(255,255,255,0.05)" filter="url(#u-glass-refract-edge)" opacity="0.85"/>`

  const rim =
    `<path d="${vessel}" fill="none" stroke="rgba(0,0,0,0.38)" stroke-width="3.6" opacity="0.42" stroke-linejoin="round"/>` +
    `<path d="${vessel}" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="4.2" opacity="0.35" stroke-linejoin="round"/>` +
    `<path d="${vessel}" fill="none" stroke="url(#u-rim-outer)" stroke-width="1.55" stroke-linejoin="round" opacity="0.88"/>` +
    `<path d="${vessel}" fill="none" stroke="url(#u-rim-spec)" stroke-width="2.4" stroke-linejoin="round" opacity="0.5"/>` +
    `<path d="${vessel}" fill="none" stroke="url(#u-rim-inner)" stroke-width="0.65" stroke-linejoin="round" opacity="0.62"/>`

  const spec =
    `<ellipse cx="${(cx - 62).toFixed(1)}" cy="172" rx="34" ry="98" fill="url(#u-shoulder-hi)" opacity="0.48"/>` +
    `<ellipse cx="${(cx - 38).toFixed(1)}" cy="108" rx="14" ry="32" fill="url(#u-neck-hi)" opacity="0.42"/>` +
    `<ellipse cx="${(cx + 44).toFixed(1)}" cy="232" rx="18" ry="52" fill="url(#u-shoulder-lo)" opacity="0.26"/>` +
    `<ellipse cx="${cx}" cy="${(yBot - 28).toFixed(1)}" rx="16" ry="8" fill="url(#u-caustic)" opacity="0.38"/>` +
    `<ellipse cx="${(cx - 88).toFixed(1)}" cy="195" rx="6" ry="28" fill="url(#u-edge-flare)" opacity="0.55"/>`

  const defs =
    `<linearGradient id="u-glass-tint" gradientUnits="userSpaceOnUse" x1="${gx1}" y1="${gy1}" x2="${gx2}" y2="${gy2}">` +
    `<stop offset="0%" stop-color="rgba(18,20,32,0.54)"/><stop offset="38%" stop-color="rgba(10,11,20,0.36)"/><stop offset="100%" stop-color="rgba(4,5,10,0.64)"/></linearGradient>` +
    `<linearGradient id="u-glass-sheen" gradientUnits="userSpaceOnUse" x1="${(cx - maxR).toFixed(1)}" y1="${(yTop + 20).toFixed(1)}" x2="${(cx + maxR * 0.35).toFixed(1)}" y2="${(yBot - 40).toFixed(1)}">` +
    `<stop offset="0%" stop-color="rgba(255,255,255,0.24)"/><stop offset="28%" stop-color="rgba(255,255,255,0.08)"/><stop offset="62%" stop-color="rgba(255,255,255,0)"/><stop offset="100%" stop-color="rgba(255,255,255,0.05)"/></linearGradient>` +
    `<linearGradient id="u-frost-matte" gradientUnits="userSpaceOnUse" x1="${gx1}" y1="${gy1}" x2="${gx2}" y2="${gy2}">` +
    `<stop offset="0%" stop-color="rgba(220,225,240,0.16)"/><stop offset="42%" stop-color="rgba(150,155,180,0.07)"/><stop offset="100%" stop-color="rgba(20,22,35,0.2)"/></linearGradient>` +
    `<linearGradient id="u-refract-fill" gradientUnits="userSpaceOnUse" x1="${(cx - maxR).toFixed(1)}" y1="${gy1}" x2="${(cx + maxR).toFixed(1)}" y2="${gy2}">` +
    `<stop offset="0%" stop-color="rgba(180,195,255,0.12)"/><stop offset="45%" stop-color="rgba(120,130,180,0.04)"/><stop offset="100%" stop-color="rgba(40,45,80,0.08)"/></linearGradient>` +
    `<linearGradient id="u-rim-outer" gradientUnits="userSpaceOnUse" x1="${(cx - maxR).toFixed(1)}" y1="${gy1}" x2="${(cx + maxR).toFixed(1)}" y2="${gy2}">` +
    `<stop offset="0%" stop-color="rgba(255,255,255,0.62)"/><stop offset="22%" stop-color="rgba(255,255,255,0.28)"/><stop offset="48%" stop-color="rgba(255,255,255,0.04)"/><stop offset="72%" stop-color="rgba(255,255,255,0.1)"/><stop offset="100%" stop-color="rgba(255,255,255,0.32)"/></linearGradient>` +
    `<linearGradient id="u-rim-spec" gradientUnits="userSpaceOnUse" x1="${(cx - maxR - 10).toFixed(1)}" y1="${(yTop - 4).toFixed(1)}" x2="${(cx + maxR * 0.25).toFixed(1)}" y2="${(yBot * 0.55).toFixed(1)}">` +
    `<stop offset="0%" stop-color="rgba(255,255,255,0.75)"/><stop offset="18%" stop-color="rgba(255,255,255,0.35)"/><stop offset="38%" stop-color="rgba(255,255,255,0)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/></linearGradient>` +
    `<linearGradient id="u-rim-inner" gradientUnits="userSpaceOnUse" x1="${(cx + maxR * 0.5).toFixed(1)}" y1="${gy1}" x2="${(cx - maxR * 0.4).toFixed(1)}" y2="${gy2}">` +
    `<stop offset="0%" stop-color="rgba(255,255,255,0.42)"/><stop offset="50%" stop-color="rgba(255,255,255,0.07)"/><stop offset="100%" stop-color="rgba(255,255,255,0.24)"/></linearGradient>` +
    `<radialGradient id="u-shoulder-hi" cx="38%" cy="42%" r="68%"><stop offset="0%" stop-color="rgba(255,255,255,0.62)"/><stop offset="55%" stop-color="rgba(255,255,255,0.1)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/></radialGradient>` +
    `<radialGradient id="u-neck-hi" cx="42%" cy="35%" r="65%"><stop offset="0%" stop-color="rgba(255,255,255,0.55)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/></radialGradient>` +
    `<radialGradient id="u-shoulder-lo" cx="58%" cy="48%" r="62%"><stop offset="0%" stop-color="rgba(180,190,230,0.24)"/><stop offset="100%" stop-color="rgba(180,190,230,0)"/></radialGradient>` +
    `<radialGradient id="u-caustic" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="rgba(255,255,255,0.4)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/></radialGradient>` +
    `<radialGradient id="u-edge-flare" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="rgba(255,255,255,0.7)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/></radialGradient>` +
    `<filter id="u-frost-blur" x="-8%" y="-4%" width="116%" height="108%"><feGaussianBlur stdDeviation="2.8" result="b"/><feColorMatrix in="b" type="matrix" values="1.14 0 0 0 0.02  0 1.12 0 0 0.02  0 0 1.2 0 0.03  0 0 0 0.92 0"/></filter>` +
    `<filter id="u-glass-grain-fine" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.05" numOctaves="4" seed="14" stitchTiles="stitch" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.14 0"/></filter>` +
    `<filter id="u-glass-grain-coarse" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.32" numOctaves="2" seed="31" stitchTiles="stitch" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.1 0"/></filter>` +
    `<filter id="u-glass-refract" x="-14%" y="-10%" width="128%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.045 0.09" numOctaves="2" seed="21" result="n"/><feGaussianBlur in="n" stdDeviation="1.4" result="nb"/><feDisplacementMap in="SourceGraphic" in2="nb" scale="5.2" xChannelSelector="R" yChannelSelector="G"/></filter>` +
    `<filter id="u-glass-refract-edge" x="-12%" y="-8%" width="124%" height="116%"><feTurbulence type="fractalNoise" baseFrequency="0.08 0.14" numOctaves="2" seed="8" result="n"/><feGaussianBlur in="n" stdDeviation="0.9" result="nb"/><feDisplacementMap in="SourceGraphic" in2="nb" scale="2.8" xChannelSelector="R" yChannelSelector="G"/></filter>`

  return { defs, ambient, refract, inner, rim, spec }
}

/** 瓶身外壁贴标：右缘贴左外轮廓外侧，沿壁微倾，裁剪防穿壁 */
function buildNowLabel(cx, labelY, halfW, hue, appName) {
  const outerWallX = cx - halfW(labelY)
  const labelW = 76
  const labelH = 18
  const wallD = (halfW(labelY + 0.75) - halfW(labelY - 0.75)) / 1.5
  const skew = Math.max(-5.5, Math.min(5.5, wallD * 2.4))
  const lip = 1.5
  const anchor = { x: outerWallX - lip, y: labelY }
  const text = `now · ${appName || '—'}`
  const svg =
    `<g class="now-label" clip-path="url(#now-label-clip)" transform="translate(${anchor.x.toFixed(1)},${labelY.toFixed(1)}) skewY(${(-skew).toFixed(2)}) translate(${-labelW},${(-labelH / 2).toFixed(1)})">` +
    `<rect x="-2.5" y="2" width="${labelW}" height="${labelH}" rx="5" fill="rgba(0,0,0,0.42)" opacity="0.55"/>` +
    `<rect x="0" y="0" width="${labelW}" height="${labelH}" rx="5" fill="url(#now-label-glass)" stroke="rgba(255,255,255,0.2)" stroke-width="0.55"/>` +
    `<rect x="3" y="3" width="2" height="${labelH - 6}" rx="1" fill="${hue}" opacity="0.55"/>` +
    `<rect x="1.5" y="1" width="${labelW - 3}" height="5.5" rx="3" fill="rgba(255,255,255,0.16)"/>` +
    `<line x1="${labelW - 1}" y1="2.5" x2="${labelW - 1}" y2="${labelH - 2.5}" stroke="rgba(0,0,0,0.18)" stroke-width="0.5"/>` +
    `<line x1="4" y1="${labelH - 1.5}" x2="${labelW - 5}" y2="${labelH - 1.5}" stroke="rgba(0,0,0,0.22)" stroke-width="0.45"/>` +
    `<text x="9.5" y="12.5" fill="rgba(120,95,60,0.38)" font-size="9.5" font-style="italic" font-family="Georgia,serif">${text}</text>` +
    `<text x="8.5" y="11.5" fill="rgba(238,210,175,0.92)" font-size="9.5" font-style="italic" font-family="Georgia,serif">${text}</text>` +
    `</g>`
  const defs =
    `<clipPath id="now-label-clip"><rect x="0" y="0" width="${(outerWallX + 0.5).toFixed(1)}" height="420"/></clipPath>` +
    `<linearGradient id="now-label-glass" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0%" stop-color="rgba(28,30,44,0.78)"/><stop offset="45%" stop-color="rgba(18,20,32,0.62)"/><stop offset="100%" stop-color="rgba(10,11,20,0.72)"/></linearGradient>`
  return { svg, defs, anchor, outerWallX, skew }
}

/**
 * @param {{ sessions, categoryTotalsMinutes, nowMeta, iceberg?: boolean }} opts
 */
export function buildFocusMeipingSvg({
  sessions = [],
  categoryTotalsMinutes = {},
  nowMeta = {},
  iceberg = false,
} = {}) {
  const VW = FOCUS_VESSEL_W
  const VH = FOCUS_VESSEL_H
  const G = 8
  const meta = { color: LAYER.coding.hue, app: 'Cursor', ...nowMeta }
  const hue = meta.color || LAYER.coding.hue
  const sunHue = '#E8A830'

  const cx = FOCUS_SKY ? 216 : 320
  const lipR = 30
  const yTop = FOCUS_Y_TOP
  const yBot = 398
  const pts = FOCUS_VESSEL_PTS
  const maxR = 154
  function halfW(y) {
    return focusMeipingHalfW(y)
  }
  const lipJoin = yTop + 10
  function lamePath(cx0, cy0, a, b, n, steps, grav) {
    let d = ''
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2
      const ct = Math.cos(t)
      const stn = Math.sin(t)
      const x = cx0 + a * Math.sign(ct) * Math.pow(Math.abs(ct), 2 / n)
      let y = cy0 + b * Math.sign(stn) * Math.pow(Math.abs(stn), 2 / n)
      if (grav && stn > 0) y += grav * stn * stn
      d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
    }
    return `${d}Z`
  }
  function lameTopArc(cx0, cy0, a, b, n, steps) {
    let d = ''
    for (let i = 0; i <= steps; i++) {
      const t = Math.PI + (i / steps) * Math.PI
      const ct = Math.cos(t)
      const stn = Math.sin(t)
      const x = cx0 + a * Math.sign(ct) * Math.pow(Math.abs(ct), 2 / n)
      const y = cy0 + b * Math.sign(stn) * Math.pow(Math.abs(stn), 2 / n)
      d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
    }
    return d
  }
  const lipCy = yTop + 7.5
  const lipA = lipR - 1.5
  const lipB = 6.8
  const lipN = 4
  const lipShell = lamePath(cx, lipCy, lipA, lipB, lipN, 56, 0.55)
  const lipArc = lameTopArc(cx, lipCy, lipA - 0.4, lipB - 0.5, lipN, 28)
  let lipMeniscus = `M${(cx - lipA + 7).toFixed(1)},${(lipCy - 1.2).toFixed(1)}`
  for (let i = 1; i <= 28; i++) {
    const xr = i / 28
    const xx = cx - lipA + 7 + xr * (lipA * 2 - 14)
    const yy = lipCy - 0.8 - Math.sin(xr * Math.PI) * 1.1 - Math.pow(Math.cos((xr - 0.5) * Math.PI), 2.2) * 2.4
    lipMeniscus += ` L${xx.toFixed(1)},${yy.toFixed(1)}`
  }
  let vessel = `M ${cx - lipR + 4},${yTop + 2} Q ${cx - lipR - 0.5},${yTop + 5} ${cx - lipR},${lipJoin} `
  for (let y = lipJoin; y <= yBot; y += 1) vessel += `L ${(cx - halfW(y)).toFixed(2)},${y} `
  vessel += `Q ${cx},${(yBot + 3).toFixed(1)} ${(cx + halfW(yBot)).toFixed(2)},${yBot} `
  for (let y = yBot; y >= lipJoin; y -= 1) vessel += `L ${(cx + halfW(y)).toFixed(2)},${y} `
  vessel += `Q ${cx + lipR + 0.5},${yTop + 5} ${cx + lipR - 4},${yTop + 2} Z`

  const agg = categoryTotalsMinutes || {}
  const strataSessions = [...sessions].sort((a, b) => (a.t || 0) - (b.t || 0))
  const totalMins = strataSessions.reduce((a, s) => a + (s.mins || 0), 0) || 1

  const stackTop = FOCUS_STACK_TOP
  const stackBot = yBot - 4
  const stackH = stackBot - stackTop
  const band = {}
  const layerList = []
  let yc = stackBot
  strataSessions.forEach((s) => {
    const h = Math.max(6, ((s.mins || 0) / totalMins) * stackH)
    const k = s.cat || 'neutral'
    const entry = { y0: yc - h, y1: yc, mid: yc - h / 2, cat: k, session: s }
    band[k] = band[k] || entry
    layerList.push(entry)
    yc -= h
  })

  let seed = 7
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 }

  let strata = ''
  layerList.forEach((layer, li) => {
    const k = layer.cat
    const layerMeta = LAYER[k] || LAYER.idle
    const b = layer
    const isNow = layer.session?.now
    strata += `<rect x="${cx - maxR}" y="${b.y0.toFixed(1)}" width="${maxR * 2}" height="${(b.y1 - b.y0).toFixed(1)}" fill="${layerMeta.hue}" opacity="${isNow ? 0.56 : 0.48}"/>`
    for (let yy = b.y0; yy < b.y1; yy += 0.55) {
      const hw = halfW(yy) - 2
      if (hw < 4) continue
      const x0 = cx - hw
      const xW = hw * 2
      const deep = mixHex(layerMeta.hue, '#050508', 0.45)
      const lite = mixHex(layerMeta.hue, '#ffffff', 0.34)
      const col = rnd() > 0.86 ? '#fff' : rnd() > 0.52 ? lite : rnd() > 0.42 ? layerMeta.hue : deep
      strata += `<line x1="${x0.toFixed(1)}" x2="${(x0 + xW).toFixed(1)}" y1="${yy.toFixed(2)}" y2="${yy.toFixed(2)}" stroke="${col}" stroke-width="${(0.45 + rnd() * 0.5).toFixed(2)}" opacity="${(0.18 + rnd() * 0.4).toFixed(2)}"/>`
      if (rnd() > 0.58) {
        const fx = x0 + rnd() * xW
        strata += `<line x1="${fx.toFixed(1)}" x2="${(fx + 3 + rnd() * 12).toFixed(1)}" y1="${yy.toFixed(2)}" y2="${(yy + (rnd() - 0.5) * 1.1).toFixed(2)}" stroke="${lite}" stroke-width="0.28" opacity="0.14"/>`
      }
      if (rnd() > 0.72) {
        const gx = x0 + rnd() * xW
        const gr = 0.18 + rnd() * 0.42
        strata += `<ellipse cx="${gx.toFixed(1)}" cy="${(yy + (rnd() - 0.5) * 0.35).toFixed(2)}" rx="${gr.toFixed(2)}" ry="${(gr * 0.55).toFixed(2)}" fill="${rnd() > 0.5 ? lite : deep}" opacity="${(0.12 + rnd() * 0.22).toFixed(2)}"/>`
      }
    }
    if (li < layerList.length - 1) {
      const hw = halfW(b.y0)
      const bandH = b.y1 - b.y0
      const fadeH = Math.min(4.5, bandH * 0.14)
      const x0 = (cx - hw + 2).toFixed(1)
      const xW = (hw * 2 - 4).toFixed(1)
      const y0 = (b.y0 - fadeH).toFixed(1)
      strata +=
        `<rect x="${x0}" y="${y0}" width="${xW}" height="${fadeH.toFixed(1)}" fill="rgba(4,4,8,0.55)" opacity="0.42"/>` +
        `<rect x="${x0}" y="${b.y0.toFixed(1)}" width="${xW}" height="${(fadeH * 0.65).toFixed(1)}" fill="${mixHex(layerMeta.hue, '#050508', 0.55)}" opacity="0.2"/>`
    }
  })

  const mHw = halfW(stackTop) - 4
  let meni = `M${(cx - mHw).toFixed(1)},${stackTop}`
  for (let i = 1; i <= 40; i++) {
    const xr = i / 40
    const xx = cx - mHw + xr * mHw * 2
    const yy = stackTop - Math.sin(xr * Math.PI) * 1.2 - Math.pow(Math.cos((xr - 0.5) * Math.PI), 2.2) * 6
    meni += ` L${xx.toFixed(1)},${yy.toFixed(1)}`
  }
  const streamY0 = lipJoin + 1
  const streamY1 = stackTop + 1
  const streamLen = Math.ceil(streamY1 - streamY0 + 18)
  const streams = buildStreamPaths(cx, streamY0, streamY1)
  const sandCascade = buildSandCascade(cx, streamY0 - 2, streamY1 + 4, hue, sunHue, rnd, 132)
  const sandCrater = buildSandCrater(cx, stackTop, mHw, hue, sunHue, rnd)
  const labelY = stackTop + 14
  const nowLabel = buildNowLabel(cx, labelY, halfW, hue, meta.app)
  const nowLead = `M${cx},${(stackTop - 6).toFixed(1)} Q ${(cx - 24).toFixed(1)},${((stackTop + labelY) / 2).toFixed(1)} ${nowLabel.outerWallX.toFixed(1)},${nowLabel.anchor.y.toFixed(1)}`
  const glassBand = {}
  layerList.forEach((layer, i) => { glassBand[`L${i}`] = layer })
  const vesselGlass = buildVesselGlass(vessel, cx, yTop, yBot, maxR, glassBand, halfW, rnd)

  const legendX = cx + maxR + 28
  const legendRight = VW - G * 4
  const legendStartY = G * 10
  let legendSvg = ''
  let ly = legendStartY
  const legendKeys = Object.keys(agg)
    .filter((k) => agg[k] > 0)
    .sort((a, b) => agg[b] - agg[a])
  legendKeys.forEach((k) => {
    const layerMeta = LAYER[k] || LAYER.idle
    legendSvg +=
      `<circle cx="${legendX}" cy="${ly - 4}" r="3.6" fill="${layerMeta.hue}"/>` +
      `<text x="${legendX + 12}" y="${ly}" fill="#c8c8d8" font-size="11" font-family="Inter,system-ui,sans-serif">${layerMeta.en}</text>` +
      `<text x="${legendRight}" y="${ly}" fill="#787890" font-size="11" text-anchor="end" font-family="ui-monospace,monospace">${fmtMin(agg[k])}</text>`
    ly += G + 11
  })
  const now = new Date()
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dateStr = `${months[now.getMonth()]} ${now.getDate()}, ${days[now.getDay()]}`

  const lipBlock = iceberg
    ? ''
    : `<g class="b-star-lip">
        <path d="M ${cx - lipR},${lipJoin} Q ${cx - lipR + 2},${lipCy + lipB + 1.5} ${cx - lipA + 3},${(lipCy + lipB + 0.8).toFixed(1)}" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="0.55"/>
        <path d="M ${cx + lipR},${lipJoin} Q ${cx + lipR - 2},${lipCy + lipB + 1.5} ${cx + lipA - 3},${(lipCy + lipB + 0.8).toFixed(1)}" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="0.55"/>
        <ellipse cx="${cx}" cy="${lipCy + 0.5}" rx="${lipA - 5}" ry="3.2" fill="url(#u-lip-well)"/>
        <path d="${lipShell}" fill="url(#u-lip)" stroke="url(#u-rim-outer)" stroke-width="0.85" opacity="0.95"/>
        <ellipse cx="${(cx - lipA * 0.28).toFixed(1)}" cy="${(lipCy - lipB * 0.42).toFixed(1)}" rx="16" ry="4.2" fill="url(#u-lip-fresnel)" opacity="0.9"/>
        <path d="${lipMeniscus}" fill="none" stroke="rgba(255,255,255,0.48)" stroke-width="0.62" stroke-linecap="round" opacity="0.82"/>
        <path d="${lipArc}" fill="none" stroke="rgba(255,255,255,0.52)" stroke-width="0.85" stroke-linecap="round"/>
        <circle cx="${cx}" cy="${lipCy}" r="5" fill="${hue}" opacity="0.1"/>
        <circle cx="${cx}" cy="${lipCy}" r="2.3" fill="${hue}" filter="url(#u-glow)"/>
      </g>`

  const legendBlock = iceberg
    ? ''
    : `<g class="fa-legend">
        <text x="${legendX}" y="${G * 6}" fill="#eceaf8" font-size="15" font-weight="500" font-family="Inter,system-ui,sans-serif">TimeLens</text>
        <text x="${legendX}" y="${G * 8}" fill="#64647a" font-size="10" font-family="Inter,system-ui,sans-serif">one day in glass</text>
        ${legendSvg}
        <line x1="${legendX}" x2="${legendRight}" y1="${ly - 8}" y2="${ly - 8}" stroke="rgba(255,255,255,0.07)"/>
        <text x="${legendX}" y="${ly + 8}" fill="#9898ae" font-size="11" font-family="Inter,system-ui,sans-serif">Total ${fmtMin(Object.values(agg).reduce((a, b) => a + safeLegendMin(b), 0))}</text>
        <text x="${legendRight}" y="${ly + 8}" fill="#64647a" font-size="10" text-anchor="end" font-family="ui-monospace,monospace">${dateStr}</text>
      </g>`

  const icebergShift = iceberg ? 0 : lipJoin
  /* 冰山：颈由 IcebergNeck + dock-pour 独占；SVG 不再叠 neckChannel / neckPour */
  const neckChannel = ''
  const neckPour = ''

  const rimClipDef = iceberg
    ? `<clipPath id="u-rim-ice"><rect x="0" y="${lipJoin}" width="${VW}" height="${VH - lipJoin}"/></clipPath>`
    : ''
  const rimGroup = iceberg
    ? `<g class="vessel-glass-rim vessel-glass-rim--iceberg" clip-path="url(#u-rim-ice)">${vesselGlass.rim}</g>`
    : `<g class="vessel-glass-rim">${vesselGlass.rim}</g>`
  const nebCx = FOCUS_SKY ? '80%' : '42%'
  const neckMid = lipJoin + (stackTop - lipJoin) * 0.48
  const edoStreaks = iceberg
    ? `<g class="vessel-edo" opacity="0.36">` +
      `<line x1="${(cx - 20).toFixed(1)}" y1="${stackTop}" x2="${(cx - 24).toFixed(1)}" y2="${stackBot}" stroke="rgba(255,255,255,0.2)" stroke-width="0.42"/>` +
      `<line x1="${(cx - 7).toFixed(1)}" y1="${(stackTop + 10).toFixed(1)}" x2="${(cx - 5).toFixed(1)}" y2="${(stackBot - 18).toFixed(1)}" stroke="rgba(255,255,255,0.12)" stroke-width="0.32"/>` +
      `<line x1="${(cx + 15).toFixed(1)}" y1="${(stackTop + 6).toFixed(1)}" x2="${(cx + 17).toFixed(1)}" y2="${(stackBot - 28).toFixed(1)}" stroke="rgba(255,255,255,0.09)" stroke-width="0.28"/>` +
      `<ellipse cx="${(cx - 36).toFixed(1)}" cy="${neckMid.toFixed(1)}" rx="11" ry="26" fill="rgba(255,255,255,0.08)" opacity="0.85"/>` +
      `</g>`
    : ''

  return (
    `<defs>
        <clipPath id="u-clip"><path d="${vessel}"/></clipPath>
        <linearGradient id="u-stream" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${sunHue}" stop-opacity="0.95"/><stop offset="38%" stop-color="${hue}" stop-opacity="0.82"/><stop offset="100%" stop-color="${hue}" stop-opacity="0.08"/>
        </linearGradient>
        <linearGradient id="u-stream-dust" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${sunHue}" stop-opacity="0.35"/><stop offset="55%" stop-color="${hue}" stop-opacity="0.22"/><stop offset="100%" stop-color="${hue}" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="u-neck-pour" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${hue}" stop-opacity="0.72"/><stop offset="100%" stop-color="${hue}" stop-opacity="0"/>
        </linearGradient>
        <radialGradient id="u-sand-dune" cx="50%" cy="72%" r="68%">
          <stop offset="0%" stop-color="${mixHex(hue, sunHue, 0.32)}" stop-opacity="0.55"/>
          <stop offset="55%" stop-color="${hue}" stop-opacity="0.38"/>
          <stop offset="100%" stop-color="${mixHex(hue, '#050508', 0.5)}" stop-opacity="0.12"/>
        </radialGradient>
        <filter id="u-sand-soft" x="-40%" y="-20%" width="180%" height="160%">
          <feGaussianBlur stdDeviation="1.6" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="u-sand-turb" x="-30%" y="-10%" width="160%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.06 0.28" numOctaves="2" seed="17" result="n"/>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.8" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
        <filter id="u-warp" x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.07" numOctaves="2" seed="3" result="w"/>
          <feDisplacementMap in="SourceGraphic" in2="w" scale="2.4" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
        <filter id="u-grain"><feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="3" seed="9" stitchTiles="stitch" result="n"/>
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.9 0 0 0 -0.28"/></filter>
        <linearGradient id="u-sed" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(255,255,255,0.12)"/><stop offset="1" stop-color="rgba(0,0,0,0.32)"/></linearGradient>
        ${vesselGlass.defs}
        ${nowLabel.defs}
        <radialGradient id="u-neb" cx="${nebCx}" cy="38%" r="55%"><stop offset="0" stop-color="rgba(60,58,158,0.14)"/><stop offset="100%" stop-color="rgba(5,5,8,0)"/></radialGradient>
        <radialGradient id="u-disc" cx="50%" cy="42%" r="60%"><stop offset="0" stop-color="rgba(18,20,42,0.48)"/><stop offset="100%" stop-color="rgba(6,6,12,0.14)"/></radialGradient>
        <radialGradient id="u-lip" cx="34%" cy="22%" r="72%"><stop offset="0" stop-color="rgba(255,255,255,0.38)"/><stop offset="48%" stop-color="rgba(160,165,200,0.14)"/><stop offset="100%" stop-color="rgba(12,12,22,0.58)"/></radialGradient>
        <radialGradient id="u-lip-fresnel" cx="28%" cy="18%" r="68%"><stop offset="0" stop-color="rgba(255,255,255,0.32)"/><stop offset="50%" stop-color="rgba(255,255,255,0.06)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/></radialGradient>
        <radialGradient id="u-lip-well" cx="50%" cy="38%" r="58%"><stop offset="0" stop-color="rgba(4,5,12,0.82)"/><stop offset="100%" stop-color="rgba(8,10,18,0.35)"/></radialGradient>
        <linearGradient id="u-neck-glass" x1="0" y1="${lipJoin}" x2="0" y2="${stackTop}">
          <stop offset="0%" stop-color="rgba(18,20,32,0.75)"/>
          <stop offset="45%" stop-color="rgba(10,12,22,0.88)"/>
          <stop offset="100%" stop-color="rgba(5,5,8,0.94)"/>
        </linearGradient>
        <filter id="u-glow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="u-sun-glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        ${rimClipDef}
      </defs>
      <rect width="${VW}" height="${VH}" fill="#050508"/>
      <rect width="${VW}" height="${VH}" fill="url(#u-neb)"/>
      <g transform="translate(0, ${-icebergShift})">
      ${neckPour}
      ${neckChannel}
      <g clip-path="url(#u-clip)">
        <rect x="${cx - maxR}" y="0" width="${maxR * 2}" height="${VH}" fill="rgba(5,5,8,0.94)"/>
        <g class="vessel-ambient">${vesselGlass.ambient}</g>
        <g class="strata-g" filter="url(#u-warp)">${strata}</g>
        ${vesselGlass.refract}
        <rect x="${cx - maxR}" y="${stackTop}" width="${maxR * 2}" height="${stackH}" fill="url(#u-sed)" opacity="0.28"/>
        <rect x="${cx - maxR}" y="${stackTop}" width="${maxR * 2}" height="${stackH}" filter="url(#u-grain)" opacity="0.08" style="mix-blend-mode:overlay"/>
        <g class="sand-plume" style="--slen:${streamLen}">
          <path class="stream-c" d="${streams.dust}" stroke="url(#u-stream-dust)" stroke-width="7" stroke-linecap="round" filter="url(#u-sand-soft)" opacity="0.35"/>
          <path class="stream-a" d="${streams.core}" stroke="url(#u-stream)" stroke-width="3.2" stroke-linecap="round" filter="url(#u-sand-turb)" opacity="0.42"/>
          <path class="stream-b" d="${streams.inner}" stroke="url(#u-stream)" stroke-width="1.4" stroke-linecap="round" filter="url(#u-glow)" opacity="0.78"/>
          <g class="sand-grains">${sandCascade}</g>
        </g>
        <g class="sand-impact">${sandCrater}</g>
        <path d="${meni}" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="0.8" opacity="0.7"/>
        <path class="sand-shear" d="${meni}" fill="none" stroke="${mixHex(hue, sunHue, 0.25)}" stroke-width="2.2" opacity="0" stroke-linecap="round" filter="url(#u-sand-soft)"/>
        <g class="vessel-glass-inner">${vesselGlass.inner}</g>
        <g class="vessel-spec">${vesselGlass.spec}</g>
        ${edoStreaks}
      </g>
      ${rimGroup}
      ${iceberg ? '' : `<path class="now-lead" d="${nowLead}" fill="none" stroke="rgba(232,168,48,0.22)" stroke-width="0.5" stroke-dasharray="2 4" opacity="0.85"/>`}
      ${nowLabel.svg}
      ${lipBlock}
      </g>

      ${legendBlock}`
  )
}
