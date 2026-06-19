/** 设计稿基准 — docs/prototype/lens-dew-bar.html */
export const MENISCUS_DESIGN = {
  dewW: 168,
  dockH: 36,
  stageW: 640,
  vesselH: 420,
  pillarsH: 92,
  dragW: 6,
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

/**
 * 按屏幕宽度计算横露珠 + Focus 舞台尺寸。
 * 瓶口（露珠）约为屏宽 7%，舞台宽 ≈ 露珠 × 3.8，整体比原稿略收一档。
 */
export function meniscusScreenLayout(screenWidth = 1920, screenHeight = 1080) {
  const sw = Math.max(1024, Number(screenWidth) || 1920)
  const sh = Math.max(600, Number(screenHeight) || 1080)

  const dewW = Math.round(clamp(sw * 0.07, 116, 142))
  const dockH = Math.round(dewW * (MENISCUS_DESIGN.dockH / MENISCUS_DESIGN.dewW))
  const stageW = Math.round(clamp(dewW * 3.81, 420, Math.min(560, sw * 0.33)))
  const vesselH = Math.round(stageW * (MENISCUS_DESIGN.vesselH / MENISCUS_DESIGN.stageW))
  const pillarsH = Math.round(stageW * (MENISCUS_DESIGN.pillarsH / MENISCUS_DESIGN.stageW))
  const stageH = vesselH + pillarsH
  const shellW = dewW + MENISCUS_DESIGN.dragW
  const expandedW = stageW
  const expandedH = dockH + stageH
  const topMargin = Math.round(clamp(sh * 0.016, 10, 22))

  const peekExtra = Math.round(96 * (dewW / MENISCUS_DESIGN.dewW))
  const peekPlusExtra = Math.round(132 * (dewW / MENISCUS_DESIGN.dewW))
  const icebergOverlap = Math.max(8, Math.round(dockH * 0.45))
  const pourH = Math.max(10, Math.round(dockH * 0.55))
  const neckBridgeH = Math.max(28, Math.round(vesselH * 0.11))

  return {
    dewW,
    dockH,
    stageW,
    vesselH,
    pillarsH,
    stageH,
    shellW,
    expandedW,
    expandedH,
    topMargin,
    peekExtra,
    peekPlusExtra,
    icebergOverlap,
    pourH,
    neckBridgeH,
    dragW: MENISCUS_DESIGN.dragW,
  }
}

export function meniscusLayoutCssVars(layout) {
  return {
    '--tl-dew-w': `${layout.dewW}px`,
    '--tl-dock-h': `${layout.dockH}px`,
    '--tl-stage-w': `${layout.stageW}px`,
    '--tl-stage-h': `${layout.stageH}px`,
    '--tl-vessel-h': `${layout.vesselH}px`,
    '--tl-pillars-h': `${layout.pillarsH}px`,
    '--tl-shell-w': `${layout.shellW}px`,
    '--tl-expanded-h': `${layout.expandedH}px`,
    '--tl-drag-w': `${layout.dragW}px`,
    '--tl-iceberg-overlap': `${layout.icebergOverlap}px`,
    '--tl-pour-h': `${layout.pourH}px`,
    '--tl-top-margin': `${layout.topMargin}px`,
    '--tl-neck-bridge-h': `${layout.neckBridgeH}px`,
  }
}
