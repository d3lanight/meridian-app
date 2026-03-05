// ━━━ Indicator ━━━ v1.0.0 · S162
'use client'
import { useState } from 'react'
import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'
import GradientBar from '@/components/shared/GradientBar'

interface IndicatorProps { label: string; value: string; desc: string; pct: number; gradient: string; infoText: string }

export default function Indicator({ label, value, desc, pct, gradient, infoText }: IndicatorProps) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ ...card({ padding: 16 }), marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: M.text }}>{label}</span>
          <button onClick={() => setOpen(!open)} style={{
            width: 18, height: 18, borderRadius: '50%',
            background: open ? M.accentDim : 'rgba(139,117,101,0.15)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, color: open ? M.accent : M.textMuted,
          }}>i</button>
        </div>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, fontWeight: 600, color: M.text }}>{value}</span>
      </div>
      {open && (
        <div style={{ margin: '0 0 10px', padding: 12, background: M.accentMuted, borderRadius: 12 }}>
          <p style={{ fontSize: 11, color: M.textSecondary, lineHeight: 1.6, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{infoText}</p>
        </div>
      )}
      <GradientBar pct={pct} gradient={gradient} h={6} />
      <p style={{ fontSize: 11, color: M.textSecondary, margin: '6px 0 0', fontFamily: "'DM Sans', sans-serif" }}>{desc}</p>
    </div>
  )
}
