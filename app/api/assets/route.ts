// ━━━ Assets API — GET (list available assets) ━━━
// v1.0.0 · ca-story48 · 2026-02-21

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('asset_mapping')
    .select('id, symbol, coingecko_id, category, active')
    .eq('active', true)
    .order('symbol', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ assets: data });
}
