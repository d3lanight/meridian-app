// ━━━ Today Page ━━━
// v4.1.0 · S177 · Sprint 36
// WIP beta state: WelcomeCard + AnonCTA (anon only) + ExploreCard. Zero fetches.
// Changelog:
//   v4.1.0 — S177: Beta state. Remove AI briefing, AgentPrompt, signals, learn cards, prices.
//             Add WelcomeCard, ExploreCard, AnonCTA, BetaChip, BetaSheet.
//   v4.0.0 — S161: Contextual intelligence layer. AI briefing, agent prompt, external signals.
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { M } from '@/lib/meridian'
import { anim } from '@/lib/ui-helpers'
import { useAuthSheet } from '@/contexts/AuthSheetContext'
import {
  Bell, Sparkles, Lock, ArrowUpRight, ChevronRight,
  Activity, Shield,
} from 'lucide-react'
import BetaSheet from '@/components/today/BetaSheet'

// ── Fonts ──────────────────────────────────────
const FONT_DISPLAY = "'Outfit', sans-serif"
const FONT_BODY = "'DM Sans', sans-serif"
const FONT_MONO = "'DM Mono', monospace"

// ── Helpers ────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function getDateString(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

// ── Beta Chip ──────────────────────────────────

function BetaChip({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: `linear-gradient(135deg, ${M.accentMuted}, rgba(90,77,138,0.05))`,
        border: `1px solid ${M.borderAccent}`,
        borderRadius: 100, padding: '5px 11px 5px 8px',
        cursor: 'pointer', fontFamily: FONT_BODY,
      }}
    >
      <style>{`
        @keyframes betapulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 2px rgba(123,111,168,0.18); }
          50% { opacity: 0.45; box-shadow: 0 0 0 4px rgba(123,111,168,0.07); }
        }
      `}</style>
      <div style={{
        width: 5, height: 5, borderRadius: '50%',
        background: M.accent,
        boxShadow: `0 0 0 2px ${M.accentDim}`,
        animation: 'betapulse 2.4s ease-in-out infinite',
      }} />
      <span style={{
        fontSize: 10, fontWeight: 700, color: M.accent,
        letterSpacing: '0.07em', textTransform: 'uppercase',
      }}>
        Beta
      </span>
    </button>
  )
}

// ── Welcome / WIP Card ─────────────────────────

function WelcomeCard({ onBeta }: { onBeta: () => void }) {
  return (
    <div style={{
      background: 'linear-gradient(150deg, rgba(123,111,168,0.09), rgba(90,77,138,0.03) 70%, rgba(255,255,255,0.25))',
      border: `1px solid ${M.borderAccent}`,
      borderRadius: 24,
      overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
    }}>
      <div style={{ height: 3, background: `linear-gradient(90deg, ${M.accent}, ${M.accentDeep})`, opacity: 0.5 }} />
      <div style={{ padding: '20px 20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 9,
            background: M.accentDim,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={13} color={M.accent} />
          </div>
          <span style={{
            fontSize: 12, fontWeight: 600, color: M.accent,
            fontFamily: FONT_DISPLAY, letterSpacing: '0.01em',
          }}>
            Welcome to Meridian
          </span>
        </div>

        <p style={{
          fontSize: 15, color: M.text, lineHeight: 1.7,
          margin: '0 0 6px', fontFamily: FONT_BODY,
        }}>
          This page is a work in progress.{' '}
          <span style={{ fontSize: 11, color: M.textMuted, fontFamily: FONT_MONO, verticalAlign: 'middle' }}>
            v0.9.1
          </span>
        </p>
        <p style={{
          fontSize: 13, color: M.textSecondary, lineHeight: 1.65,
          margin: '0 0 18px', fontFamily: FONT_BODY,
        }}>
          The full intelligence layer is being built — personalized briefings, regime-aware insights, and live portfolio context will live here.
        </p>

        <button
          onClick={onBeta}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: M.accentMuted,
            border: `1px solid ${M.borderAccent}`,
            borderRadius: 12, padding: '9px 14px',
            cursor: 'pointer', fontFamily: FONT_BODY,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: M.accentDeep }}>
            Check the beta tracker
          </span>
          <ChevronRight size={13} color={M.accent} />
        </button>
      </div>
    </div>
  )
}

// ── Anon CTA ───────────────────────────────────

