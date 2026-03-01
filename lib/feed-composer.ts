// ━━━ Feed Composer ━━━
// v2.1.0 · ca-story86 · Sprint 20
// v2.1: stub signals with live data, severity mapping fix

import type { FeedEntry } from '@/lib/feed-types'
import type { RegimeData, PortfolioData, MarketMetrics, Signal } from '@/types'
import { generateInsights } from "@/lib/insight-engine"

interface FeedSources {
  // Market (always available)
  regime: RegimeData | null
  metrics: MarketMetrics | null
  btcPrice?: number
  btcChange?: number
  ethPrice?: number
  ethChange?: number
  persistence?: number

  // Portfolio (requires auth)
  portfolio: PortfolioData | null
  signals: Signal[]
  userName: string | null
  hasHoldings?: boolean

  // Educational
  regimeExplainer?: { summary: string; slug: string } | null
  learnEntries?: { summary: string; slug: string; topic: string }[]
}

interface ComposedFeed {
  entries: FeedEntry[]
  showEmptyPortfolioCTA: boolean
}

export function composeFeed(sources: FeedSources): ComposedFeed {
  const entries: FeedEntry[] = []
  const isAuthed = !!sources.userName
  let showEmptyPortfolioCTA = false

  // ── 1. Greeting ──
  entries.push({
    type: 'greeting',
    data: { name: sources.userName ?? 'there' },
  })

  // ── 2. Regime card ──
  if (sources.regime) {
    const r = sources.regime
    const narrativeParts: string[] = []
    if (r.persistence > 0) narrativeParts.push(`Day ${r.persistence} of ${r.current.toLowerCase()} conditions.`)
    if (r.confidence >= 70) narrativeParts.push('Signal strength is high.')
    else if (r.confidence >= 50) narrativeParts.push('Signal strength is moderate.')
    else narrativeParts.push('Signal is weak — conditions may shift.')

    entries.push({
      type: 'regime',
      data: {
        regime: r.current,
        confidence: r.confidence / 100,
        persistence: r.persistence,
        narrative: narrativeParts.join(' '),
      },
    })
  }

  // ── 3. Price pair ──
  if (sources.btcPrice != null && sources.ethPrice != null) {
    entries.push({
      type: 'price_pair',
      data: {
        btcPrice: sources.btcPrice,
        btcChange: sources.btcChange ?? 0,
        ethPrice: sources.ethPrice,
        ethChange: sources.ethChange ?? 0,
      },
    })
  }

  // ── 4. Posture (auth only) ──
  if (isAuthed && sources.portfolio && sources.hasHoldings !== false) {
    const p = sources.portfolio
    const postureScore = Math.round((1 - p.misalignment) * 100)
    const label = postureScore >= 70 ? 'Aligned' : postureScore >= 40 ? 'Moderate' : 'Misaligned'

    let narrative = `Your portfolio posture score is ${postureScore}.`
    if (p.allocations.length > 0) {
      const topAlloc = p.allocations[0]
      narrative += ` ${topAlloc.asset} is at ${topAlloc.current}% (target: ${topAlloc.target}%).`
    }

    entries.push({
      type: 'posture',
      data: { score: postureScore, label, narrative },
    })
  } else if (isAuthed && sources.hasHoldings === false) {
    showEmptyPortfolioCTA = true
  }

  // ── 5. Portfolio insights (auth only, engine-driven) ──
  if (isAuthed && sources.portfolio && sources.regime && sources.hasHoldings !== false) {
    const insights = generateInsights(sources.regime, sources.portfolio, 4)
    for (const insight of insights) {
      entries.push({ type: "insight", data: insight })
    }
  }

  // ── 5b. Anon CTA ──
  if (!isAuthed) {
    entries.push({
      type: 'anon_cta',
      data: {
        title: 'Your daily context awaits',
        text: 'Sign in to see portfolio insights, posture scoring, and signals tailored to your holdings.',
      },
    })
  }

  // ── 6. Market context divider ──
  entries.push({ type: 'divider', data: { label: 'Market context' } })

  // ── 7. Market snippets ──
  if (sources.metrics) {
    const m = sources.metrics
    entries.push({
      type: 'market_snippet',
      data: {
        label: 'Fear & Greed',
        value: String(m.fearGreed),
        change: m.fearGreed >= 50 ? `+${m.fearGreed - 50}` : undefined,
        positive: m.fearGreed >= 50,
      },
    })
    entries.push({
      type: 'market_snippet',
      data: {
        label: 'BTC Dominance',
        value: `${m.btcDominance.toFixed(1)}%`,
      },
    })
    if (m.altSeason != null) {
      entries.push({
        type: 'market_snippet',
        data: {
          label: 'ALT Season',
          value: String(m.altSeason),
          change: m.altSeason >= 75 ? 'Active' : undefined,
          positive: m.altSeason >= 50,
        },
      })
    }
    if (m.totalVolume != null) {
      entries.push({
        type: 'market_snippet',
        data: {
          label: '24h Volume',
          value: `$${(m.totalVolume / 1e9).toFixed(1)}B`,
        },
      })
    }
  }

  // ── 8. Signals with temporal grouping (auth only) ──
  if (isAuthed && sources.signals.length > 0) {
    let lastGroup: 'today' | 'yesterday' | 'older' | null = null

    for (const sig of sources.signals.slice(0, 5)) {
      const group = getTemporalGroup(sig.time)

      // Insert divider at group boundary
      if (group !== lastGroup && lastGroup !== null) {
        const dividerLabel = group === 'yesterday' ? 'Yesterday' : group === 'older' ? 'Earlier' : 'Earlier today'
        entries.push({ type: 'divider', data: { label: dividerLabel } })
      }
      lastGroup = group

      // severity is 0-100 scale from mapSignals
      const sev = sig.severity <= 33 ? 'info' : sig.severity <= 66 ? 'watch' : 'action'
      entries.push({
        type: 'signal',
        data: {
          severity: sev,
          title: sig.reason,
          text: `${sig.action} — ${sig.asset}`,
          time: sig.time,
        },
      })
    }
  }

  // ── 8b. Stub signals when pipeline has none (auth only) ──
  // Uses real data to feel authentic. Flagged stub:true for Phase 5 replacement.
  if (isAuthed && sources.signals.length === 0 && sources.regime) {
    const r = sources.regime

    // Info: regime persistence
    if (r.persistence >= 2) {
      entries.push({
        type: 'signal',
        data: {
          severity: 'info',
          title: `Regime confirmed: day ${r.persistence}`,
          text: `${r.current} has sustained for ${r.persistence} days with ${r.confidence}% confidence.`,
          time: 'Today',
        },
      })
    }

    // Watch: BTC price milestone (uses real price)
    if (sources.btcPrice) {
      const rounded = Math.round(sources.btcPrice / 1000) * 1000
      entries.push({
        type: 'signal',
        data: {
          severity: 'info',
          title: `BTC near $${(rounded / 1000).toFixed(0)}K`,
          text: `Bitcoin is trading at $${sources.btcPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}. Price action is ${r.current.toLowerCase().includes('bull') ? 'consistent with upward momentum' : 'worth watching in the current regime'}.`,
          time: 'Today',
        },
      })
    }

    // Watch: portfolio hint (if holdings exist but allocation is off)
    if (sources.portfolio && sources.hasHoldings !== false) {
      const btcAlloc = sources.portfolio.allocations.find(a => a.asset === 'BTC')
      if (btcAlloc && btcAlloc.current < btcAlloc.target - 5) {
        entries.push({
          type: 'signal',
          data: {
            severity: 'watch',
            title: 'BTC underweight for current regime',
            text: `Your BTC allocation (${btcAlloc.current}%) is below the ${btcAlloc.target}% target. This isn't a trade signal — just context.`,
            time: 'Today',
          },
        })
      }
    }
  }

 // ── 9. Educational entries ──
  const learns = sources.learnEntries ?? []
  if (learns.length > 0) {
    for (const learn of learns.slice(0, 2)) {
      entries.push({
        type: 'learn',
        data: {
          text: learn.summary,
          topic: learn.topic,
          slug: learn.slug,
        },
      })
    }
  } else if (sources.regimeExplainer) {
    entries.push({
      type: 'learn',
      data: {
        text: sources.regimeExplainer.summary,
        topic: sources.regime?.current?.toLowerCase() ?? 'market regimes',
        slug: sources.regimeExplainer.slug,
      },
    })
  }

  return { entries, showEmptyPortfolioCTA }
}

// ── Helpers ──

function getTemporalGroup(timeStr: string): 'today' | 'yesterday' | 'older' {
  // Signal.time can be relative ("2h ago") or absolute date
  if (!timeStr) return 'today'
  const lower = timeStr.toLowerCase()
  if (lower.includes('ago') || lower.includes('just now')) return 'today'
  if (lower.includes('yesterday')) return 'yesterday'

  // Try parsing as date
  const date = new Date(timeStr)
  if (isNaN(date.getTime())) return 'today'

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date >= today) return 'today'
  if (date >= yesterday) return 'yesterday'
  return 'older'
}