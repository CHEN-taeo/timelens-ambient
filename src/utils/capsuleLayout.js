/** Tight compact width — no dead space in the ambient pill. */

const CHAR_PX = 6.5

/** Meniscus vessel — fixed Electron window; inner liquid width animates on hover. */
export const MENISCUS_W = 168
export const MENISCUS_MINIMAL_W = 32
export const MENISCUS_LIQUID_AMBIENT = 92
export const MENISCUS_LIQUID_HOVER = 108
export const MENISCUS_LIQUID_PEEK = 122
export const MENISCUS_LIQUID_PEEK_PLUS = 136

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
    if (signatureState === 'minimal') return MENISCUS_MINIMAL_W
    return MENISCUS_W
  }

  if (presentationMode === 'minimal' || signatureState === 'minimal') {
    return 36
  }

  const timePx = String(timeText).length * CHAR_PX + 8

  if (!peek && !peekPlus && signatureState === 'ambient') {
    // Ambient: ring + time only — hug content
    return Math.round(Math.max(72, Math.min(120, 8 + 28 + 6 + timePx)))
  }

  let w = 8 + 28 + 6 // drag + ring + gap

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

export const EXPANDED_W = 320
export const EXPANDED_H = 236
export const PILL_H = 36
