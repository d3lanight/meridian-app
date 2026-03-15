// ━━━ Exposure Page ━━━
// v4.4.0 · bug fix — remove Shield InsightCards, ProFeaturesCta; move MessageFeed to Signals & Context
// v4.3.0 · Sprint 46 — S229: MessageFeed strip below AllocationCard (exposure screen, unread only).
// v4.2.0 · Sprint 42 — S209: Replace per-page getUser()+pref fetch with useUser() context.
// Changelog:
//   v4.4.0 — Remove Shield InsightCards ("Your allocation..." / "All categories...") — no real data behind them.
//             Keep Zap/TrendingUp warning InsightCards for misaligned state.
//             Rename Analysis divider → Signals & Context.
//             Move MessageFeed strip into Signals & Context section (was between AllocationCard and Holdings).
//             Remove ProFeaturesCta (Exposure Pro card) — empty, no content yet.
//             Remove ProFeaturesCta import.
//   v4.3.0 — S229: MessageFeed strip below AllocationCard (exposure screen, unread only).
//   v4.2.0 — S209: Replace per-page getUser()+pref fetch with useUser() context.
//   v4.1.0 — S195-fix: initPage extracted + visibilitychange listener added.
//             Exposure now re-reads regime_display_window when user returns from Profile.
//   v4.0.0 — S194: Resolve regimeWindow before fetching snapshot.
//   v3.9.0 — S188: Reads regime_display_window from user_preferences KV.
//   v3.8.0 — S-fix-exposure: Multiple regression fixes.
//   v3.7.0 — S189f: Weights + score derived from enriched_holdings directly.
//   v3.6.0 — S189: Optimistic snapshot patch after edit.
//   v3.5.0 — S178: fetchSnapshot() added to onRemove handler.
//   v3.4.0 — S177: Replace inline sheet wrappers with shared BottomSheet component.
//   v3.3.0 — S169: fetchSnapshot extracted; onAdd triggers refetch.
//   v3.2.0 — S173: + button → AddHoldingSheet; Edit holding wired.
//   v3.0.0 — S163/S164: Full v4 redesign.
'use client'

