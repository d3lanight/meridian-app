// ━━━ Market Context API ━━━
// v3.2.0 · ca-story56 · 2026-02-25
// Fetches regime history + price history + duration patterns + transitions
// Changelog (from v3.1.0):
//  - Aggregates regime transitions from rows where regime_changed = true
//  - Response includes transitions array + transition_count

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID_DAYS = [7, 30, 90] as const;
type ValidDays = (typeof VALID_DAYS)[number];

function parseDays(param: string | null): ValidDays {
  const n = Number(param);
  if (VALID_DAYS.includes(n as ValidDays)) return n as ValidDays;
  return 7;
}

// ── Transition Aggregation ────────────────────

interface Transition {
  from: string;
  to: string;
  count: number;
  last_seen: string;
}

function aggregateTransitions(regimes: any[]): Transition[] {
  // Filter for regime-change rows only
  const changes = regimes.filter(r => r.regime_changed && r.previous_regime);

  // Aggregate by from→to pair
  const map = new Map<string, { count: number; last_seen: string }>();

  for (const r of changes) {
    const key = `${r.previous_regime}→${r.regime}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { count: 1, last_seen: r.market_timestamp });
    } else {
      existing.count++;
      // Keep the most recent (changes are sorted DESC, so first seen = most recent)
      if (!existing.last_seen || r.market_timestamp > existing.last_seen) {
        existing.last_seen = r.market_timestamp;
      }
    }
  }

  // Convert to array
  const transitions: Transition[] = [];
  for (const [key, val] of map) {
    const [from, to] = key.split('→');
    transitions.push({ from, to, count: val.count, last_seen: val.last_seen });
  }

  // Sort by count DESC, then by last_seen DESC
  transitions.sort((a, b) => b.count - a.count || b.last_seen.localeCompare(a.last_seen));

  return transitions;
}

// ═══════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Parse ?days param
    const { searchParams } = new URL(request.url);
    const days = parseDays(searchParams.get('days'));

    // Calculate date cutoff
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffISO = cutoff.toISOString();

    // Parallel fetch: regime history (date-range) + price history + duration stats
    const [regimeResult, priceResult, durationResult] = await Promise.all([
      supabase
        .from('market_regimes')
        .select('market_timestamp, regime, previous_regime, regime_changed, confidence, price_now, r_1d, r_7d, vol_7d, eth_price_now, eth_r_7d, eth_vol_7d')
        .gte('created_at', cutoffISO)
        .order('created_at', { ascending: false }),
      supabase
        .from('crypto_prices')
        .select('timestamp, btc_usd, eth_usd')
        .order('timestamp', { ascending: false })
        .limit(14),
      supabase.rpc('regime_duration_stats'),
    ]);

    if (regimeResult.error) {
      console.error('market_regimes fetch error:', regimeResult.error);
      return NextResponse.json({ error: 'Failed to fetch regime data' }, { status: 500 });
    }

    if (priceResult.error) {
      console.error('crypto_prices fetch error:', priceResult.error);
      return NextResponse.json({ error: 'Failed to fetch price data' }, { status: 500 });
    }

    if (durationResult.error) {
      console.error('regime_duration_stats error:', durationResult.error);
      // Non-fatal — continue without duration patterns
    }

    // Normalize: rename market_timestamp → timestamp for frontend compatibility
    const regimes = (regimeResult.data ?? []).map((r: any) => ({
      timestamp: r.market_timestamp,
      regime: r.regime,
      previous_regime: r.previous_regime,
      regime_changed: r.regime_changed,
      confidence: r.confidence,
      price_now: r.price_now,
      r_1d: r.r_1d,
      r_7d: r.r_7d,
      vol_7d: r.vol_7d,
      eth_price_now: r.eth_price_now,
      eth_r_7d: r.eth_r_7d,
      eth_vol_7d: r.eth_vol_7d,
    }));

    // S56: Aggregate transitions from the full dataset (not just current timeframe)
    // Use raw regimeResult.data which has all rows in the date range
    const transitions = aggregateTransitions(regimeResult.data ?? []);

    return NextResponse.json({
      regimes,
      prices: priceResult.data ?? [],
      duration_patterns: durationResult.data ?? [],
      transitions,
      transition_count: transitions.reduce((sum, t) => sum + t.count, 0),
      row_count: regimes.length,
      days_requested: days,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Market context API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}