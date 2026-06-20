import { useEffect } from 'react'
import Capsule from './components/Capsule.jsx'
import MeniscusCapsule from './components/MeniscusCapsule.jsx'
import ThreadField from './components/ThreadField.jsx'
import { useTimeStore } from './store/useTimeStore.js'
import { useSettingsStore } from './store/useSettingsStore.js'
import { getCurrentActivity, getTodayTotals, getTodaySessions, getDayStrip, pingAW } from './store/awService.js'
import { checkTemporalLandmark, playLandmark, setSoundsEnabled } from './utils/sounds.js'
import { useThreadStore } from './store/useThreadStore.js'

const POLL_ACTIVITY_MS = 5000
const POLL_TOTALS_MS = 30000

export default function App() {
  const presentationMode = useSettingsStore((s) => s.settings.presentationMode)
  const isThread = presentationMode === 'thread'
  const useMeniscusDock = presentationMode === 'meniscus' || presentationMode === 'lens-ring'

  const setConnected = useTimeStore((s) => s.setConnected)
  const setCurrentActivity = useTimeStore((s) => s.setCurrentActivity)
  const setTodayTotals = useTimeStore((s) => s.setTodayTotals)
  const setTodaySessions = useTimeStore((s) => s.setTodaySessions)
  const setDayStrip = useTimeStore((s) => s.setDayStrip)
  const tick = useTimeStore((s) => s.tick)
  const triggerEdgeShimmer = useTimeStore((s) => s.triggerEdgeShimmer)

  useEffect(() => {
    useSettingsStore.getState().hydrate()
  }, [])

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
    if (isThread) return
    window.timelens?.setMousePassthrough?.(false)
  }, [isThread])

  useEffect(() => {
    if (!window.timelens) {
      document.documentElement.classList.add('browser-preview')
    }
  }, [])

  useEffect(() => {
    if (!isThread) return
    const setVisibility = useThreadStore.getState().setVisibility
    const onVis = () => {
      setVisibility(document.hidden ? 'ghost' : 'breath')
    }
    onVis()
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [isThread])

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
        const [totals, strip, sessions] = await Promise.all([
          getTodayTotals(),
          getDayStrip(),
          getTodaySessions(),
        ])
        if (cancelled) return
        setTodayTotals(totals)
        setDayStrip(strip)
        setTodaySessions(sessions)
      } catch {
        /* keep last known totals on error */
      }
    }

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
  }, [setConnected, setCurrentActivity, setTodayTotals, setTodaySessions, setDayStrip])

  useEffect(() => {
    const t = setInterval(() => tick(), 1000)
    return () => clearInterval(t)
  }, [tick])

  useEffect(() => {
    if (checkTemporalLandmark()) {
      triggerEdgeShimmer()
      playLandmark()
    }
  }, [triggerEdgeShimmer])

  if (isThread) {
    return <ThreadField />
  }

  if (useMeniscusDock) {
    return <MeniscusCapsule />
  }

  return <Capsule />
}
