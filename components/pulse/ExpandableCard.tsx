// ━━━ ExpandableCard ━━━
// v1.0.0 · S172 · Sprint 35
// Generic expandable shell — tappable header toggles drawer.
// Used by MarketSignals in market/page.tsx.
// Export from pulse barrel for future reuse.

'use client'

import { useState } from 'react'
import { card } from '@/lib/ui-helpers'
import { M } from '@/lib/meridian'

// ── Props ──────────────────────────────────────

interface ExpandableCardProps {
  /** Border + tint colour (e.g. M.accentDeep) */
  accentColor: string
  /** Background tint (e.g. M.accentMuted) */
  accentDim: string
  /** Rendered inside the tappable header row */
  header: React.ReactNode
  /** Small label above chevron — defaults to "more" */
  label?: string
  /** Drawer content. If function, receives open state. */
  children: React.ReactNode | ((open: boolean) => React.ReactNode)
  style?: React.CSSProperties
}

// ── Component ──────────────────────────────────

export default function ExpandableCard({
  accentColor,
  accentDim,
  header,
  label = 'more',
  children,
  style = {},
}: ExpandableCardProps) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{
      ...card({ padding: 0 }),
      background: `linear-gradient(135deg, ${accentDim}, rgba(255,255,255,0.4))`,
      border: `1px solid ${accentColor}33`,
      overflow: 'hidden',
      marginBottom: 12,
      ...style,
    }}>
      {/* Tappable header row */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => e.key === 'Enter' && setOpen(o => !o)}
        style={{
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
          userSelect: 'none',
        }}
      >
        {header}
      </div>

      {/* Drawer */}
      {open && (
        <div style={{ borderTop: `1px solid ${M.borderSubtle}` }}>
          {typeof children === 'function' ? children(open) : children}
        </div>
      )}
    </div>
  )
}
