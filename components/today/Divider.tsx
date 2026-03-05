// ━━━ Divider ━━━ v1.0.0 · S161
'use client'
import { M } from '@/lib/meridian'

interface DividerProps {
  label: string
}

export default function Divider({ label }: DividerProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0', marginBottom: 12 }}>
      <div style={{ flex: 1, height: 1, background: M.borderSubtle }} />
      <span style={{ fontSize: 9, color: M.textMuted, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 500 }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: M.borderSubtle }} />
    </div>
  )
}
