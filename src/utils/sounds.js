/**
 * Three signature sounds — opt-in via localStorage `timelens-sounds`.
 * Values: 'off' | 'on' (default off, Warm Restraint)
 *
 * 1. confirm — Focus panel opens / pomodoro armed
 * 2. complete — +1 tomato peak moment
 * 3. landmark — temporal fresh-start pulse (Monday, month, post-lunch)
 */

const STORAGE_KEY = 'timelens-sounds'

export function soundsEnabled() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'on'
  } catch {
    return false
  }
}

export function setSoundsEnabled(on) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off')
  } catch {
    /* ignore */
  }
  // Sync to main process for tray menu label
  window.timelens?.setSoundEnabled?.(on)
}

let audioCtx = null

function getCtx() {
  if (!soundsEnabled()) return null
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    } catch {
      return null
    }
  }
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

function tone(ac, { freq, dur = 0.12, gain = 0.06, type = 'sine' }) {
  const t0 = ac.currentTime
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  g.gain.setValueAtTime(0, t0)
  g.gain.linearRampToValueAtTime(gain, t0 + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g)
  g.connect(ac.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

/** Ma — single soft confirm when entering Focus */
export function playConfirm() {
  const ac = getCtx()
  if (!ac) return
  tone(ac, { freq: 392, dur: 0.1, gain: 0.045 })
}

/** Peak — two-note ascending chime on tomato complete */
export function playComplete() {
  const ac = getCtx()
  if (!ac) return
  tone(ac, { freq: 523.25, dur: 0.14, gain: 0.05 })
  setTimeout(() => tone(ac, { freq: 659.25, dur: 0.18, gain: 0.055 }), 90)
}

/** Landmark — one quiet bell at temporal fresh-start markers */
export function playLandmark() {
  const ac = getCtx()
  if (!ac) return
  tone(ac, { freq: 277.18, dur: 0.35, gain: 0.04, type: 'triangle' })
}

const LANDMARK_KEY = 'timelens-last-landmark'

/** Milkman fresh-start: Monday AM, 1st of month, post-lunch ~13:00. */
export function checkTemporalLandmark(now = new Date()) {
  const day = now.getDay()
  const hour = now.getHours()
  const dateKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${
    hour >= 13 && hour < 14 ? 'lunch' : day === 1 ? 'mon' : now.getDate() === 1 ? 'month' : ''
  }`

  let kind = null
  if (day === 1 && hour >= 8 && hour < 11) kind = 'monday'
  else if (now.getDate() === 1 && hour >= 8 && hour < 12) kind = 'month'
  else if (hour === 13 && now.getMinutes() < 5) kind = 'lunch'

  if (!kind) return false

  try {
    const last = localStorage.getItem(LANDMARK_KEY)
    if (last === dateKey) return false
    localStorage.setItem(LANDMARK_KEY, dateKey)
    return true
  } catch {
    return false
  }
}
