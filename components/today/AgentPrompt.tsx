// ━━━ AgentPrompt ━━━
// v2.0.0 · S202 · S204 · Sprint 41
// Purpose: Ask Meridian question chips. Tier-aware. Calls /api/ask via onQuestion callback.
// Changelog:
//   v2.0.0 — S202/S204: Live question registry. isPro prop. onQuestion callback.
//             Free: 5 market chips. Pro: 10 chips (market + portfolio).
//             Portfolio chips for free users render ProBadge, tap → onProTap.
//             Loading state: tapped chip spins, others disabled.
//   v1.0.0 — S161: Static UI-only chips, no backend.

'use client'

import { useState } from 'react'
import { Sparkles, Loader } from 'lucide-react'
import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'

const FONT_DISPLAY = "'Outfit', sans-serif"
const FONT_BODY    = "'DM Sans', sans-serif"

// ── Question Registry ──────────────────────────

interface Question {
  id: string
  label: string
  proOnly: boolean
}

const QUESTIONS: Question[] = [
  { id: 'market.regime_today',       label: 'What regime are we in?',        proOnly: false },
  { id: 'market.regime_duration',    label: 'How long has this regime lasted?', proOnly: false },
  { id: 'market.signals_now',        label: 'Key signals right now',          proOnly: false },
  { id: 'market.volatility_context', label: 'Is volatility normal?',          proOnly: false },
  { id: 'market.sentiment_meaning',  label: 'What does sentiment mean?',      proOnly: false },
  { id: 'portfolio.my_posture',      label: 'How is my portfolio positioned?', proOnly: true },
  { id: 'portfolio.biggest_risk',    label: 'My biggest risk right now',       proOnly: true },
  { id: 'portfolio.posture_score',   label: 'Why is my posture score this?',  proOnly: true },
  { id: 'portfolio.alt_exposure',    label: 'What does my ALT allocation mean?', proOnly: true },
  { id: 'portfolio.watch_today',     label: 'What to watch in my portfolio',  proOnly: true },
]

// ── Pro Badge (inline pill) ────────────────────

function ProBadge() {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '1px 6px',
      borderRadius: 8,
      background: M.accentDim,
      border: `1px solid ${M.borderAccent}`,
      fontSize: 9,
      fontWeight: 700,
      color: M.accentDeep,
      fontFamily: FONT_BODY,
      letterSpacing: '0.06em',
      textTransform: 'uppercase' as const,
      marginLeft: 4,
      verticalAlign: 'middle',
    }}>
      Pro
    </span>
  )
}

// ── Props ──────────────────────────────────────

interface AgentPromptProps {
  isPro: boolean
  activeQuestion: string | null    // currently loading question_id
  onQuestion: (questionId: string) => void
  onProTap: () => void             // shows ProUpgradeCard
}

// ── AgentPrompt ────────────────────────────────

export default function AgentPrompt({
  isPro,
  activeQuestion,
  onQuestion,
  onProTap,
}: AgentPromptProps) {
  const isLoading = activeQuestion !== null

  return (
    <div style={{
      ...card({ padding: 0, overflow: 'hidden' }),
      background: `linear-gradient(135deg, rgba(123,111,168,0.06), rgba(90,77,138,0.03))`,
      border: `1px solid ${M.borderAccent}`,
    }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 12,
          background: M.accentGradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 2px 8px ${M.accentGlow}`,
        }}>
          <Sparkles size={14} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: M.text, fontFamily: FONT_DISPLAY }}>
            Ask Meridian
          </div>
          <div style={{ fontSize: 11, color: M.textMuted, fontFamily: FONT_BODY }}>
            What should I pay attention to today?
          </div>
        </div>
      </div>

      {/* Question chips */}
      <div style={{ padding: '0 16px 14px' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
          {QUESTIONS.map((q) => {
            const isThisLoading = activeQuestion === q.id
            const isProLocked = q.proOnly && !isPro
            const isDisabled = isLoading && !isThisLoading

            if (isProLocked) {
              // Pro-locked chip: shows ProBadge, tap → ProUpgradeCard
              return (
                <button
                  key={q.id}
                  onClick={onProTap}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 20,
                    border: `1px solid ${M.borderSubtle}`,
                    background: 'rgba(255,255,255,0.35)',
                    cursor: 'pointer',
                    fontSize: 11,
                    color: M.textMuted,
                    fontFamily: FONT_BODY,
                    fontWeight: 500,
                    display: 'inline-flex',
                    alignItems: 'center',
                    opacity: 0.75,
                  }}
                >
                  {q.label}
                  <ProBadge />
                </button>
              )
            }

            return (
              <button
                key={q.id}
                onClick={() => !isLoading && onQuestion(q.id)}
                disabled={isDisabled}
                style={{
                  padding: '6px 12px',
                  borderRadius: 20,
                  border: `1px solid ${isThisLoading ? M.borderAccent : M.borderSubtle}`,
                  background: isThisLoading
                    ? M.accentDim
                    : 'rgba(255,255,255,0.5)',
                  cursor: isDisabled ? 'default' : 'pointer',
                  fontSize: 11,
                  color: isThisLoading ? M.accentDeep : M.textSecondary,
                  fontFamily: FONT_BODY,
                  fontWeight: 500,
                  opacity: isDisabled ? 0.45 : 1,
                  transition: 'opacity 0.2s, background 0.2s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                {isThisLoading && (
                  <Loader
                    size={10}
                    color={M.accentDeep}
                    style={{ animation: 'spin 0.8s linear infinite' }}
                  />
                )}
                {q.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Spin keyframe */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
