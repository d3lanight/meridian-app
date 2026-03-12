// ━━━ Briefing ━━━
// v2.0.0 · S202 · Sprint 41
// Purpose: AI briefing card — reads live content from /api/briefing.
// Changelog:
//   v2.0.0 — S202: New props interface. content + isPending replace regime/regimeDay/confidence/postureLabel/portfolioNote.
//             Pending state renders graceful skeleton. Ready state renders content text directly.
//   v1.0.0 — S161: Initial. Static prop-driven regime card.

'use client'

import { Sparkles } from 'lucide-react'
import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'

const FONT_DISPLAY = "'Outfit', sans-serif"
const FONT_BODY    = "'DM Sans', sans-serif"

interface BriefingProps {
  content?: string      // ready state — AI text
  isPending?: boolean   // pending state — show skeleton
}

// ── Skeleton ───────────────────────────────────

function BriefingSkeleton() {
  return (
    <>
      <style>{`
        @keyframes briefingPulse {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.75; }
        }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        <p style={{
          fontSize: 12,
          color: M.textMuted,
          margin: '0 0 6px',
          fontFamily: FONT_BODY,
          fontStyle: 'italic',
        }}>
          Your briefing is being prepared…
        </p>
        {[1, 0.9, 0.72].map((w, i) => (
          <div
            key={i}
            style={{
              height: 12,
              borderRadius: 6,
              width: `${w * 100}%`,
              background: M.borderSubtle,
              animation: `briefingPulse 1.8s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </>
  )
}

// ── Briefing ───────────────────────────────────

export default function Briefing({ content, isPending = false }: BriefingProps) {
  const isReady = !isPending && !!content

  return (
    <div style={{
      ...card({ padding: 18 }),
      background: `linear-gradient(135deg, ${M.accentMuted}, rgba(123,111,168,0.04))`,
      border: `1px solid ${M.borderAccent}`,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 10,
          background: M.accentDim,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Sparkles size={14} color={M.accent} />
        </div>
        <span style={{
          fontSize: 13,
          fontWeight: 600,
          color: M.text,
          fontFamily: FONT_DISPLAY,
        }}>
          Your briefing
        </span>
        <span style={{
          fontSize: 9,
          color: M.textMuted,
          marginLeft: 'auto',
          fontFamily: FONT_BODY,
        }}>
          {isReady ? 'Updated today' : 'Loading…'}
        </span>
      </div>

      {/* Body */}
      {isPending || !content ? (
        <BriefingSkeleton />
      ) : (
        <p style={{
          fontSize: 14,
          color: M.text,
          lineHeight: 1.65,
          margin: 0,
          fontFamily: FONT_BODY,
        }}>
          {content}
        </p>
      )}
    </div>
  )
}
