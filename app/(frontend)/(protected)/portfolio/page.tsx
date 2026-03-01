// v2.5.0 · ca-story78 · Sprint 19
// S78: Shared helpers extracted to lib/ui-helpers + components/shared/
'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Pencil, Wallet, Eye, EyeOff } from 'lucide-react'
import { M } from '@/lib/meridian'
import { usePortfolio } from '@/hooks/usePortfolio'
import AddHoldingSheet from '@/components/portfolio/AddHoldingSheet'
import EditHoldingSheet from '@/components/portfolio/EditHoldingSheet'
import MisalignmentFramingCard from '@/components/portfolio/MisalignmentFramingCard'
import type { PortfolioExposure, Holding } from '@/types'
import ProgressiveDisclosure, { DisclosureGroup } from "@/components/education/ProgressiveDisclosure"
import { card, anim } from '@/lib/ui-helpers'
import GradientBar from '@/components/shared/GradientBar'
import { usePrivacy } from '@/contexts/PrivacyContext'

// ── Helpers ───────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  })
const pctFmt = (n: number) => `${(n * 100).toFixed(1)}%`
const qtyFmt = (n: number) => {
  if (n === 0) return '0'
  if (n < 0.0001) return n.toPrecision(2)
  if (n < 1) return n.toFixed(4)
  if (n < 100) return n.toFixed(2)
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function getSegKey(symbol: string): 'BTC' | 'ETH' | 'ALT' {
  if (symbol === 'BTC') return 'BTC'
  if (symbol === 'ETH') return 'ETH'
  return 'ALT'
}

// ── Crypto Icon (branded gradients from artifact) ──

function CryptoIcon({ symbol, size = 48, iconUrl }: { symbol: string; size?: number; iconUrl?: string | null }) {
  const segColors: Record<string, string> = {
    BTC: '#F7931A', ETH: '#627EEA', SOL: '#9945FF', ADA: '#0033AD',
    DOT: '#E6007A', RUNE: '#33FF99', DOGE: '#C3A634',
  }
  const color = segColors[symbol] || '#A78BFA'

  if (iconUrl) {
    return (
      <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
        <img
          src={iconUrl}
          alt={symbol}
          width={size}
          height={size}
          style={{ borderRadius: '50%', background: M.surfaceLight, display: 'block' }}
          onError={(e) => {
            e.currentTarget.style.display = 'none'
            const fb = e.currentTarget.nextElementSibling as HTMLElement
            if (fb) fb.style.display = 'flex'
          }}
        />
        <div
          style={{
            width: size, height: size, background: `${color}20`, borderRadius: '50%',
            display: 'none', alignItems: 'center', justifyContent: 'center',
            position: 'absolute', top: 0, left: 0,
          }}
        >
          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: size * 0.28, fontWeight: 700, color }}>
            {symbol.slice(0, 3)}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        width: size, height: size, background: `${color}20`, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}
    >
      <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: size * 0.28, fontWeight: 700, color }}>
        {symbol.slice(0, 3)}
      </span>
    </div>
  )
}

// ── Allocation gradients ──────────────────────

const ALLOC_GRADIENTS: Record<string, string> = {
  BTC: 'linear-gradient(90deg, #F7931A, #F79A1F)',
  ETH: 'linear-gradient(90deg, #627EEA, #7B9FF5)',
  ALT: 'linear-gradient(90deg, #14F195, #9945FF)',
  Stable: 'linear-gradient(90deg, #2A9D8F, rgba(42,157,143,0.7))',
}

// ── Sheet state ───────────────────────────────

type SheetState = { type: 'closed' } | { type: 'add' } | { type: 'edit'; holding: Holding }

// ═══════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════

