// MenuRow.tsx
// Profile — Menu row with dual badge support (PRO + SOON)
// Version: 2.0.0
// Sprint: 35 (S168)
// Changelog:
//   2.0.0 - Dual badge support: pro + coming can now both render simultaneously.
//           Locked state: pro || coming prevents onClick.
//           Icon bg/color adapts to variant (danger/pro/coming/default).
//   1.0.0 - Initial (S87): Icon + label + desc, pro/danger/badge/disabled variants.

import { ChevronRight } from 'lucide-react'
import { M } from '@/lib/meridian'

const FONT_BODY = "'DM Sans', sans-serif"

interface MenuRowProps {
  icon: React.ElementType
  label: string
  desc?: string
  onClick?: () => void
  pro?: boolean
  coming?: boolean
  danger?: boolean
  badge?: string
  disabled?: boolean
}

export function MenuRow({
  icon: Icon,
  label,
  desc,
  onClick,
  pro = false,
  coming = false,
  danger = false,
  badge,
  disabled = false,
}: MenuRowProps) {
  const locked = pro || coming || disabled

  // Icon container bg and color
  const iconBg = danger
    ? M.negativeDim
    : pro
    ? M.accentDim
    : coming
    ? M.surfaceLight
    : 'rgba(0,0,0,0.03)'

  const iconColor = danger
    ? M.negative
    : pro
    ? M.accent
    : coming
    ? M.textMuted
    : M.textSecondary

  // Row opacity: coming-only rows dim more than pro rows
  const rowOpacity = coming && !pro ? 0.5 : pro && !coming ? 0.75 : 1

  return (
    <button
      onClick={() => !locked && onClick?.()}
      style={{
        width: '100%',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        background: 'transparent',
        border: 'none',
        cursor: locked ? 'default' : 'pointer',
        opacity: rowOpacity,
        borderRadius: 0,
        fontFamily: FONT_BODY,
      }}
    >
      {/* Icon container */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={15} color={iconColor} strokeWidth={2} />
      </div>

      {/* Label + description */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: danger ? M.negative : M.text,
          }}
        >
          {label}
        </div>
        {desc && (
          <div style={{ fontSize: 11, color: M.textMuted, marginTop: 1 }}>{desc}</div>
        )}
      </div>

      {/* Badges — PRO and/or SOON side by side */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
        {pro && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: 'white',
              background: M.accentGradient,
              padding: '2px 7px',
              borderRadius: 6,
            }}
          >
            PRO
          </span>
        )}
        {coming && (
          <span
            style={{
              fontSize: 8,
              fontWeight: 600,
              color: M.textMuted,
              background: M.surfaceLight,
              padding: '2px 7px',
              borderRadius: 6,
            }}
          >
            SOON
          </span>
        )}
      </div>

      {/* Badge text (e.g. tier label) */}
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

      {/* Chevron — only when not locked, no badge, not danger */}
      {!pro && !coming && !badge && !danger && (
        <ChevronRight size={14} color={M.textMuted} style={{ flexShrink: 0 }} />
      )}
    </button>
  )
}
