import { useTimeStore } from '../store/useTimeStore.js'
import { CATEGORIES } from '../utils/rules.js'
import { useThreadStore } from '../store/useThreadStore.js'

function fmtProd(seconds = 0) {
  const s = Math.max(0, Math.round(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}m`
  return `${m}m`
}

function shortApp(app = '') {
  const base = app.replace(/\.exe$/i, '').split(/[/\\]/).pop() || app
  return base.length > 18 ? `${base.slice(0, 16)}…` : base
}

export default function ThreadDetail() {
  const detailOpen = useThreadStore((s) => s.detailOpen)
  const setDetailOpen = useThreadStore((s) => s.setDetailOpen)

  const connected = useTimeStore((s) => s.connected)
  const currentActivity = useTimeStore((s) => s.currentActivity)
  const todayTotals = useTimeStore((s) => s.todayTotals)

  if (!detailOpen) return null

  const cat = currentActivity?.category
  const catKey = typeof cat === 'object' && cat ? cat.key : cat || 'neutral'
  const meta = CATEGORIES[catKey] || CATEGORIES.neutral
  const sessionMins = currentActivity?.startedAt
    ? Math.max(0, Math.round((Date.now() - currentActivity.startedAt) / 60000))
    : 0
  const app = shortApp(currentActivity?.app || '')

  return (
    <div className="thread-detail no-drag">
      <button
        type="button"
        className="thread-detail-close"
        onClick={() => setDetailOpen(false)}
        aria-label="收起"
      >
        ✕
      </button>
      {connected ? (
        <>
          <div className="thread-detail-line">
            <span className="thread-detail-dot" style={{ background: meta.color }} />
            <span>
              {meta.label} · {sessionMins}m
            </span>
          </div>
          {app ? <div className="thread-detail-sub">因为：{app}</div> : null}
          <div className="thread-detail-sub tnum">
            今日有效 {fmtProd(todayTotals.productiveSeconds || 0)}
          </div>
        </>
      ) : (
        <>
          <div className="thread-detail-line">ActivityWatch 未连接</div>
          <div className="thread-detail-sub">演示 · 丝线在漂 · 连接后可看分类</div>
        </>
      )}
    </div>
  )
}
