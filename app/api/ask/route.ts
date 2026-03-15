// ━━━ Ask API ━━━
// v2.2.0 · 2026-03-15
// POST /api/ask — handles preset question taps from AgentPrompt
// Auth: required — 401 for unauthenticated
// Request:  { question_id: string, regime_window: number }
// Response: { answer, question_id, generated_at, regime_window }
//
// Changelog:
//   v2.2.0 — Context Behaviour section parsed from ca-doc-agent-config.
//            contextBehaviourAsk injected into prompt as format block.
//            Hardcoded FORMAT_CONSTRAINT removed — format is now config-driven.
//            Fallback mirrors doc values so behaviour is identical on fetch failure.
//   v2.1.0 — Fix sentiment: fear_greed_value / alt_season_value (correct column names).
//            Fix portfolio context: source switched to portfolio_exposure
//            (was portfolio_snapshots — columns do not exist on that table).
//   v2.0.0 — Runtime config from ca-doc-agent-config. buildPrompt config param.
//            question registry remains in code.
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

// ─── 2. Agent Config ─────────────────────────────────────────────────────────

interface AgentConfig {
  identity: string
  toneRules: string
  outputFormatRules: string
  contextBehaviourAsk: string
  wordLimit: number
  model: string
  maxTokens: number
}

const CONFIG_FALLBACK: AgentConfig = {
  identity:
    'You are Meridian, an educational crypto market intelligence assistant. You help users understand their portfolio and market context. You never recommend buying or selling.',
  toneRules:
    'Calm and educational. Plain English. Specific to the data provided. Non-prescriptive.',
  outputFormatRules:
    'Follow the formatting rules defined in the Format block below. Do not mention "Meridian" in the response text. No price targets or percentage predictions.',
  contextBehaviourAsk:
    'Use markdown. Structure with short paragraphs, **bold** key terms and values. Never produce a wall of text. Use line breaks to breathe.',
  wordLimit: 150,
  model: 'claude-haiku-4-5-20251001',
  maxTokens: 300,
}

function parseSection(markdown: string, heading: string): string {
  const re = new RegExp(`## ${heading}\\n([\\s\\S]*?)(?=\\n## |$)`, 'i')
  const match = markdown.match(re)
  return match ? match[1].trim() : ''
}

function parseContextBehaviour(markdown: string, context: 'ask' | 'briefing'): string {
  const section = parseSection(markdown, 'Context Behaviour')
  if (!section) return ''
  const re = new RegExp(`### ${context}\\n([\\s\\S]*?)(?=\\n### |$)`, 'i')
  const match = section.match(re)
  return match ? match[1].trim() : ''
}

function parseWordLimit(markdown: string, key: string): number {
  const section = parseSection(markdown, 'Word Limits')
  const re = new RegExp(`\\|\\s*${key}\\s*\\|\\s*(\\d+)`)
  const match = section.match(re)
  return match ? parseInt(match[1], 10) : CONFIG_FALLBACK.wordLimit
}

function parseModel(markdown: string): { model: string; maxTokens: number } {
  const section = parseSection(markdown, 'Model')
  const modelMatch = section.match(/model:\s*(\S+)/)
  const tokensMatch = section.match(/max_tokens_ask:\s*(\d+)/)
  return {
    model: modelMatch ? modelMatch[1] : CONFIG_FALLBACK.model,
    maxTokens: tokensMatch ? parseInt(tokensMatch[1], 10) : CONFIG_FALLBACK.maxTokens,
  }
}

