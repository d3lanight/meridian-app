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

const CRYPTO_CONFIGS: Record<
  string,
  { bg: string; shadow: string; vb: string; path: React.ReactNode }
> = {
  BTC: {
    bg: 'linear-gradient(135deg, #F7931A, #F79A1F)',
    shadow: 'rgba(247,147,26,0.3)',
    vb: '0 0 32 32',
    path: (
      <path
        d="M23.189 14.02c.314-2.096-1.283-3.223-3.465-3.975l.708-2.84-1.728-.43-.69 2.765c-.454-.114-.92-.22-1.385-.326l.695-2.783L15.596 6l-.708 2.839c-.376-.085-.746-.17-1.104-.26l.002-.009-2.384-.595-.46 1.846s1.283.294 1.256.312c.7.175.826.638.805 1.006l-.806 3.235c.048.012.11.03.18.057l-.183-.045-1.13 4.532c-.086.212-.303.531-.793.41.018.025-1.256-.313-1.256-.313l-.858 1.978 2.25.561c.418.105.828.215 1.231.318l-.715 2.872 1.727.43.708-2.84c.472.127.93.245 1.378.357l-.706 2.828 1.728.43.715-2.866c2.948.558 5.164.333 6.097-2.333.752-2.146-.037-3.385-1.588-4.192 1.13-.26 1.98-1.003 2.207-2.538zm-3.95 5.538c-.533 2.147-4.148.986-5.32.695l.95-3.805c1.172.293 4.929.872 4.37 3.11zm.535-5.569c-.487 1.953-3.495.96-4.47.717l.86-3.45c.975.243 4.118.696 3.61 2.733z"
        fill="white"
      />
    ),
  },
  ETH: {
    bg: 'linear-gradient(135deg, #627EEA, #7B9FF5)',
    shadow: 'rgba(98,126,234,0.3)',
    vb: '0 0 24 24',
    path: (
      <>
        <path
          d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003z"
          fill="white"
          fillOpacity="0.6"
        />
        <path
          d="M12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"
          fill="white"
          fillOpacity="0.6"
        />
        <path d="M11.943 0v11.645l7.365 4.354L11.943 0z" fill="white" />
      </>
    ),
  },
  SOL: {
    bg: 'linear-gradient(135deg, #14F195, #9945FF)',
    shadow: 'rgba(153,69,255,0.3)',
    vb: '0 0 32 32',
    path: (
      <>
        <path
          d="M6.52 20.51a.83.83 0 0 1 .59-.24h18.38a.41.41 0 0 1 .3.71l-3.77 3.77a.83.83 0 0 1-.59.24H2.85a.41.41 0 0 1-.3-.71z"
          fill="white"
        />
        <path
          d="M6.52 7.01a.88.88 0 0 1 .59-.24h18.38a.41.41 0 0 1 .3.71L22 11.25a.83.83 0 0 1-.59.24H2.85a.41.41 0 0 1-.3-.71z"
          fill="white"
          fillOpacity="0.6"
        />
        <path
          d="M25.43 13.51a.83.83 0 0 0-.59-.24H6.46a.41.41 0 0 0-.3.71l3.77 3.77a.83.83 0 0 0 .59.24h18.58a.41.41 0 0 0 .3-.71z"
          fill="white"
          fillOpacity="0.8"
        />
      </>
    ),
  },
  DOT: {
    bg: 'linear-gradient(135deg, #E6007A, #FF1E8E)',
    shadow: 'rgba(230,0,122,0.3)',
    vb: '0 0 32 32',
    path: (<><ellipse cx="16" cy="5" rx="2.5" ry="2.5" fill="white"/><ellipse cx="16" cy="27" rx="2.5" ry="2.5" fill="white"/><ellipse cx="24" cy="11" rx="2" ry="2" fill="white" fillOpacity=".7"/><ellipse cx="8" cy="11" rx="2" ry="2" fill="white" fillOpacity=".7"/><ellipse cx="24" cy="21" rx="2" ry="2" fill="white" fillOpacity=".7"/><ellipse cx="8" cy="21" rx="2" ry="2" fill="white" fillOpacity=".7"/></>),
  },
  ADA: {
    bg: 'linear-gradient(135deg, #0033AD, #0D47A1)',
    shadow: 'rgba(0,51,173,0.3)',
    vb: '0 0 32 32',
    path: (<><circle cx="16" cy="16" r="2.5" fill="white"/><circle cx="16" cy="8" r="1.5" fill="white" fillOpacity=".8"/><circle cx="16" cy="24" r="1.5" fill="white" fillOpacity=".8"/><circle cx="10" cy="12" r="1.3" fill="white" fillOpacity=".7"/><circle cx="22" cy="12" r="1.3" fill="white" fillOpacity=".7"/></>),
  },
  RUNE: {
    bg: 'linear-gradient(135deg, #33FF99, #00CCFF)',
    shadow: 'rgba(51,255,153,0.3)',
    vb: '0 0 32 32',
    path: (<path d="M16 4L20 12L28 16L20 20L16 28L12 20L4 16L12 12L16 4Z" fill="white"/>),
  },
  CHZ: {
    bg: 'linear-gradient(135deg, #CD0124, #E31E3B)',
    shadow: 'rgba(205,1,36,0.3)',
    vb: '0 0 32 32',
    path: (<path d="M16 6C12 6 10 9 10 12C10 15 11 16 13 18C15 20 16 21 16 24C16 21 17 20 19 18C21 16 22 15 22 12C22 9 20 6 16 6Z" fill="white"/>),
  },
  DOGE: {
    bg: 'linear-gradient(135deg, #C3A634, #D4AF37)',
    shadow: 'rgba(195,166,52,0.3)',
    vb: '0 0 32 32',
    path: (<path d="M16 6h-4v7H9v2h3v7h4c4 0 7-2 7-8s-3-8-7-8zm0 14h-2v-5h5v-2h-5V8h2c3 0 5 1 5 6s-2 6-5 6z" fill="white"/>),
  },
  THETA: {
    bg: 'linear-gradient(135deg, #2AB8E6, #29C5F6)',
    shadow: 'rgba(42,184,230,0.3)',
    vb: '0 0 32 32',
    path: (<><circle cx="16" cy="16" r="9" stroke="white" strokeWidth="2" fill="none"/><path d="M16 11v10M11 16h10" stroke="white" strokeWidth="2"/></>),
  },
  GRT: {
    bg: 'linear-gradient(135deg, #6F4FF2, #8B5CF6)',
    shadow: 'rgba(111,79,242,0.3)',
    vb: '0 0 32 32',
    path: (<><path d="M16 8L10 14L16 20L22 14L16 8Z" fill="white"/><circle cx="8" cy="16" r="2" fill="white" fillOpacity=".7"/><circle cx="24" cy="16" r="2" fill="white" fillOpacity=".7"/></>),
  },
}

