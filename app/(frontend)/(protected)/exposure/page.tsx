// ━━━ Exposure Page ━━━
//   v3.4.0 — S177 · Sprint 36
// Changelog:
//   v3.4.0 — S177: Replace inline sheet wrappers with shared BottomSheet component.
//   v3.3.0 — S169: fetchSnapshot extracted; onAdd triggers refetch; sheet wrappers inset 12px margin.
//   v3.2.0 — S173: + button → AddHoldingSheet; Edit holding wired; RegimeTimeline removed.
//   v3.0.0 — S163/S164: Full v4 redesign.
//            - RegimeTimeline: collapsible, period tabs (7d/30d/90d), 90d pro-locked, rich blocks
//            - AllocationCard: teal-tinted, regime badge, target zone bars, warning text
//            - Empty state: regime-aware CTA with target preview
//            - Header: subtitle with holdings/total/regime
//            - HoldingCard: v4 style (card per holding, 24h change, flagText)
//            - isPro from profiles.tier (not hardcoded)
//            - ManageBar removed
//            - Divider component between sections
//   v2.0.0 — S163/S164: Initial v4 attempt (TimelineStrip + AggSection reuse — replaced)
//   v1.0.0 — S159: Cross-screen consistency
'use client'

import { useState, useEffect } from 'react'
import { Shield, Zap, TrendingUp, Plus, BookOpen, Eye, EyeOff } from 'lucide-react'
import { getTargetBands } from '@/lib/risk-profiles'
import { getRegimeConfig } from '@/lib/regime-utils'
import type { RegimeRow } from '@/lib/regime-utils'
import { M } from '@/lib/meridian'
import { card, anim } from '@/lib/ui-helpers'
import PostureHero from '@/components/exposure/PostureHero'
import AllocationCard, { buildAllocations } from '@/components/exposure/AllocationCard'
import HoldingsSection from '@/components/exposure/HoldingsSection'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { usePortfolio } from '@/hooks/usePortfolio'
import InsightCard from '@/components/exposure/InsightCard'
import AddHoldingSheet from '@/components/portfolio/AddHoldingSheet'
import EditHoldingSheet from '@/components/portfolio/EditHoldingSheet'
import ProFeaturesCta from '@/components/exposure/ProFeaturesCta'
import type { PortfolioSnapshot, AltHolding } from '@/types'
import type { TargetBands } from '@/lib/risk-profiles'
import Link from 'next/link'


// ─── Fonts ────────────────────────────────────────────────────────────────────
const FONT_DISPLAY = "'Outfit', sans-serif"
const FONT_BODY = "'DM Sans', sans-serif"
const FONT_MONO = "'DM Mono', monospace"


// ─── Local types ──────────────────────────────────────────────────────────────

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
  enriched_holdings?:  any[]
  holdings_count?:     number
}


// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreToLabel(score: number): string {
  if (score >= 60) return 'Aligned'
  if (score < 40)  return 'Misaligned'
  return 'Steady'
}

function formatUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${Math.round(value).toLocaleString()}`
}

const REGIME_LABELS: Record<string, string> = {
  bull: 'Bull', bear: 'Bear',
  range: 'Range', volatility: 'Volatile', insufficient_data: 'Insufficient Data',
}

/** Map market-context API response → RegimeRow[] for regime-utils */
function toRegimeRows(raw: any[]): RegimeRow[] {
  return raw.map(r => ({
    timestamp: r.timestamp || r.market_timestamp || r.created_at || '',
    regime: r.regime || r.regime_type || 'range',
    confidence: r.confidence ?? 0,
    price_now: r.price_now ?? 0,
  }))
}


// ─── Divider ──────────────────────────────────────────────────────────────────

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0', margin: '16px 0 12px' }}>
      <div style={{ flex: 1, height: 1, background: M.borderSubtle }} />
      <span style={{ fontSize: 9, color: M.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: M.borderSubtle }} />
    </div>
  )
}


// ─── Empty State ──────────────────────────────────────────────────────────────

function ExposureEmptyState({
  regime,
  confidence,
  persistence,
  mounted,
}: {
  regime: string
  confidence: number
  persistence: number
  mounted: boolean
}) {
  const rc = getRegimeConfig(regime)
  const regimeKey = regime as import('@/lib/risk-profiles').RegimeKey
  const bands = getTargetBands(null, regimeKey)

  const targets = [
    { label: 'BTC', color: M.btcOrange, pct: Math.round((bands.btc[0] + bands.btc[1]) / 2), target: `${bands.btc[0]}–${bands.btc[1]}%` },
    { label: 'ETH', color: M.ethBlue, pct: Math.round((bands.eth[0] + bands.eth[1]) / 2), target: `${bands.eth[0]}–${bands.eth[1]}%` },
    { label: 'ALT', color: '#9945FF', pct: Math.round((bands.alt[0] + bands.alt[1]) / 2), target: `${bands.alt[0]}–${bands.alt[1]}%` },
    { label: 'Stable', color: M.positive, pct: Math.round((bands.stable[0] + bands.stable[1]) / 2), target: `${bands.stable[0]}–${bands.stable[1]}%` },
  ]

  return (
    <div style={{ padding: '28px 0 0' }}>
      {/* Regime context card */}
      <div style={{
        ...card({ padding: 20 }),
        background: `linear-gradient(135deg, ${rc.d}, rgba(42,157,143,0.02))`,
        border: `1px solid ${rc.s}33`, marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, background: rc.d,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 18, color: rc.s }}>{rc.icon}</span>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: M.text }}>{rc.l} regime detected</div>
            <div style={{ fontSize: 11, color: M.textMuted }}>{confidence}% confidence · Day {persistence}</div>
          </div>
        </div>

        <p style={{ fontSize: 13, color: M.textSecondary, lineHeight: 1.55, marginBottom: 16 }}>
          Here&apos;s what a regime-aligned portfolio looks like right now:
        </p>

        <div style={{ background: 'rgba(255,255,255,0.5)', borderRadius: 16, padding: 14 }}>
          <div style={{ fontSize: 10, color: M.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            {rc.l} target allocation
          </div>
          {targets.map(({ label, color, pct, target }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: 3, background: color }} />
              <span style={{ fontSize: 12, color: M.text, flex: 1 }}>{label}</span>
              <div style={{ width: 100, height: 5, borderRadius: 5, background: M.borderSubtle, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 5 }} />
              </div>
              <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: M.textSecondary, width: 50, textAlign: 'right' }}>{target}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Educational insight */}
      <div >
        <InsightCard
          icon={BookOpen}
          variant="neutral"
          text="Target allocations shift with the market regime. Add your holdings to see how your portfolio aligns."
          subtext="These are model suggestions, not financial advice."
        />
      </div>

      {/* CTA */}
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Link href="/portfolio" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px',
          background: M.accentGradient, borderRadius: 20, boxShadow: `0 4px 16px ${M.accentGlow}`,
          textDecoration: 'none', fontSize: 14, fontWeight: 600, color: 'white', fontFamily: FONT_BODY,
        }}>
          Add your first holding
        </Link>
        <p style={{ fontSize: 11, color: M.textMuted, marginTop: 10 }}>
          No wallet connection needed — just enter what you hold.
        </p>
      </div>
    </div>
  )
}


// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExposurePage() {
  const [mounted, setMounted]   = useState(false)
  const [snapshot, setSnapshot] = useState<SnapshotWithPosture | null>(null)
  const [regime, setRegime]     = useState<string>('range')
  const [regimeConfidence, setRegimeConfidence] = useState<number>(0)
  const [regimePersistence, setRegimePersistence] = useState(1)
  const [regimeHistory, setRegimeHistory] = useState<RegimeRow[]>([])
  const [isPro, setIsPro]       = useState(false)
  const [sheet, setSheet]       = useState<{ type: 'add' } | { type: 'edit'; holdingId: string } | null>(null)
  const [currentPrices, setCurrentPrices] = useState<Record<string, { price: number; change_24h: number }>>({})
  const [coinContext, setCoinContext]      = useState<Record<string, { sparkline?: number[]; high30d?: number; low30d?: number; change30d?: number; beta?: number }>>({})
  const { hidden, toggleHidden } = usePrivacy()
  const { holdings: portfolioHoldings, assets, addHolding, updateHolding, removeHolding, refresh } = usePortfolio()


  const fetchSnapshot = () => {
    fetch('/api/portfolio-snapshot')
      .then(r => r.ok ? r.json() : null)
      .then((data: SnapshotWithPosture | null) => { if (data) setSnapshot(data) })
      .catch(() => {})
  }

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100)

    // Portfolio snapshot (auth required — will 401 for anon, that's fine)
    fetchSnapshot()

    // Market context (public)
    fetch('/api/market-context?days=90')
      .then(r => r.ok ? r.json() : null)
      .then((data: any) => {
        const regimes = data?.regimes || []
        if (regimes.length > 0) {
          setRegime(regimes[0].regime || 'range')
          setRegimeConfidence(Math.round((regimes[0].confidence || 0) * 100))

          // Persistence: count consecutive matching regime rows
          let days = 1
          for (let i = 1; i < regimes.length; i++) {
            if (regimes[i].regime === regimes[0].regime) days++
            else break
          }
          setRegimePersistence(days)
        }
        setRegimeHistory(toRegimeRows(regimes))
        if (data?.current_prices) setCurrentPrices(data.current_prices)
      })
      .catch(() => {})

    // Coin context for sparklines/beta/30d range (Pro)
    fetch('/api/portfolio-snapshot')
      .then(r => r.ok ? r.json() : null)
      .then((snap: any) => {
        if (!snap?.enriched_holdings?.length) return null
        const symbols = snap.enriched_holdings.map((h: any) => h.asset).join(',')
        return fetch(`/api/coin-context?symbols=${symbols}`)
      })
      .then(r => r && r.ok ? r.json() : null)
      .then((ctx: any) => { if (ctx) setCoinContext(ctx) })
      .catch(() => {})

    // Auth + tier check
    ;(async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('tier')
            .eq('id', user.id)
            .maybeSingle()
          setIsPro(profile?.tier === 'pro')
        }
      } catch {}
    })()

    return () => clearTimeout(t)
  }, [])

  const holdingCount  = snapshot?.enriched_holdings?.length ?? snapshot?.holdings_count ?? 0
  const score         = snapshot?.risk_score ?? 0
  const label         = scoreToLabel(score)
  const isEmpty       = snapshot?.isEmpty === true

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

  const regimeLabel  = REGIME_LABELS[regime] ?? regime
  const isMisaligned = score < 40

  // Build allocation rows for AllocationCard
  const allocations = buildAllocations(btcWeight, ethWeight, altWeight, stableWeight)

  return (
    <div style={{
      minHeight: '100vh',
      background: M.bg,
      padding: '24px 20px 100px',
    }}>

      {/* ── Header (v4) ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
      }}>
        <div>
          <h1 style={{
            fontSize: 22, fontWeight: 500, color: M.text,
            fontFamily: FONT_DISPLAY, margin: '0 0 2px',
          }}>
            Your Exposure
          </h1>
          <p style={{ fontSize: 12, color: M.textSecondary, margin: 0 }}>
            {snapshot && !isEmpty
              ? `${holdingCount} holding${holdingCount !== 1 ? 's' : ''} · ${hidden ? '$••••' : formatUsd(totalValueAll)} · ${regimeLabel} regime`
              : `${regimeLabel} regime`
            }
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={toggleHidden}
            aria-label={hidden ? 'Show amounts' : 'Hide amounts'}
            style={{
              width: 44, height: 44, borderRadius: '50%', cursor: 'pointer',
              background: 'rgba(255,255,255,0.5)',
              border: `1px solid ${M.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {hidden
              ? <EyeOff size={16} color={M.textMuted} strokeWidth={2} />
              : <Eye size={16} color={M.textSecondary} strokeWidth={2} />}
          </button>
          <button
            onClick={() => setSheet({ type: 'add' })}
            style={{
              width: 44, height: 44, borderRadius: '50%',
              background: M.accentGradient, border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 12px ${M.accentGlow}`,
            }}
            aria-label="Add holding"
          >
            <Plus size={20} color="white" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* ── Risk profile null banner ── */}
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
            <div style={{ fontSize: 13, fontWeight: 500, color: M.text, fontFamily: FONT_BODY }}>
              Set your risk profile
            </div>
            <div style={{ fontSize: 11, color: M.textMuted, marginTop: 1 }}>
              Get tailored alignment targets for your portfolio
            </div>
          </div>
          <Link href="/profile" style={{
            fontSize: 12, fontWeight: 600, color: M.accentDeep,
            textDecoration: 'none', flexShrink: 0, fontFamily: FONT_BODY,
          }}>
            Set up →
          </Link>
        </div>
      )}

      {/* ── Empty state ── */}
      {snapshot && isEmpty ? (
        <ExposureEmptyState
          regime={regime}
          confidence={regimeConfidence}
          persistence={regimePersistence}
          mounted={mounted}
        />
      ) : (
        <>
          {/* ── PostureHero or skeleton ── */}
          {snapshot ? (
            <div style={{ marginBottom: 12 }}>
              <PostureHero
                score={score}
                label={label}
                regime={regime}
                hidden={hidden}
                profile={riskProfile ?? undefined}
              />
            </div>
          ) : (
            <div className="animate-pulse" style={{ ...card(), marginBottom: 16,  }}>
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

          {/* ── Allocation vs Target (S164) ── */}
          {snapshot ? (
            <div >
              <AllocationCard
                allocations={allocations}
                regime={regime}
                hidden={hidden}
              />
            </div>
          ) : (
            <div className="animate-pulse" style={{ ...card(), marginBottom: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ height: 12, borderRadius: 6, background: M.surfaceLight, width: '40%' }} />
                {[0, 1, 2, 3].map(i => (
                  <div key={i} style={{ height: 24, borderRadius: 6, background: M.surfaceLight }} />
                ))}
              </div>
            </div>
          )}

          {/* ── Holdings ── */}
          {snapshot && (
            <div >
              <Divider label={isMisaligned ? 'Most Exposed' : 'Holdings'} />
            </div>
          )}
          {snapshot ? (
            <div >
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
                isPro={isPro}
                enrichedHoldings={snapshot?.enriched_holdings ?? []}
                currentPrices={currentPrices}
                coinContext={coinContext}
                onEdit={(id) => setSheet({ type: 'edit', holdingId: id })}
              />
            </div>
          ) : (
            <div className="animate-pulse" style={{ ...card(), marginBottom: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ height: 12, borderRadius: 6, background: M.surfaceLight, width: '30%' }} />
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ height: 44, borderRadius: 8, background: M.surfaceLight }} />
                ))}
              </div>
            </div>
          )}

          {/* ── Analysis ── */}
          {snapshot && (
            <>
              <div >
                <Divider label="Analysis" />
              </div>
              <div >
                {isMisaligned ? (
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
                ) : score >= 60 ? (
                  <InsightCard
                    icon={Shield}
                    variant="positive"
                    text={`All categories within target bands. BTC at ${allocations[0]?.current}% anchors the portfolio with room to increase if confidence holds above 70%.`}
                  />
                ) : (
                  <InsightCard
                    icon={Shield}
                    variant="neutral"
                    text="Your allocation is moderately aligned. Some buckets are near the edge of their target bands."
                  />
                )}
              </div>
            </>
          )}

          {/* ── Pro CTA ── */}
          <div >
            <ProFeaturesCta />
          </div>

          {/* Footer */}
          <div style={{
            textAlign: 'center', padding: '12px 0 4px', fontSize: 10, color: M.textMuted, lineHeight: 1.5,
          }}>
            Exposure data reflects current holdings, not recommendations.
          </div>
        </>
      )}

      {/* ── Add Holding Sheet ── */}
      <AddHoldingSheet
        isOpen={sheet?.type === 'add'}
        assets={assets}
        heldSymbols={portfolioHoldings.map(h => h.asset)}
        onAdd={async (asset, quantity, costBasis) => {
          const ok = await addHolding({ asset, quantity, cost_basis: costBasis ?? null })
          if (ok) { refresh(); fetchSnapshot(); setSheet(null) }
          return ok
        }}
        onClose={() => setSheet(null)}
      />

      {/* ── Edit Holding Sheet ── */}
      {(() => {
        const h = sheet?.type === 'edit' ? portfolioHoldings.find(p => p.id === sheet.holdingId) : undefined
        if (!h) return null
        return (
          <EditHoldingSheet
            isOpen={true}
            holding={h}
            onUpdate={async (id, updates) => {
              const ok = await updateHolding(id, updates)
              if (ok) { refresh(); fetchSnapshot() }
              return ok
            }}
            onRemove={async (id) => {
              const ok = await removeHolding(id)
              if (ok) { refresh(); setSheet(null) }
              return ok
            }}
            onClose={() => setSheet(null)}
          />
        )
      })()}

    </div>
  )
}
