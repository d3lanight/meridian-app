// ============================================================
// Supabase Queries — fetch + map to UI types
// Story: ca-story18-connect-ui-supabase
// Version: 1.0 · 2026-02-14
// ============================================================

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
  const r1d = row.r_1d ?? 0
  const r7d = row.r_7d ?? 0
  const vol = row.vol_7d ?? 0

  return {
    current: REGIME_LABELS[row.regime] ?? row.regime ?? 'Unknown',
    confidence: Math.round((row.confidence ?? 0) * 100),
    persistence: row.eth_days_confirmed ?? 0,
    trend: `${r7d >= 0 ? '+' : ''}${r7d.toFixed(1)}%`,
    volume: r1d > 3 ? 'High' : r1d > -3 ? 'Medium' : 'Low',
    volatility: `${vol.toFixed(0)}%`,
  }
}

// ━━━ PORTFOLIO ━━━

const POSTURE_MAP: Record<string, string> = {
  aligned: 'Aligned',
  watch: 'Watch',
  misaligned: 'Misaligned',
}

export function mapExposure(row: any): PortfolioData {
  const btcW = Math.round((row.btc_weight_all ?? 0) * 100)
  const ethW = Math.round((row.eth_weight_all ?? 0) * 100)
  const altW = Math.round((row.alt_weight_all ?? 0) * 100)
  const stableW = Math.max(0, 100 - btcW - ethW - altW)

  return {
    posture: POSTURE_MAP[row.misalignment_label] ?? 'Unknown',
    misalignment: Math.round(row.misalignment_score ?? 0),
    allocations: [
      { asset: 'BTC', current: btcW, target: 50 },
      { asset: 'ETH', current: ethW, target: 25 },
      { asset: 'ALTS', current: altW, target: 15 },
      { asset: 'STABLE', current: stableW, target: 10 },
    ],
  }
}

// Fallback when no exposure data exists yet
export function emptyExposure(): PortfolioData {
  return {
    posture: 'No Data',
    misalignment: 0,
    allocations: [
      { asset: 'BTC', current: 0, target: 50 },
      { asset: 'ETH', current: 0, target: 25 },
      { asset: 'ALTS', current: 0, target: 15 },
      { asset: 'STABLE', current: 0, target: 10 },
    ],
  }
}

// ━━━ SIGNALS ━━━

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime()
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  return 'just now'
}

function mapAction(signal: any): 'BUY' | 'SELL' | 'HOLD' {
  // Derive action from severity + posture context
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
    time: row.timestamp ? timeAgo(row.timestamp) : 'unknown',
  }))
}

// ━━━ MARKET METRICS ━━━

export function computeMetrics(regime: any, prices: any): MarketMetrics {
  const confidence = Math.round((regime?.confidence ?? 0.5) * 100)
  const r7d = regime?.r_7d ?? 0
  const vol = regime?.vol_7d ?? 0

  // Proxy fear & greed from confidence + trend
  const fearGreed = Math.min(100, Math.max(0, Math.round(50 + r7d * 2 + (confidence - 50) * 0.3)))

  // BTC dominance — from exposure if available, else estimate
  const btcDom = regime?.price_now && regime?.eth_price_now
    ? Math.round(regime.price_now / (regime.price_now + regime.eth_price_now * 10) * 100 * 10) / 10
    : 54.0

  // Alt season proxy — inverse of vol + positive alts
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
