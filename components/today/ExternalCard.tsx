// ━━━ ExternalCard ━━━ v1.0.0 · S161
// Mock content — real X/RSS integration is Phase 6+
'use client'
import { ExternalLink } from 'lucide-react'
import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'

const SOURCE_ICONS: Record<string, string> = { x: '𝕏', blog: '📝', news: '📰' }

interface ExternalCardProps {
  source: string
  author: string
  text: string
  time: string
  sourceIcon: string
}

export default function ExternalCard({ source, author, text, time, sourceIcon }: ExternalCardProps) {
  return (
    <div style={{ ...card({ padding: '14px 16px' }), cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{
          width: 24, height: 24, borderRadius: 8,
          background: M.surfaceLight,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, flexShrink: 0,
        }}>
          {SOURCE_ICONS[sourceIcon] || '🔗'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: M.text }}>{author}</span>
            <span style={{ fontSize: 10, color: M.textMuted }}>· {source}</span>
          </div>
        </div>
        <span style={{ fontSize: 9, color: M.textMuted }}>{time}</span>
      </div>
      <p style={{ fontSize: 13, color: M.textSecondary, lineHeight: 1.55, margin: '0 0 8px', fontFamily: "'DM Sans', sans-serif" }}>{text}</p>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: M.accent, fontWeight: 500 }}>
        Read more <ExternalLink size={10} />
      </div>
    </div>
  )
}
