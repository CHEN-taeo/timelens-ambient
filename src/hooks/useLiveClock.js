import { useEffect, useState } from 'react'

/** Tick every 30s so dead-reckoning dot color tracks real clock. */
export function useLiveClock(intervalMs = 30_000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}
