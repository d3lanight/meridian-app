// ━━━ Market Context API ━━━
// v3.5.0 · S176 · Sprint 36 — is_volatile added to market_regimes select and regimes map
// v3.4.0 · S173 · Sprint 35 — current_prices for ALL symbols (not just BTC/ETH); change_24h rounded to 2dp
// Fetches regime history + price history + duration patterns + transitions + intraday signals
// Changelog:
//  v3.3.1 — S147: Added intraday_signals to response (last 6 snapshots from intraday_regimes)
//  v3.2.0 — S56: Aggregates regime transitions from rows where regime_changed = true
//  v3.1.0 — S145: current_prices from asset_prices cache

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID_DAYS = [7, 30, 90] as const;
type ValidDays = (typeof VALID_DAYS)[number];

function parseDays(param: string | null): ValidDays {
  const n = Number(param);
  if (VALID_DAYS.includes(n as ValidDays)) return n as ValidDays;
  return 7;
}

interface Transition {
  from: string;
  to: string;
  count: number;
  last_seen: string;
}

function aggregateTransitions(regimes: any[]): Transition[] {
  const changes = regimes.filter(r => r.regime_changed && r.previous_regime);

  const map = new Map<string, { count: number; last_seen: string }>();

  for (const r of changes) {
    const key = `${r.previous_regime}→${r.regime}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { count: 1, last_seen: r.market_timestamp });
    } else {
      existing.count++;
      if (!existing.last_seen || r.market_timestamp > existing.last_seen) {
        existing.last_seen = r.market_timestamp;
      }
    }
  }

  const transitions: Transition[] = [];
  for (const [key, val] of map) {
    const [from, to] = key.split('→');
    transitions.push({ from, to, count: val.count, last_seen: val.last_seen });
  }

  transitions.sort((a, b) => b.count - a.count || b.last_seen.localeCompare(a.last_seen));

  return transitions;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const days = parseDays(searchParams.get('days'));

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffISO = cutoff.toISOString();

    const [regimeResult, priceResult, durationResult, livePriceResult, intradayResult] = await Promise.all([
      supabase
        .from('market_regimes')
        .select('market_timestamp, regime, previous_regime, regime_changed, confidence, price_now, r_1d, r_7d, vol_7d, is_volatile, eth_price_now, eth_r_7d, eth_vol_7d')
        .gte('created_at', cutoffISO)
        .order('created_at', { ascending: false }),
      supabase
        .from('crypto_prices')
        .select('timestamp, btc_usd, eth_usd')
        .order('timestamp', { ascending: false })
        .limit(14),
      supabase.rpc('regime_duration_stats'),
      supabase
        .from('asset_prices')
        .select('price_usd, change_24h, recorded_at, asset_mapping!inner(symbol)'),
      supabase
        .from('intraday_regimes')
        .select('regime, confidence, btc_r_short, eth_r_short, eth_confirming, created_at')
        .order('created_at', { ascending: false })
        .limit(6),
    ]);

    const currentPrices: Record<string, { price: number; change_24h: number; recorded_at: string }> = {}
    for (const row of (livePriceResult.data ?? []) as any[]) {
      const symbol = row.asset_mapping?.symbol
      if (symbol) {
        currentPrices[symbol] = {
          price: Number(row.price_usd),
          change_24h: Math.round(Number(row.change_24h) * 100) / 100,
          recorded_at: row.recorded_at,
        }
      }
    }

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
    }

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
      is_volatile: r.is_volatile ?? false,
    }));

    const transitions = aggregateTransitions(regimeResult.data ?? []);

    const intradaySignals = (intradayResult?.data ?? []).map((r: any) => ({
      time: r.created_at,
      regime: r.regime,
      confidence: r.confidence,
      btc_r_short: r.btc_r_short,
      eth_r_short: r.eth_r_short,
      eth_confirming: r.eth_confirming,
    }));

    return NextResponse.json({
      regimes,
      prices: priceResult.data ?? [],
      duration_patterns: durationResult.data ?? [],
      transitions,
      transition_count: transitions.reduce((sum, t) => sum + t.count, 0),
      row_count: regimes.length,
      days_requested: days,
      generated_at: new Date().toISOString(),
      current_prices: currentPrices,
      intraday_signals: intradaySignals,
    });
  } catch (err) {
    console.error('Market context API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}