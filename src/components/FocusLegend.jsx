import { CATEGORIES } from '../utils/rules.js'

const LAYER_EN = {
  coding: 'Coding',
  project: 'Project',
  entertainment: 'Distraction',
  comms: 'Meetings',
  learning: 'Learning',
  ai: 'AI',
  neutral: 'Other',
  idle: 'Idle',
}

function fmtMin(m) {
  const mins = Math.max(0, Math.round(Number(m) || 0))
  const h = Math.floor(mins / 60)
  const mm = mins % 60
  if (h > 0 && mm > 0) return `${h}h ${String(mm).padStart(2, '0')}m`
  if (h > 0) return `${h}h`
  return `${mins}m`
}

function safeMinutes(m) {
  const n = Number(m) || 0
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.min(24 * 60, Math.round(n))
}

/** 梅瓶右侧图例 — HTML 排版，避免 SVG 文字重叠 */
export default function FocusLegend({ categoryTotalsMinutes = {} }) {
  const rows = Object.entries(categoryTotalsMinutes)
    .map(([k, m]) => [k, safeMinutes(m)])
    .filter(([, m]) => m >= 1)
    .sort((a, b) => b[1] - a[1])

  const total = rows.reduce((a, [, m]) => a + m, 0)
  const now = new Date()
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dateStr = `${months[now.getMonth()]} ${now.getDate()}, ${days[now.getDay()]}`

  return (
    <div className="focus-legend no-drag" aria-hidden>
      <div className="focus-legend-title">TimeLens</div>
      <div className="focus-legend-sub">one day in glass</div>
      <div className="focus-legend-rows">
        {rows.map(([k, mins]) => {
          const hue = CATEGORIES[k]?.color || '#A0A0B8'
          const en = LAYER_EN[k] || CATEGORIES[k]?.label || k
          return (
            <div key={k} className="focus-legend-row">
              <span className="focus-legend-dot" style={{ background: hue }} />
              <span className="focus-legend-name">{en}</span>
              <span className="focus-legend-time tnum">{fmtMin(mins)}</span>
            </div>
          )
        })}
      </div>
      <div className="focus-legend-total">
        <span>Total {fmtMin(total)}</span>
        <span className="focus-legend-date tnum">{dateStr}</span>
      </div>
    </div>
  )
}
