// ━━━ Assets API — GET (list available assets) ━━━
// v1.1.0 · ca-story52 · 2026-02-21
// Changelog (from v1.0.0):
//  - Added name field to SELECT (from asset_mapping.name column)

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
    .select('id, symbol, name, coingecko_id, category, active')
    .eq('active', true)
    .order('symbol', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ assets: data });
}