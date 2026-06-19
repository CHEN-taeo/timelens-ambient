import { useMemo } from 'react'
import {
  buildVesselModel,
  VESSEL_CX,
  VESSEL_MAX_R,
  VESSEL_LIP_JOIN,
  fmtDuration,
} from '../utils/focusVesselGeometry.js'

export default function FocusVessel({
  totalsByCategory = {},
  currentCategory = 'neutral',
  appLabel = '—',
  open = true,
  /** 顶栏露珠即瓶口 — 隐藏 SVG 瓶口、上移瓶身 */
  iceberg = false,
}) {
  const m = useMemo(
    () => buildVesselModel({ totalsByCategory, currentCategory, appLabel }),
    [totalsByCategory, currentCategory, appLabel]
  )

  const legendX = m.cx + VESSEL_MAX_R + 20
  const legendRight = 620
  const legendStartY = 80

  const bodyClass = iceberg ? 'fv-body-shift' : ''

  return (
    <svg
      viewBox="0 0 640 420"
      className={`focus-vessel block h-full w-full ${open ? 'focus-vessel--open' : ''} ${iceberg ? 'focus-vessel--iceberg' : ''}`}
      aria-hidden
    >
      <defs>
        <clipPath id="fv-clip">
          <path d={m.vessel} />
        </clipPath>
        <linearGradient id="fv-stream" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={m.hue} stopOpacity="0.15" />
          <stop offset="40%" stopColor={m.hue} stopOpacity="0.75" />
          <stop offset="100%" stopColor={m.hue} stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="fv-stream-dust" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8A830" stopOpacity="0.05" />
          <stop offset="50%" stopColor="#E8A830" stopOpacity="0.22" />
          <stop offset="100%" stopColor={m.hue} stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id="fv-glass-tint" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(180,195,255,0.1)" />
          <stop offset="50%" stopColor="rgba(80,90,140,0.04)" />
          <stop offset="100%" stopColor="rgba(20,22,40,0.12)" />
        </linearGradient>
        <linearGradient id="fv-glass-sheen" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
          <stop offset="35%" stopColor="rgba(255,255,255,0.04)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <linearGradient id="fv-lip" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
          <stop offset="100%" stopColor="rgba(120,130,180,0.12)" />
        </linearGradient>
        <linearGradient id="fv-label-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(28,30,44,0.78)" />
          <stop offset="45%" stopColor="rgba(18,20,32,0.62)" />
          <stop offset="100%" stopColor="rgba(10,11,20,0.72)" />
        </linearGradient>
        <clipPath id="fv-label-clip">
          <rect x="0" y="0" width={m.nowLabel.clipW} height="420" />
        </clipPath>
      </defs>

      <g className={bodyClass} transform={iceberg ? `translate(0, ${-VESSEL_LIP_JOIN})` : undefined}>
      <g clipPath="url(#fv-clip)">
        <g className="fv-strata">
          {m.strata.map((s, i) =>
            s.type === 'rect' ? (
              <rect
                key={`r${i}`}
                x={m.cx - VESSEL_MAX_R}
                y={s.y0}
                width={VESSEL_MAX_R * 2}
                height={s.h}
                fill={s.fill}
                opacity={s.opacity}
              />
            ) : (
              <line
                key={`l${i}`}
                x1={s.x1}
                x2={s.x2}
                y1={s.y}
                y2={s.y}
                stroke={s.stroke}
                strokeWidth={s.strokeWidth}
                opacity={s.opacity}
              />
            )
          )}
        </g>

        <g className="fv-sand-plume" style={{ '--slen': m.streamLen }}>
          <path
            className="fv-stream-c"
            d={m.streams.dust}
            fill="none"
            stroke="url(#fv-stream-dust)"
            strokeWidth="7"
            strokeLinecap="round"
            opacity="0.35"
          />
          <path
            className="fv-stream-a"
            d={m.streams.core}
            fill="none"
            stroke="url(#fv-stream)"
            strokeWidth="3.2"
            strokeLinecap="round"
            opacity="0.42"
          />
          <path
            className="fv-stream-b"
            d={m.streams.inner}
            fill="none"
            stroke="url(#fv-stream)"
            strokeWidth="1.4"
            strokeLinecap="round"
            opacity="0.78"
          />
        </g>

        <path d={m.meniscus} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.8" opacity="0.7" />

        <g className="fv-glass-inner">
          <path d={m.vessel} fill="url(#fv-glass-tint)" opacity="0.88" />
          <path d={m.vessel} fill="url(#fv-glass-sheen)" opacity="0.58" />
        </g>
      </g>

      <g className="fv-glass-rim">
        <path
          d={m.vessel}
          fill="none"
          stroke="rgba(0,0,0,0.38)"
          strokeWidth="3.6"
          opacity="0.42"
          strokeLinejoin="round"
        />
        <path
          d={m.vessel}
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="1.2"
          opacity="0.75"
          strokeLinejoin="round"
        />
      </g>

      <path
        className="fv-now-lead"
        d={m.nowLead}
        fill="none"
        stroke="rgba(232,168,48,0.22)"
        strokeWidth="0.5"
        strokeDasharray="2 4"
        opacity="0.85"
      />

      <g
        className="fv-now-label"
        clipPath="url(#fv-label-clip)"
        transform={`translate(${m.nowLabel.anchor.x},${m.nowLabel.anchor.y}) skewY(${(-m.nowLabel.skew).toFixed(2)}) translate(${-m.nowLabel.labelW},${-m.nowLabel.labelH / 2})`}
      >
        <rect
          x="-2.5"
          y="2"
          width={m.nowLabel.labelW}
          height={m.nowLabel.labelH}
          rx="5"
          fill="rgba(0,0,0,0.42)"
          opacity="0.55"
        />
        <rect
          x="0"
          y="0"
          width={m.nowLabel.labelW}
          height={m.nowLabel.labelH}
          rx="5"
          fill="url(#fv-label-glass)"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="0.55"
        />
        <rect x="3" y="3" width="2" height={m.nowLabel.labelH - 6} rx="1" fill={m.hue} opacity="0.55" />
        <text
          x="8.5"
          y="11.5"
          fill="rgba(238,210,175,0.92)"
          fontSize="9.5"
          fontStyle="italic"
          fontFamily="Georgia,serif"
        >
          {m.nowLabel.text}
        </text>
      </g>

      {!iceberg ? (
        <g className="fv-lip">
          <path d={m.lipShell} fill="url(#fv-lip)" stroke="rgba(255,255,255,0.35)" strokeWidth="0.85" opacity="0.95" />
          <path d={m.lipArc} fill="none" stroke="rgba(255,255,255,0.52)" strokeWidth="0.85" strokeLinecap="round" />
          <circle cx={VESSEL_CX} cy={m.lipCy} r="2.3" fill={m.hue} opacity="0.85" />
        </g>
      ) : null}
      </g>

      <g className="fv-legend">
        <text x={legendX} y="48" fill="#eceaf8" fontSize="13" fontWeight="500" fontFamily="Inter,system-ui,sans-serif">
          TimeLens
        </text>
        <text x={legendX} y="62" fill="#64647a" fontSize="9" fontFamily="Inter,system-ui,sans-serif">
          one day in glass
        </text>
        {m.legend.map((item, idx) => {
          const y = legendStartY + 18 + idx * 18
          return (
            <g key={item.key}>
              <circle cx={legendX} cy={y - 4} r="3.6" fill={item.color} />
              <text x={legendX + 12} y={y} fill="#c8c8d8" fontSize="10" fontFamily="Inter,system-ui,sans-serif">
                {item.label}
              </text>
              <text
                x={legendRight}
                y={y}
                fill="#787890"
                fontSize="10"
                textAnchor="end"
                fontFamily="ui-monospace,monospace"
              >
                {fmtDuration(item.seconds)}
              </text>
            </g>
          )
        })}
        <line
          x1={legendX}
          x2={legendRight}
          y1={legendStartY + 18 + m.legend.length * 18 + 4}
          y2={legendStartY + 18 + m.legend.length * 18 + 4}
          stroke="rgba(255,255,255,0.07)"
        />
        <text
          x={legendX}
          y={legendStartY + 18 + m.legend.length * 18 + 20}
          fill="#9898ae"
          fontSize="10"
          fontFamily="Inter,system-ui,sans-serif"
        >
          Total {m.totalFmt}
        </text>
        <text
          x={legendRight}
          y={legendStartY + 18 + m.legend.length * 18 + 20}
          fill="#64647a"
          fontSize="9"
          textAnchor="end"
          fontFamily="ui-monospace,monospace"
        >
          {m.dateStr}
        </text>
      </g>
    </svg>
  )
}
