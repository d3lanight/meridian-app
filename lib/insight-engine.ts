// ━━━ Insight Engine ━━━
// v1.0.0 · ca-story94 · Sprint 24
// Rule-based template engine for portfolio insights
// Replaces inline insight logic from feed-composer.ts

import type { EntryInsightData } from '@/lib/feed-types'
import type { RegimeData, PortfolioData } from '@/types'

interface InsightContext {
  regime: RegimeData
  portfolio: PortfolioData
}

interface InsightTemplate {
  id: string
  match: (ctx: InsightContext) => boolean
  build: (ctx: InsightContext) => EntryInsightData
}

// ── Helpers ──

function findAlloc(ctx: InsightContext, asset: string) {
  return ctx.portfolio.allocations.find(a => a.asset === asset)
}

function bucketWeight(ctx: InsightContext, bucket: 'BTC' | 'ETH' | 'ALT' | 'STABLE') {
  if (bucket === 'ALT') {
    return ctx.portfolio.allocations
      .filter(a => a.asset !== 'BTC' && a.asset !== 'ETH')
      .reduce((sum, a) => sum + a.current, 0)
  }
  return findAlloc(ctx, bucket)?.current ?? 0
}

function regimeLabel(ctx: InsightContext) {
  return ctx.regime.current.toLowerCase()
}

// ── Templates ──

