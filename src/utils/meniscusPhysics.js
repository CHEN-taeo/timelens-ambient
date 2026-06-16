/**
 * Meniscus fluid physics — viscosity & tension profiles per visual state.
 * Ambient = crisp water · Flow = honey · Warning = boiling jitter
 */

export const VISCOSITY = {
  ambient: { stiffness: 420, damping: 30, flat: false },
  /** Hover micro-ripple — crisp, light splash */
  ambientHover: { stiffness: 480, damping: 22, flat: false, rippleAmp: 0.55, rippleHz: 0.75 },
  peek: { stiffness: 440, damping: 28, flat: false },
  /** Flow — high damping, flat meniscus, honey stillness */
  flow: { stiffness: 160, damping: 72, flat: true, rippleAmp: 0, rippleHz: 0 },
  /** Entertainment drift — gentle standing wave */
  entertainment: { stiffness: 380, damping: 28, flat: false, rippleAmp: 0.85, rippleHz: 0.22 },
  /** Pomodoro deviation / boiling — high-freq edge noise */
  warning: { stiffness: 520, damping: 16, flat: false, rippleAmp: 1.6, rippleHz: 0.85, noise: true },
  focus: { stiffness: 360, damping: 34, flat: false },
  settle: { stiffness: 100, damping: 42, flat: true, rippleAmp: 0, rippleHz: 0 },
  minimal: { stiffness: 280, damping: 38, flat: false, rippleAmp: 0, rippleHz: 0 },
}

/** Pick active physics profile from runtime flags. */
export function resolveMeniscusPhysics({
  visualState = 'ambient',
  flow = false,
  warning = false,
  entertainment = false,
  hovered = false,
}) {
  if (visualState === 'settle') return VISCOSITY.settle
  if (visualState === 'minimal') return VISCOSITY.minimal
  if (visualState === 'focus') return VISCOSITY.focus
  if (warning) return VISCOSITY.warning
  if (flow) return VISCOSITY.flow
  if (entertainment) return VISCOSITY.entertainment
  if (visualState === 'peek') return VISCOSITY.peek
  if (hovered && visualState === 'ambient') return VISCOSITY.ambientHover
  return VISCOSITY.ambient
}

export function springFromPhysics(physics) {
  return { type: 'spring', stiffness: physics.stiffness, damping: physics.damping }
}

/** Multi-frequency edge jitter — Perlin-like without deps */
export function meniscusNoise(phase, intensity = 1) {
  return (
    Math.sin(phase * 4.1) * 0.55 +
    Math.sin(phase * 8.3 + 1.2) * 0.3 +
    Math.sin(phase * 13.7 + 2.4) * 0.15
  ) * intensity
}
