// ━━━ MisalignmentFramingCard ━━━
// v1.1.0 · ca-story-design-refresh · Sprint 24
// Regime-aware misalignment framing for the portfolio allocation card.
// Shows when any allocation category deviates > THRESHOLD from regime target bands.
// Consequence text sourced from payload_knowledge_entries via /api/glossary.
// Language rules: no "error", "wrong", "fix", "should", "rebalance".

import { useState, useEffect } from 'react'
import { M } from '@/lib/meridian'
import type { PortfolioExposure } from '@/types'

// ── Constants ─────────────────────────────────

const MISALIGNMENT_THRESHOLD = 10 // show framing when any delta > 10pp

// Target bands per base regime (min%, max%) — all values in 0–100
const REGIME_TARGETS: Record<
  string,
  { BTC: [number, number]; ETH: [number, number]; ALT: [number, number] }
> = {
  bull:     { BTC: [35, 50], ETH: [25, 35], ALT: [15, 25] },
  bear:     { BTC: [55, 70], ETH: [20, 30], ALT: [0,  10] },
  range:    { BTC: [45, 60], ETH: [25, 35], ALT: [5,  15] },
  volatile: { BTC: [50, 65], ETH: [20, 30], ALT: [0,  10] },
}

// Category display labels
const CATEGORY_LABELS: Record<string, string> = {
  BTC: 'BTC',
  ETH: 'ETH',
  ALT: 'ALT',
}

// ── Helpers ───────────────────────────────────

function normalizeRegime(regime: string): 'bull' | 'bear' | 'range' | 'volatile' {
  const r = regime.toLowerCase()
  if (r.includes('bear')) return 'bear'
  if (r.includes('volatile')) return 'volatile'
  if (r.includes('bull')) return 'bull'
  return 'range'
}

interface MisalignmentResult {
  category: 'BTC' | 'ETH' | 'ALT'
  actual: number
  targetMin: number
  targetMax: number
  delta: number
  direction: 'above' | 'below'
}

function computeWorstMisalignment(
  btcPct: number,
  ethPct: number,
  altPct: number,
  baseRegime: string
): MisalignmentResult | null {
  const targets = REGIME_TARGETS[baseRegime] ?? REGIME_TARGETS.range
  const assets: { key: 'BTC' | 'ETH' | 'ALT'; actual: number }[] = [
    { key: 'BTC', actual: btcPct },
    { key: 'ETH', actual: ethPct },
    { key: 'ALT', actual: altPct },
  ]

  let worst: MisalignmentResult | null = null

  for (const { key, actual } of assets) {
    const [min, max] = targets[key]
    let delta = 0
    let direction: 'above' | 'below' = 'above'

    if (actual > max) {
      delta = Math.round(actual - max)
      direction = 'above'
    } else if (actual < min) {
      delta = Math.round(min - actual)
      direction = 'below'
    }

    if (delta > MISALIGNMENT_THRESHOLD) {
      if (!worst || delta > worst.delta) {
        worst = { category: key, actual: Math.round(actual), targetMin: min, targetMax: max, delta, direction }
      }
    }
  }

  return worst
}

// ── Types ─────────────────────────────────────

interface ConsequenceEntry {
  summary: string
  slug: string
}

// ── Framing Card ──────────────────────────────

interface MisalignmentFramingCardProps {
  snapshot: PortfolioExposure
  regime: string // raw regime string from API e.g. "Bull Range"
}

export default function MisalignmentFramingCard({ snapshot, regime }: MisalignmentFramingCardProps) {
  const [consequence, setConsequence] = useState<ConsequenceEntry | null>(null)
  const [loadingConsequence, setLoadingConsequence] = useState(false)

  const baseRegime = normalizeRegime(regime)

  // Convert weights (0–1 fractions) to percentages
  const btcPct = Math.round((snapshot.btc_weight_all ?? 0) * 100)
  const ethPct = Math.round((snapshot.eth_weight_all ?? 0) * 100)
  const altPct = Math.round((snapshot.alt_weight_all ?? 0) * 100)

  const misalignment = computeWorstMisalignment(btcPct, ethPct, altPct, baseRegime)

  // Fetch consequence text when regime is known and misalignment exists
  useEffect(() => {
    if (!misalignment) return
    setLoadingConsequence(true)
    fetch(`/api/glossary?slug=misalignment-consequence-${baseRegime}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.summary) {
          setConsequence({ summary: data.summary, slug: data.slug })
        }
      })
      .catch(() => {})
      .finally(() => setLoadingConsequence(false))
  }, [baseRegime, misalignment?.delta])

  // No misalignment worth showing
  if (!misalignment) return null

  const { category, actual, targetMin, targetMax, delta, direction } = misalignment
  const regimeLabel = regime.charAt(0).toUpperCase() + regime.slice(1).toLowerCase()
  const categoryLabel = CATEGORY_LABELS[category]

  // Sentence: "Your ALT allocation is 12% above target."
  const sentenceMain = `Your ${categoryLabel} allocation is ${delta}% ${direction} target.`

  // Consequence clause from DB, or terse fallback
  const FALLBACK_CONSEQUENCE: Record<string, string> = {
    bull:     'higher exposure to volatile assets amplifies gains but increases drawdown risk',
    bear:     'excess risk-on allocation increases exposure to downward pressure',
    range:    'imbalanced allocation may drift further as the market consolidates',
    volatile: 'concentration in any category increases portfolio sensitivity to rapid moves',
  }
  const consequenceText = consequence?.summary ?? (!loadingConsequence ? FALLBACK_CONSEQUENCE[baseRegime] : null)

  // Color: accent for moderate (10–20pp), negative for significant (>20pp)
  const isSignificant = delta > 20
  const accentColor = isSignificant ? M.negative : M.accent
  const bgColor = isSignificant ? M.negativeDim : M.accentDim
  const borderColor = isSignificant
    ? 'rgba(231,111,81,0.2)'
    : M.borderAccent

  return (
    <div
      style={{
        marginTop: 12,
        padding: '12px 14px',
        background: bgColor,
        borderRadius: 16,
        border: `1px solid ${borderColor}`,
      }}
    >
      {/* Primary framing line */}
      <p
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: accentColor,
          margin: '0 0 4px',
          lineHeight: 1.4,
        }}
      >
        {sentenceMain}
      </p>

      {/* Consequence line */}
      {consequenceText && (
        <p
          style={{
            fontSize: 12,
            color: M.textSecondary,
            margin: '0 0 8px',
            lineHeight: 1.5,
          }}
        >
          In {regimeLabel} regimes, {consequenceText}.
        </p>
      )}

      {/* Target band reference */}
      <p
        style={{
          fontSize: 11,
          color: M.textMuted,
          margin: 0,
          fontFamily: "'DM Mono', monospace",
        }}
      >
        Target: {targetMin}–{targetMax}% · Actual: {actual}%
      </p>
    </div>
  )
}
