/** 横露珠 + Focus 舞台尺寸 — 与 docs/prototype/lens-dew-bar.html 一致 */

export const MENISCUS_DEW_W = 168
export const MENISCUS_W = 168
export const MENISCUS_MINIMAL_W = 32
/** 露珠 168 + 左侧拖动条 6 */
export const MENISCUS_SHELL_W = MENISCUS_DEW_W + 6

export const DOCK_H = 36
export const FOCUS_STAGE_W = 640
export const FOCUS_VESSEL_H = 420
export const FOCUS_PILLARS_H = 92
export const FOCUS_STAGE_H = FOCUS_VESSEL_H + FOCUS_PILLARS_H

export const EXPANDED_W = FOCUS_STAGE_W
export const EXPANDED_H = DOCK_H + FOCUS_STAGE_H
export const PILL_H = DOCK_H

const CHAR_PX = 6.5

export function computeCompactWidth({
  presentationMode = 'meniscus',
  peek = false,
  peekPlus = false,
  timeText = '—',
  label = '',
  appShort = '',
  warning = false,
  connected = true,
  signatureState = 'ambient',
}) {
  if (presentationMode === 'meniscus') {
    return MENISCUS_W
  }

  if (presentationMode === 'minimal' || signatureState === 'minimal') {
    return 36
  }

  const timePx = String(timeText).length * CHAR_PX + 8

  if (!peek && !peekPlus && signatureState === 'ambient') {
    return Math.round(Math.max(72, Math.min(120, 8 + 28 + 6 + timePx)))
  }

  let w = 8 + 28 + 6

  if (presentationMode === 'standard') {
    w = 8 + 12 + 4
  }

  if (signatureState !== 'minimal') {
    w += Math.max(36, String(timeText).length * CHAR_PX + 6)
  }

  if (peek && connected && label) {
    w += Math.min(72, label.length * CHAR_PX + 14)
  }
  if (peekPlus && connected && appShort) {
    w += Math.min(64, appShort.length * CHAR_PX + 18)
  }
  if (!connected && peek) w += 44
  if (warning) w += 36

  return Math.round(Math.max(84, Math.min(156, w)))
}
