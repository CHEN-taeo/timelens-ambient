/** Golden-ratio thread bundle — 丝束左端聚合，向右扇形散开 */

export const PHI = (1 + Math.sqrt(5)) / 2
const FIB_SCALE = [0.78, 0.88, 1, 0.92, 0.84]
const WAVE_ROOM = 14

export function computeThreadLayout(
  workAreaWidth,
  workAreaHeight,
  { detailOpen = false, fixOpen = false } = {},
) {
  const W = Math.max(800, workAreaWidth || 1920)
  const H = Math.max(600, workAreaHeight || 1080)
  const L = Math.round(Math.min(144, W / (PHI * PHI)))
  const threadCount = W < 1400 ? 3 : 5
  const lengths = FIB_SCALE.slice(0, threadCount).map((s) => Math.round(L * s))

  const padX = 16
  const padY = 8
  /** 束尖最大垂直展开 — 聚合点在束腰，梢端扇开 */
  const fanSpread = Math.round(L * 0.26)
  const bundleH = fanSpread + WAVE_ROOM + padY * 2
  const bundleW = L + 36

  /** 左端结：所有丝从此点出发（聚合） */
  const anchorX = padX + 6
  const anchorY = padY + bundleH / 2

  const detailExtra = detailOpen ? 78 : 0
  const fixExtra = fixOpen ? Math.max(Math.round(L / PHI), 168) : 0
  const panelExtra = Math.max(detailExtra, fixExtra)
  const windowW = bundleW
  const windowH = bundleH + panelExtra + 8
  const topMargin = Math.max(12, Math.round(H * 0.012))

  return {
    L,
    threadCount,
    lengths,
    bundleW,
    bundleH,
    fanSpread,
    anchorX,
    anchorY,
    detailExtra,
    fixExtra,
    panelExtra,
    windowW,
    windowH,
    topMargin,
    padX,
    padY,
    contentH: bundleH + panelExtra,
  }
}
