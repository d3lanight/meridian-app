// ━━━ AllocRow Component ━━━
// v1.0.0 · ca-story131 · Sprint 28
// Single allocation row: label, current %, target band, visual bar, warning state

'use client'

import { M } from '@/lib/meridian'

// ─── Props ────────────────────────────────────────────────────────────────────

interface AllocRowProps {
  category: string
  current: number           // 0–1 (weight)
  targetMin: number         // 0–100 (percentage points)
  targetMax: number         // 0–100 (percentage points)
  hidden?: boolean
  preview?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AllocRow({
  category,
  current,
  targetMin,
  targetMax,
  hidden = false,
  preview = false,
}: AllocRowProps) {
  const currentPct = Math.round(current * 100)
  const targetMid  = Math.round((targetMin + targetMax) / 2)
  const inZone     = currentPct >= targetMin && currentPct <= targetMax
  const warning    = !inZone

  const barCurrentPct = Math.min(current * 100, 100)
  const zoneLeft      = Math.min(targetMin, 100)
  const zoneWidth     = Math.min(targetMax - targetMin, 100 - zoneLeft)

  return (
    <div style={{ marginBottom: 16 }}>

      {/* ── Row header ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
      }}>
        {/* Label + warning */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: 13,
            fontWeight: 500,
            color: M.text,
            fontFamily: "'Outfit', sans-serif",
          }}>
            {category}
          </span>
          {warning && !preview &&(
            <span style={{ fontSize: 12, color: '#F59E0B' }} aria-label="Outside target zone">
              ⚠
            </span>
          )}
        </div>

        {/* Current % + target range */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 13,
            fontWeight: 600,
            color: warning ? '#F59E0B' : M.text,
            fontFamily: "'Outfit', sans-serif",
            minWidth: 32,
            textAlign: 'right',
          }}>
            <span style={{
              fontSize: 13,
              fontWeight: 600,
              color: warning && !preview ? '#F59E0B' : M.text,
              fontFamily: "'Outfit', sans-serif",
              minWidth: 32,
              textAlign: 'right',
            }}>
            {preview || hidden ? '—' : `${currentPct}%`}
            </span>
          </span>
          <span style={{
            fontSize: 11,
            color: M.textMuted,
            fontFamily: "'Outfit', sans-serif",
          }}>
            {`${targetMin}–${targetMax}%`}
          </span>
        </div>
      </div>

      {/* ── Visual bar ── */}
      <div style={{
        position: 'relative',
        height: 6,
        borderRadius: 4,
        background: M.surfaceLight,
        overflow: 'hidden',
      }}>
        {/* Target zone shading */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: `${zoneLeft}%`,
          width: `${zoneWidth}%`,
          height: '100%',
          background: 'rgba(99, 102, 241, 0.15)',
          borderRadius: 4,
        }} />

        {/* Current fill — hidden in preview mode */}
        {!preview && (
          <div style={{
            position: 'absolute', top: 0, left: 0,
            width: `${barCurrentPct}%`, height: '100%',
            borderRadius: 4,
            background: warning
              ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
              : M.accentGradient,
            transition: 'width 0.4s ease',
          }} />
        )}


        {/* Target mid marker */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: `${targetMid}%`,
          width: 1,
          height: '100%',
          background: 'rgba(99, 102, 241, 0.4)',
          transform: 'translateX(-50%)',
        }} />
      </div>
    </div>
  )
}
