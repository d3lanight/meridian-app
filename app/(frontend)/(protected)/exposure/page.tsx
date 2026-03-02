// ━━━ Exposure Page ━━━
// v0.3.1 · ca-story130 · Sprint 28
// Changelog:
//   v0.3.1 — Fix: M.display replaced with string literal
//   v0.3.0 — S130: PostureHero wired with snapshot + market data
//   v0.2.0 — S133: ManageBar wired with snapshot data
//   v0.1.0 — S128: Stub
'use client'

import { useState, useEffect } from 'react'
import { M } from '@/lib/meridian'
import { card, anim } from '@/lib/ui-helpers'
import PostureHero from '@/components/exposure/PostureHero'
import { usePrivacy } from '@/contexts/PrivacyContext'
import ManageBar from '@/components/exposure/ManageBar'
import type { PortfolioSnapshot } from '@/types'

// ─── Local types ──────────────────────────────────────────────────────────────

interface MarketContextData {
  regime_type: string
}

/**
 * /api/portfolio-snapshot returns PortfolioSnapshot plus computed posture fields
 * not yet in the base type. Extended locally until types/index.ts is updated.
 */
interface SnapshotWithPosture extends PortfolioSnapshot {
  risk_score?: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Map risk_score (0–100) → posture label */
function scoreToLabel(score: number): string {
  if (score >= 60) return 'Aligned'
  if (score < 40)  return 'Misaligned'
  return 'Neutral'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExposurePage() {
  const [mounted, setMounted]   = useState(false)
  const [snapshot, setSnapshot] = useState<SnapshotWithPosture | null>(null)
  const [regime, setRegime]     = useState<string>('range')
  const { hidden } = usePrivacy()

  useEffect(() => {
    setMounted(true)

    fetch('/api/portfolio-snapshot')
      .then(r => r.ok ? r.json() : null)
      .then((data: SnapshotWithPosture | null) => { if (data) setSnapshot(data) })
      .catch(() => {})

    // market-context is public — no auth required
    fetch('/api/market-context')
      .then(r => r.ok ? r.json() : null)
      .then((data: { regime_history?: MarketContextData[] } | null) => {
        const current = data?.regime_history?.[0]?.regime_type
        if (current) setRegime(current)
      })
      .catch(() => {})
  }, [])

  const holdingCount = snapshot?.holdings?.length ?? snapshot?.holding_count ?? 0
  const totalValue   = snapshot?.total_value_usd ?? 0
  const score        = snapshot?.risk_score ?? 0
  const label        = scoreToLabel(score)

  return (
    <div style={{
      minHeight: '100vh',
      background: M.bg,
      padding: '20px 16px 100px',
    }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
      }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 500,
          color: M.text,
          fontFamily: "'Outfit', sans-serif",
        }}>
          Exposure
        </h1>
      </div>

      {/* ── PostureHero or skeleton ── */}
      {snapshot ? (
        <div style={{ marginBottom: 16 }}>
          <PostureHero
            score={score}
            label={label}
            regime={regime}
            hidden={hidden}
          />
        </div>
      ) : (
        <div style={{ ...card(), marginBottom: 16, ...anim(mounted, 0) }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ width: 72, height: 52, borderRadius: 8, background: M.surfaceLight, marginBottom: 8 }} />
            <div style={{ width: 56, height: 12, borderRadius: 6, background: M.surfaceLight }} />
          </div>
          <div style={{ height: 8, borderRadius: 8, background: M.surfaceLight, marginBottom: 20 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ height: 12, borderRadius: 6, background: M.surfaceLight, width: '90%' }} />
            <div style={{ height: 12, borderRadius: 6, background: M.surfaceLight, width: '65%' }} />
          </div>
        </div>
      )}

      <ManageBar count={holdingCount} total={totalValue} />
    </div>
  )
}