function CryptoIcon({ symbol, size = 48 }: { symbol: string; size?: number }) {
  const c = CRYPTO_CONFIGS[symbol]
  if (!c) {
    // Fallback: text icon in accent pill
    const segColors: Record<string, string> = {
      BTC: '#F7931A',
      ETH: '#627EEA',
    }
    const color = segColors[symbol] || '#A78BFA'
    return (
      <div
        style={{
          width: size,
          height: size,
          background: `${color}20`,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: size * 0.28,
            fontWeight: 700,
            color,
          }}
        >
          {symbol.slice(0, 3)}
        </span>
      </div>
    )
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        background: c.bg,
        boxShadow: `0 4px 12px ${c.shadow}`,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox={c.vb} fill="none">
        {c.path}
      </svg>
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

// ── Asset name lookup ─────────────────────────

const ASSET_NAMES: Record<string, string> = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  SOL: 'Solana',
  DOT: 'Polkadot',
  ADA: 'Cardano',
  RUNE: 'THORChain',
  CHZ: 'Chiliz',
  DOGE: 'Dogecoin',
  THETA: 'Theta',
  GRT: 'The Graph',
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
      const json: PortfolioExposure = await res.json()
      setSnapshot(json)
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
    const btcQty = snapshot.holdings_json.find((h: any) => h.asset === 'BTC')?.quantity || 0
    if (btcQty > 0) {
      map['BTC'] = {
        usd_price: snapshot.btc_value_usd / btcQty,
        value_usd: snapshot.btc_value_usd,
        weight: snapshot.btc_weight_all,
      }
    }
    const ethQty = snapshot.holdings_json.find((h: any) => h.asset === 'ETH')?.quantity || 0
    if (ethQty > 0) {
      map['ETH'] = {
        usd_price: snapshot.eth_value_usd / ethQty,
        value_usd: snapshot.eth_value_usd,
        weight: snapshot.eth_weight_all,
      }
    }
    for (const a of snapshot.alt_breakdown) {
      map[a.asset] = {
        usd_price: a.usd_price,
        value_usd: a.value_usd,
        weight: snapshot.total_value_usd_all > 0 ? a.value_usd / snapshot.total_value_usd_all : 0,
      }
    }
    return map
  }, [snapshot])

  const handleAdd = async (asset: string, quantity: number, costBasis?: number | null) => {
    const ok = await addHolding(asset, quantity, costBasis)
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
  const hasSnapshot = snapshot && !snapshot.isEmpty && snapshot.total_value_usd_all > 0
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
          const name = ASSET_NAMES[h.asset] || h.asset
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
                <CryptoIcon symbol={h.asset} size={36} />

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
