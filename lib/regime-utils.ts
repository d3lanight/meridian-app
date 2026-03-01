// ━━━ Regime Utilities ━━━
// v1.1.0 · ca-story-design-refresh · Sprint 24
// Pure functions for regime timeline processing
// v1.1: Range regime color → neutral taupe (decoupled from accent)

// ── Types ─────────────────────────────────────

/** Raw regime row from /api/market-context (sorted newest-first) */
export interface RegimeRow {
  timestamp: string
  regime: string
  confidence: number
  price_now: number
}

/** Compressed run of consecutive same-regime days */
export interface Run {
  regime: string
  days: number
  startDate: string
  endDate: string
  confs: number[]
  prices: number[]
}

/** Per-regime breakdown in aggregation */
export interface RegimeBreakdown {
  regime: string
  totalDays: number
  inst: number
  confs: number[]
  avgConf: number
  pct: number
  traj: '↑' | '↓' | '→'
}

/** Aggregation summary for a period */
export interface RegimeAgg {
  /** Total days in period */
  td: number
  /** Total regime changes */
  tc: number
  /** Average confidence % (0-100) */
  ac: number
  /** Per-regime breakdown, sorted by totalDays desc */
  bd: RegimeBreakdown[]
  /** Dominant regime (first in bd) */
  dom: RegimeBreakdown | null
  /** BTC price change % over period (null if insufficient data) */
  btcChange: number | null
}

// ── Regime Config ─────────────────────────────

export interface RegimeConfig {
  /** Gradient background for filled elements */
  bg: string
  /** Solid color for borders, dots */
  s: string
  /** Dim tint for past/inactive elements */
  d: string
  /** Display label */
  l: string
  /** Arrow icon character */
  icon: string
}

export const REGIMES: Record<string, RegimeConfig> = {
  bull:     { bg: 'linear-gradient(135deg,#2A9D8F,#3DB8A9)', s: '#2A9D8F', d: 'rgba(42,157,143,0.12)',  l: 'Bull',     icon: '↗' },
  bear:     { bg: 'linear-gradient(135deg,#E76F51,#F08C70)', s: '#E76F51', d: 'rgba(231,111,81,0.12)',  l: 'Bear',     icon: '↘' },
  range:    { bg: 'linear-gradient(135deg,#8B7565,#A08979)', s: '#8B7565', d: 'rgba(139,117,101,0.12)', l: 'Range',    icon: '→' },
  volatile: { bg: 'linear-gradient(135deg,#D4A017,#E8B84B)', s: '#D4A017', d: 'rgba(212,160,23,0.12)', l: 'Volatile', icon: '↕' },
}

/** Reverse-lookup: display label → regime key */
const LABEL_TO_KEY: Record<string, string> = {
  'bull market': 'bull',
  'bear market': 'bear',
  'range': 'range',
  'high volatility': 'volatile',
  'volatile': 'volatile',
  'volatility': 'volatile',
  'insufficient data': 'range',
}

/** Lookup regime config by key, display label, or partial match (case-insensitive, defaults to range) */
export function getRegimeConfig(regime: string | undefined | null): RegimeConfig {
  const r = regime?.toLowerCase() ?? ''
  // Direct key match
  if (REGIMES[r]) return REGIMES[r]
  // Display label reverse-lookup
  const key = LABEL_TO_KEY[r]
  if (key && REGIMES[key]) return REGIMES[key]
  // Partial match fallback
  if (r.includes('bull')) return REGIMES.bull
  if (r.includes('bear')) return REGIMES.bear
  if (r.includes('volat')) return REGIMES.volatile
  return REGIMES.range
}

// ── Compress to Runs ──────────────────────────
// Input: regime rows sorted NEWEST-FIRST (from API)
// Output: Run[] sorted CHRONOLOGICALLY (oldest first)

export function compressToRuns(rows: RegimeRow[]): Run[] {
  if (!rows?.length) return []

  const runs: Run[] = []
  let cur: Run = {
    regime: rows[0].regime,
    days: 1,
    startDate: rows[0].timestamp,
    endDate: rows[0].timestamp,
    confs: [rows[0].confidence],
    prices: [rows[0].price_now],
  }

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    if (r.regime === cur.regime) {
      cur.days++
      cur.startDate = r.timestamp
      cur.confs.push(r.confidence)
      cur.prices.push(r.price_now)
    } else {
      runs.push(cur)
      cur = {
        regime: r.regime,
        days: 1,
        startDate: r.timestamp,
        endDate: r.timestamp,
        confs: [r.confidence],
        prices: [r.price_now],
      }
    }
  }
  runs.push(cur)

  return runs.reverse()
}

// ── Confidence Trajectory ─────────────────────
// Compares avg first-third vs last-third of confidence values
// Returns ↑ (strengthening), ↓ (weakening), → (stable)
// Threshold: ±0.03, min 3 data points

export function confTraj(confs: number[]): '↑' | '↓' | '→' {
  if (confs.length < 3) return '→'

  const c = [...confs].reverse()
  const t = Math.ceil(c.length / 3)
  const early = c.slice(-t).reduce((s, v) => s + v, 0) / t
  const late = c.slice(0, t).reduce((s, v) => s + v, 0) / t
  const d = late - early

  return d > 0.03 ? '↑' : d < -0.03 ? '↓' : '→'
}

// ── Build Aggregation ─────────────────────────
// Computes period summary from runs + raw rows

export function buildAgg(runs: Run[], rows: RegimeRow[]): RegimeAgg {
  const td = rows?.length || 0
  const tc = Math.max(0, runs.length - 1)

  const by: Record<string, { regime: string; totalDays: number; inst: number; confs: number[] }> = {}
  for (const r of runs) {
    const k = r.regime.toLowerCase()
    if (!by[k]) by[k] = { regime: r.regime, totalDays: 0, inst: 0, confs: [] }
    by[k].totalDays += r.days
    by[k].inst++
    by[k].confs.push(...r.confs)
  }

  const bd: RegimeBreakdown[] = Object.values(by)
    .map((b) => ({
      ...b,
      avgConf: b.confs.length
        ? Math.round((b.confs.reduce((s, c) => s + c, 0) / b.confs.length) * 100)
        : 0,
      pct: td ? Math.round((b.totalDays / td) * 100) : 0,
      traj: confTraj(b.confs),
    }))
    .sort((a, b) => b.totalDays - a.totalDays)

  const ac = rows?.length
    ? Math.round((rows.reduce((s, r) => s + r.confidence, 0) / rows.length) * 100)
    : 0

  const prices = rows?.map((r) => r.price_now).filter((p) => p > 0) ?? []
  const btcChange =
    prices.length >= 2
      ? ((prices[0] - prices[prices.length - 1]) / prices[prices.length - 1]) * 100
      : null

  const dom = bd[0] ?? null

  return { td, tc, ac, bd, dom, btcChange }
}
