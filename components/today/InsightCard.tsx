// ━━━ InsightCard (Today) ━━━ v1.0.0 · S161
'use client'
import { ChevronRight } from 'lucide-react'
import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'

interface InsightCardProps {
  text: string
  subtext?: string
  linkLabel?: string
  accentColor?: string
}

export default function InsightCard({ text, subtext, linkLabel, accentColor = M.accent }: InsightCardProps) {
  return (
    <div style={{ ...card({ padding: '14px 16px' }), display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ width: 3, height: 32, borderRadius: 2, background: accentColor, flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, color: M.text, lineHeight: 1.55, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{text}</p>
        {subtext && <p style={{ fontSize: 11, color: M.textMuted, margin: '4px 0 0' }}>{subtext}</p>}
        {linkLabel && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            marginTop: 8, fontSize: 11, color: accentColor, fontWeight: 600, cursor: 'pointer',
          }}>
            {linkLabel} <ChevronRight size={11} />
          </div>
        )}
      </div>
    </div>
  )
}
