// v1.4.0 · Sprint 36
// Changelog:
//   v1.4.0 — 'Neutral' → 'Steady' throughout:
//             Steady state: accent tint + accent border + accent icon (indigo — calm, on-brand)
//             Was: blank white card, brown icon, no color — read as absent/empty
//             Axis label 'Neutral' → 'Steady'
//             toPostureKey: 'Neutral'/'Steady' → 'Steady' (matches ui-helpers branch)
//   v1.3.0 — S154: Add visible border to match other hero cards
//   v1.2.0 — S144: Added profile prop, passed to postureNarrative for profile-aware text
//   v1.1.0 — Rebuilt to match Figma design (node 40:1074)
//   v1.0.1 — Fix: M.display/M.body replaced with string literals

import { useState, useEffect, useRef } from 'react'
import { Shield } from 'lucide-react'
import { M } from '@/lib/meridian'
import { card, anim, postureNarrative } from '@/lib/ui-helpers'
import { getRegimeConfig } from '@/lib/regime-utils'

interface PostureHeroProps {
  score:    number    // 0–100
  label:    string    // 'Aligned' | 'Steady' | 'Misaligned'
  regime:   string
  hidden:   boolean
  profile?: string
}

const FONT_DISPLAY = "'Outfit', sans-serif"
const FONT_BODY    = "'DM Sans', sans-serif"

function getScoreThreshold(score: number): {
  tint: string; scoreColor: string; iconBg: string; dotBorder: string; cardBorder: string
} {
  if (score >= 60) return {
    tint:        'rgba(42,157,143,0.08)',
    scoreColor:  M.positive,
    iconBg:      'linear-gradient(135deg, #2A9D8F, rgba(42,157,143,0.8))',
    dotBorder:   M.positive,
    cardBorder:  M.borderPositive,
  }
  if (score < 40) return {
    tint:        'rgba(231,111,81,0.08)',
    scoreColor:  M.negative,
    iconBg:      'linear-gradient(135deg, #E76F51, rgba(231,111,81,0.8))',
    dotBorder:   M.negative,
    cardBorder:  'rgba(231,111,81,0.3)',
  }
  // Steady — accent/indigo treatment: calm, on-brand, not absent
  return {
    tint:        M.accentMuted,                                         // indigo tint
    scoreColor:  M.accent,                                              // indigo score number
    iconBg:      'linear-gradient(135deg, #7B6FA8, rgba(90,77,138,0.8))', // indigo icon
    dotBorder:   M.accent,
    cardBorder:  M.borderAccent,                                        // indigo border
  }
}

/**
 * Map label → postureNarrative key.
 * Handles legacy 'Neutral' in case old data comes through.
 */
function toPostureKey(label: string): string {
  if (label === 'Neutral') return 'Steady'
  return label
}

export default function PostureHero({ score, label, regime, hidden, profile }: PostureHeroProps) {
  const [mounted, setMounted] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)
  const [barWidth, setBarWidth] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const el = barRef.current
    if (!el) return
    const observer = new ResizeObserver(entries => {
      setBarWidth(entries[0].contentRect.width)
    })
    observer.observe(el)
    setBarWidth(el.getBoundingClientRect().width)
    return () => observer.disconnect()
  }, [])

  const { tint, scoreColor, iconBg, dotBorder, cardBorder } = getScoreThreshold(score)
  const narrative    = postureNarrative(toPostureKey(label), regime, profile)
  const clampedScore = Math.min(100, Math.max(0, score))

  const DOT_SIZE = 16
  const dotX = barWidth > 0
    ? Math.min(barWidth - DOT_SIZE, Math.max(0, (clampedScore / 100) * barWidth - DOT_SIZE / 2))
    : 0

  return (
    <div style={{
      ...card(),
      border: `1px solid ${cardBorder}`,
      background: `linear-gradient(135deg, ${tint}, ${tint}), ${M.surface}`,
      position: 'relative',
      overflow: 'visible',
      ...anim(mounted, 0),
    }}>

      {/* ── Top row: icon + label / score ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>

        {/* Left: micro-label + icon + heading */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{
            fontFamily: FONT_BODY, fontSize: 11, fontWeight: 500,
            letterSpacing: '0.06em', textTransform: 'uppercase' as const,
            color: M.textMuted,
          }}>
            Posture
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Shield size={18} color="white" strokeWidth={2} />
            </div>
            <span style={{
              fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 500,
              color: M.text, lineHeight: 1, letterSpacing: '-0.01em',
            }}>
              {label}
            </span>
          </div>
        </div>

        {/* Right: score */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, paddingTop: 2 }}>
          <span style={{
            fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: 500,
            lineHeight: 1, color: scoreColor, letterSpacing: '-0.02em',
          }}
            aria-label={hidden ? 'Score hidden' : `Posture score ${clampedScore}`}
          >
            {hidden ? '••' : clampedScore}
          </span>
          <span style={{
            fontFamily: FONT_BODY, fontSize: 10, fontWeight: 500,
            letterSpacing: '0.06em', textTransform: 'uppercase' as const,
            color: M.textMuted,
          }}>
            score
          </span>
        </div>
      </div>

      {/* ── Narrative ── */}
      <p style={{
        fontFamily: FONT_BODY, fontSize: 13, color: M.textSecondary,
        lineHeight: 1.55, margin: '0 0 20px',
      }}>
        {narrative}
      </p>

      {/* ── Posture bar ── */}
      <div>
        <div
          ref={barRef}
          style={{
            position: 'relative', height: 8, borderRadius: 8,
            background: M.surfaceLight, overflow: 'visible',
          }}
          role="progressbar"
          aria-valuenow={hidden ? undefined : clampedScore}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Portfolio posture score"
        >
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0,
            borderRadius: 8,
            background: 'linear-gradient(90deg, #E76F51 0%, #7B6FA8 50%, #2A9D8F 100%)',
            width: `${clampedScore}%`,
            transition: 'width 0.65s cubic-bezier(0.4, 0, 0.2, 1)',
          }} />

          <div style={{
            position: 'absolute', top: '50%', left: dotX,
            transform: 'translateY(-50%)',
            width: DOT_SIZE, height: DOT_SIZE, borderRadius: '50%',
            background: 'white', border: `2.5px solid ${dotBorder}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.14), 0 0 0 3px rgba(255,255,255,0.55)',
            transition: 'left 0.65s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 1,
          }} />
        </div>

        {/* Axis labels — centre updated to 'Steady' */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7 }}>
          {([
            { text: 'Misaligned', color: M.negative },
            { text: 'Steady',     color: M.accent   },  // was 'Neutral' + M.textMuted
            { text: 'Aligned',    color: M.positive  },
          ] as const).map(({ text, color }) => (
            <span key={text} style={{
              fontFamily: FONT_BODY, fontSize: 10, fontWeight: 500,
              letterSpacing: '0.04em', color,
            }}>
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
