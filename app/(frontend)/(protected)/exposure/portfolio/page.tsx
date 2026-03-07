// v4.0.0 · S165/S166 · Sprint 35
// Changelog:
//   v4.0.0 — S165: Sparkline + Beta + PriceContext (Pro), PriceContextTeaser (Free)
//            S166: Full opacity on all holdings, "Not in posture" pill, remove weight %
//                  duplication, P&L on all, expand only on in-posture.
//            - AllocationCard reused from exposure (buildAllocations + component)
//            - isPro from profiles.tier (same pattern as Exposure v4)
//            - Total portfolio movement (free feature, not Pro-gated)
//            - MisalignmentFramingCard + ProgressiveDisclosure removed (v4 cleanup)
//            - Local CryptoIcon replaced by shared/CryptoIcon
//   v2.5.0 — S78: Shared helpers extracted
'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Pencil, Eye, EyeOff, Wallet, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react'
import { M } from '@/lib/meridian'
import { card, anim } from '@/lib/ui-helpers'
import { usePortfolio } from '@/hooks/usePortfolio'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { createClient } from '@/lib/supabase/client'
import CryptoIcon from '@/components/shared/CryptoIcon'
import GradientBar from '@/components/shared/GradientBar'
import AllocationCard, { buildAllocations } from '@/components/exposure/AllocationCard'
import AddHoldingSheet from '@/components/portfolio/AddHoldingSheet'
import EditHoldingSheet from '@/components/portfolio/EditHoldingSheet'
import PriceContext from '@/components/portfolio/PriceContext'
import PriceContextTeaser from '@/components/portfolio/PriceContextTeaser'
import { AnonPortfolioCTA } from '@/components/portfolio/AnonPortfolioCTA'
import type { PortfolioExposure, Holding } from '@/types'


// ── Fonts ─────────────────────────────────────────────────────────────────────
const FONT_DISPLAY = "'Outfit', sans-serif"
const FONT_BODY = "'DM Sans', sans-serif"
const FONT_MONO = "'DM Mono', monospace"
const FONT_NUM = "'DM Sans', sans-serif"
const NUM_FEATURES = "'tnum' 1, 'lnum' 1"


// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtUsd = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`