export default function PortfolioPage() {
  const [snapshot, setSnapshot] = useState<PortfolioExposure | null>(null)
  const [snapshotLoading, setSnapshotLoading] = useState(true)
  const [sheet, setSheet] = useState<SheetState>({ type: 'closed' })
  const [mounted, setMounted] = useState(false)
  const [regime, setRegime] = useState<string>('range')

  const { holdings, assets, isLoading: holdingsLoading, addHolding, updateHolding, removeHolding } =
    usePortfolio()
  const { hidden, toggleHidden } = usePrivacy()

  const fetchSnapshot = async () => {
    try {
      const res = await fetch('/api/portfolio-snapshot')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setSnapshot(json.exposure ?? json)
    } catch (err) {
      console.error('[PortfolioPage] snapshot error:', err)
    } finally {
      setSnapshotLoading(false)
    }
  }

  const [allocationExplainer, setAllocationExplainer] = useState<string>('The percentage each asset or category represents in your total portfolio.')
const [contributionExplainer, setContributionExplainer] = useState<string>('How much a single holding adds to or subtracts from your overall posture score.')

useEffect(() => {
  Promise.all([
    fetch('/api/glossary?slug=glossary-allocation').then(r => r.ok ? r.json() : null),
    fetch('/api/glossary?slug=glossary-posture-contribution').then(r => r.ok ? r.json() : null),
  ]).then(([allocation, contribution]) => {
    if (allocation?.summary) setAllocationExplainer(allocation.summary)
    if (contribution?.summary) setContributionExplainer(contribution.summary)
  }).catch(() => {})
}, [])

  useEffect(() => {
    fetchSnapshot()
  }, [])
  // S61: Fetch regime for misalignment framing
  useEffect(() => {
  fetch('/api/market')
    .then(r => r.ok ? r.json() : null)
    .then(d => { if (d?.regime?.current) setRegime(d.regime.current) })
    .catch(() => {})
}, [])
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(t)
  }, [])

  const heldSymbols = useMemo(() => holdings.map((h) => h.asset), [holdings])

  // Build price lookup from snapshot
  const priceLookup = useMemo(() => {
    const map: Record<string, { usd_price: number; value_usd: number; weight: number }> = {}
    if (!snapshot || snapshot.isEmpty) return map
    const exp = snapshot
    const btcQty = exp.holdings_json?.find((h: any) => h.asset === 'BTC')?.quantity || 0
    if (btcQty > 0) {
      map['BTC'] = {
        usd_price: exp.btc_value_usd / btcQty,
        value_usd: exp.btc_value_usd,
        weight: exp.btc_weight_all,
      }
    }
    const ethQty = exp.holdings_json?.find((h: any) => h.asset === 'ETH')?.quantity || 0
    if (ethQty > 0) {
      map['ETH'] = {
        usd_price: exp.eth_value_usd / ethQty,
        value_usd: exp.eth_value_usd,
        weight: exp.eth_weight_all,
      }
    }
    for (const a of exp.alt_breakdown ?? []) {
      map[a.asset] = {
        usd_price: a.usd_price,
        value_usd: a.value_usd,
        weight: exp.total_value_usd_all > 0 ? a.value_usd / exp.total_value_usd_all : 0,
      }
    }
    return map
  }, [snapshot])

  const handleAdd = async (asset: string, quantity: number, costBasis?: number | null) => {
    const ok = await addHolding({ asset, quantity, cost_basis: costBasis })
    if (ok) fetchSnapshot()
    return ok
  }

  const handleUpdate = async (id: string, updates: any) => {
    const ok = await updateHolding(id, updates)
    if (ok) fetchSnapshot()
    return ok
  }

  const handleRemove = async (id: string) => {
    const ok = await removeHolding(id)
    if (ok) fetchSnapshot()
    return ok
  }


  const loading = snapshotLoading || holdingsLoading
  const isEmpty = holdings.length === 0
  const hasSnapshot = snapshot && !snapshot.isEmpty && (snapshot.total_value_usd_all ?? 0) > 0
  const totalValue = snapshot?.total_value_usd_all || 0

  // ── Loading state ──

  if (loading) {
    return (
      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-3xl animate-pulse"
            style={{
              background: M.surfaceLight,
              height: i === 1 ? 160 : 120,
            }}
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
          <h1
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 24,
              fontWeight: 500,
              color: M.text,
              margin: '0 0 4px',
            }}
          >
            Your portfolio
          </h1>
          <p style={{ fontSize: 14, color: M.textSecondary, margin: 0 }}>
            Tell Meridian what you hold
          </p>
        </div>

        <div
          style={{
            ...card({
              background:
                'linear-gradient(135deg, rgba(244,162,97,0.08), rgba(231,111,81,0.06))',
              border: `1px solid ${M.borderAccent}`,
            }),
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            padding: '48px 24px',
            ...anim(mounted, 1),
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background:
                'linear-gradient(135deg, rgba(244,162,97,0.15), rgba(231,111,81,0.15))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <Wallet size={28} color={M.accentDeep} strokeWidth={2} />
          </div>
          <p
            style={{
              fontSize: 16,
              fontWeight: 500,
              color: M.text,
              margin: '0 0 8px',
            }}
          >
            Add your first holding
          </p>
          <p
            style={{
              fontSize: 14,
              color: M.textSecondary,
              lineHeight: 1.6,
              margin: '0 0 24px',
              maxWidth: 280,
            }}
          >
            Once Meridian knows what you hold, it can show how your portfolio aligns
            with current market conditions.
          </p>
          <button
            onClick={() => setSheet({ type: 'add' })}
            style={{
              background: M.accentGradient,
              color: 'white',
              padding: '14px 32px',
              borderRadius: 20,
              border: 'none',
              fontSize: 16,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 16px rgba(231,111,81,0.3)',
            }}
          >
            <Plus size={20} color="white" strokeWidth={2.5} /> Add a coin
          </button>
        </div>
      </div>
    )
  }

  // ── Main portfolio view ──

  // Build allocation rows from snapshot
  const allocRows: { label: string; pct: number; gradient: string }[] = []
  if (hasSnapshot) {
    if (snapshot!.btc_weight_all > 0) {
      allocRows.push({
        label: 'BTC',
        pct: Math.round(snapshot!.btc_weight_all * 100),
        gradient: ALLOC_GRADIENTS.BTC,
      })
    }
    if (snapshot!.eth_weight_all > 0) {
      allocRows.push({
        label: 'ETH',
        pct: Math.round(snapshot!.eth_weight_all * 100),
        gradient: ALLOC_GRADIENTS.ETH,
      })
    }
    if (snapshot!.alt_weight_all > 0) {
      allocRows.push({
        label: 'ALT',
        pct: Math.round(snapshot!.alt_weight_all * 100),
        gradient: ALLOC_GRADIENTS.ALT,
      })
    }
    // Stable row — always show (design v3.1)
    const usedPct = allocRows.reduce((s, r) => s + r.pct, 0)
    allocRows.push({
      label: 'Stable',
      pct: Math.max(0, 100 - usedPct),
      gradient: ALLOC_GRADIENTS.Stable,
    })
  }

  return (
    <DisclosureGroup>
    <div style={{ padding: '24px 20px' }}>
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
          ...anim(mounted, 0),
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 22,
              fontWeight: 500,
              color: M.text,
              margin: '0 0 2px',
            }}
          >
            Your portfolio
          </h1>
          <p style={{ fontSize: 12, color: M.textSecondary, margin: 0 }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontFeatureSettings: "'tnum' 1, 'lnum' 1" }}>{holdings.length}</span> holding
            {holdings.length !== 1 ? 's' : ''}
            {hasSnapshot && (
              <>
                {' · '}
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontFeatureSettings: "'tnum' 1, 'lnum' 1" }}>{hidden ? '$••••' : fmt(totalValue)}</span>
              </>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button
            onClick={toggleHidden}
            aria-label={hidden ? 'Show amounts' : 'Hide amounts'}
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.5)',
              border: `1px solid ${M.border}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 8,
            }}
          >
            {hidden ? (
              <EyeOff size={16} color={M.textMuted} strokeWidth={2} />
            ) : (
              <Eye size={16} color={M.textSecondary} strokeWidth={2} />
            )}
          </button>
          <button
            onClick={() => setSheet({ type: 'add' })}
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: M.accentGradient,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(231,111,81,0.25)',
            }}
          >
            <Plus size={20} color="white" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* ── Allocation card (on top) ── */}
      {hasSnapshot && allocRows.length > 0 && (
        <div
          style={{
            ...card({
              background:
                'linear-gradient(135deg, rgba(42,157,143,0.1), rgba(42,157,143,0.05))',
              border: `1px solid ${M.borderPositive}`,
            }),
            marginBottom: 16,
            ...anim(mounted, 1),
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <ProgressiveDisclosure
              id="allocation"
              summary={
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 600, color: M.text }}>
                  Allocation
                </span>
              }
              context={allocationExplainer}
              learnMoreHref="/profile/learn/glossary#glossary-allocation"
            />
          </div>
          {allocRows.map((a, i) => (
            <div key={a.label} style={{ marginBottom: i < allocRows.length - 1 ? 6 : 0 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 11,
                  marginBottom: 3,
                }}
              >
                <span style={{ color: M.textSecondary }}>{a.label}</span>
                <span
                  style={{
                    fontWeight: 600,
                    color: M.text,
                    fontFamily: "'DM Sans', sans-serif",
                    fontFeatureSettings: "'tnum' 1, 'lnum' 1",
                  }}
                >
                  {a.pct}%
                </span>
              </div>
              <GradientBar pct={a.pct} gradient={a.gradient} h={5} />
            </div>
          ))}
        </div>
      )}
      
      {/* ── Misalignment framing (S61) ── */}
        {hasSnapshot && snapshot && (
          <div style={{ marginBottom: 16, ...anim(mounted, 1) }}>
            <MisalignmentFramingCard snapshot={snapshot} regime={regime} />
          </div>
        )}

      {/* ── No snapshot notice ── */}
      {!hasSnapshot && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 14px',
            borderRadius: 16,
            background: M.accentMuted,
            marginBottom: 12,
            ...anim(mounted, 1),
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 500, color: M.accent }}>
            Exposure data will update on next analysis cycle
          </span>
        </div>
      )}

      {/* ── Holdings heading ── */}
      <h2
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 15,
          fontWeight: 600,
          color: M.text,
          margin: '0 0 8px',
          ...anim(mounted, 2),
        }}
      >
        Holdings
      </h2>

      {/* ── Holdings list ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          ...anim(mounted, 3),
        }}
      >
        {holdings.map((h) => {
          const price = priceLookup[h.asset]
          const valueUsd = price ? price.usd_price * h.quantity : null
          const weight = price?.weight ?? null
          const name = h.asset_mapping?.name || h.asset
          const iconUrl = h.asset_mapping?.icon_url || null
          const weightPct = weight !== null ? Math.round(weight * 100) : null

          return (
            <div
              key={h.id}
              style={{
                ...card({ padding: '14px' }),
                opacity: h.include_in_exposure ? 1 : 0.55,
              }}
            >
              {/* Main row: icon | name+qty | value+edit — single horizontal line */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CryptoIcon symbol={h.asset} size={36} iconUrl={iconUrl} />

                {/* Left: name + qty inline + since-added or excluded */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: M.text }}>{name}</span>
                    <span style={{
                      fontSize: 10, color: M.textMuted,
                      fontFamily: "'DM Sans', sans-serif",
                      fontFeatureSettings: "'tnum' 1, 'lnum' 1",
                    }}>
                      {hidden ? '\u2022\u2022\u2022\u2022' : qtyFmt(h.quantity)} {h.asset}
                    </span>
                  </div>
                  {h.include_in_exposure ? (
                    h.cost_basis != null && price ? (() => {
                      const pctChange = ((price.usd_price - h.cost_basis!) / h.cost_basis!) * 100
                      const up = pctChange >= 0
                      const addedDate = new Date(h.created_at)
                      const dateLbl = addedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      return hidden ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: M.textMuted, fontFamily: "'DM Sans', sans-serif", fontFeatureSettings: "'tnum' 1, 'lnum' 1" }}>\u2022\u2022%</span>
                          <span style={{ fontSize: 9, color: M.textMuted }}>since \u2022\u2022\u2022</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{
                            fontSize: 11, fontWeight: 600,
                            fontFamily: "'DM Sans', sans-serif", fontFeatureSettings: "'tnum' 1, 'lnum' 1",
                            color: up ? M.positive : M.negative,
                          }}>
                            {up ? '+' : ''}{pctChange.toFixed(1)}%
                          </span>
                          <span style={{ fontSize: 9, color: M.textMuted }}>since {dateLbl}</span>
                        </div>
                      )
                    })() : null
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                      <EyeOff size={9} color={M.textMuted} strokeWidth={2} />
                      <span style={{ fontSize: 9, color: M.textMuted }}>Excluded from posture</span>
                    </div>
                  )}
                </div>

                {/* Right: value + edit */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {valueUsd !== null && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: 13, fontWeight: 600, color: M.text,
                        fontFamily: "'DM Sans', sans-serif",
                        fontFeatureSettings: "'tnum' 1, 'lnum' 1",
                      }}>
                        {hidden ? '$\u2022\u2022\u2022\u2022' : fmt(valueUsd)}
                      </div>
                      {weightPct !== null && weightPct > 0 && (
                        <div style={{
                          fontSize: 10, color: M.textMuted,
                          fontFamily: "'DM Sans', sans-serif",
                          fontFeatureSettings: "'tnum' 1, 'lnum' 1",
                        }}>
                          {hidden ? '\u2022\u2022%' : `${weightPct}%`}
                        </div>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => setSheet({ type: 'edit', holding: h })}
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

              {/* Posture contribution bar — inline compact (v3.1) */}
              {h.include_in_exposure && weightPct !== null && weightPct > 0 && (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 9, color: M.textMuted, whiteSpace: 'nowrap' }}>Posture</span>
                  <GradientBar pct={hidden ? 0 : Math.min(weightPct * 2.5, 100)} h={4} />
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: M.text, whiteSpace: 'nowrap',
                    fontFamily: "'DM Sans', sans-serif", fontFeatureSettings: "'tnum' 1, 'lnum' 1",
                  }}>
                    {hidden ? '\u2022\u2022%' : `${weightPct}%`}
                  </span>
                </div>
              )}

              {/* Pro teaser — regime performance preview (v3.1) */}
              {h.include_in_exposure && (
                <div style={{
                  marginTop: 10, padding: '8px 10px', borderRadius: 12,
                  background: 'linear-gradient(135deg, rgba(42,157,143,0.04), rgba(244,162,97,0.04))',
                  border: '1px solid rgba(42,157,143,0.08)',
                  position: 'relative', overflow: 'hidden',
                }}>
                  {/* Blurred mini regime strip */}
                  <div style={{ display: 'flex', gap: 2, marginBottom: 6, filter: 'blur(3px)', opacity: 0.5, pointerEvents: 'none' }}>
                    {[
                      { w: '35%', bg: 'linear-gradient(90deg,#2A9D8F,#3DB8A9)' },
                      { w: '15%', bg: 'linear-gradient(90deg,#F4A261,#F7B87A)' },
                      { w: '25%', bg: 'linear-gradient(90deg,#2A9D8F,#5CC4B5)' },
                      { w: '10%', bg: 'linear-gradient(90deg,#E76F51,#F08C70)' },
                      { w: '15%', bg: 'linear-gradient(90deg,#2A9D8F,#3DB8A9)' },
                    ].map((b, i) => (
                      <div key={i} style={{ width: b.w, height: 16, borderRadius: 4, background: b.bg }} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{
                        width: 12, height: 12, borderRadius: 4,
                        background: M.accentGradient,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ fontSize: 7, color: 'white', fontWeight: 700 }}>P</span>
                      </div>
                      <span style={{ fontSize: 9, color: M.textMuted }}>Regime performance · P&L tracking</span>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 600, color: M.accent }}>Pro</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Footer ── */}
      <div
        style={{
          textAlign: 'center',
          padding: '16px 0 8px',
          fontSize: 11,
          color: M.textMuted,
          lineHeight: 1.5,
          ...anim(mounted, 5),
        }}
      >
        Exposure data reflects current holdings, not recommendations.
      </div>
    </div>
    </DisclosureGroup>
  )
}
