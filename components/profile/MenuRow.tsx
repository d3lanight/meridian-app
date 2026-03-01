// ━━━ MenuRow ━━━
// v1.1.0 · ca-story92 · Sprint 24
// Added onProTap callback for Pro-locked rows upgrade prompt

import { ChevronRight, type LucideIcon } from 'lucide-react'
import { M } from '@/lib/meridian'

interface MenuRowProps {
  icon: LucideIcon
  label: string
  desc?: string
  onClick?: () => void
  onProTap?: () => void
  pro?: boolean
  disabled?: boolean
  danger?: boolean
  badge?: string
}

export function MenuRow({ icon: Icon, label, desc, onClick, onProTap, pro, disabled, danger, badge }: MenuRowProps) {
  const isLocked = pro && !onProTap
  const isDisabled = disabled || isLocked

  return (
    <button
      onClick={() => {
        if (pro && onProTap) { onProTap(); return }
        if (!isDisabled) onClick?.()
      }}
      style={{
        width: '100%',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        background: 'transparent',
        border: 'none',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.45 : pro ? 0.7 : 1,
        borderRadius: 0,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Icon container */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: danger
            ? M.negativeDim
            : pro
              ? M.accentDim
              : 'rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon
          size={15}
          color={danger ? M.negative : pro ? M.accent : M.textSecondary}
          strokeWidth={2}
        />
      </div>

      {/* Label + description */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: danger ? M.negative : M.text }}>
          {label}
        </div>
        {desc && (
          <div style={{ fontSize: 11, color: M.textMuted, marginTop: 1 }}>{desc}</div>
        )}
      </div>

      {/* PRO badge */}
      {pro && (
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: 'white',
            background: M.accentGradient,
            padding: '2px 7px',
            borderRadius: 6,
            flexShrink: 0,
          }}
        >
          PRO
        </span>
      )}

      {/* Value badge */}
      {badge && (
        <span
          style={{
            fontSize: 11,
            color: M.textSecondary,
            fontFamily: "'DM Mono', monospace",
            flexShrink: 0,
          }}
        >
          {badge}
        </span>
      )}

      {/* Chevron for standard navigable rows */}
      {!pro && !badge && !danger && (
        <ChevronRight size={14} color={M.textMuted} style={{ flexShrink: 0 }} />
      )}
    </button>
  )
}
