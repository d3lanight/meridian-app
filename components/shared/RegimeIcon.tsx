// ━━━ RegimeIcon ━━━
// v1.0.0 · ca-story78 · Sprint 19

'use client'

import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react'

interface RegimeIconProps {
  regime: string
  size?: number
  strokeWidth?: number
  color?: string
}

export default function RegimeIcon({
  regime,
  size = 24,
  strokeWidth = 2.5,
  color = 'white',
}: RegimeIconProps) {
  const r = regime.toLowerCase()
  if (r.includes('bull'))
    return <TrendingUp size={size} color={color} strokeWidth={strokeWidth} />
  if (r.includes('bear'))
    return <TrendingDown size={size} color={color} strokeWidth={strokeWidth} />
  if (r.includes('volatile'))
    return <Activity size={size} color={color} strokeWidth={strokeWidth} />
  return <Minus size={size} color={color} strokeWidth={strokeWidth} />
}
