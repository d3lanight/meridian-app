// ━━━ Assets API — GET (list available assets) ━━━
// v2.0.0 · ca-story109 · 2026-03-01
// Changelog:
//  v1.1.0 — Added name field to SELECT
//  v2.0.0 — S109: Added icon_url, subcategory, rank. Top 20 by rank default, ?all=true for full list

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const showAll = searchParams.get('all') === 'true';

  let query = supabase
    .from('asset_mapping')
    .select('id, symbol, name, coingecko_id, category, subcategory, icon_url, rank, active')
    .eq('active', true)
    .order('rank', { ascending: true, nullsFirst: false });

  if (!showAll) {
    query = query.limit(20);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ assets: data });
}