const templates: InsightTemplate[] = [
  // 1. BTC allocation vs target
  {
    id: 'btc-alloc',
    match: (ctx) => {
      const btc = findAlloc(ctx, 'BTC')
      return !!btc && Math.abs(btc.current - btc.target) > 3
    },
    build: (ctx) => {
      const btc = findAlloc(ctx, 'BTC')!
      const diff = btc.current - btc.target
      return {
        icon: 'zap',
        iconVariant: 'accent',
        text: `Your BTC allocation is ${btc.current}% — ${diff > 0 ? 'above' : 'below'} the ${btc.target}% target for a ${regimeLabel(ctx)} environment.`,
        link: true,
      }
    },
  },

  // 2. ETH allocation vs target
  {
    id: 'eth-alloc',
    match: (ctx) => {
      const eth = findAlloc(ctx, 'ETH')
      return !!eth && Math.abs(eth.current - eth.target) > 5
    },
    build: (ctx) => {
      const eth = findAlloc(ctx, 'ETH')!
      const diff = eth.current - eth.target
      return {
        icon: 'shield',
        iconVariant: 'eth',
        text: `ETH is at ${eth.current}% — ${Math.abs(diff).toFixed(0)}% ${diff > 0 ? 'above' : 'below'} target for this regime.`,
      }
    },
  },

  // 3. ALT concentration warning
  {
    id: 'alt-concentration',
    match: (ctx) => bucketWeight(ctx, 'ALT') > 40,
    build: (ctx) => {
      const altPct = Math.round(bucketWeight(ctx, 'ALT'))
      return {
        icon: 'activity',
        iconVariant: 'accent',
        text: `ALT concentration at ${altPct}% — higher altcoin exposure typically amplifies volatility in a ${regimeLabel(ctx)} regime.`,
        subtext: 'Consider whether this matches your risk tolerance.',
      }
    },
  },

  // 4. Posture alignment narrative
  {
    id: 'posture-aligned',
    match: (ctx) => ctx.portfolio.misalignment < 0.1 && ctx.portfolio.allocations.length > 0,
    build: (ctx) => ({
      icon: 'shield',
      iconVariant: 'positive',
      text: `Your portfolio is well-aligned with the current ${regimeLabel(ctx)} regime. Allocations are within target bands.`,
      subtext: 'No adjustments suggested by the current model.',
    }),
  },

  // 5. Posture misalignment warning
  {
    id: 'posture-misaligned',
    match: (ctx) => ctx.portfolio.misalignment > 0.2,
    build: (ctx) => {
      const pct = Math.round(ctx.portfolio.misalignment * 100)
      return {
        icon: 'activity',
        iconVariant: 'accent',
        text: `Portfolio misalignment is ${pct}% — your allocations diverge significantly from ${regimeLabel(ctx)} targets.`,
        subtext: 'This is analytical context, not a rebalancing signal.',
      }
    },
  },

  // 6. Regime persistence (long streak)
  {
    id: 'regime-persistence',
    match: (ctx) => ctx.regime.persistence >= 7,
    build: (ctx) => ({
      icon: 'trending',
      iconVariant: 'positive',
      text: `The ${regimeLabel(ctx)} regime has held for ${ctx.regime.persistence} days — a sustained trend with ${ctx.regime.confidence}% confidence.`,
      subtext: 'Longer regimes tend to be more reliable for allocation decisions.',
    }),
  },

  // 7. Low confidence warning
  {
    id: 'low-confidence',
    match: (ctx) => ctx.regime.confidence < 50 && ctx.regime.confidence > 0,
    build: (ctx) => ({
      icon: 'activity',
      iconVariant: 'neutral',
      text: `Regime confidence is ${ctx.regime.confidence}% — the model is uncertain about current conditions.`,
      subtext: 'Low confidence periods often precede regime transitions.',
    }),
  },

  // 8. STABLE bucket heavy
  {
    id: 'stable-heavy',
    match: (ctx) => {
      const stables = ctx.portfolio.allocations.filter(a =>
        ['USDT', 'USDC', 'DAI'].includes(a.asset)
      )
      return stables.reduce((sum, a) => sum + a.current, 0) > 30
    },
    build: (ctx) => {
      const stablePct = Math.round(
        ctx.portfolio.allocations
          .filter(a => ['USDT', 'USDC', 'DAI'].includes(a.asset))
          .reduce((sum, a) => sum + a.current, 0)
      )
      return {
        icon: 'shield',
        iconVariant: 'neutral',
        text: `Stablecoin allocation is ${stablePct}% — a defensive position${regimeLabel(ctx).includes('bull') ? ' that may limit upside capture in a bull regime' : ''}.`,
      }
    },
  },

  // 9. BTC dominant portfolio
  {
    id: 'btc-dominant',
    match: (ctx) => {
      const btc = findAlloc(ctx, 'BTC')
      return !!btc && btc.current > 60
    },
    build: (ctx) => {
      const btc = findAlloc(ctx, 'BTC')!
      return {
        icon: 'zap',
        iconVariant: 'accent',
        text: `BTC is ${btc.current}% of your portfolio — a concentrated position that tracks closely with overall market direction.`,
        subtext: regimeLabel(ctx).includes('bear')
          ? 'In bear regimes, high BTC concentration provides relative stability vs alts.'
          : undefined,
      }
    },
  },

  // 10. Regime transition hint
  {
    id: 'regime-fresh',
    match: (ctx) => ctx.regime.persistence <= 2 && ctx.regime.persistence > 0,
    build: (ctx) => ({
      icon: 'trending',
      iconVariant: 'accent',
      text: `New regime detected: ${ctx.regime.current} (day ${ctx.regime.persistence}). Early regime shifts can be noisy — confidence is at ${ctx.regime.confidence}%.`,
      subtext: 'The model typically needs 3-5 days to confirm a regime change.',
    }),
  },
]

// ── Engine ──

/**
 * Generates insight entries based on current portfolio and regime state.
 * Returns up to `max` insights, prioritized by template order.
 */
export function generateInsights(
  regime: RegimeData,
  portfolio: PortfolioData,
  max: number = 4
): EntryInsightData[] {
  const ctx: InsightContext = { regime, portfolio }
  const results: EntryInsightData[] = []

  for (const tpl of templates) {
    if (results.length >= max) break
    try {
      if (tpl.match(ctx)) {
        results.push(tpl.build(ctx))
      }
    } catch {
      // Skip broken template, don't crash feed
    }
  }

  return results
}
