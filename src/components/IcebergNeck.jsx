import { useId } from 'react'
import { mixHex } from '../utils/meniscusDewBar.js'

/**
 * 冰山瓶颈 — 连接横露珠（俯视瓶口）与梅瓶剖面（侧视肩线）
 * 光路一体：玻璃颈由本组件独占；pour 由 dock-pour 单线贯穿
 */
export default function IcebergNeck({
  dewW = 134,
  stageW = 500,
  height = 48,
  hue = '#818CF8',
  lipOuterW,
}) {
  const uid = useId().replace(/:/g, '')
  const w = Math.max(stageW, dewW)
  const cx = w / 2
  const topW = dewW * 0.94
  const botW = Math.max(24, lipOuterW ?? Math.round(stageW * (58 / 640)))
  const h = Math.max(28, height)
  const shellTint = mixHex('#0a0a12', hue, 0.14)

  const leftTop = cx - topW / 2
  const rightTop = cx + topW / 2
  const leftBot = cx - botW / 2
  const rightBot = cx + botW / 2
  const lipY = 1.5

  const path = [
    `M ${leftTop},${lipY}`,
    `C ${leftTop - 0.5},${h * 0.26} ${leftBot - 3},${h * 0.7} ${leftBot},${h}`,
    `L ${rightBot},${h}`,
    `C ${rightBot + 3},${h * 0.7} ${rightTop + 0.5},${h * 0.26} ${rightTop},${lipY}`,
    'Z',
  ].join(' ')

  const rimL = `M ${leftTop},${lipY} Q ${leftTop - 1},${h * 0.48} ${leftBot},${h}`
  const rimR = `M ${rightTop},${lipY} Q ${rightTop + 1},${h * 0.48} ${rightBot},${h}`

  return (
    <div className="iceberg-neck-bridge" style={{ width: w, height: h }} aria-hidden>
      <svg width={w} height={h} className="block">
        <defs>
          <linearGradient id={`${uid}-glass`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.16)" />
            <stop offset="18%" stopColor={shellTint} stopOpacity="0.9" />
            <stop offset="100%" stopColor="rgba(5,5,8,0.82)" />
          </linearGradient>
          <radialGradient id={`${uid}-fresnel`} cx="50%" cy="6%" r="52%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.26)" />
            <stop offset="55%" stopColor="rgba(255,255,255,0.04)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>
        <path d={path} fill={`url(#${uid}-glass)`} />
        <ellipse cx={cx} cy={lipY + 0.8} rx={topW * 0.44} ry={2.8} fill={`url(#${uid}-fresnel)`} />
        <path d={rimL} fill="none" stroke="rgba(255,255,255,0.24)" strokeWidth="0.8" />
        <path d={rimR} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="0.7" />
      </svg>
    </div>
  )
}
