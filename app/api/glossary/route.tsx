// ━━━ Glossary API ━━━
// v2.2.0 · ca-story85 · Sprint 20
// S85: EntryLearn integration — glossary API, tap-to-expand, regime-contextual content

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  const term = searchParams.get('term')

  const supabase = await createClient()

  let query = supabase
    .from('payload_knowledge_entries')
    .select('slug, title, summary, raw_markdown, related_regime_id, sort_order')
    .eq('category', 'glossary')
    .eq('status', 'published')
    .order('sort_order', { ascending: true })

  // Single entry lookup by slug
  if (slug) {
    query = query.eq('slug', slug)
  }

  // Single entry lookup by term (fuzzy match on title)
  if (term) {
    query = query.ilike('title', term)
  }

  // Filter by regime type (e.g. ?regime=bull)
  const regime = searchParams.get('regime')
  if (regime) {
    query = query.eq('related_regime_id', regime)
  }

  // Random selection (e.g. ?random=2)
  const random = searchParams.get('random')
  if (random) {
    const { data: allData } = await supabase
      .from('payload_knowledge_entries')
      .select('slug, title, summary, related_regime_id')
      .eq('category', 'glossary')
      .eq('status', 'published')

    const count = Math.min(parseInt(random) || 2, 5)
    const shuffled = (allData ?? []).sort(() => Math.random() - 0.5).slice(0, count)
    return NextResponse.json(shuffled)
  }

  const { data, error } = await query

  if (error) {
    console.error('Glossary fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch glossary' }, { status: 500 })
  }

  // Single lookup returns object, list returns array
  if ((slug || term) && data?.length === 1) {
    return NextResponse.json(data[0], {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    })
  }

  return NextResponse.json(data ?? [], {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  })
}