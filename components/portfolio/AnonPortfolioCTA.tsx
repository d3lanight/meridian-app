// ━━━ AnonPortfolioCTA ━━━
// v1.0.0 · ca-story127 · Sprint 26
// Shown to anonymous users on Portfolio page instead of redirect

import { PieChart, TrendingUp, Shield, ArrowRight } from 'lucide-react'
import { M } from '@/lib/meridian'
import { card, anim } from '@/lib/ui-helpers'

export function AnonPortfolioCTA() {
  return (
    <div style={{ padding: '24px 20px', minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 32, ...anim(true, 0) }}>
        <div style={{
          width: 56, height: 56, borderRadius: 18,
          background: M.accentGradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <PieChart size={26} color="white" strokeWidth={1.8} />
        </div>
        <h1 style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 22, fontWeight: 500, color: M.text, margin: '0 0 8px',
        }}>
          Track your portfolio
        </h1>
        <p style={{ fontSize: 14, color: M.textSecondary, margin: 0, lineHeight: 1.5, maxWidth: 280, marginInline: 'auto' }}>
          Add your holdings and see how they align with current market conditions.
        </p>
      </div>

      {/* Feature cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32, ...anim(true, 0.5) }}>
        {[
          { icon: PieChart, label: 'Allocation tracking', desc: 'See your portfolio breakdown at a glance' },
          { icon: TrendingUp, label: 'Regime alignment', desc: 'How your holdings map to market conditions' },
          { icon: Shield, label: 'Posture scoring', desc: 'Understand your portfolio\'s defensive stance' },
        ].map(({ icon: Icon, label, desc }, i) => (
          <div key={i} style={{
            ...card({ padding: '14px 16px' }),
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12,
              background: M.surfaceLight,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Icon size={18} color={M.accent} strokeWidth={1.8} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: M.text }}>{label}</div>
              <div style={{ fontSize: 11, color: M.textMuted }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={anim(true, 1)}>
        
     <button
          onClick={() => { window.location.href = '/login' }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: 14, borderRadius: 16,
            background: M.accentGradient,
            border: 'none', color: 'white',
            fontSize: 15, fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          Sign in to get started
          <ArrowRight size={16} />
        </button>
        <p style={{ textAlign: 'center', fontSize: 11, color: M.textMuted, marginTop: 12 }}>
          Free account — no credit card needed
        </p>
      </div>
    </div>
  )
}
