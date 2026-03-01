import { Crown } from 'lucide-react'
import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'

interface IdentityCardProps {
  name: string
  email: string
  tier: 'free' | 'pro'
  memberSince: string
}

export function IdentityCard({ name, email, tier, memberSince }: IdentityCardProps) {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : email?.[0]?.toUpperCase() ?? '?'

  const isPro = tier === 'pro'

  return (
    <div style={{ ...card({ padding: '20px 18px' }), marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Avatar */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 18,
            background: isPro
              ? M.accentGradient
              : 'linear-gradient(135deg, #D4C8BD, #C4B8AD)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isPro
              ? '0 3px 12px rgba(244,162,97,0.25)'
              : '0 2px 8px rgba(0,0,0,0.06)',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: 'white',
              fontFamily: "'Outfit', sans-serif",
              letterSpacing: 0.5,
            }}
          >
            {initials}
          </span>
        </div>

        {/* Name + email */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: 17,
                fontWeight: 600,
                color: M.text,
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              {name || 'User'}
            </span>
            {isPro && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  background: M.accentDim,
                  padding: '2px 8px',
                  borderRadius: 8,
                }}
              >
                <Crown size={10} color={M.accent} strokeWidth={2.5} />
                <span style={{ fontSize: 9, fontWeight: 700, color: M.accent }}>PRO</span>
              </div>
            )}
          </div>
          <div style={{ fontSize: 12, color: M.textMuted, marginTop: 2 }}>{email}</div>
        </div>
      </div>

      {/* Member since + tier pill */}
      <div
        style={{
          marginTop: 14,
          paddingTop: 12,
          borderTop: `1px solid ${M.borderSubtle}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 11, color: M.textMuted }}>Member since {memberSince}</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: isPro ? M.accent : M.textMuted,
            background: isPro ? M.accentDim : 'rgba(0,0,0,0.04)',
            padding: '4px 10px',
            borderRadius: 8,
          }}
        >
          {isPro ? 'Pro' : 'Free'}
        </span>
      </div>
    </div>
  )
}
