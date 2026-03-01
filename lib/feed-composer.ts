// ━━━ Feed Composer ━━━
// v2.2.0 · ca-story85 · Sprint 20
// S85: EntryLearn integration — glossary API, tap-to-expand, regime-contextual content

import type { FeedEntry } from '@/lib/feed-types'
import type { RegimeData, PortfolioData, MarketMetrics, Signal } from '@/types'

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

  // ── 5. Portfolio insight (auth only, template-driven) ──
  if (isAuthed && sources.portfolio && sources.regime && sources.hasHoldings !== false) {
    const p = sources.portfolio
    const r = sources.regime
    if (p.allocations.length > 0) {
      const btcAlloc = p.allocations.find(a => a.asset === 'BTC')
      if (btcAlloc && Math.abs(btcAlloc.current - btcAlloc.target) > 3) {
        const diff = btcAlloc.current - btcAlloc.target
        entries.push({
          type: 'insight',
          data: {
            icon: 'zap',
            iconVariant: 'accent',
            text: `Your BTC allocation is ${btcAlloc.current}% — ${diff > 0 ? 'above' : 'below'} the ${btcAlloc.target}% target for a ${r.current.toLowerCase()} environment.`,
            link: true,
          },
        })
      }

      // ETH insight if present
      const ethAlloc = p.allocations.find(a => a.asset === 'ETH')
      if (ethAlloc && Math.abs(ethAlloc.current - ethAlloc.target) > 5) {
        const diff = ethAlloc.current - ethAlloc.target
        entries.push({
          type: 'insight',
          data: {
            icon: 'shield',
            iconVariant: 'eth',
            text: `ETH is at ${ethAlloc.current}% — ${Math.abs(diff).toFixed(0)}% ${diff > 0 ? 'above' : 'below'} target for this regime.`,
          },
        })
      }
    }
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

      const sevMap: Record<number, 'info' | 'watch' | 'action'> = { 1: 'info', 2: 'watch', 3: 'action' }
      entries.push({
        type: 'signal',
        data: {
          severity: sevMap[sig.severity] ?? 'info',
          title: sig.reason,
          text: `${sig.action} — ${sig.asset}`,
          time: sig.time,
        },
      })
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