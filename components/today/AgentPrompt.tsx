// ━━━ AgentPrompt ━━━ v1.0.0 · S161
// UI-only — no backend wiring yet
'use client'
import { MessageCircle } from 'lucide-react'
import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'

const QUICK_PROMPTS = ['Why is BTC up?', 'Explain my posture', "What's alt season?", 'SOL thesis']

export default function AgentPrompt() {
  return (
    <div style={{
      ...card({ padding: 0, overflow: 'hidden' }),
      background: `linear-gradient(135deg, rgba(123,111,168,0.06), rgba(90,77,138,0.03))`,
      border: `1px solid ${M.borderAccent}`,
    }}>
      <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 12,
          background: M.accentGradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 2px 8px ${M.accentGlow}`,
        }}>
          <MessageCircle size={14} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: M.text }}>Ask Meridian</div>
          <div style={{ fontSize: 11, color: M.textMuted }}>What should I pay attention to today?</div>
        </div>
      </div>
      <div style={{ padding: '0 16px 14px' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {QUICK_PROMPTS.map(q => (
            <button key={q} style={{
              padding: '6px 12px', borderRadius: 20,
              border: `1px solid ${M.borderSubtle}`,
              background: 'rgba(255,255,255,0.5)',
              cursor: 'pointer', fontSize: 11,
              color: M.textSecondary, fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
            }}>
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
