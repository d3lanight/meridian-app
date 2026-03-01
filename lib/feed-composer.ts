// ━━━ Feed Composer ━━━
// v1.0.0 · ca-story83 · Sprint 20
// Multi-source assembler: market + portfolio + sentiment → FeedEntry[]
// Handles auth state: anonymous users get market entries only

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

  // Educational
  regimeExplainer?: { summary: string; slug: string } | null
}

export function composeFeed(sources: FeedSources): FeedEntry[] {
  const entries: FeedEntry[] = []
  const isAuthed = !!sources.userName

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
  if (isAuthed && sources.portfolio) {
    const p = sources.portfolio
    const postureScore = Math.round((1 - p.misalignment) * 100)
    const label = postureScore >= 70 ? 'Aligned' : postureScore >= 40 ? 'Moderate' : 'Misaligned'

    // Build narrative from allocations
    let narrative = `Your portfolio posture score is ${postureScore}.`
    if (p.allocations.length > 0) {
      const topAlloc = p.allocations[0]
      narrative += ` ${topAlloc.asset} is at ${topAlloc.current}% (target: ${topAlloc.target}%).`
    }

    entries.push({
      type: 'posture',
      data: {
        score: postureScore,
        label,
        narrative,
      },
    })
  }

  // ── 5. Portfolio insight (auth only, template-driven) ──
  if (isAuthed && sources.portfolio && sources.regime) {
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
    }
  }

  // ── 6. Divider ──
  entries.push({ type: 'divider', data: { label: 'Market context' } })

  // ── 7. Market snippets ──
  if (sources.metrics) {
    const m = sources.metrics
    entries.push({
      type: 'market_snippet',
      data: {
        label: 'Fear & Greed',
        value: String(m.fearGreed),
        change: m.fearGreed >= 50 ? String(m.fearGreed - 50) : undefined,
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
  }

  // ── 8. Signals (auth only) ──
  if (isAuthed && sources.signals.length > 0) {
    for (const sig of sources.signals.slice(0, 3)) {
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

  // ── 9. Educational entry ──
  if (sources.regimeExplainer) {
    entries.push({
      type: 'learn',
      data: {
        text: sources.regimeExplainer.summary,
        topic: sources.regime?.current?.toLowerCase() ?? 'market regimes',
        slug: sources.regimeExplainer.slug,
      },
    })
  }

  return entries
}

// ── Helpers ──

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffH = Math.floor(diffMs / 3600000)

  if (diffH < 1) return 'Just now'
  if (diffH < 24) return `${diffH}h ago`

  const diffD = Math.floor(diffH / 24)
  if (diffD === 1) {
    return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
