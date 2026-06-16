import { useEffect, useRef } from 'react'
import Capsule from './components/Capsule.jsx'
import { useTimeStore } from './store/useTimeStore.js'
import { useSettingsStore } from './store/useSettingsStore.js'
import { getCurrentActivity, getTodayTotals, getDayStrip, pingAW } from './store/awService.js'
import { checkTemporalLandmark, playLandmark, setSoundsEnabled, soundsEnabled } from './utils/sounds.js'

const POLL_ACTIVITY_MS = 5000
const POLL_TOTALS_MS = 30000

export default function App() {
  const setConnected = useTimeStore((s) => s.setConnected)
  const setCurrentActivity = useTimeStore((s) => s.setCurrentActivity)
  const setTodayTotals = useTimeStore((s) => s.setTodayTotals)
  const setDayStrip = useTimeStore((s) => s.setDayStrip)
  const tick = useTimeStore((s) => s.tick)
  const triggerEdgeShimmer = useTimeStore((s) => s.triggerEdgeShimmer)

  const totalsCounter = useRef(0)

  useEffect(() => {
    useSettingsStore.getState().hydrate()
  }, [])

  // Sync sound toggle from tray menu → localStorage
  useEffect(() => {
    if (!window.timelens?.onSoundToggled) return
    window.timelens.getSoundEnabled().then((enabled) => {
      setSoundsEnabled(enabled)
    })
    const unsub = window.timelens.onSoundToggled((enabled) => {
      setSoundsEnabled(enabled)
    })
    return unsub
  }, [])

  useEffect(() => {
    let cancelled = false

    async function pollActivity() {
      try {
        const act = await getCurrentActivity()
        if (cancelled) return
        setConnected(true)
        setCurrentActivity(act)
      } catch {
        if (cancelled) return
        setConnected(false)
      }
    }

    async function pollTotals() {
      try {
        const [totals, strip] = await Promise.all([getTodayTotals(), getDayStrip()])
        if (cancelled) return
        setTodayTotals(totals)
        setDayStrip(strip)
      } catch {
        /* keep last known totals on error */
      }
    }

    // Initial connectivity check + first loads.
    pingAW().then((ok) => setConnected(ok))
    pollActivity()
    pollTotals()

    const actTimer = setInterval(pollActivity, POLL_ACTIVITY_MS)
    const totalsTimer = setInterval(pollTotals, POLL_TOTALS_MS)

    return () => {
      cancelled = true
      clearInterval(actTimer)
      clearInterval(totalsTimer)
    }
  }, [setConnected, setCurrentActivity, setTodayTotals, setDayStrip])

  // 1-second pomodoro tick.
  useEffect(() => {
    const t = setInterval(() => tick(), 1000)
    return () => clearInterval(t)
  }, [tick])

  // Temporal landmark — one quiet pulse at fresh-start markers (Milkman et al.).
  useEffect(() => {
    if (checkTemporalLandmark()) {
      triggerEdgeShimmer()
      playLandmark()
    }
  }, [triggerEdgeShimmer])

  return <Capsule />
}
