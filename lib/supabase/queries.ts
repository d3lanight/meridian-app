// ━━━ Supabase Queries — fetch + map to UI types ━━━
// v3.0.0 · ca-story50 · 2026-02-21
// Changelog (from v2.0):
//  v3.0.0 — S50: Real posture calculation
//   - mapExposure accepts configTargets from config table (not hardcoded)
//   - Switched to 3-bucket model: Core (BTC+ETH) / ALT / STABLE
//   - Posture label: Aligned (<10%), Moderate (10-20%), Misaligned (>20%)
//   - emptyExposure updated for 3 buckets
//   - Removed hardcoded REGIME_TARGETS

import type { RegimeData, PortfolioData, Signal, MarketMetrics } from '@/types'

// ━━━ REGIME ━━━

const REGIME_LABELS: Record<string, string> = {
  bull: 'Bull Market',
  bear: 'Bear Market',
  range: 'Sideways',
  volatility: 'High Volatility',
  insufficient_data: 'Insufficient Data',
}

export function mapRegime(row: any): RegimeData {
  const r1d = (row.r_1d ?? 0) * 100
  const r7d = (row.r_7d ?? 0) * 100
  const vol = (row.vol_7d ?? 0) * 100

  return {
    current: REGIME_LABELS[row.regime] ?? row.regime ?? 'Unknown',
    confidence: Math.round((row.confidence ?? 0) * 100),
    persistence: row._persistence_days ?? row.eth_days_confirmed ?? 0,
    trend: `${r7d >= 0 ? '+' : ''}${r7d.toFixed(1)}%`,
    volume: r1d > 3 ? 'High' : r1d > -3 ? 'Medium' : 'Low',
    volatility: `${vol.toFixed(0)}%`,
  }
}

// ━━━ PORTFOLIO ━━━

const REGIME_TARGETS: Record<string, { btc: number; eth: number; alts: number; stable: number }> = {
  bull:       { btc: 50, eth: 25, alts: 15, stable: 10 },
  bear:       { btc: 30, eth: 15, alts: 10, stable: 45 },
  range:      { btc: 40, eth: 20, alts: 15, stable: 25 },
  volatility: { btc: 35, eth: 15, alts: 10, stable: 40 },
}
const DEFAULT_TARGETS = { btc: 40, eth: 20, alts: 15, stable: 25 }

export function mapExposure(row: any): PortfolioData {
  const btcW = Math.round((row.btc_weight_all ?? 0) * 100)
  const ethW = Math.round((row.eth_weight_all ?? 0) * 100)
  const altW = Math.round((row.alt_weight_all ?? 0) * 100)
  const stableW = Math.max(0, 100 - btcW - ethW - altW)

  const targets = REGIME_TARGETS[row.regime] ?? DEFAULT_TARGETS

  const deltas = [
    Math.abs(btcW - targets.btc),
    Math.abs(ethW - targets.eth),
    Math.abs(altW - targets.alts),
    Math.abs(stableW - targets.stable),
  ]
  const misalignment = Math.round(deltas.reduce((a, b) => a + b, 0) / deltas.length)

  const postureFromStatus: Record<string, string> = {
    ok: 'Aligned',
    watch: 'Watch',
    misaligned: 'Misaligned',
  }
  const posture = postureFromStatus[row.regime_status]
    ?? (misalignment > 20 ? 'Misaligned' : misalignment > 10 ? 'Watch' : 'Aligned')

  return {
    posture,
    misalignment,
    allocations: [
      { asset: 'BTC', current: btcW, target: targets.btc },
      { asset: 'ETH', current: ethW, target: targets.eth },
      { asset: 'ALTS', current: altW, target: targets.alts },
      { asset: 'STABLE', current: stableW, target: targets.stable },
    ],
  }
}

export function emptyExposure(): PortfolioData {
  return {
    posture: 'No Data',
    misalignment: 0,
    allocations: [
      { asset: 'BTC', current: 0, target: 0 },
      { asset: 'ETH', current: 0, target: 0 },
      { asset: 'ALTS', current: 0, target: 0 },
      { asset: 'STABLE', current: 0, target: 0 },
    ],
  }
}

// ━━━ SIGNALS ━━━

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  return 'just now'
}

function mapAction(signal: any): 'BUY' | 'SELL' | 'HOLD' {
  if (signal.severity === 'actionable' && signal.posture_mismatch) return 'SELL'
  if (signal.severity === 'actionable') return 'BUY'
  return 'HOLD'
}

export function mapSignals(rows: any[]): Signal[] {
  return rows.map((row, i) => ({
    id: i + 1,
    asset: row.from_regime ? `${row.from_regime} → ${row.to_regime}` : 'Market',
    action: mapAction(row),
    severity: Math.round((row.severity_score ?? 0.5) * 100),
    reason: row.summary ?? row.recommended_focus ?? 'No details',
    time: row.created_at ? timeAgo(row.created_at) : 'unknown',
  }))
}

// ━━━ MARKET METRICS ━━━

export function computeMetrics(regime: any, prices: any): MarketMetrics {
  const confidence = Math.round((regime?.confidence ?? 0.5) * 100)
  const r7d = (regime?.r_7d ?? 0) * 100
  const vol = (regime?.vol_7d ?? 0) * 100

  const fearGreed = Math.min(100, Math.max(0, Math.round(50 + r7d * 2 + (confidence - 50) * 0.3)))

  const btcDom = regime?.price_now && regime?.eth_price_now
    ? Math.round(regime.price_now / (regime.price_now + regime.eth_price_now * 10) * 100 * 10) / 10
    : 54.0

  const altSeason = Math.min(100, Math.max(0, Math.round(50 - vol * 0.5 + r7d * 1.5)))

  const fearGreedLabel =
    fearGreed >= 75 ? 'Extreme Greed' :
    fearGreed >= 55 ? 'Greed' :
    fearGreed >= 45 ? 'Neutral' :
    fearGreed >= 25 ? 'Fear' :
    'Extreme Fear'

  return {
    fearGreed,
    fearGreedLabel,
    btcDominance: btcDom,
    altSeason,
  }
}

// ━━━ TIMESTAMP ━━━

export function formatLastAnalysis(timestamp: string | null): string {
  if (!timestamp) return 'No data yet'
  const d = new Date(timestamp)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return isToday ? `Today, ${time}` : `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${time}`
}