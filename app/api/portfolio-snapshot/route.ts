// ━━━ Portfolio Snapshot API ━━━
// v1.0.1 · ca-story39 · 2026-02-18
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

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

    const { data, error: expError } = await supabase
      .from('latest_exposure')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (expError || !data) {
      return NextResponse.json(EMPTY);
    }

    const exposure = data as unknown as ExposureRow;

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
      timestamp: exposure.timestamp,
    });
  } catch (err) {
    console.error('[portfolio-snapshot] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
