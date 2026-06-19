/**
 * 横露珠几何 — 与 docs/prototype/lens-dew-bar.js 对齐
 * 超椭圆外壳 · 毛细弯月面 · 多频驻波 · 黄金分割 ●
 */

export const DEW_W = 168
export const DEW_H = 36
export const PHI = 1.6180339887
export const PRODUCTIVE_CAP_SEC = 8 * 3600

/** 分类液面物理参数（与网页 CATS 一致） */
export const MENISCUS_CAT_PHYSICS = {
  coding: { amp: 1.2, freq: 0.55, deep: true },
  learning: { amp: 1.5, freq: 0.68, deep: true },
  ai: { amp: 1.4, freq: 0.6, deep: true },
  project: { amp: 1.1, freq: 0.48, deep: true },
  comms: { amp: 2.4, freq: 0.95, deep: false },
  entertainment: { amp: 4.5, freq: 1.5, deep: false },
  neutral: { amp: 1.8, freq: 0.72, deep: false },
  idle: { amp: 2.2, freq: 0.8, deep: false },
}

export function hexToRgb(hex) {
  const h = String(hex || '#818CF8').replace('#', '')
  const n = parseInt(h.length === 3 ? h.replace(/./g, (c) => c + c) : h, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export function mixHex(a, b, t) {
  const A = hexToRgb(a)
  const B = hexToRgb(b)
  const m = (x, y) => Math.round(x + (y - x) * t)
  return `rgb(${m(A.r, B.r)},${m(A.g, B.g)},${m(A.b, B.b)})`
}

/** 航程色带 — 与网页 reckon() 一致 */
export function reckon(p) {
  const stops = [
    [0, '#4A7CFF'],
    [0.35, '#90A8FF'],
    [0.55, '#F0A030'],
    [0.78, '#C07018'],
    [1, '#30B060'],
  ]
  for (let i = 0; i < stops.length - 1; i++) {
    if (p <= stops[i + 1][0]) return stops[i][1]
  }
  return stops[stops.length - 1][1]
}

function gauss(x, mu, s) {
  const d = (x - mu) / s
  return Math.exp(-d * d)
}

/** Lamé 超椭圆 |x/a|^n + |y/b|^n = 1，n≈4；底缘重力微鼓 */
export function superellipseShell(W, H, wobble = 0) {
  const cx = W / 2
  const cy = H / 2
  const a = W / 2 - 0.5
  const b = H / 2 - 0.5
  const n = 4
  const grav = 1.15 + wobble * 0.35
  const steps = 72
  let d = ''
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2
    const ct = Math.cos(t)
    const stn = Math.sin(t)
    const x = cx + a * Math.sign(ct) * Math.pow(Math.abs(ct), 2 / n)
    let y = cy + b * Math.sign(stn) * Math.pow(Math.abs(stn), 2 / n)
    if (stn > 0) y += grav * stn * stn
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
  }
  return `${d}Z`
}

/** 弯月面：边缘毛细下陷 + 驻波 */
export function surfY(xr, W, baseY, amp, freq, phase, wetBias) {
  const x = xr * W
  const capillary = (gauss(x, 0, W * 0.2) + gauss(x, W, W * 0.2)) * 2.2
  const f1 = Math.sin(xr * Math.PI * 2 * (1 + freq) + phase * freq * 2.2)
  const f2 = Math.sin(xr * Math.PI * 4.1 + phase * 1.3) * 0.35
  const f3 = Math.sin(xr * Math.PI * 6.7 + phase * 0.7) * 0.15
  const tilt = wetBias * (xr - 0.5) * 2.8
  return baseY - capillary - amp * (f1 + f2 + f3) + tilt
}

export function productiveFillP(productiveSeconds = 0) {
  if (productiveSeconds <= 0) return 0.55
  return Math.min(0.92, Math.max(0.08, productiveSeconds / PRODUCTIVE_CAP_SEC))
}

export function tideFraction(now = new Date()) {
  return (now.getHours() * 60 + now.getMinutes()) / (24 * 60)
}

/** 从会话长度推断稳定度（网页滑块默认 0.82） */
export function estimateSteady({ flow, warning, sessionSeconds = 0 }) {
  if (flow) return 0.9
  if (warning) return 0.38
  if (sessionSeconds > 25 * 60) return 0.86
  if (sessionSeconds > 10 * 60) return 0.78
  if (sessionSeconds > 3 * 60) return 0.65
  return 0.52
}

/**
 * 单帧露珠渲染数据 — 供 MeniscusVessel SVG 使用
 */
export function computeDewBarFrame({
  width = DEW_W,
  height = DEW_H,
  hue = '#818CF8',
  catKey = 'coding',
  fillP = 0.55,
  tideP = 0.5,
  steady = 0.82,
  flow = false,
  focus = false,
  hover = false,
  prox = 'ambient',
  wetBias = 0,
  phase = 0,
  breath = 0,
  settle = 'none',
  settleT = 0,
  evap = 0,
  cryOn = false,
  crystal = 0,
}) {
  const W = width
  const H = height
  const c = MENISCUS_CAT_PHYSICS[catKey] || MENISCUS_CAT_PHYSICS.coding
  const instab = 1 - steady
  const wob = Math.sin(phase * 1.25) * (flow ? 0.15 : 1)
  const shell = superellipseShell(W, H, wob)

  let fill = fillP
  if (settle === 'evaporating') fill = evap * (1 - settleT)
  if (settle === 'ended') fill = 0

  const breathWave = breath > 0 ? Math.sin(breath * Math.PI) : 0
  fill = Math.min(0.94, fill + breathWave * 0.04)

  const bottom = H - 1.5
  const top = 3.5
  const liquidH = bottom - top
  const baseY = bottom - fill * liquidH

  let amp = c.amp * (0.22 + instab * 1.15)
  if (c.deep && steady > 0.7) amp *= 0.42
  if (flow) amp *= 0.1
  amp *= 1 - breathWave * 0.5
  if (hover && !flow && !focus) {
    if (prox === 'peekPlus') amp *= 1.12
    else if (prox === 'peek') amp *= 1.06
    else amp *= 1.03
  }

  const N = 48
  let line = ''
  for (let i = 0; i <= N; i++) {
    const xr = i / N
    const x = 2 + xr * (W - 4)
    const y = surfY(xr, W, baseY, amp, c.freq, phase, wetBias)
    line += `${i ? ` L ${x},${y}` : `M ${x},${y}`}`
  }

  const liquidPath = `${line} L ${W - 2},${bottom + 2} L 2,${bottom + 2} Z`
  const voyage = reckon(fill)
  const rgb = hexToRgb(hue)
  const op = flow ? 0.34 : 0.74
  const shellTint = mixHex('#0a0a12', hue, 0.14)
  const shellOpacity = flow ? 0.42 : 0.9

  const poolTop = Math.max(top, baseY - 2)
  const poolHeight = bottom - poolTop + 1

  const tideY = bottom - tideP * liquidH
  const ghostStroke = reckon(tideP)
  const ghostOpacity = flow ? 0.26 : 0.44

  const peakX = 1 / PHI
  const bx = 2 + peakX * (W - 4)
  const by = surfY(peakX, W, baseY, amp, c.freq, phase, wetBias)
  const j = instab * (flow ? 0 : 1.6)
  const jx = Math.sin(phase * 8.2) * j
  const jy = Math.cos(phase * 10.5) * j * 0.35
  const beadCx = bx + jx
  const beadCy = by + jy
  const beadOpacity = flow ? 0.32 : 1
  const beadVisible = !(flow || focus)

  let crystalPoints = ''
  let crystalOpacity = 0
  let crystalFill = '#fff'
  if (cryOn || settle === 'ended') {
    const ccx = settle === 'ended' ? W / 2 : beadCx
    const ccy = settle === 'ended' ? H / 2 : beadCy
    const pr = settle === 'ended' ? 1 : Math.sin(crystal * Math.PI)
    const s = 2.5 + pr * 4
    crystalPoints = `${ccx},${ccy - s} ${ccx + s * 0.65},${ccy} ${ccx},${ccy + s} ${ccx - s * 0.65},${ccy}`
    crystalFill = settle === 'ended' ? reckon(fillP) : '#fff'
    crystalOpacity = settle === 'ended' ? 0.9 : pr
  }

  const fresnelOpacity = flow ? 0.3 : 0.72 + breathWave * 0.08
  const specOpacity = flow ? 0.35 : 0.82
  const specSoftOpacity = flow ? 0.2 : 0.42
  const hzOpacity = flow ? 0.5 : 0.95

  return {
    shell,
    liquidPath,
    surfaceLine: line,
    shellTint,
    shellOpacity,
    hue,
    voyage,
    rgb,
    op,
    poolTop,
    poolHeight,
    poolWash: {
      pw0: flow ? 0.38 : 0.52,
      pw1: flow ? 0.42 : 0.56,
      pw2: flow ? 0.46 : 0.6,
      pw2Color: mixHex(hue, '#000000', 0.08),
    },
    liqDeepOpacity: flow ? 0.12 : 0.2,
    tideY,
    ghostStroke,
    ghostOpacity,
    baseY,
    hzOpacity,
    specOpacity,
    specSoftOpacity,
    beadCx,
    beadCy,
    beadOpacity,
    beadVisible,
    beadGlow: `drop-shadow(0 0 4px rgba(${rgb.r},${rgb.g},${rgb.b},0.7))`,
    crystalPoints,
    crystalOpacity,
    crystalFill,
    fresnelOpacity,
    fresnelCx: W * 0.214,
    fresnelCy: 9,
    fresnelRx: W * 0.286,
    fresnelRy: 11,
    showLiquid: settle !== 'ended' && fill > 0.01,
  }
}