async function fetchAgentConfig(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<AgentConfig> {
  try {
    const { data, error } = await supabase
      .from('payload_project_docs')
      .select('raw_markdown')
      .eq('slug', 'ca-doc-agent-config')
      .single()

    if (error || !data?.raw_markdown) {
      console.warn('[/api/ask] config=fallback — fetch error or empty doc', error?.message)
      return CONFIG_FALLBACK
    }

    const md = data.raw_markdown
    const { model, maxTokens } = parseModel(md)

    return {
      identity: parseSection(md, 'Identity') || CONFIG_FALLBACK.identity,
      toneRules: parseSection(md, 'Tone Rules') || CONFIG_FALLBACK.toneRules,
      outputFormatRules: parseSection(md, 'Output Format Rules') || CONFIG_FALLBACK.outputFormatRules,
      contextBehaviourAsk: parseContextBehaviour(md, 'ask') || CONFIG_FALLBACK.contextBehaviourAsk,
      wordLimit: parseWordLimit(md, 'ask_response'),
      model,
      maxTokens,
    }
  } catch (err) {
    console.warn('[/api/ask] config=fallback — unexpected error', err)
    return CONFIG_FALLBACK
  }
}

// ─── 3. Context Fetchers ─────────────────────────────────────────────────────

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
  // v2.1.0: correct column names — fear_greed_value / alt_season_value
  // (fear_greed_index / alt_season_index do not exist)
  const { data } = await supabase
    .from('market_sentiment')
    .select('fear_greed_value, fear_greed_label, alt_season_value, updated_at')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()
  return data
}

async function fetchPortfolioContext(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  // v2.1.0: source switched from portfolio_snapshots to portfolio_exposure
  // (btc_pct / eth_pct / alt_pct / stable_pct / risk_score / posture_label
  //  do not exist on portfolio_snapshots)
  const { data: exposure } = await supabase
    .from('portfolio_exposure')
    .select('btc_weight_all, eth_weight_all, alt_weight_all, holdings_count, regime_status')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const { data: riskPref } = await supabase
    .from('user_preferences')
    .select('value')
    .eq('user_id', userId)
    .eq('name', 'risk_profile')
    .maybeSingle()

  return { exposure, riskProfile: riskPref?.value ?? 'neutral' }
}

// ─── 4. Prompt Builder ───────────────────────────────────────────────────────

function buildPrompt(
  config: AgentConfig,
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
  const fgValue = sentiment?.fear_greed_value ?? 'N/A'
  const altSeason = sentiment?.alt_season_value ?? 'N/A'

  const marketCtx = `
Current market data (${window}d window):
- Regime: ${regimeLabel} (confidence: ${confidencePct}%)
- Volatile modifier: ${isVolatile}
- 7d return: ${r7d} | 30d return: ${r30d}
- 7d volatility: ${vol7d}
- Fear & Greed: ${fgValue} (${fgLabel})
- Alt Season Index: ${altSeason}
- Previous regime: ${regime.previous_regime ?? 'N/A'}
`.trim()

  let portfolioCtx = ''
  if (portfolio?.exposure) {
    const e = portfolio.exposure
    const btcPct = Math.round((e.btc_weight_all ?? 0) * 100)
    const ethPct = Math.round((e.eth_weight_all ?? 0) * 100)
    const altPct = Math.round((e.alt_weight_all ?? 0) * 100)
    const stablePct = Math.max(0, 100 - btcPct - ethPct - altPct)
    portfolioCtx = `
User portfolio context:
- Risk profile: ${portfolio.riskProfile}
- Portfolio posture: ${e.regime_status ?? 'tracked'}
- BTC: ${btcPct}% | ETH: ${ethPct}% | ALT: ${altPct}% | STABLE: ${stablePct}%
- Holdings: ${e.holdings_count ?? 0}
`.trim()
  }

  return `${config.identity}

Tone: ${config.toneRules}

${marketCtx}
${portfolioCtx ? '\n' + portfolioCtx : ''}

The user asked: "${questionText}"

Answer in ${config.wordLimit} words or fewer.

Format:
${config.contextBehaviourAsk}`
}

// ─── 5. Route Handler ────────────────────────────────────────────────────────

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

  // Fetch agent config at runtime
  const config = await fetchAgentConfig(supabase)

  // Fetch market context
  const regime = await fetchMarketContext(supabase, window)
  if (!regime) {
    return NextResponse.json({ error: 'Market data unavailable' }, { status: 503 })
  }

  const sentiment = await fetchSentiment(supabase)

  // Portfolio context — only for pro portfolio questions
  let portfolioCtx: Awaited<ReturnType<typeof fetchPortfolioContext>> | null = null
  if (isPortfolioQuestion) {
    portfolioCtx = await fetchPortfolioContext(supabase, user.id)
  }

  // Build prompt
  const prompt = buildPrompt(config, question_id, questionText, regime, sentiment, portfolioCtx, window)

  // Call Claude
  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: config.maxTokens,
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