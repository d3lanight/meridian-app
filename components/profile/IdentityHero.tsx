// IdentityHero.tsx
// Profile v4 — Identity hero card with accent banner, avatar overlap, connected sources row
// Version: 1.0.0
// Sprint: 35 (S167)
// Changelog:
//   1.0.0 - New component. Replaces IdentityCard. Accent banner (Pro/Free gradient),
//           avatar overlap with pencil badge, tappable name → edit-name sub-view,
//           connected sources row (CoinGecko + Meridian active, X placeholder),
//           member since footer.

import { Clock, ChevronRight, Crown } from 'lucide-react'
import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'

const FONT_DISPLAY = "'Outfit', sans-serif"

interface IdentityHeroProps {
  name: string | null
  email: string
  tier: string | null
  memberSince: string
  onEditName: () => void
}

export function IdentityHero({ name, email, tier, memberSince, onEditName }: IdentityHeroProps) {
  const isPro = tier === 'pro'
  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : email?.[0]?.toUpperCase() ?? '?'

  return (
    <div style={{ ...card({ padding: 0, overflow: 'hidden' }), marginBottom: 20 }}>
      {/* Accent banner */}
      <div
        style={{
          height: 52,
          background: isPro
            ? M.accentGradient
            : 'linear-gradient(135deg, #D4C8BD, #C4B8AD)',
          position: 'relative',
        }}
      >
        {/* Subtle diagonal pattern overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.12,
            background:
              'repeating-linear-gradient(135deg, transparent, transparent 20px, rgba(255,255,255,0.15) 20px, rgba(255,255,255,0.15) 40px)',
          }}
        />
        {/* Pro badge on banner */}
        {isPro && (
          <div
            style={{
              position: 'absolute',
              top: 12,
              right: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              background: 'rgba(255,255,255,0.2)',
              padding: '3px 8px',
              borderRadius: 8,
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            <Crown size={10} color="white" strokeWidth={2.5} />
            <span style={{ fontSize: 9, fontWeight: 700, color: 'white', fontFamily: FONT_DISPLAY }}>
              PRO
            </span>
          </div>
        )}
      </div>

      {/* Content below banner */}
      <div style={{ padding: '0 18px 16px' }}>
        {/* Avatar row — pulls up into banner via negative margin */}
        <div style={{ display: 'flex', gap: 14, marginTop: -24, marginBottom: 14 }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 20,
                background: isPro
                  ? M.accentGradient
                  : 'linear-gradient(135deg, #B8ADA4, #A89E95)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '3px solid white',
                boxShadow: '0 4px 14px rgba(0,0,0,0.10)',
              }}
            >
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: 'white',
                  fontFamily: FONT_DISPLAY,
                  letterSpacing: 0.5,
                }}
              >
                {initials}
              </span>
            </div>
            {/* Avatar upload badge: placeholder — will use Meridian icon in future */}
          </div>

          {/* Name + email — positioned to clear avatar */}
          <div style={{ flex: 1, minWidth: 0, paddingTop: 28 }}>
            <button
              onClick={onEditName}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span
                style={{
                  fontSize: 17,
                  fontWeight: 600,
                  color: M.text,
                  fontFamily: FONT_DISPLAY,
                }}
              >
                {name || 'Set your name'}
              </span>
            </button>
            <div style={{ fontSize: 12, color: M.textMuted, marginTop: 2 }}>{email}</div>
          </div>
        </div>

        {/* Connected sources row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            borderRadius: 14,
            background: 'rgba(255,255,255,0.4)',
            border: `1px solid ${M.border}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: M.textMuted, fontWeight: 500 }}>Sources</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {/* CoinGecko — connected, live data source */}
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 7,
                  background: 'linear-gradient(135deg, #8DC63F, #4DB749)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  color: 'white',
                  fontWeight: 700,
                  border: '1.5px solid white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  fontFamily: FONT_DISPLAY,
                }}
              >
                C
              </div>
              {/* Meridian AI — placeholder for future agent integration */}
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 7,
                  background: M.surfaceLight,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1.5px dashed ${M.borderSubtle}`,
                  opacity: 0.45,
                }}
              >
                <svg width={10} height={10} viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="13" stroke={M.textMuted} strokeWidth="3" />
                  <line x1="24" y1="8" x2="24" y2="40" stroke={M.textMuted} strokeWidth="3" />
                </svg>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 10, color: M.textMuted }}>1 active</span>
            <ChevronRight size={12} color={M.textMuted} />
          </div>
        </div>

        {/* Member since — centered subtle footer */}
        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Clock size={10} color={M.textMuted} />
            <span style={{ fontSize: 10, color: M.textMuted }}>Member since {memberSince}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
