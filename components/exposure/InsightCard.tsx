// v1.0.0 · ca-story134 · Sprint 29
// InsightCard — contextual analysis card with icon + variant coloring
// Variants: positive (teal), warning (accent), neutral (muted)

'use client'

import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'
import type { LucideIcon } from 'lucide-react'

interface InsightCardProps {
  icon: LucideIcon
  text: string
  subtext?: string
  variant?: 'positive' | 'warning' | 'neutral'
}

const VARIANT_STYLES = {
  positive: { iconBg: 'rgba(42,157,143,0.1)',  iconColor: '#2A9D8F' },
  warning:  { iconBg: 'rgba(123,111,168,0.18)', iconColor: '#7B6FA8' },
  neutral:  { iconBg: 'rgba(139,117,101,0.1)',  iconColor: '#8B7565' },
}

export default function InsightCard({ icon: Icon, text, subtext, variant = 'neutral' }: InsightCardProps) {
  const v = VARIANT_STYLES[variant]

  return (
    <div style={{ ...card({ padding: '14px 16px' }), display: 'flex', gap: 12, marginBottom: 12 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10, background: v.iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={15} color={v.iconColor} />
      </div>
      <div>
        <div style={{
          fontSize: 13, color: M.text, lineHeight: 1.5,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {text}
        </div>
        {subtext && (
          <div style={{
            fontSize: 11, color: M.textMuted, marginTop: 4,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {subtext}
          </div>
        )}
      </div>
    </div>
  )
}