const qtyFmt = (n: number) => {
  if (n === 0) return '0'
  if (n < 0.0001) return n.toPrecision(2)
  if (n < 1) return n.toFixed(4)
  if (n < 100) return n.toFixed(2)
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

const maskUsd = (v: number, hidden: boolean) => hidden ? '$\u2022\u2022\u2022\u2022' : fmtUsd(v)
const maskQty = (q: number, hidden: boolean) => hidden ? '\u2022\u2022\u2022\u2022' : qtyFmt(q)
const maskPct = (p: number, hidden: boolean) => hidden ? '\u2022\u2022%' : fmtPct(p)


// ── Coin context types ────────────────────────────────────────────────────────

interface CoinContextData {
  sparkline: number[]
  beta: number
  high30d: number
  low30d: number
  change30d: number
}


// ── Sheet state ───────────────────────────────────────────────────────────────

type SheetState = { type: 'closed' } | { type: 'add' } | { type: 'edit'; holding: Holding }


// ── HoldingCard ───────────────────────────────────────────────────────────────

function HoldingCard({
  holding, price, name, iconUrl, hidden, isPro, coinContext, coinContextLoading, authChecked, onEdit,
}: {
  holding: Holding
  price: { usd_price: number; value_usd: number; weight: number } | null
  name: string
  iconUrl: string | null
  hidden: boolean
  isPro: boolean
  coinContext: CoinContextData | null
  coinContextLoading: boolean
  authChecked: boolean
  onEdit: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  const valueUsd = price ? price.usd_price * holding.quantity : null
  const inPosture = holding.include_in_exposure

  // P&L from cost basis (S166: show on ALL holdings)
  const baseline = holding.price_at_add ?? holding.cost_basis ?? null
  const currentPrice = price?.usd_price ?? null
  const hasPnl = baseline != null && currentPrice != null && baseline > 0
  const pctChange = hasPnl ? ((currentPrice! - baseline!) / baseline!) * 100 : 0
  const up = pctChange >= 0
  const addedDate = new Date(holding.created_at)
  const dateLbl = addedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  // Unrealized P&L values (for expanded section)
  const costBasis = baseline != null ? baseline * holding.quantity : 0
  const currentValue = valueUsd ?? 0
  const unrealizedPnl = currentValue - costBasis
  const unrealizedPct = costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : 0
  const unrealizedUp = unrealizedPnl >= 0

  return (
    <div style={{ ...card({ padding: 16, borderRadius: 20 }) }}>
      {/* Main row: icon | name+qty+change | value+edit */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <CryptoIcon symbol={holding.asset} size={36} iconUrl={iconUrl} />

        {/* Left: name + qty + P&L line */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: M.text }}>{name}</span>
            <span style={{
              fontSize: 10, color: M.textMuted,
              fontFamily: FONT_NUM, fontFeatureSettings: NUM_FEATURES,
            }}>
              {maskQty(holding.quantity, hidden)} {holding.asset}
            </span>
          </div>

          {/* P&L change line (S166: on ALL holdings) */}
          {hasPnl ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
              <span style={{
                fontSize: 11, fontWeight: 600,
                fontFamily: FONT_NUM, fontFeatureSettings: NUM_FEATURES,
                color: up ? M.positive : M.negative,
              }}>
                {maskPct(pctChange, hidden)}
              </span>
              <span style={{ fontSize: 9, color: M.textMuted }}>
                since {hidden ? '\u2022\u2022\u2022' : dateLbl}
              </span>
              {/* S166: "Not in posture" pill on non-posture holdings */}
              {!inPosture && (
                <span style={{
                  fontSize: 8, color: M.textMuted, background: M.surfaceLight,
                  padding: '1px 6px', borderRadius: 4, fontWeight: 500,
                }}>
                  Not in posture
                </span>
              )}
            </div>
          ) : (
            !inPosture && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <span style={{
                  fontSize: 8, color: M.textMuted, background: M.surfaceLight,
                  padding: '1px 6px', borderRadius: 4, fontWeight: 500,
                }}>
                  Not in posture
                </span>
              </div>
            )
          )}
        </div>

        {/* Right: value + edit button (S166: no weight % line) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {valueUsd !== null && (
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: M.text,
                fontFamily: FONT_NUM, fontFeatureSettings: NUM_FEATURES,
              }}>
                {maskUsd(valueUsd, hidden)}
              </div>
            </div>
          )}
          <button
            onClick={onEdit}
            style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(255,255,255,0.5)',
              border: `1px solid ${M.border}`,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Pencil size={12} color={M.textSecondary} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Posture contribution bar — only for in-posture holdings */}
      {inPosture && price && price.weight > 0 && (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 9, color: M.textMuted, whiteSpace: 'nowrap' }}>Posture</span>
          <GradientBar pct={hidden ? 0 : Math.min(Math.round(price.weight * 100) * 2.5, 100)} h={4} />
          <span style={{
            fontSize: 10, fontWeight: 600, color: M.text, whiteSpace: 'nowrap',
            fontFamily: FONT_NUM, fontFeatureSettings: NUM_FEATURES,
          }}>
            {hidden ? '\u2022\u2022%' : `${Math.round(price.weight * 100)}%`}
          </span>
        </div>
      )}

      {/* Pro: Price Context (sparkline + beta + range) */}
      {!authChecked ? null : isPro && coinContext ? (
        <div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 10, marginBottom: 0,
          }}>
            <span style={{
              fontSize: 9, color: M.textMuted, textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              Price context
            </span>
            {/* P&L expand button — only on in-posture holdings (S166) */}
            {inPosture && hasPnl && (
              <button
                onClick={() => setExpanded(!expanded)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  display: 'flex', alignItems: 'center', gap: 2,
                  fontSize: 9, color: M.accent, fontWeight: 600, fontFamily: FONT_BODY,
                }}
              >
                {expanded ? 'Less' : 'P&L'}
                {expanded
                  ? <ChevronUp size={10} color={M.accent} />
                  : <ChevronDown size={10} color={M.accent} />
                }
              </button>
            )}
          </div>
          <PriceContext
            sparkline={coinContext.sparkline}
            beta={coinContext.beta}
            high30d={coinContext.high30d}
            low30d={coinContext.low30d}
            current={price?.usd_price ?? 0}
            change30d={coinContext.change30d}
            hidden={hidden}
          />
        </div>
      ) : !isPro ? (
        <PriceContextTeaser />
      ) : coinContextLoading ? (
        <div style={{
          marginTop: 10, padding: '10px 12px', borderRadius: 12,
          background: 'rgba(255,255,255,0.4)', border: `1px solid ${M.border}`,
        }}>
          <div className="animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ height: 10, width: 60, borderRadius: 4, background: M.surfaceLight }} />
              <div style={{ height: 10, width: 80, borderRadius: 4, background: M.surfaceLight }} />
            </div>
            <div style={{ height: 36, borderRadius: 6, background: M.surfaceLight }} />
            <div style={{ height: 4, borderRadius: 4, background: M.surfaceLight }} />
          </div>
        </div>
      ) : null}

      {/* Expanded P&L detail (Pro + in-posture only) */}
      {inPosture && isPro && expanded && hasPnl && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', gap: 12, padding: '6px 0' }}>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 9, color: M.textMuted, textTransform: 'uppercase',
                letterSpacing: 0.5, marginBottom: 2,
              }}>
                Cost basis
              </div>
              <div style={{
                fontSize: 12, fontFamily: FONT_NUM, fontFeatureSettings: NUM_FEATURES,
                color: M.textSecondary,
              }}>
                {maskUsd(costBasis, hidden)}
              </div>
            </div>
            <div style={{ width: 1, background: M.borderSubtle }} />
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 9, color: M.textMuted, textTransform: 'uppercase',
                letterSpacing: 0.5, marginBottom: 2,
              }}>
                Current
              </div>
              <div style={{
                fontSize: 12, fontFamily: FONT_NUM, fontFeatureSettings: NUM_FEATURES,
                color: M.text,
              }}>
                {maskUsd(currentValue, hidden)}
              </div>
            </div>
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 0', borderTop: `1px solid ${M.borderSubtle}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 20, height: 20, borderRadius: 6,
                background: unrealizedUp ? M.positiveDim : M.negativeDim,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {unrealizedUp
                  ? <TrendingUp size={10} color={M.positive} />
                  : <TrendingDown size={10} color={M.negative} />
                }
              </div>
              <span style={{ fontSize: 10, color: M.textMuted }}>Unrealized P&L</span>
            </div>
            {hidden ? (
              <span style={{ fontSize: 12, fontWeight: 600, color: M.textMuted }}>$\u2022\u2022\u2022\u2022</span>
            ) : (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  fontFamily: FONT_NUM, fontFeatureSettings: NUM_FEATURES,
                  color: unrealizedUp ? M.positive : M.negative,
                }}>
                  {unrealizedUp ? '+' : ''}{fmtUsd(unrealizedPnl)}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 600,
                  fontFamily: FONT_NUM, fontFeatureSettings: NUM_FEATURES,
                  color: unrealizedUp ? M.positive : M.negative,
                  opacity: 0.7,
                }}>
                  {fmtPct(unrealizedPct)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


// ── Total Movement Card (free) / P&L Summary (Pro) ───────────────────────────

function TotalMovementCard({
  holdings, priceLookup, hidden, isPro,
}: {
  holdings: Holding[]
  priceLookup: Record<string, { usd_price: number; value_usd: number; weight: number }>
  hidden: boolean
  isPro: boolean
}) {
  let totalCost = 0
  let totalCurrent = 0
  let hasCostBasis = false

  for (const h of holdings) {
    const price = priceLookup[h.asset]
    if (!price) continue
    const baseline = h.price_at_add ?? h.cost_basis ?? null
    if (baseline == null) continue
    hasCostBasis = true
    totalCost += baseline * h.quantity
    totalCurrent += price.usd_price * h.quantity
  }

  if (!hasCostBasis || totalCost === 0) return null

  const change = totalCurrent - totalCost
  const changePct = (change / totalCost) * 100
  const up = change >= 0

  return (
    <div style={{
      ...card({
        padding: 16,
        background: `linear-gradient(135deg, ${up ? M.positiveDim : M.negativeDim}, rgba(255,255,255,0.3))`,
        border: `1px solid ${up ? M.borderPositive : 'rgba(231,111,81,0.2)'}`,
      }),
      marginBottom: 14,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: up ? M.positiveDim : M.negativeDim,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {up
              ? <TrendingUp size={15} color={M.positive} />
              : <TrendingDown size={15} color={M.negative} />
            }
          </div>
          <div>
            <div style={{
              fontSize: 10, color: M.textMuted, textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              {isPro ? 'Unrealized P&L' : 'Total movement'}
            </div>
            <div style={{
              fontSize: 16, fontWeight: 600,
              fontFamily: FONT_NUM, fontFeatureSettings: NUM_FEATURES,
              color: up ? M.positive : M.negative,
            }}>
              {hidden ? '$\u2022\u2022\u2022\u2022' : `${up ? '+' : ''}${fmtUsd(change)}`}
            </div>
          </div>
        </div>
        <div style={{
          padding: '4px 10px', borderRadius: 10,
          background: up ? M.positiveDim : M.negativeDim,
        }}>
          <span style={{
            fontSize: 12, fontWeight: 600,
            fontFamily: FONT_NUM, fontFeatureSettings: NUM_FEATURES,
            color: up ? M.positive : M.negative,
          }}>
            {maskPct(changePct, hidden)}
          </span>
        </div>
      </div>

      {/* Pro: cost basis + current value breakdown */}
      {isPro && (
        <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
          <div>
            <div style={{
              fontSize: 9, color: M.textMuted, textTransform: 'uppercase',
              letterSpacing: 0.5, marginBottom: 2,
            }}>
              Total cost
            </div>
            <span style={{
              fontSize: 12, fontFamily: FONT_NUM, fontFeatureSettings: NUM_FEATURES,
              color: M.textSecondary,
            }}>
              {hidden ? '$\u2022\u2022\u2022\u2022' : fmtUsd(totalCost)}
            </span>
          </div>
          <div>
            <div style={{
              fontSize: 9, color: M.textMuted, textTransform: 'uppercase',
              letterSpacing: 0.5, marginBottom: 2,
            }}>
              Current value
            </div>
            <span style={{
              fontSize: 12, fontFamily: FONT_NUM, fontFeatureSettings: NUM_FEATURES,
              color: M.text,
            }}>
              {hidden ? '$\u2022\u2022\u2022\u2022' : fmtUsd(totalCurrent)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function PortfolioPage() {
  const [isAnon, setIsAnon] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [snapshot, setSnapshot] = useState<PortfolioExposure | null>(null)
  const [snapshotLoading, setSnapshotLoading] = useState(true)
  const [snapshotError, setSnapshotError] = useState(false)
  const [sheet, setSheet] = useState<SheetState>({ type: 'closed' })
  const [mounted, setMounted] = useState(false)
  const [isPro, setIsPro] = useState(false)
  const [regime, setRegime] = useState<string>('range')
  const [coinContextMap, setCoinContextMap] = useState<Record<string, CoinContextData>>({})
  const [coinContextLoading, setCoinContextLoading] = useState(true)

  const { holdings, assets, isLoading: holdingsLoading, addHolding, updateHolding, removeHolding } =
    usePortfolio()
  const { hidden, toggleHidden } = usePrivacy()

  // ── Stable key for coin-context dependency ──
  const heldSymbols = useMemo(() => holdings.map(h => h.asset), [holdings])
  const heldSymbolsKey = heldSymbols.join(',')

  // ── Snapshot fetch ──
  const fetchSnapshot = async () => {
    try {
      const res = await fetch('/api/portfolio-snapshot')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setSnapshot(json.exposure ?? json)
    } catch (err) {
      console.error('[PortfolioPage] snapshot error:', err)
      setSnapshotError(true)
    } finally {
      setSnapshotLoading(false)
    }
  }

  // ── Coin context fetch helper ──
  const fetchCoinContext = (symbols: string) => {
    if (!symbols) return
    setCoinContextLoading(true)
    fetch(`/api/coin-context?symbols=${symbols}`)
      .then(r => r.ok ? r.json() : null)
      .then((data: Record<string, CoinContextData> | null) => {
        if (data) setCoinContextMap(prev => ({ ...prev, ...data }))
        setCoinContextLoading(false)
      })
      .catch(() => { setCoinContextLoading(false) })
  }

  // ── Auth + tier check (same pattern as Exposure v4) ──
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100)

    ;(async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        setIsAnon(!user)
        setAuthChecked(true)
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('tier')
            .eq('id', user.id)
            .maybeSingle()
          setIsPro(profile?.tier === 'pro')
        }
      } catch {
        setAuthChecked(true)
      }
    })()

    return () => clearTimeout(t)
  }, [])

  // ── Snapshot on auth ──
  useEffect(() => {
    if (!isAnon) fetchSnapshot()
    else setSnapshotLoading(false)
  }, [isAnon])

  // ── Regime fetch (for AllocationCard) ──
  useEffect(() => {
    fetch('/api/market')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.regime?.current) setRegime(d.regime.current) })
      .catch(() => {})
  }, [])

  // ── Coin context fetch (Pro feature — sparkline + beta) ──
  useEffect(() => {
    if (!heldSymbolsKey || isAnon) { setCoinContextLoading(false); return }
    fetchCoinContext(heldSymbolsKey)
  }, [heldSymbolsKey, isAnon])

  // ── Price lookup from snapshot ──
  const priceLookup = useMemo(() => {
    const map: Record<string, { usd_price: number; value_usd: number; weight: number }> = {}
    if (!snapshot || snapshot.isEmpty) return map
    const cp = (snapshot as any).current_prices as Record<string, number> ?? {}
    const totalValue = snapshot.total_value_usd_all ?? 0
    for (const h of holdings) {
      const price = cp[h.asset]
      if (price == null) continue
      const valueUsd = price * h.quantity
      map[h.asset] = {
        usd_price: price,
        value_usd: valueUsd,
        weight: totalValue > 0 ? valueUsd / totalValue : 0,
      }
    }
    return map
  }, [snapshot, holdings])

  // ── CRUD handlers ──
  const handleAdd = async (asset: string, quantity: number, costBasis?: number | null) => {
    const ok = await addHolding({ asset, quantity, cost_basis: costBasis })
    if (ok) { fetchSnapshot(); fetchCoinContext(asset) }
    return ok
  }
  const handleUpdate = async (id: string, updates: any) => {
    const ok = await updateHolding(id, updates)
    if (ok) { fetchSnapshot(); fetchCoinContext(heldSymbolsKey) }
    return ok
  }
  const handleRemove = async (id: string) => {
    const ok = await removeHolding(id)
    if (ok) { fetchSnapshot(); fetchCoinContext(heldSymbolsKey) }
    return ok
  }

  // ── Derived state ──
  const loading = snapshotLoading || holdingsLoading || !authChecked || (isPro && coinContextLoading)
  const isEmpty = holdings.length === 0
  const hasSnapshot = snapshot && !snapshot.isEmpty && (snapshot.total_value_usd_all ?? 0) > 0
  const totalValue = snapshot?.total_value_usd_all || 0

  // ── Allocation (reused from Exposure) ──
  const btcWeight = snapshot?.btc_weight_all ?? 0
  const ethWeight = snapshot?.eth_weight_all ?? 0
  const altWeight = snapshot?.alt_weight_all ?? 0
  const stableWeight = Math.max(0, 1 - btcWeight - ethWeight - altWeight)
  const allocations = buildAllocations(btcWeight, ethWeight, altWeight, stableWeight)

  // ── Early returns ──

  if (authChecked && isAnon) {
    return <AnonPortfolioCTA />
  }

  if (snapshotError && !holdingsLoading) {
    return (
      <div style={{ padding: '24px 20px', textAlign: 'center' }}>
        <div style={{ padding: '48px 20px' }}>
          <p style={{ fontSize: 14, color: M.textSecondary, margin: '0 0 4px' }}>
            Couldn&apos;t load portfolio data
          </p>
          <p style={{ fontSize: 12, color: M.textMuted, margin: '0 0 14px' }}>
            Your holdings are safe — we just can&apos;t reach the server right now
          </p>
          <button
            onClick={() => { setSnapshotError(false); setSnapshotLoading(true); fetchSnapshot() }}
            style={{
              background: M.surface, border: `1px solid ${M.border}`, borderRadius: 12,
              padding: '8px 16px', fontSize: 12, color: M.text, cursor: 'pointer',
              fontFamily: FONT_BODY,
            }}
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="animate-pulse"
            style={{ background: M.surfaceLight, height: i === 1 ? 160 : 120, borderRadius: 24 }}
          />
        ))}
      </div>
    )
  }

  // ── Sheet overlay ──
  if (sheet.type !== 'closed') {
    return (
      <div style={{ minHeight: '100vh' }}>
        {sheet.type === 'add' && (
          <AddHoldingSheet
            assets={assets}
            heldSymbols={heldSymbols}
            onAdd={handleAdd}
            onClose={() => setSheet({ type: 'closed' })}
          />
        )}
        {sheet.type === 'edit' && (
          <EditHoldingSheet
            holding={sheet.holding}
            onUpdate={handleUpdate}
            onRemove={handleRemove}
            onClose={() => setSheet({ type: 'closed' })}
          />
        )}
      </div>
    )
  }

  // ── Empty state ──
  if (isEmpty) {
    return (
      <div style={{ padding: '24px 20px' }}>
        <div style={{ marginBottom: 28, ...anim(mounted, 0) }}>
          <h1 style={{
            fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 500, color: M.text,
            margin: '0 0 2px',
          }}>
            Your portfolio
          </h1>
          <p style={{ fontSize: 12, color: M.textSecondary, margin: 0 }}>
            Tell Meridian what you hold
          </p>
        </div>
        <div style={{
          ...card({
            background: `linear-gradient(135deg, ${M.accentDim}, ${M.accentGlow})`,
            border: `1px solid ${M.borderAccent}`,
          }),
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          textAlign: 'center', padding: '48px 24px',
          ...anim(mounted, 1),
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: `linear-gradient(135deg, ${M.accentDim}, ${M.accentMuted})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 20,
          }}>
            <Wallet size={28} color={M.accentDeep} strokeWidth={2} />
          </div>
          <p style={{ fontSize: 16, fontWeight: 500, color: M.text, margin: '0 0 8px' }}>
            Add your first holding
          </p>
          <p style={{
            fontSize: 14, color: M.textSecondary, lineHeight: 1.6,
            margin: '0 0 24px', maxWidth: 280,
          }}>
            Once Meridian knows what you hold, it can show how your portfolio aligns
            with current market conditions.
          </p>
          <button
            onClick={() => setSheet({ type: 'add' })}
            style={{
              background: M.accentGradient, color: 'white', padding: '14px 32px',
              borderRadius: 20, border: 'none', fontSize: 16, fontWeight: 500,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: `0 4px 16px ${M.accentGlow}`,
            }}
          >
            <Plus size={20} color="white" strokeWidth={2.5} /> Add a coin
          </button>
        </div>
      </div>
    )
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN PORTFOLIO VIEW
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div style={{ minHeight: '100vh', background: M.bg, padding: '24px 20px 100px' }}>

      {/* ── Header ── */}
      <div style={{
        ...anim(mounted, 0),
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 16,
      }}>
        <div>
          <h1 style={{
            fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 500, color: M.text,
            margin: '0 0 2px',
          }}>
            Your portfolio
          </h1>
          <p style={{ fontSize: 12, color: M.textSecondary, margin: 0 }}>
            <span style={{ fontFamily: FONT_NUM, fontFeatureSettings: NUM_FEATURES }}>
              {holdings.length}
            </span>
            {' '}holding{holdings.length !== 1 ? 's' : ''}
            {hasSnapshot && (
              <>
                {' · '}
                <span style={{ fontFamily: FONT_NUM, fontFeatureSettings: NUM_FEATURES }}>
                  {maskUsd(totalValue, hidden)}
                </span>
              </>
            )}
            {isPro && (
              <span style={{
                marginLeft: 8, fontSize: 9, fontWeight: 700, color: M.accent,
                background: M.accentDim, padding: '2px 6px', borderRadius: 6,
                verticalAlign: 'middle',
              }}>
                PRO
              </span>
            )}
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
              : <Eye size={16} color={M.textSecondary} strokeWidth={2} />
            }
          </button>
          <button
            onClick={() => setSheet({ type: 'add' })}
            style={{
              width: 44, height: 44, borderRadius: '50%',
              background: M.accentGradient, border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 12px ${M.accentGlow}`,
            }}
          >
            <Plus size={20} color="white" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* ── Allocation Card (shared with Exposure) ── */}
      {hasSnapshot && allocations.length > 0 && (
        <div style={anim(mounted, 1)}>
          <AllocationCard allocations={allocations} regime={regime} hidden={hidden} />
        </div>
      )}

      {/* ── Total Movement (free feature) ── */}
      <div style={anim(mounted, 2)}>
        <TotalMovementCard holdings={holdings} priceLookup={priceLookup} hidden={hidden} isPro={isPro} />
      </div>

      {/* ── No snapshot notice ── */}
      {!hasSnapshot && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 14px', borderRadius: 16,
          background: M.accentMuted, marginBottom: 12,
          ...anim(mounted, 2),
        }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: M.accent }}>
            Exposure data will update on next analysis cycle
          </span>
        </div>
      )}

      {/* ── Holdings heading ── */}
      <div style={{
        ...anim(mounted, 3),
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        margin: '0 0 10px',
      }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 600, color: M.text }}>
          Holdings
        </h2>
        {isPro && (
          <span style={{ fontSize: 10, color: M.textMuted }}>Tap P&L for cost basis</span>
        )}
      </div>

      {/* ── Holdings list ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {holdings.map((h, i) => {
          const price = priceLookup[h.asset] ?? null
          const name = h.asset_mapping?.name || h.asset
          const iconUrl = h.asset_mapping?.icon_url || null
          const coinCtx = coinContextMap[h.asset] ?? null

          return (
            <div key={h.id} style={anim(mounted, 4 + i)}>
              <HoldingCard
                holding={h}
                price={price}
                name={name}
                iconUrl={iconUrl}
                hidden={hidden}
                isPro={isPro}
                coinContext={coinCtx}
                coinContextLoading={coinContextLoading}
                authChecked={authChecked}
                onEdit={() => setSheet({ type: 'edit', holding: h })}
              />
            </div>
          )
        })}
      </div>

      {/* ── Footer ── */}
      <div style={{
        ...anim(mounted, 10),
        textAlign: 'center', padding: '16px 0 4px',
        fontSize: 10, color: M.textMuted, lineHeight: 1.5,
      }}>
        {isPro
          ? 'P&L reflects unrealized gains. Not financial advice.'
          : 'Holdings data, not recommendations.'
        }
      </div>
    </div>
  )
}
