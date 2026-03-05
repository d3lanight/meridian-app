// ━━━ StatPill ━━━ v1.1.0 · S162
'use client'
import { M } from '@/lib/meridian'

const NUM_STYLE = { fontFamily: "'DM Sans', sans-serif", fontFeatureSettings: "'tnum' 1, 'lnum' 1" }

interface StatPillProps { label: string; value: string }

export default function StatPill({ label, value }: StatPillProps) {
  return (
    <div style={{ flex: 1, minWidth: 0, background: 'rgba(255,255,255,0.5)', borderRadius: 12, padding: '10px 12px', border: `1px solid ${M.border}` }}>
      <div style={{ fontSize: 9, color: M.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: M.text, ...NUM_STYLE }}>{value}</div>
    </div>
  )
}
