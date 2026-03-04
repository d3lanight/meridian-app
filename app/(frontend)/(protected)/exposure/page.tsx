// ━━━ Exposure Page ━━━
//   v0.7.0 — S134: Analysis cards (posture-driven) + Pro CTA
// Changelog:
//   v0.7.0 — S134: Analysis cards (posture-driven) + Pro CTA
//   v0.6.0 — S135: Empty state with regime preview + educational allocation bands
//   v0.5.0 — S132: HoldingsSection wired with flagged state + ETH-fold
//   v0.4.0 — S131: AllocationSection wired with 4-bucket weights + target_bands
//   v0.3.1 — Fix: M.display replaced with string literal
//   v0.3.0 — S130: PostureHero wired with snapshot + market data
//   v0.2.0 — S133: ManageBar wired with snapshot data
//   v0.1.0 — S128: Stub
'use client'

import { useState, useEffect } from 'react'
import { Shield, Zap, TrendingUp } from 'lucide-react'
import { BookOpen } from 'lucide-react'
import { getTargetBands } from '@/lib/risk-profiles'
import AllocRow from '@/components/exposure/AllocRow'
import { M } from '@/lib/meridian'
import { card, anim } from '@/lib/ui-helpers'
import PostureHero from '@/components/exposure/PostureHero'
import AllocationSection from '@/components/exposure/AllocationSection'
import HoldingsSection from '@/components/exposure/HoldingsSection'
import { usePrivacy } from '@/contexts/PrivacyContext'
import ManageBar from '@/components/exposure/ManageBar'
import InsightCard from '@/components/exposure/InsightCard'
import ProFeaturesCta from '@/components/exposure/ProFeaturesCta'
import type { PortfolioSnapshot, AltHolding } from '@/types'
import type { TargetBands } from '@/lib/risk-profiles'
import Link from 'next/link'


// ─── Local types ──────────────────────────────────────────────────────────────

interface MarketContextData {
  regime_type: string
  confidence?: number
}

/**
 * /api/portfolio-snapshot returns PortfolioSnapshot plus computed posture fields
 * not yet in the base type. Extended locally until types/index.ts is updated.
 */
interface SnapshotWithPosture extends PortfolioSnapshot {
  isEmpty?:             boolean
  risk_score?:          number
  btc_weight_all?:      number
  eth_weight_all?:      number
  alt_weight_all?:      number
  btc_value_usd?:       number
  eth_value_usd?:       number
  alt_value_usd?:       number
  btc_icon_url?:        string | null
  eth_icon_url?:        string | null
  total_value_usd_all?: number
  alt_breakdown?:       AltHolding[]
  target_bands?:        TargetBands | null
  risk_profile?:        string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Map risk_score (0–100) → posture label */
function scoreToLabel(score: number): string {
  if (score >= 60) return 'Aligned'
  if (score < 40)  return 'Misaligned'
  return 'Neutral'
}

// ─── Empty State ──────────────────────────────────────────────────────────────

const REGIME_LABELS: Record<string, string> = {
  bull: 'Bull Market', bear: 'Bear Market',
  range: 'Range', volatility: 'High Volatility', insufficient_data: 'Insufficient Data',
}

function ExposureEmptyState({
  regime,
  confidence,
  mounted,
}: {
  regime: string
  confidence: number | null
  mounted: boolean
}) {
  const regimeKey = regime as import('@/lib/risk-profiles').RegimeKey
  const bands = getTargetBands(null, regimeKey)   // null → neutral default
  const regimeLabel = REGIME_LABELS[regime] ?? regime

  const rows = [
    { category: 'BTC', min: bands.btc[0],    max: bands.btc[1] },
    { category: 'ETH', min: bands.eth[0],    max: bands.eth[1] },
    { category: 'ALT', min: bands.alt[0],    max: bands.alt[1] },
    { category: 'STABLE', min: bands.stable[0], max: bands.stable[1] },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Regime context pill */}
      <div style={{ ...anim(mounted, 0), ...card({ padding: '14px 16px' }) }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{
              fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: M.textMuted,
              fontFamily: "'DM Sans', sans-serif", marginBottom: 4,
            }}>
              Current Regime
            </div>
            <div style={{
              fontSize: 18, fontWeight: 500, color: M.text,
              fontFamily: "'Outfit', sans-serif",
            }}>
              {regimeLabel}
            </div>
          </div>
          {confidence !== null && (
            <div style={{
              background: M.accentDim,
              borderRadius: 20, padding: '6px 12px',
            }}>
              <span style={{
                fontSize: 13, fontWeight: 600, color: M.accentDeep,
                fontFamily: "'DM Mono', monospace",
              }}>
                {Math.round(confidence * 100)}%
              </span>
              <span style={{
                fontSize: 10, color: M.textMuted,
                fontFamily: "'DM Sans', sans-serif", marginLeft: 4,
              }}>
                confidence
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Target allocation preview */}
      <div style={{ ...anim(mounted, 1), ...card() }}>
        <div style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: M.accent,
          fontFamily: "'DM Sans', sans-serif", marginBottom: 16,
        }}>
          Target Allocations · Neutral Profile
        </div>
        {rows.map(row => (
          <AllocRow
            key={row.category}
            category={row.category}
            current={0}
            targetMin={row.min}
            targetMax={row.max}
            preview
          />
        ))}
        <p style={{
          fontSize: 11, color: M.textMuted, lineHeight: 1.6,
          marginTop: 8, marginBottom: 0,
        }}>
          Target bands shift with the market regime. Add holdings to see your actual posture.
        </p>
      </div>

