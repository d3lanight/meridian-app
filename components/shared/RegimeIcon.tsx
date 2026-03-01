// ━━━ RegimeIcon ━━━
// v1.1.0 · ca-story100 · Sprint 20
// Text arrows matching regime history cards (↗↘↕→)

'use client'

import { getRegimeConfig } from '@/lib/regime-utils'

interface RegimeIconProps {
  regime: string
  size?: number
  strokeWidth?: number
  color?: string
}

export default function RegimeIcon({
  regime,
  size = 24,
  color = 'white',
}: RegimeIconProps) {
  const rc = getRegimeConfig(regime)
  return (
    <span
      style={{
        fontSize: size * 0.65,
        fontWeight: 700,
        color,
        lineHeight: 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {rc.icon}
    </span>
  )
}
