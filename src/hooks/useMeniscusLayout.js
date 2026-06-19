import { useEffect, useState } from 'react'
import { meniscusScreenLayout } from '../utils/meniscusScreenLayout.js'

function readScreen() {
  if (typeof window === 'undefined') return meniscusScreenLayout()
  return meniscusScreenLayout(window.screen?.availWidth, window.screen?.availHeight)
}

/** 随显示器尺寸返回露珠 / 舞台布局（屏宽变化时更新） */
export function useMeniscusLayout() {
  const [layout, setLayout] = useState(readScreen)

  useEffect(() => {
    const update = () => setLayout(readScreen())
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return layout
}
