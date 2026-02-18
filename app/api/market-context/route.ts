// app/api/market-context/route.ts
// v1.0.0 — Story 40: Market Context API
// Fetches regime history + price history from Supabase (public market data)

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Parallel fetch: regime history + price history
    const [regimeResult, priceResult] = await Promise.all([
      supabase
        .from('market_regimes')
        .select('timestamp, regime, previous_regime, regime_changed, confidence, price_now, r_1d, r_7d, vol_7d, eth_price_now, eth_r_7d, eth_vol_7d')
        .order('timestamp', { ascending: false })
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

    return NextResponse.json({
      regimes: regimeResult.data ?? [],
      prices: priceResult.data ?? [],
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Market context API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}