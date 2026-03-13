// ━━━ Today Page ━━━
// v5.1.0 · Sprint 42 — S209: Replace per-page getUser()+pref fetch with useUser() context.
//                            Zero Supabase calls on mount — data already loaded by ProtectedLayout.
// v5.0.0 · S202 · S204 · Sprint 41
// Purpose: Today intelligence hub — live briefing, AgentPrompt wired, AnswerCard, tier gate.
// Changelog:
//   v5.0.0 — S202/S204: Full wiring.
//             Fetches: /api/briefing + user_preferences (regime_display_window) + profiles (display_name, tier).
//             Briefing: live content from /api/briefing, pending → skeleton.
//             AgentPrompt: live question registry, isPro from profiles.tier.
//             AnswerCard: inline answer display, dismiss, loading skeleton.
//             Free gate: portfolio chips → ProBadge + ProUpgradeCard overlay.
//             ExternalCard and "From the network" divider removed (usage only — files kept).
//   v4.1.0 — S177: Beta state. WelcomeCard + AnonCTA + ExploreCard.

'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'
import { M } from '@/lib/meridian'
import { anim } from '@/lib/ui-helpers'
import { useAuthSheet } from '@/contexts/AuthSheetContext'
import {
  Bell, Lock, ArrowUpRight, ChevronRight,
  Activity, Shield,
} from 'lucide-react'
import BetaSheet from '@/components/today/BetaSheet'
import Briefing from '@/components/today/Briefing'
import AgentPrompt from '@/components/today/AgentPrompt'
import { AnswerCard } from '@/components/agent'
import { ProUpgradeCard } from '@/components/profile'

// ── Fonts ──────────────────────────────────────
const FONT_DISPLAY = "'Outfit', sans-serif"
const FONT_BODY    = "'DM Sans', sans-serif"

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
        Explore Meridian
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
  const [betaOpen, setBetaOpen] = useState(false)
  const [showProUpgrade, setShowProUpgrade] = useState(false)

  // Briefing state
  const [briefingContent, setBriefingContent] = useState<string | undefined>(undefined)
  const [briefingPending, setBriefingPending] = useState(true) // true until API responds

  // Answer state
  const [answer, setAnswer] = useState<{
    text: string
    question: string
    generated_at: string
  } | null>(null)
  const [answerLoading, setAnswerLoading] = useState(false)
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null)

  const { openAuth } = useAuthSheet()

  // User data from context — no Supabase calls needed
  const { isAnon, displayName, isPro, regimeWindow, loading: userLoading } = useUser()

  // ── Mount ──────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(t)
  }, [])

  // ── Briefing fetch — only once user state is resolved ─────────────────────
  useEffect(() => {
    if (userLoading) return
    if (isAnon) { setBriefingPending(false); return }
    fetchBriefing()
  }, [userLoading, isAnon])

  // ── Briefing fetch ─────────────────────────────
  const fetchBriefing = async () => {
    try {
      const res = await fetch('/api/briefing')
      if (!res.ok) return

      const data = await res.json()
      if (data.status === 'pending') {
        setBriefingPending(true)
      } else if (data.status === 'ready' && data.content) {
        setBriefingContent(data.content)
        setBriefingPending(false)
      }
    } catch {}
  }

  // ── Ask handler ────────────────────────────────
  async function handleQuestion(questionId: string) {
    setActiveQuestion(questionId)
    setAnswerLoading(true)
    setAnswer(null)
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_id: questionId, regime_window: regimeWindow }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setAnswer({
        text: data.answer,
        question: questionId,
        generated_at: data.generated_at,
      })
    } catch {
      // silently clear — no error state for v1
    } finally {
      setAnswerLoading(false)
      setActiveQuestion(null)
    }
  }

  const greeting = getGreeting()
  const title = (!isAnon && displayName) ? `${greeting}, ${displayName}` : greeting
  const hasBriefing = briefingPending || !!briefingContent

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

      {/* Briefing — authenticated only, when briefing data available */}
      {!isAnon && hasBriefing && (
        <div style={{ ...anim(mounted, 1), marginBottom: 12 }}>
          <Briefing
            content={briefingContent}
            isPending={briefingPending}
          />
        </div>
      )}

      {/* AgentPrompt — authenticated only */}
      {!isAnon && (
        <div style={{ ...anim(mounted, 2), marginBottom: 12 }}>
          <AgentPrompt
            isPro={isPro}
            activeQuestion={activeQuestion}
            onQuestion={handleQuestion}
            onProTap={() => setShowProUpgrade(true)}
          />
        </div>
      )}

      {/* AnswerCard — shown when loading or answer ready */}
      {!isAnon && (answerLoading || answer) && (
        <div style={{ ...anim(mounted, 3), marginBottom: 12 }}>
          {answerLoading ? (
            <AnswerCard
              answer=""
              question={activeQuestion ?? ''}
              generated_at={new Date().toISOString()}
              onDismiss={() => setAnswer(null)}
              loading
            />
          ) : answer ? (
            <AnswerCard
              answer={answer.text}
              question={answer.question}
              generated_at={answer.generated_at}
              onDismiss={() => setAnswer(null)}
            />
          ) : null}
        </div>
      )}

      {/* AnonCTA — anonymous only */}
      {isAnon && (
        <div style={{ ...anim(mounted, 1), marginBottom: 12 }}>
          <AnonCTA onAuth={openAuth} />
        </div>
      )}

      {/* ExploreCard */}
      <div style={{ ...anim(mounted, isAnon ? 2 : 4), marginBottom: 12 }}>
        <ExploreCard />
      </div>

      {/* Footer */}
      <div style={{
        ...anim(mounted, isAnon ? 3 : 5),
        textAlign: 'center', padding: '12px 0', fontSize: 10, color: M.textMuted,
        fontFamily: FONT_BODY,
      }}>
        Educational purposes only · Not financial advice
      </div>

      {/* ProUpgradeCard overlay */}
      {showProUpgrade && (
        <div
          onClick={() => setShowProUpgrade(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            background: 'rgba(45,36,22,0.22)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            display: 'flex', alignItems: 'flex-end',
            padding: '0 20px 96px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 428, margin: '0 auto' }}
          >
            <ProUpgradeCard />
          </div>
        </div>
      )}

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
          {/* Sheet */}
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
