// ━━━ Ask API ━━━
// v1.0.0 · ca-story201 · 2026-03-12
// POST /api/ask — handles preset question taps from AgentPrompt
// Auth: required — 401 for unauthenticated
// Request:  { question_id: string, regime_window: number }
// Response: { answer, question_id, generated_at, regime_window }
//
// Question registry:
//   Market (free + pro): market.regime_today, market.regime_duration,
//     market.signals_now, market.volatility_context, market.sentiment_meaning
//   Portfolio (pro only): portfolio.my_posture, portfolio.biggest_risk,
//     portfolio.posture_score, portfolio.alt_exposure, portfolio.watch_today

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ─── 1. Question Registry ───────────────────────────────────────────────────

const MARKET_QUESTIONS: Record<string, string> = {
  'market.regime_today':       'What regime are we in and what does it mean?',
  'market.regime_duration':    'How long has this regime lasted and is that normal?',
  'market.signals_now':        'What are the key signals telling us right now?',
  'market.volatility_context': 'Is the current volatility normal for this regime?',
  'market.sentiment_meaning':  'What does the current market sentiment mean?',
}

const PORTFOLIO_QUESTIONS: Record<string, string> = {
  'portfolio.my_posture':    'How is my portfolio positioned for this regime?',
  'portfolio.biggest_risk':  'What is my biggest risk right now?',
  'portfolio.posture_score': 'Why is my posture score what it is?',
  'portfolio.alt_exposure':  'What does my ALT allocation mean in this market?',
  'portfolio.watch_today':   'What should I be watching in my portfolio today?',
}

const ALL_QUESTIONS = { ...MARKET_QUESTIONS, ...PORTFOLIO_QUESTIONS }

const VALID_WINDOWS = [7, 30, 90, 180, 360] as const
type ValidWindow = (typeof VALID_WINDOWS)[number]

function parseWindow(val: unknown): ValidWindow {
  const n = Number(val)
  return (VALID_WINDOWS as readonly number[]).includes(n) ? (n as ValidWindow) : 30
}

// ─── 2. Context Fetchers ─────────────────────────────────────────────────────

async function fetchMarketContext(supabase: Awaited<ReturnType<typeof createClient>>, window: ValidWindow) {
  const { data } = await supabase
    .from('market_regimes')
    .select('regime, confidence, is_volatile, r_1d, r_7d, r_30d, vol_7d, market_timestamp, previous_regime, regime_changed')
    .filter('window', 'eq', window)
    .order('market_timestamp', { ascending: false })
    .limit(1)
    .single()

  return data
}

async function fetchSentiment(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase
    .from('market_sentiment')
    .select('fear_greed_index, fear_greed_label, alt_season_index, updated_at')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()
  return data
}

async function fetchPortfolioContext(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, window: ValidWindow) {
  // Snapshot from portfolio-snapshot route logic — read holdings + prices for key metrics
  const { data: holdings } = await supabase
    .from('portfolio_holdings')
    .select('quantity, include_in_exposure, asset_mapping(symbol, name, category)')
    .eq('user_id', userId)
    .eq('include_in_exposure', true)

  const { data: snapshot } = await supabase
    .from('portfolio_snapshots')
    .select('btc_pct, eth_pct, alt_pct, stable_pct, risk_score, posture_label')
    .eq('user_id', userId)
    .single()

  const { data: riskPref } = await supabase
    .from('user_preferences')
    .select('value')
    .eq('user_id', userId)
    .eq('name', 'risk_profile')
    .maybeSingle()

  return { holdings, snapshot, riskProfile: riskPref?.value ?? 'neutral' }
}

// ─── 3. Prompt Builder ───────────────────────────────────────────────────────