      {/* Educational insight card */}
      <div style={{
        ...anim(mounted, 2),
        ...card({ padding: '14px 16px' }),
        display: 'flex', gap: 12, alignItems: 'flex-start',
        background: 'linear-gradient(135deg, rgba(123,111,168,0.08), rgba(90,77,138,0.05))',
        border: `1px solid ${M.borderAccent}`,
      }}>
        <BookOpen size={16} color={M.accent} style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{
          fontSize: 13, color: M.textSecondary, lineHeight: 1.6,
          margin: 0, fontFamily: "'DM Sans', sans-serif",
        }}>
          Target allocations shift with the market regime — add holdings to see your posture and alignment score.
        </p>
      </div>

      {/* CTA */}
      <div style={{ ...anim(mounted, 3) }}>
        <Link href="/portfolio" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: 'linear-gradient(90deg, #7B6FA8, #5A4D8A)',
          color: 'white', padding: 16, borderRadius: 20,
          textDecoration: 'none', fontSize: 15, fontWeight: 500,
          fontFamily: "'DM Sans', sans-serif",
          boxShadow: '0 4px 16px rgba(90,77,138,0.3)',
        }}>
          Add your first holding →
        </Link>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExposurePage() {
  const [mounted, setMounted]   = useState(false)
  const [snapshot, setSnapshot] = useState<SnapshotWithPosture | null>(null)
  const [regime, setRegime]     = useState<string>('range')
  const [regimeConfidence, setRegimeConfidence] = useState<number | null>(null)
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
        const conf = data?.regime_history?.[0]?.confidence
        if (conf !== undefined) setRegimeConfidence(conf)
      })
      .catch(() => {})
  }, [])

  const holdingCount  = snapshot?.holdings?.length ?? snapshot?.holding_count ?? 0
  const totalValue    = snapshot?.total_value_usd ?? 0
  const score         = snapshot?.risk_score ?? 0
  const label         = scoreToLabel(score)
  const isEmpty = snapshot?.isEmpty === true

  // 4-bucket weights
  const btcWeight    = snapshot?.btc_weight_all ?? 0
  const ethWeight    = snapshot?.eth_weight_all ?? 0
  const altWeight    = snapshot?.alt_weight_all ?? 0
  const stableWeight = Math.max(0, 1 - btcWeight - ethWeight - altWeight)
  const targetBands  = snapshot?.target_bands ?? null
  const btcValueUsd    = snapshot?.btc_value_usd ?? 0
  const ethValueUsd    = snapshot?.eth_value_usd ?? 0
  const altValueUsd    = snapshot?.alt_value_usd ?? 0
  const btcIconUrl     = snapshot?.btc_icon_url ?? null
  const ethIconUrl     = snapshot?.eth_icon_url ?? null
  const totalValueAll  = snapshot?.total_value_usd_all ?? 0
  const altBreakdown   = snapshot?.alt_breakdown ?? []
  const riskProfile    = snapshot?.risk_profile ?? null

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

      {/* ── Risk profile null banner (S143) ── */}
      {snapshot && riskProfile === null && !isEmpty && (
        <div style={{
          ...card({ padding: '12px 16px' }),
          marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 12,
          border: `1px solid ${M.borderAccent}`,
          background: 'linear-gradient(135deg, rgba(123,111,168,0.08), rgba(90,77,138,0.05))',
        }}>
          <Shield size={16} color={M.accent} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: M.text, fontFamily: "'DM Sans', sans-serif" }}>
              Set your risk profile
            </div>
            <div style={{ fontSize: 11, color: M.textMuted, marginTop: 1 }}>
              Get tailored alignment targets for your portfolio
            </div>
          </div>
          <Link href="/profile" style={{
            fontSize: 12, fontWeight: 600, color: M.accentDeep,
            textDecoration: 'none', flexShrink: 0,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Set up →
          </Link>
        </div>
      )}

      {/* ── Empty state ── */}
      {snapshot && isEmpty ? (
        <ExposureEmptyState regime={regime} confidence={regimeConfidence} mounted={mounted} />
      ) : (
        <>
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

          {/* ── Allocation vs Targets ── */}
          {snapshot ? (
            <AllocationSection
              btcWeight={btcWeight}
              ethWeight={ethWeight}
              altWeight={altWeight}
              stableWeight={stableWeight}
              targetBands={targetBands}
              mounted={mounted}
              hidden={hidden}
            />
          ) : (
            <div style={{ ...card(), ...anim(mounted, 1), marginBottom: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ height: 12, borderRadius: 6, background: M.surfaceLight, width: '40%' }} />
                {[0, 1, 2, 3].map(i => (
                  <div key={i} style={{ height: 24, borderRadius: 6, background: M.surfaceLight }} />
                ))}
              </div>
            </div>
          )}

          {/* ── Holdings ── */}
          {snapshot ? (
            <HoldingsSection
              btcWeight={btcWeight}
              ethWeight={ethWeight}
              altWeight={altWeight}
              stableWeight={stableWeight}
              btcValueUsd={btcValueUsd}
              ethValueUsd={ethValueUsd}
              altValueUsd={altValueUsd}
              btcIconUrl={btcIconUrl}
              ethIconUrl={ethIconUrl}
              altBreakdown={altBreakdown}
              totalValue={totalValueAll}
              targetBands={targetBands}
              score={score}
              mounted={mounted}
              hidden={hidden}
            />
          ) : (
            <div style={{ ...card(), ...anim(mounted, 2), marginBottom: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ height: 12, borderRadius: 6, background: M.surfaceLight, width: '30%' }} />
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ height: 44, borderRadius: 8, background: M.surfaceLight }} />
                ))}
              </div>
            </div>
          )}

          {/* ── Analysis (S134) ── */}
          {snapshot && (
            <div style={{ marginTop: 8 }}>
              {score >= 60 ? (
                <InsightCard
                  icon={Shield}
                  variant="positive"
                  text={`All categories within target bands. Your portfolio is well-positioned for the current regime.`}
                />
              ) : score < 40 ? (
                <>
                  <InsightCard
                    icon={Zap}
                    variant="warning"
                    text="Concentration detected — one or more buckets are significantly outside target bands, which amplifies exposure to regime shifts."
                    subtext="Analytical context, not a rebalancing signal."
                  />
                  <InsightCard
                    icon={TrendingUp}
                    variant="warning"
                    text="Early regime transitions can be noisy. The model typically needs 3–5 days to confirm a shift."
                  />
                </>
              ) : (
                <InsightCard
                  icon={Shield}
                  variant="neutral"
                  text="Your allocation is moderately aligned. Some buckets are near the edge of their target bands."
                />
              )}
            </div>
          )}

          {/* ── Analysis (S134) ── */}
          {snapshot && (
            <div style={{ marginTop: 8 }}>
              {score >= 60 ? (
                <InsightCard
                  icon={Shield}
                  variant="positive"
                  text={`All categories within target bands. Your portfolio is well-positioned for the current regime.`}
                />
              ) : score < 40 ? (
                <>
                  <InsightCard
                    icon={Zap}
                    variant="warning"
                    text="Concentration detected — one or more buckets are significantly outside target bands, which amplifies exposure to regime shifts."
                    subtext="Analytical context, not a rebalancing signal."
                  />
                  <InsightCard
                    icon={TrendingUp}
                    variant="warning"
                    text="Early regime transitions can be noisy. The model typically needs 3–5 days to confirm a shift."
                  />
                </>
              ) : (
                <InsightCard
                  icon={Shield}
                  variant="neutral"
                  text="Your allocation is moderately aligned. Some buckets are near the edge of their target bands."
                />
              )}
            </div>
          )}

          {/* ── Pro CTA (S134) ── */}
          <ProFeaturesCta />

          <ManageBar count={holdingCount} total={totalValue} />
        </>
      )}
    </div>
  )
}
