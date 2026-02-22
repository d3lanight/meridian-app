// ━━━ Market Context API ━━━
// v2.1.0 · ca-story69 · 2026-02-22
// Fetches regime history + price history + held asset prices grouped by category
// Changelog (from v1.0.0):
//  - Added auth (needs user context for holdings)
//  - Added held_assets: user's holdings with live prices, grouped by category
//  - Prices sourced from portfolio_exposure.coingecko_prices_raw + crypto_prices fallback
//  - STABLE assets show $1.00 baseline with depeg detection
//  -  Fix timestamp column references (market_timestamp + created_at)

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Parallel fetch: regime history + price history
    const [regimeResult, priceResult] = await Promise.all([
      supabase
        .from('market_regimes')
        .select('market_timestamp, regime, previous_regime, regime_changed, confidence, price_now, r_1d, r_7d, vol_7d, eth_price_now, eth_r_7d, eth_vol_7d')
        .order('created_at', { ascending: false })
        .limit(7),
      supabase
        .from('crypto_prices')
        .select('timestamp, btc_usd, eth_usd')
        .order('timestamp', { ascending: false })
        .limit(14),
    ]);

    if (regimeResult.error) {
      console.error('market_regimes fetch error:', regimeResult.error);
      return NextResponse.json({ error: 'Failed to fetch regime data' }, { status: 500 });
    }

    if (priceResult.error) {
      console.error('crypto_prices fetch error:', priceResult.error);
      return NextResponse.json({ error: 'Failed to fetch price data' }, { status: 500 });
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

    return NextResponse.json({
      regimes,
      prices: priceResult.data ?? [],
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Market context API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}