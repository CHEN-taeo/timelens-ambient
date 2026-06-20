/** Silk thread simulation — 束腰聚合 + 梢端扇形 + 驻波 */

const IRRATIO = [Math.SQRT2, Math.SQRT3, Math.PI / Math.E, 1.618, 2.236]

function lerp(a, b, t) {
  return a + (b - a) * t
}

function smoothstep(s) {
  const t = Math.max(0, Math.min(1, s))
  return t * t * (3 - 2 * t)
}

function mixHex(base, amount, toward = '#ffffff') {
  const parse = (hex) => {
    const h = hex.replace('#', '')
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ]
  }
  const [r1, g1, b1] = parse(base)
  const [r2, g2, b2] = parse(toward)
  const t = Math.max(0, Math.min(1, amount))
  const ch = (a, b) => Math.round(a + (b - a) * t)
  return `rgb(${ch(r1, r2)}, ${ch(g1, g2)}, ${ch(b1, b2)})`
}

export function createThreadEngine(layout) {
  const { threadCount, lengths, fanSpread } = layout
  const mid = (threadCount - 1) / 2

  const threads = lengths.map((len, i) => ({
    len,
    tipSpread: mid === 0 ? 0 : ((i - mid) / mid) * fanSpread,
    omega: 0.85 + IRRATIO[i % IRRATIO.length] * 0.18,
    phase: (i / threadCount) * Math.PI * 2 + IRRATIO[i % IRRATIO.length] * 0.55,
    hueShift: i * 0.08,
  }))

  return {
    threads,
    time: 0,
    tangleAmount: 0,
    scatterAmount: 0,
    alignAmount: 0,
    mouseX: -9999,
    mouseY: -9999,
    sweep: 0,
    crossingBoost: 0,
  }
}

export function stepEngine(engine, dt, targets) {
  const t = Math.min(1, dt * 8)
  engine.tangleAmount = lerp(engine.tangleAmount, targets.tangleAmount ?? 0, t)
  engine.scatterAmount = lerp(engine.scatterAmount, targets.scatterAmount ?? 0, t)
  engine.alignAmount = lerp(engine.alignAmount, targets.alignAmount ?? 0, t)
  engine.mouseX = targets.mouseX ?? engine.mouseX
  engine.mouseY = targets.mouseY ?? engine.mouseY
  engine.time += dt

  if (targets.sweepTrigger) engine.sweep = 1
  engine.sweep = Math.max(0, engine.sweep - dt * 2.5)

  const tangled = engine.tangleAmount > 0.35
  engine.crossingBoost = lerp(engine.crossingBoost, tangled ? 1 : 0, t * 0.5)
}

/** 沿丝参数 localX∈[0,len]：左端聚合于 anchor，向右扇开 + 驻波 */
export function sampleThreadPoint(engine, thread, layout, localX) {
  const { len, tipSpread, omega, phase } = thread
  const { anchorX, anchorY } = layout
  const s = localX / Math.max(len, 1)
  const t = engine.time

  let spread = tipSpread
  spread = lerp(spread, 0, engine.alignAmount)
  spread = lerp(spread, tipSpread * 1.65, engine.scatterAmount)

  let amp = lerp(2.2, 0.9, engine.alignAmount)
  amp = lerp(amp, 4.8, engine.scatterAmount)
  amp = lerp(amp, 1.2, engine.tangleAmount)

  const wave =
    Math.sin((2 * Math.PI * s) / 1 + omega * t + phase) * amp +
    Math.sin((2 * Math.PI * s) / 2 + omega * 1.25 * t + phase * 0.65) * amp * 0.32

  const fanY = spread * smoothstep(s)
  const x = anchorX + localX
  let y = anchorY + fanY + wave

  const dx = x - engine.mouseX
  const dy = y - engine.mouseY
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist < 72) {
    y += ((72 - dist) / 72) * 3.5 * (1 - engine.alignAmount) * Math.sign(dy || 1)
  }

  if (engine.tangleAmount > 0.25) {
    const pull = engine.tangleAmount * (1 - s) * 2.5
    y = lerp(y, anchorY, pull * 0.35)
  }

  return { x, y }
}

function strokeThread(ctx, points, { color, alpha, width, glow = false }) {
  if (points.length < 2) return
  ctx.save()
  if (glow) {
    ctx.shadowBlur = 5
    ctx.shadowColor = color
  }
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y)
  ctx.strokeStyle = color
  ctx.globalAlpha = alpha
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke()
  ctx.restore()
}

export function drawThreadField(
  ctx,
  engine,
  layout,
  { opacity = 0.12, categoryColor = '#818CF8', clipHeight = null } = {},
) {
  const { lengths, anchorX, anchorY } = layout
  const { windowW, windowH } = layout
  const h = clipHeight ?? windowH
  ctx.clearRect(0, 0, windowW, h)

  if (engine.sweep > 0) {
    const sweepX = (1 - engine.sweep) * windowW
    ctx.save()
    ctx.globalAlpha = engine.sweep * 0.35
    ctx.fillStyle = '#fff'
    ctx.fillRect(sweepX - 20, 0, 40, h)
    ctx.restore()
  }

  engine.threads.forEach((thread, ti) => {
    const len = lengths[ti]
    const steps = 36
    const points = []
    for (let i = 0; i <= steps; i++) {
      const localX = (i / steps) * len
      points.push(sampleThreadPoint(engine, thread, layout, localX))
    }

    const threadColor = mixHex(categoryColor, thread.hueShift * 0.32, '#e8e4ff')
    const baseAlpha = opacity * (0.68 + ti * 0.07)
    const lw = engine.tangleAmount > 0.4 ? 2 : 1.5 + (ti % 2) * 0.1

    strokeThread(ctx, points, {
      color: threadColor,
      alpha: baseAlpha * 0.3,
      width: lw + 1,
      glow: true,
    })
    strokeThread(ctx, points, {
      color: threadColor,
      alpha: baseAlpha,
      width: lw,
      glow: false,
    })
  })

  if (opacity > 0.04) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(anchorX, anchorY, 2.2, 0, Math.PI * 2)
    ctx.fillStyle = mixHex(categoryColor, 0.2, '#ffffff')
    ctx.globalAlpha = opacity * 0.85
    ctx.fill()
    ctx.restore()
  }

  if (engine.crossingBoost > 0.15) {
    ctx.beginPath()
    ctx.strokeStyle = '#FCD34D'
    ctx.globalAlpha = opacity * engine.tangleAmount * 0.9
    ctx.lineWidth = 1.5
    ctx.moveTo(anchorX - 4, anchorY - 3)
    ctx.lineTo(anchorX + 5, anchorY + 2)
    ctx.moveTo(anchorX - 3, anchorY + 3)
    ctx.lineTo(anchorX + 4, anchorY - 2)
    ctx.stroke()
  }

  ctx.globalAlpha = 1
  ctx.shadowBlur = 0
}
