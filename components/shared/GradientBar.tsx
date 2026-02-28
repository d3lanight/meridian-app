// ━━━ GradientBar ━━━
// v1.0.0 · ca-story78 · Sprint 19

import { M } from '@/lib/meridian'

interface GradientBarProps {
  pct: number
  gradient?: string
  h?: number
}

export default function GradientBar({
  pct,
  gradient = M.accentGradient,
  h = 8,
}: GradientBarProps) {
  return (
    <div
      style={{
        height: h,
        borderRadius: h,
        background: M.surfaceLight,
        overflow: 'hidden',
        width: '100%',
      }}
    >
      <div
        style={{
          height: '100%',
          borderRadius: h,
          background: gradient,
          width: `${Math.min(100, Math.max(0, pct))}%`,
          transition: 'width 0.5s ease',
        }}
      />
    </div>
  )
}