function AnonCTA({ onAuth }: { onAuth: (trigger: string, mode?: 'login' | 'signup') => void }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${M.accentMuted}, rgba(123,111,168,0.03))`,
      border: `1px solid ${M.borderAccent}`,
      borderRadius: 24, padding: 18,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Lock size={14} color={M.accent} />
        <span style={{ fontSize: 13, fontWeight: 600, color: M.text, fontFamily: FONT_DISPLAY }}>
          Track your portfolio
        </span>
      </div>
      <p style={{
        fontSize: 13, color: M.textSecondary,
        lineHeight: 1.65, margin: '0 0 14px', fontFamily: FONT_BODY,
      }}>
        Sign in to see your posture score, allocation targets, and how your portfolio aligns with the current market regime.
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => onAuth('Today', 'login')}
          style={{
            flex: 1,
            background: `linear-gradient(90deg, ${M.accent}, ${M.accentDeep})`,
            color: 'white', padding: '11px 16px',
            borderRadius: 16, border: 'none',
            fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: FONT_BODY,
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 6,
            boxShadow: '0 4px 14px rgba(90,77,138,0.22)',
          }}
        >
          Sign in <ArrowUpRight size={13} />
        </button>
        <button
          onClick={() => onAuth('Today', 'signup')}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.5)',
            color: M.accentDeep, padding: '11px 16px',
            borderRadius: 16,
            border: `1px solid ${M.borderAccent}`,
            fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: FONT_BODY,
          }}
        >
          Create account
        </button>
      </div>
    </div>
  )
}

// ── Explore Card ───────────────────────────────

function ExploreCard() {
  const items = [
    {
      icon: Activity,
      label: 'Pulse',
      desc: 'Live market regime & signals',
      color: M.accent,
      bg: M.accentDim,
      href: '/market',
    },
    {
      icon: Shield,
      label: 'Exposure',
      desc: 'Your portfolio posture & holdings',
      color: M.positive,
      bg: M.positiveDim,
      href: '/exposure',
    },
  ]

  return (
    <div style={{
      background: 'rgba(255,255,255,0.6)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderRadius: 24, padding: '16px 18px',
      border: '1px solid rgba(255,255,255,0.8)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
    }}>
      <div style={{
        fontSize: 11, fontWeight: 600, color: M.textMuted,
        textTransform: 'uppercase', letterSpacing: '0.09em',
        fontFamily: FONT_BODY, marginBottom: 12,
      }}>
        Explore while Meridian is being built
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map(({ icon: Icon, label, desc, color, bg, href }) => (
          <a
            key={label}
            href={href}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'rgba(255,255,255,0.45)',
              border: '1px solid rgba(255,255,255,0.7)',
              borderRadius: 16, padding: '12px 14px',
              textDecoration: 'none',
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 11,
              background: bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Icon size={16} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: M.text, fontFamily: FONT_BODY }}>
                {label}
              </div>
              <div style={{ fontSize: 12, color: M.textMuted, fontFamily: FONT_BODY, marginTop: 1 }}>
                {desc}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

// ── Page ────────────────────────────────────────

export default function TodayPage() {
  const [mounted, setMounted] = useState(false)
  const [isAnon, setIsAnon] = useState(true)
  const [displayName, setDisplayName] = useState('')
  const [betaOpen, setBetaOpen] = useState(false)
  const { openAuth } = useAuthSheet()

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const anon = !user
      setIsAnon(anon)

      if (!anon && user) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', user.id)
            .maybeSingle()
          if (data?.display_name) setDisplayName(data.display_name)
        } catch {}
      }
    }
    load()
  }, [])

  const greeting = getGreeting()
  const title = (!isAnon && displayName) ? `${greeting}, ${displayName}` : greeting

  return (
    <div style={{ padding: '20px 20px 24px' }}>
      {/* Header */}
      <div style={{
        ...anim(mounted, 0),
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 24,
      }}>
        <div>
          <h1 style={{
            fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 400,
            color: M.text, lineHeight: 1.3, marginBottom: 6,
          }}>
            {title}
          </h1>
          <p style={{ fontSize: 12, color: M.textMuted, margin: 0, fontFamily: FONT_BODY }}>
            {getDateString()}
          </p>
        </div>

        {/* Beta chip + bell */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BetaChip onClick={() => setBetaOpen(true)} />
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(255,255,255,0.5)',
            border: '1px solid rgba(255,255,255,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bell size={15} color={M.textSecondary} />
          </div>
        </div>
      </div>

      {/* WelcomeCard */}
      <div style={{ ...anim(mounted, 1), marginBottom: 12 }}>
        <WelcomeCard onBeta={() => setBetaOpen(true)} />
      </div>

      {/* AnonCTA — anonymous only */}
      {isAnon && (
        <div style={{ ...anim(mounted, 2), marginBottom: 12 }}>
          <AnonCTA onAuth={openAuth} />
        </div>
      )}

      {/* ExploreCard */}
      <div style={{ ...anim(mounted, isAnon ? 3 : 2), marginBottom: 12 }}>
        <ExploreCard />
      </div>

      {/* Footer */}
      <div style={{
        ...anim(mounted, isAnon ? 4 : 3),
        textAlign: 'center', padding: '12px 0', fontSize: 10, color: M.textMuted,
        fontFamily: FONT_BODY,
      }}>
        Educational purposes only · Not financial advice
      </div>

      {/* BetaSheet */}
      {betaOpen && (
        <div style={{
          position: 'fixed', inset: 0,
          maxWidth: 428, margin: '0 auto',
          zIndex: 50,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          pointerEvents: 'auto',
        }}>
          {/* Backdrop */}
          <div
            onClick={() => setBetaOpen(false)}
            onWheel={e => e.preventDefault()}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(45,36,22,0.22)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
            }}
          />
          {/* Sheet — inset 12px matching AuthSheet v1.1.0 */}
          <div style={{
            position: 'relative',
            background: 'rgba(255,255,255,0.96)',
            borderRadius: '24px 24px 0 0',
            margin: '0 12px',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.08)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            maxHeight: '78vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <BetaSheet onClose={() => setBetaOpen(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