import { useState, useEffect } from 'react'
import { Shield, Zap, Plus, BookOpen, Eye, EyeOff } from 'lucide-react'
import { getTargetBands } from '@/lib/risk-profiles'
import { getRegimeConfig } from '@/lib/regime-utils'
import type { RegimeRow } from '@/lib/regime-utils'
import { M } from '@/lib/meridian'
import { card, anim } from '@/lib/ui-helpers'
import PostureHero from '@/components/exposure/PostureHero'
import AllocationCard, { buildAllocations } from '@/components/exposure/AllocationCard'
import { MessageFeed } from '@/components/shared'
import HoldingsSection from '@/components/exposure/HoldingsSection'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { useUser } from '@/contexts/UserContext'
import { usePortfolio } from '@/hooks/usePortfolio'
import InsightCard from '@/components/exposure/InsightCard'
import AddHoldingSheet from '@/components/portfolio/AddHoldingSheet'
import EditHoldingSheet from '@/components/portfolio/EditHoldingSheet'
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
  regime_window?:      number
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
  onAddHolding,
}: {
  regime: string
  confidence: number
  persistence: number
  mounted: boolean
  onAddHolding: () => void
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
      <div>
        <InsightCard
          icon={BookOpen}
          variant="neutral"
          text="Target allocations shift with the market regime. Add your holdings to see how your portfolio aligns."
          subtext="These are model suggestions, not financial advice."
        />
      </div>

      {/* CTA */}
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <button
          onClick={onAddHolding}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px',
            background: M.accentGradient, borderRadius: 20, boxShadow: `0 4px 16px ${M.accentGlow}`,
            border: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 600, color: 'white', fontFamily: FONT_BODY,
          }}
        >
          <Plus size={16} color="white" strokeWidth={2.5} />
          Add your first holding
        </button>
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
  const [regimeWindow, setRegimeWindow] = useState<number>(30)

  const { isPro, isAnon, regimeWindow: ctxRegimeWindow, loading: userLoading } = useUser()
  const [sheet, setSheet]       = useState<{ type: 'add' } | { type: 'edit'; holdingId: string } | null>(null)
  const [currentPrices, setCurrentPrices] = useState<Record<string, { price: number; change_24h: number }>>({})
  const [coinContext, setCoinContext]      = useState<Record<string, { sparkline?: number[]; high30d?: number; low30d?: number; change30d?: number; beta?: number }>>({})
  const { hidden, toggleHidden } = usePrivacy()
  const { holdings: portfolioHoldings, assets, addHolding, updateHolding, removeHolding, refresh } = usePortfolio()


  const fetchSnapshot = (window: number = 30) => {
    fetch(`/api/portfolio-snapshot?window=${window}`)
      .then(r => r.ok ? r.json() : null)
      .then((data: SnapshotWithPosture | null) => { if (data) setSnapshot(data) })
      .catch(() => {})
  }

  const fetchCoinContext = () => {
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
  }

  const patchSnapshotHolding = (
    assetSymbol: string,
    updates: { quantity?: number; cost_basis?: number | null; include_in_exposure?: boolean }
  ) => {
    setSnapshot(prev => {
      if (!prev?.enriched_holdings) return prev
      const holdings = prev.enriched_holdings.map((h: any) => {
        if (h.asset !== assetSymbol) return h
        const newQty   = updates.quantity ?? h.quantity
        const newPrice = h.price_usd ?? 0
        const newValue = newPrice * newQty
        const newPriceAtAdd = h.price_at_add
        const newUsdDelta = newPriceAtAdd != null ? (newPrice - newPriceAtAdd) * newQty : null
        return {
          ...h,
          quantity:            newQty,
          value_usd:           newValue,
          usd_delta:           newUsdDelta,
          include_in_exposure: updates.include_in_exposure ?? h.include_in_exposure,
          cost_basis:          'cost_basis' in updates ? updates.cost_basis : h.cost_basis,
        }
      })
      return { ...prev, enriched_holdings: holdings }
    })
  }

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100)

    const initPage = async () => {
      if (userLoading) return
      try {
        const resolvedWindow = ctxRegimeWindow
        setRegimeWindow(resolvedWindow)
        fetchSnapshot(resolvedWindow)

        fetch(`/api/market-context?days=${resolvedWindow}&window=${resolvedWindow}`)
          .then(r => r.ok ? r.json() : null)
          .then((data: any) => {
            const regimes = data?.regimes || []
            if (regimes.length > 0) {
              setRegime(regimes[0].regime || 'range')
              setRegimeConfidence(Math.round((regimes[0].confidence || 0) * 100))
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
      } catch {}
    }

    initPage()
    fetchCoinContext()

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') initPage()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearTimeout(t)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [userLoading, ctxRegimeWindow])

  const holdingCount  = snapshot?.enriched_holdings?.length ?? snapshot?.holdings_count ?? 0

  const holdingIdMap: Record<string, string> = {}
  for (const h of portfolioHoldings) {
    if (h?.asset) holdingIdMap[h.asset.toUpperCase()] = h.id
  }

  const isEmpty       = snapshot?.isEmpty === true
  const targetBands  = snapshot?.target_bands ?? null
  const riskProfile    = snapshot?.risk_profile ?? null
  const btcIconUrl     = snapshot?.btc_icon_url ?? null
  const ethIconUrl     = snapshot?.eth_icon_url ?? null
  const altBreakdown   = snapshot?.alt_breakdown ?? []

  const enrichedHoldings = snapshot?.enriched_holdings ?? []
  const inPostureHoldings = enrichedHoldings.filter((h: any) => h.include_in_exposure !== false)
  const postureTotal = inPostureHoldings.reduce((s: number, h: any) => s + (h.value_usd ?? 0), 0)
  const totalValueAll = enrichedHoldings.reduce((s: number, h: any) => s + (h.value_usd ?? 0), 0)

  let btcWeight = 0, ethWeight = 0, altWeight = 0, stableWeight = 0
  let btcValueUsd = 0, ethValueUsd = 0, altValueUsd = 0
  if (postureTotal > 0) {
    for (const h of inPostureHoldings as any[]) {
      const sym = (h.asset ?? '') as string
      const cat = h.category ?? 'alt'
      const v = h.value_usd ?? 0
      const w = v / postureTotal
      if (sym === 'BTC')          { btcWeight    += w; btcValueUsd    += v }
      else if (sym === 'ETH')     { ethWeight    += w; ethValueUsd    += v }
      else if (cat === 'stable')  { stableWeight += w                      }
      else                        { altWeight    += w; altValueUsd    += v }
    }
  }

  const score = (() => {
    if (!targetBands || postureTotal === 0) return snapshot?.risk_score ?? 0
    const buckets = [
      { actual: btcWeight * 100,    min: targetBands.btc[0],    max: targetBands.btc[1] },
      { actual: ethWeight * 100,    min: targetBands.eth[0],    max: targetBands.eth[1] },
      { actual: altWeight * 100,    min: targetBands.alt[0],    max: targetBands.alt[1] },
      { actual: stableWeight * 100, min: targetBands.stable[0], max: targetBands.stable[1] },
    ].filter(b => b.actual > 0)
    if (!buckets.length) return snapshot?.risk_score ?? 0
    let totalRelDev = 0
    for (const b of buckets) {
      const overshoot = b.actual < b.min ? b.min - b.actual : b.actual > b.max ? b.actual - b.max : 0
      const bandWidth = b.max - b.min
      totalRelDev += bandWidth > 0 ? Math.min(1, overshoot / (bandWidth * 2)) : 0
    }
    return Math.round(Math.max(0, Math.min(100, (1 - totalRelDev / buckets.length) * 100)))
  })()

  const label         = scoreToLabel(score)
  const isMisaligned  = score < 40

  const totalPnlUsd: number | null = (() => {
    const holdings = snapshot?.enriched_holdings ?? []
    const deltas = holdings.map((h: any) => h.usd_delta).filter((d: any) => d != null)
    return deltas.length > 0 ? deltas.reduce((s: number, d: number) => s + d, 0) : null
  })()

  const allocations = buildAllocations(btcWeight, ethWeight, altWeight, stableWeight)

  return (
    <div style={{
      minHeight: '100vh',
      background: M.bg,
      padding: '24px 20px 100px',
    }}>

      {/* ── Header ── */}
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
          <p style={{ fontSize: 12, color: M.textSecondary, margin: 0, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const }}>
            {snapshot && !isEmpty
              ? <>
                  <span>{holdingCount} holding{holdingCount !== 1 ? 's' : ''} · {hidden ? '$••••' : formatUsd(totalValueAll)}</span>
                  {!hidden && totalPnlUsd != null && (
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: totalPnlUsd >= 0 ? M.accent : M.volatility,
                      background: totalPnlUsd >= 0 ? M.accentMuted : M.volatilityDim,
                      padding: '1px 7px',
                      borderRadius: 6,
                      fontFamily: FONT_BODY,
                      letterSpacing: '0.01em',
                    }}>
                      {totalPnlUsd >= 0 ? '+' : ''}{formatUsd(totalPnlUsd)}
                    </span>
                  )}
                </>
              : null
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
          onAddHolding={() => setSheet({ type: 'add' })}
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
            <div className="animate-pulse" style={{ ...card(), marginBottom: 16 }}>
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

          {/* ── Allocation vs Target ── */}
          {snapshot ? (
            <div>
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
            <div>
              <Divider label={isMisaligned ? 'Most Exposed' : 'Holdings'} />
            </div>
          )}
          {snapshot ? (
            <div>
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
                enrichedHoldings={enrichedHoldings}
                currentPrices={currentPrices}
                coinContext={coinContext}
                holdingIdMap={holdingIdMap}
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

          {/* ── Signals & Context ── */}
          {snapshot && (
            <>
              <div>
                <Divider label="Signals & Context" />
              </div>
              <div>
                {/* Misalignment warnings — only shown when portfolio is off-target */}
                {isMisaligned && (
                  <>
                    <InsightCard
                      icon={Zap}
                      variant="warning"
                      text="Concentration detected — one or more buckets are significantly outside target bands, which amplifies exposure to regime shifts."
                      subtext="Analytical context, not a rebalancing signal."
                    />
                  </>
                )}
              </div>

              {/* Message strip — unread exposure messages, hidden when empty */}
              {!isAnon && (
                <div style={{ paddingLeft: 10 }}>
                  <MessageFeed
                    screen="exposure"
                    limit={3}
                    showHeader={false}
                    unreadOnly
                    hideWhenEmpty
                    onMessageRead={() => {}}
                  />
                </div>
              )}
            </>
          )}

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
          if (ok) {
            await refresh()
            fetchSnapshot(regimeWindow)
            fetchCoinContext()
            setSheet(null)
          }
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
              patchSnapshotHolding(h.asset, updates)
              const ok = await updateHolding(id, updates)
              if (ok) { refresh(); fetchSnapshot(regimeWindow) }
              return ok
            }}
            onRemove={async (id) => {
              const ok = await removeHolding(id)
              if (ok) {
                await refresh()
                fetchSnapshot(regimeWindow)
                fetchCoinContext()
                setSheet(null)
              }
              return ok
            }}
            onClose={() => setSheet(null)}
          />
        )
      })()}

    </div>
  )
}
