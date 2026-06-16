import { deadReckoning } from '../utils/deadReckoning.js'
import { useTimeStore } from '../store/useTimeStore.js'
import { useSettingsStore } from '../store/useSettingsStore.js'
import { formatClockLabel } from '../utils/settings.js'
import { useEffect, useState } from 'react'

/** Live dead-reckoning strip */
export default function DeadReckoningBar({ now: nowProp, compact = false }) {
  const [now, setNow] = useState(nowProp || new Date())
  const productiveSeconds = useTimeStore((s) => s.todayTotals.productiveSeconds || 0)
  const currentActivity = useTimeStore((s) => s.currentActivity)
  const pomodoro = useTimeStore((s) => s.pomodoro)
  const settings = useSettingsStore((s) => s.settings)
  const getWorkDay = useSettingsStore((s) => s.getWorkDay)
  const getProductiveGoalSeconds = useSettingsStore((s) => s.getProductiveGoalSeconds)

  useEffect(() => {
    if (nowProp) return
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [nowProp])

  const effectiveNow = nowProp || now
  const sessionSeconds = currentActivity?.startedAt
    ? Math.max(0, Math.round((Date.now() - currentActivity.startedAt) / 1000))
    : 0
  const inPomodoro = pomodoro.mode === 'focus' || pomodoro.mode === 'shortBreak' || pomodoro.mode === 'longBreak'
  const flowActive =
    currentActivity?.category?.productive && !inPomodoro && sessionSeconds >= 15 * 60

  const dr = deadReckoning({
    productiveSeconds,
    flowActive,
    now: effectiveNow,
    dailyGoalSeconds: getProductiveGoalSeconds(),
    ...getWorkDay(),
  })

  if (compact) {
    return (
      <div className="flex h-full flex-col justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1.5">
        <div className="mb-1 flex items-baseline justify-between gap-1">
          <span className="text-[9px] text-txt-muted">今日</span>
          <span className="text-[13px] font-semibold leading-none text-txt-primary tnum">{dr.clock}</span>
        </div>
        <div className="relative h-1">
          <div
            className="h-full w-full rounded-full"
            style={{
              background: 'linear-gradient(to right,#4a7cff,#90a8ff,#f0a030,#c07018,#30b060)',
            }}
          />
          <div
            className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border bg-[#0a0a10]"
            style={{
              left: `${dr.markPct}%`,
              transform: 'translate(-50%, -50%)',
              borderColor: dr.color,
            }}
          />
        </div>
      </div>
    )
  }

  const midStart = formatClockLabel(
    settings.workDayStartHour + Math.floor((settings.workDayEndHour - settings.workDayStartHour) / 2)
  )
  const midEnd = formatClockLabel(settings.workDayEndHour - 1, 0)

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[9px] text-txt-muted">Dead reckoning</span>
        <span className="text-[11px] font-medium text-txt-primary tnum">{dr.clock}</span>
      </div>
      <div className="mb-1 flex justify-between text-[9px] text-txt-muted">
        <span>{formatClockLabel(settings.workDayStartHour, settings.workDayStartMin)}</span>
        <span>{midStart}</span>
        <span>{midEnd}</span>
        <span>Goal ✦</span>
      </div>
      <div className="relative mb-2 h-1.5">
        <div
          className="h-full w-full rounded-full"
          style={{
            background: 'linear-gradient(to right,#4a7cff,#90a8ff,#f0a030,#c07018,#30b060)',
          }}
        />
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 bg-[#0a0a10] transition-all duration-500 ease-out"
          style={{
            left: `${dr.markPct}%`,
            transform: 'translate(-50%, -50%)',
            borderColor: dr.color,
          }}
        />
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[9px] text-txt-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#4a7cff]" />
          上午
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#f0a030]" />
          下午
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#30b060]" />
          目标
        </span>
      </div>
    </div>
  )
}
