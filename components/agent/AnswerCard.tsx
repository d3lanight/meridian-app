// ━━━ AnswerCard ━━━
// v1.0.0 · S203 · Sprint 41
// Purpose: Renders AI answer from /api/ask. Inline placement below AgentPrompt.
// Changelog:
//   v1.0.0 — S203: Initial. Glassmorphic card, animated entrance, loading skeleton,
//             relative timestamp, dismiss button.

'use client'

import { useState, useEffect } from 'react'
import { X, Sparkles } from 'lucide-react'
import { M } from '@/lib/meridian'
import { card, anim } from '@/lib/ui-helpers'

// ── Fonts ──────────────────────────────────────
const FONT_DISPLAY = "'Outfit', sans-serif"
const FONT_BODY    = "'DM Sans', sans-serif"

// ── Relative time helper ───────────────────────

function relativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  return `${Math.floor(diff / 3600)}h ago`
}

// ── Props ──────────────────────────────────────

interface AnswerCardProps {
  answer: string
  question: string
  generated_at: string   // ISO timestamp
  onDismiss: () => void
  loading?: boolean      // default false
}

// ── Skeleton ───────────────────────────────────

function AnswerSkeleton() {
  return (
    <>
      <style>{`
        @keyframes answerPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.85; }
        }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0' }}>
        {[1, 0.85, 0.7].map((w, i) => (
          <div
            key={i}
            style={{
              height: 13,
              borderRadius: 6,
              width: `${w * 100}%`,
              background: M.borderSubtle,
              animation: `answerPulse 1.6s ease-in-out ${i * 0.15}s infinite`,
            }}
          />
        ))}
      </div>
    </>
  )
}

// ── AnswerCard ─────────────────────────────────

export function AnswerCard({
  answer,
  question,
  generated_at,
  onDismiss,
  loading = false,
}: AnswerCardProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30)
    return () => clearTimeout(t)
  }, [loading, answer]) // re-trigger entrance on new answer

  return (
    <div
      style={{
        ...anim(mounted, 0),
        ...card({
          padding: 0,
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${M.accentMuted}, rgba(123,111,168,0.04))`,
          border: `1px solid ${M.borderAccent}`,
        }),
      }}
    >
      {/* Top accent bar */}
      <div style={{
        height: 2,
        background: `linear-gradient(90deg, ${M.accent}, ${M.accentDeep})`,
        opacity: 0.5,
      }} />

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '14px 16px 10px',
        gap: 8,
      }}>
        {/* Icon */}
        <div style={{
          width: 26,
          height: 26,
          borderRadius: 9,
          background: M.accentDim,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Sparkles size={12} color={M.accent} />
        </div>

        {/* Label */}
        <span style={{
          fontSize: 12,
          fontWeight: 600,
          color: M.accent,
          fontFamily: FONT_DISPLAY,
          letterSpacing: '0.01em',
          flex: 1,
        }}>
          Meridian
        </span>

        {/* Timestamp */}
        {!loading && (
          <span style={{
            fontSize: 11,
            color: M.textMuted,
            fontFamily: FONT_BODY,
          }}>
            {relativeTime(generated_at)}
          </span>
        )}

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          aria-label="Dismiss answer"
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: 'none',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            marginRight: -4,
            flexShrink: 0,
          }}
        >
          <X size={14} color={M.textMuted} />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '0 16px 6px' }}>
        {loading ? (
          <AnswerSkeleton />
        ) : (
          <p style={{
            fontSize: 15,
            color: M.text,
            lineHeight: 1.65,
            margin: 0,
            fontFamily: FONT_BODY,
          }}>
            {answer}
          </p>
        )}
      </div>

      {/* Footer */}
      {!loading && (
        <div style={{
          padding: '10px 16px 14px',
          borderTop: `1px solid ${M.borderSubtle}`,
          marginTop: 10,
        }}>
          <span style={{
            fontSize: 11,
            color: M.textMuted,
            fontFamily: FONT_BODY,
          }}>
            Educational context only
          </span>
        </div>
      )}
    </div>
  )
}
