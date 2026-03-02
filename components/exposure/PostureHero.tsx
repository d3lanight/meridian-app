// v1.1.0 · ca-story130 · Sprint 28
// Changelog:
//   v1.1.0 — Rebuilt to match Figma design (node 40:1074):
//             label as large heading, score top-right, icon left of label,
//             "Posture" micro-label above, score color matches threshold
//   v1.0.1 — Fix: M.display/M.body replaced with string literals
// PostureHero — visual centrepiece of the Exposure page

// 1. React
import { useState, useEffect, useRef } from 'react'

// 2. Lucide
import { Shield } from 'lucide-react'

// 3. Internal utilities
import { M } from '@/lib/meridian'
import { card, anim, postureNarrative } from '@/lib/ui-helpers'
import { getRegimeConfig } from '@/lib/regime-utils'

// 4. Types
interface PostureHeroProps {
  score: number    // 0–100
  label: string    // 'Aligned' | 'Neutral' | 'Misaligned'
  regime: string   // e.g. 'bull', 'bear', 'range', 'volatility'
  hidden: boolean  // privacy mode — from usePrivacy() in parent
}

// ─── Font constants (M has no typography tokens) ──────────────────────────
const FONT_DISPLAY = "'Outfit', sans-serif"
const FONT_BODY    = "'DM Sans', sans-serif"

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns threshold colors based on posture score */
function getScoreThreshold(score: number): {
  tint: string
  scoreColor: string
  iconBg: string
  dotBorder: string
} {
  if (score >= 60) return {
    tint:       'rgba(42,157,143,0.08)',
    scoreColor: M.positive,
    iconBg:     'linear-gradient(135deg, #2A9D8F, rgba(42,157,143,0.8))',
    dotBorder:  M.positive,
  }
  if (score < 40) return {
    tint:       'rgba(231,111,81,0.08)',
    scoreColor: M.negative,
    iconBg:     'linear-gradient(135deg, #E76F51, rgba(231,111,81,0.8))',
    dotBorder:  M.negative,
  }
  return {
    tint:       'transparent',
    scoreColor: M.textMuted,
    iconBg:     'linear-gradient(135deg, #8B7565, rgba(139,117,101,0.8))',
    dotBorder:  M.accent,
  }
}

/**
 * postureNarrative() checks 'Aligned' | 'Watch' | 'Moderate' | 'Misaligned'.
 * Map 'Neutral' → 'Moderate' so the correct branch fires.
 */
function toPostureKey(label: string): string {
  return label === 'Neutral' ? 'Moderate' : label
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PostureHero({ score, label, regime, hidden }: PostureHeroProps) {
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

  const { tint, scoreColor, iconBg, dotBorder } = getScoreThreshold(score)
  const narrative  = postureNarrative(toPostureKey(label), regime)
  const clampedScore = Math.min(100, Math.max(0, score))

  const DOT_SIZE = 16
  const dotX = barWidth > 0
    ? Math.min(barWidth - DOT_SIZE, Math.max(0, (clampedScore / 100) * barWidth - DOT_SIZE / 2))
    : 0

  return (
    <div
      style={{
        ...card(),
        background: tint !== 'transparent'
          ? `linear-gradient(135deg, ${tint}, ${tint}), ${M.surface}`
          : M.surface,
        position: 'relative',
        overflow: 'visible',
        ...anim(mounted, 0),
      }}
    >

      {/* ── Top row: icon + label / score ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
      }}>

        {/* Left: micro-label + icon + heading */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* "Posture" micro-label */}
          <span style={{
            fontFamily: FONT_BODY,
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.06em',
            textTransform: 'uppercase' as const,
            color: M.textMuted,
          }}>
            Posture
          </span>

          {/* Icon + label row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Colored icon circle */}
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Shield size={18} color="white" strokeWidth={2} />
            </div>

            {/* Label heading */}
            <span style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 28,
              fontWeight: 500,
              color: M.text,
              lineHeight: 1,
              letterSpacing: '-0.01em',
            }}>
              {label}
            </span>
          </div>
        </div>

        {/* Right: score number */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 2,
          paddingTop: 2,
        }}>
          <span
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 32,
              fontWeight: 500,
              lineHeight: 1,
              color: scoreColor,
              letterSpacing: '-0.02em',
            }}
            aria-label={hidden ? 'Score hidden' : `Posture score ${clampedScore}`}
          >
            {hidden ? '••' : clampedScore}
          </span>
          <span style={{
            fontFamily: FONT_BODY,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.06em',
            textTransform: 'uppercase' as const,
            color: M.textMuted,
          }}>
            score
          </span>
        </div>
      </div>

      {/* ── Narrative ── */}
      <p style={{
        fontFamily: FONT_BODY,
        fontSize: 13,
        color: M.textSecondary,
        lineHeight: 1.55,
        margin: '0 0 20px',
      }}>
        {narrative}
      </p>

      {/* ── Posture bar ── */}
      <div>
        {/* Track */}
        <div
          ref={barRef}
          style={{
            position: 'relative',
            height: 8,
            borderRadius: 8,
            background: M.surfaceLight,
            overflow: 'visible',
          }}
          role="progressbar"
          aria-valuenow={hidden ? undefined : clampedScore}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Portfolio posture score"
        >
          {/* Gradient fill */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, bottom: 0,
            borderRadius: 8,
            background: 'linear-gradient(90deg, #E76F51 0%, #8B7565 50%, #2A9D8F 100%)',
            width: `${clampedScore}%`,
            transition: 'width 0.65s cubic-bezier(0.4, 0, 0.2, 1)',
          }} />

          {/* Thumb dot */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: dotX,
            transform: 'translateY(-50%)',
            width: DOT_SIZE,
            height: DOT_SIZE,
            borderRadius: '50%',
            background: 'white',
            border: `2.5px solid ${dotBorder}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.14), 0 0 0 3px rgba(255,255,255,0.55)',
            transition: 'left 0.65s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 1,
          }} />
        </div>

        {/* Axis labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7 }}>
          {([
            { text: 'Misaligned', color: M.negative },
            { text: 'Neutral',    color: M.textMuted },
            { text: 'Aligned',    color: M.positive  },
          ] as const).map(({ text, color }) => (
            <span key={text} style={{
              fontFamily: FONT_BODY,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.04em',
              color,
            }}>
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