function buildPrompt(
  questionId: string,
  questionText: string,
  regime: NonNullable<Awaited<ReturnType<typeof fetchMarketContext>>>,
  sentiment: Awaited<ReturnType<typeof fetchSentiment>>,
  portfolio: Awaited<ReturnType<typeof fetchPortfolioContext>> | null,
  window: ValidWindow
): string {
  const regimeLabel = regime.regime.replace('_', ' ')
  const confidencePct = Math.round((regime.confidence ?? 0) * 100)
  const r7d = regime.r_7d != null ? `${(regime.r_7d * 100).toFixed(1)}%` : 'N/A'
  const r30d = regime.r_30d != null ? `${(regime.r_30d * 100).toFixed(1)}%` : 'N/A'
  const vol7d = regime.vol_7d != null ? `${(regime.vol_7d * 100).toFixed(1)}%` : 'N/A'
  const isVolatile = regime.is_volatile ? 'Yes (volatile modifier active)' : 'No'
  const fgLabel = sentiment?.fear_greed_label ?? 'Unknown'
  const fgIndex = sentiment?.fear_greed_index ?? 'N/A'
  const altSeason = sentiment?.alt_season_index ?? 'N/A'

  let marketCtx = `
Current market data (${window}d window):
- Regime: ${regimeLabel} (confidence: ${confidencePct}%)
- Volatile modifier: ${isVolatile}
- 7d return: ${r7d} | 30d return: ${r30d}
- 7d volatility: ${vol7d}
- Fear & Greed: ${fgIndex} (${fgLabel})
- Alt Season Index: ${altSeason}
- Previous regime: ${regime.previous_regime ?? 'N/A'}
`.trim()

  let portfolioCtx = ''
  if (portfolio?.snapshot) {
    const s = portfolio.snapshot
    portfolioCtx = `
User portfolio context:
- Risk profile: ${portfolio.riskProfile}
- Posture score: ${s.risk_score ?? 'N/A'} (${s.posture_label ?? 'N/A'})
- BTC: ${s.btc_pct ?? 'N/A'}% | ETH: ${s.eth_pct ?? 'N/A'}% | ALT: ${s.alt_pct ?? 'N/A'}% | STABLE: ${s.stable_pct ?? 'N/A'}%
`.trim()
  }

  return `You are Meridian, an educational crypto intelligence assistant. You help users understand their portfolio and market context — you never recommend buying or selling.

${marketCtx}
${portfolioCtx ? '\n' + portfolioCtx : ''}

The user asked: "${questionText}"

Answer in 150 words or fewer. Be calm, educational, and specific to the data above. End with something the user can observe or understand — not an action to take. No trade recommendations. No "you should buy/sell". Write in plain English.`
}

// ─── 4. Route Handler ────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Auth required
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse body
  let body: { question_id?: unknown; regime_window?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { question_id, regime_window } = body

  // Validate question_id
  if (typeof question_id !== 'string' || !ALL_QUESTIONS[question_id]) {
    return NextResponse.json({ error: 'Unknown question_id' }, { status: 400 })
  }

  // Portfolio question gate — requires pro tier
  const isPortfolioQuestion = question_id in PORTFOLIO_QUESTIONS
  if (isPortfolioQuestion) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('tier')
      .eq('id', user.id)
      .single()

    if (profile?.tier !== 'pro') {
      return NextResponse.json({ error: 'Pro required for portfolio questions' }, { status: 403 })
    }
  }

  const window = parseWindow(regime_window)
  const questionText = ALL_QUESTIONS[question_id]

  // Fetch market context
  const regime = await fetchMarketContext(supabase, window)
  if (!regime) {
    return NextResponse.json({ error: 'Market data unavailable' }, { status: 503 })
  }

  const sentiment = await fetchSentiment(supabase)

  // Portfolio context — only for pro portfolio questions
  let portfolioCtx: Awaited<ReturnType<typeof fetchPortfolioContext>> | null = null
  if (isPortfolioQuestion) {
    portfolioCtx = await fetchPortfolioContext(supabase, user.id, window)
  }

  // Build prompt
  const prompt = buildPrompt(question_id, questionText, regime, sentiment, portfolioCtx, window)

  // Call Claude Haiku
  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!anthropicRes.ok) {
    const err = await anthropicRes.text()
    console.error('[/api/ask] Anthropic error:', err)
    return NextResponse.json({ error: 'AI unavailable' }, { status: 502 })
  }

  const anthropicData = await anthropicRes.json()
  const answer: string = anthropicData?.content?.[0]?.text ?? ''

  if (!answer) {
    return NextResponse.json({ error: 'Empty response from AI' }, { status: 502 })
  }

  return NextResponse.json({
    answer,
    question_id,
    generated_at: new Date().toISOString(),
    regime_window: window,
  })
}