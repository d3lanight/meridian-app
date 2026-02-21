// ━━━ Portfolio Snapshot API ━━━
// v1.2.0 · ca-story48 · 2026-02-21
// Changelog:
//  v1.1.0 — Enriched holdings with cost_basis + category
//  v1.2.0 — Enriched holdings include include_in_exposure flag

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { EnrichedHolding } from '@/types';

interface ExposureRow {
  btc_weight_all: number | null;
  eth_weight_all: number | null;
  alt_weight_all: number | null;
  btc_value_usd: string | number | null;
  eth_value_usd: string | number | null;
  alt_value_usd: string | number | null;
  alt_count: number | null;
  alt_unpriced: string | null;
  alt_breakdown: string | unknown[] | null;
  total_value_usd_all: string | number | null;
  holdings_count: number | null;
  holdings_json: string | unknown[] | null;
  timestamp: string | null;
}

const EMPTY = {
  isEmpty: true,
  btc_weight_all: 0, eth_weight_all: 0, alt_weight_all: 0,
  btc_value_usd: 0, eth_value_usd: 0, alt_value_usd: 0,
  alt_count: 0, alt_unpriced: '[]', alt_breakdown: [],
  total_value_usd_all: 0, holdings_count: 0, holdings_json: [],
  enriched_holdings: [],
  timestamp: null,
};

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parallel fetch: exposure snapshot + enriched holdings
    const [expResult, holdingsResult] = await Promise.all([
      supabase
        .from('latest_exposure')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from('portfolio_holdings')
        .select('asset, quantity, cost_basis, include_in_exposure')
        .eq('user_id', user.id)
        .order('asset', { ascending: true }),
    ]);

    if (expResult.error || !expResult.data) {
      return NextResponse.json(EMPTY);
    }

    const exposure = expResult.data as unknown as ExposureRow;

    // Build category lookup from asset_mapping
    const { data: mappings } = await supabase
      .from('asset_mapping')
      .select('symbol, category')
      .eq('active', true);

    const categoryMap: Record<string, string> = {};
    if (mappings) {
      for (const m of mappings) {
        categoryMap[m.symbol] = m.category;
      }
    }

    // Build enriched holdings array
    const enrichedHoldings: EnrichedHolding[] = (holdingsResult.data ?? []).map((h: any) => ({
      asset: h.asset,
      quantity: Number(h.quantity) || 0,
      cost_basis: h.cost_basis != null ? Number(h.cost_basis) : null,
      category: (categoryMap[h.asset] as EnrichedHolding['category']) ?? null,
      include_in_exposure: h.include_in_exposure ?? true,
    }));

    let altBreakdown = exposure.alt_breakdown;
    if (typeof altBreakdown === 'string') {
      try { altBreakdown = JSON.parse(altBreakdown); } catch { altBreakdown = []; }
    }
    let holdingsJson = exposure.holdings_json;
    if (typeof holdingsJson === 'string') {
      try { holdingsJson = JSON.parse(holdingsJson); } catch { holdingsJson = []; }
    }

    return NextResponse.json({
      isEmpty: false,
      btc_weight_all: exposure.btc_weight_all ?? 0,
      eth_weight_all: exposure.eth_weight_all ?? 0,
      alt_weight_all: exposure.alt_weight_all ?? 0,
      btc_value_usd: Number(exposure.btc_value_usd) || 0,
      eth_value_usd: Number(exposure.eth_value_usd) || 0,
      alt_value_usd: Number(exposure.alt_value_usd) || 0,
      alt_count: exposure.alt_count ?? 0,
      alt_unpriced: exposure.alt_unpriced ?? '[]',
      alt_breakdown: altBreakdown ?? [],
      total_value_usd_all: Number(exposure.total_value_usd_all) || 0,
      holdings_count: exposure.holdings_count ?? 0,
      holdings_json: holdingsJson ?? [],
      enriched_holdings: enrichedHoldings,
      timestamp: exposure.timestamp,
    });
  } catch (err) {
    console.error('[portfolio-snapshot] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
