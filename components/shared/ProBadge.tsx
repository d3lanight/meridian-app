// ━━━ ProBadge ━━━
// v1.0.0 · ca-story90 · Sprint 24
// Small "PRO" pill for menu rows and feature labels

import { M } from '@/lib/meridian'

interface ProBadgeProps {
  size?: 'sm' | 'md'
}

export function ProBadge({ size = 'sm' }: ProBadgeProps) {
  const isSmall = size === 'sm'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isSmall ? '1px 6px' : '2px 8px',
        fontSize: isSmall ? 9 : 10,
        fontWeight: 700,
        letterSpacing: 0.5,
        lineHeight: isSmall ? '16px' : '18px',
        color: 'white',
        background: M.accentGradient,
        borderRadius: 6,
        textTransform: 'uppercase' as const,
        flexShrink: 0,
      }}
    >
      PRO
    </span>
  )
}
