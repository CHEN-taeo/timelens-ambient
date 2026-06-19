import { useEffect, useRef } from 'react'
import { buildFocusMeipingSvg, FOCUS_VESSEL_W, FOCUS_LIP_JOIN, FOCUS_NECK_VIEW_H } from '../utils/focusMeipingBuild.js'

/** 梅瓶剖面 — iceberg 模式隐藏 SVG 内 lip/图例（由露珠 + HTML 图例承接） */
export default function FocusMeiping({
  sessions = [],
  categoryTotalsMinutes = {},
  nowMeta = {},
  iceberg = true,
}) {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    ref.current.innerHTML = buildFocusMeipingSvg({
      sessions,
      categoryTotalsMinutes,
      nowMeta,
      iceberg,
    })
  }, [sessions, categoryTotalsMinutes, nowMeta, iceberg])

  const viewBox = iceberg
    ? `0 ${FOCUS_LIP_JOIN} ${FOCUS_VESSEL_W} ${FOCUS_NECK_VIEW_H}`
    : `0 0 ${FOCUS_VESSEL_W} ${FOCUS_NECK_VIEW_H + FOCUS_LIP_JOIN}`

  return (
    <svg
      ref={ref}
      className={`view view-a h-full w-full ${iceberg ? 'view-a--iceberg' : ''}`}
      viewBox={viewBox}
      preserveAspectRatio="xMidYMin meet"
      aria-hidden
    />
  )
}
