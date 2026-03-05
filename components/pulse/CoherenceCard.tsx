// ━━━ CoherenceCard ━━━ v1.0.0 · S162
'use client'
import { Activity } from 'lucide-react'
import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'

interface CoherenceCardProps { text: string }

export default function CoherenceCard({ text }: CoherenceCardProps) {
  return (
    <div style={{
      ...card({ padding: 16 }),
      background: `linear-gradient(135deg, ${M.accentMuted}, rgba(123,111,168,0.04))`,
      border: `1px solid ${M.borderAccent}`, marginBottom: 12,
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: M.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Activity size={15} color={M.accent} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: M.text, marginBottom: 4 }}>Signal Coherence</div>
          <p style={{ fontSize: 12, color: M.textSecondary, lineHeight: 1.55, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{text}</p>
        </div>
      </div>
    </div>
  )
}
