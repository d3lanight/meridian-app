// components/shared/Sparkline.tsx
// v1.0.0 · S165 · Sprint 35
// SVG sparkline: 30d polyline + area fill + current price dot.
// Reusable across portfolio, dashboard, etc.

import { M } from '@/lib/meridian'

interface SparklineProps {
  data: number[]
  color?: string
  w?: number
  h?: number
  showArea?: boolean
}

export default function Sparkline({ data, color = M.accent, w = 120, h = 32, showArea = true }: SparklineProps) {
  if (!data || data.length < 2) return null

  const pad = 2
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2)
    const y = pad + (1 - (v - min) / range) * (h - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const line = pts.join(' ')

  // Area fill path: line + close to bottom-right → bottom-left
  const lastX = pad + ((data.length - 1) / (data.length - 1)) * (w - pad * 2)
  const areaPath = `M${pts[0]} ${pts.slice(1).map(p => `L${p}`).join(' ')} L${lastX.toFixed(1)},${h} L${pad},${h} Z`

  // Current price dot position
  const lastPt = pts[pts.length - 1].split(',')
  const dotCx = parseFloat(lastPt[0])
  const dotCy = parseFloat(lastPt[1])

  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      {showArea && (
        <path d={areaPath} fill={color} opacity={0.08} />
      )}
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={dotCx} cy={dotCy} r={2.5} fill={color} />
    </svg>
  )
}
