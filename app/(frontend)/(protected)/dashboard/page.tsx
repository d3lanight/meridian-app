// ━━━ Today Page ━━━
// v5.1.0 · S211 · Sprint 43
// Purpose: Today dashboard — personalised header, regime block, prices trio.
// Changelog:
//   v5.1.0 — S211: Personalised greeting header (display_name, first-token split).
//             Date line (DM Mono). ActivityBadge with notification dot.
//             Regime row: label + day count + gain % + window badge.
//             Prices trio: BTC / ETH / BTC.D with dividers.
//             Replaced old anonymous header block with auth-aware greeting.
//   v5.0.0 — S202+S204: Live briefing, AgentPrompt wired, AnswerCard, /api/ask.
//   v4.x   — See codebase skill.
// Affected files: app/(frontend)/dashboard/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Home, Activity, Shield, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { M } from '@/lib/meridian'
import { card, anim } from '@/lib/ui-helpers'
import { getRegimeConfig } from '@/lib/regime-utils'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/contexts/UserContext'
import { useAuthSheet } from '@/contexts/AuthSheetContext'
import {
  Briefing,
  AgentPrompt,
  ActivityBadge,
  InsightCard,
  LearnCard,
} from '@/components/today'
import { AnswerCard } from '@/components/agent'
import type { RegimeData, Signal, MarketMetrics } from '@/types'

// ── Font constants ─────────────────────────────────────────────────────────

const FONT_DISPLAY = "'Outfit', sans-serif"
const FONT_BODY    = "'DM Sans', sans-serif"
const FONT_MONO    = "'DM Mono', monospace"

// ── Regime gradient wash (top of page background) ─────────────────────────

function regimeGradientWash(regimeCurrent: string): string {
  const r = regimeCurrent.toLowerCase()
  if (r.includes('bull'))  return 'linear-gradient(180deg,rgba(42,157,143,.15) 0%,transparent 100%)'  // teal
  if (r.includes('bear'))  return 'linear-gradient(180deg,rgba(231,111,81,.13) 0%,transparent 100%)'   // coral
  if (r.includes('volat')) return 'linear-gradient(180deg,rgba(212,160,23,.13) 0%,transparent 100%)'   // amber
  return 'linear-gradient(180deg,rgba(91,127,166,.13) 0%,transparent 100%)'                            // steel blue (range)
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Returns first word of a free-text display name, or full string if no space. */
function firstName(name: string | null | undefined): string {
  if (!name) return ''
  return name.trim().split(/\s+/)[0]
}

/** Returns "Good morning / afternoon / evening" based on local hour. */
function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

/** Formats today as "Friday · March 13" */
function todayLabel(): string {
  const now = new Date()
  const day  = now.toLocaleDateString('en-US', { weekday: 'long' })
  const date = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  return `${day} · ${date}`
}

/** Format USD price compactly. */
function formatPrice(n: number): string {
  if (n >= 1000) return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (n >= 1)    return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 2 })
  return '$' + n.toPrecision(3)
}

/** Uppercase regime label from raw DB key — not needed, mapRegime already returns the full label. */

/** Colour for the regime label text — matches against full label string from mapRegime. */
function regimeLabelColor(regimeCurrent: string): string {
  const r = regimeCurrent.toLowerCase()
  if (r.includes('bull'))  return M.positive
  if (r.includes('bear'))  return M.negative
  if (r.includes('volat')) return M.volatility
  return '#5B7FA6'
}

// ── Types ──────────────────────────────────────────────────────────────────

interface BriefingApiResponse {
  status: 'pending' | 'ready'
  content?: string
}

interface AskApiResponse {
  answer: string
  question_id: string
  generated_at: string
  regime_window: number
}

// ── Nav config ─────────────────────────────────────────────────────────────

const NAV_TABS = [
  { id: 'home',     label: 'Today',    icon: Home,     href: '/dashboard' },
  { id: 'market',   label: 'Pulse',    icon: Activity, href: '/market'    },
  { id: 'exposure', label: 'Exposure', icon: Shield,   href: '/exposure'  },
  { id: 'profile',  label: 'Profile',  icon: User,     href: '/profile'   },
]

// ── Page ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router        = useRouter()
  const { userId, displayName, tier, isAnon, loading: userLoading, regimeWindow } = useUser()
  const { openAuth }  = useAuthSheet()
  const isPro         = tier === 'pro'
  const handleOpenAuth = () => openAuth('dashboard-cta')

  // ── Market data ────────────────────────────────────────────────────────
  const [regime,  setRegime]  = useState<RegimeData | null>(null)
  const [metrics, setMetrics] = useState<MarketMetrics | null>(null)
  const [signals, setSignals] = useState<Signal[]>([])
  const [regimeDay, setRegimeDay] = useState<number | null>(null)

  // ── Briefing ───────────────────────────────────────────────────────────
  const [briefingContent,  setBriefingContent]  = useState<string | undefined>(undefined)
  const [briefingPending,  setBriefingPending]  = useState(true)

  // ── Ask / AgentPrompt ──────────────────────────────────────────────────
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null)
  const [answer,         setAnswer]         = useState<AskApiResponse | null>(null)
  const [answerQuestion, setAnswerQuestion] = useState<string>('')

  // ── Posture ────────────────────────────────────────────────────────────
  const [postureLabel, setPostureLabel] = useState<string | null>(null)

  // ── Mount animation ────────────────────────────────────────────────────
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(t)
  }, [])

  // ── Fetch: regime — same source + window as Pulse page ────────────────
  useEffect(() => {
    if (userLoading) return
    fetch(`/api/market-context?window=${regimeWindow}&days=${regimeWindow}`)
      .then(r => r.ok ? r.json() : null)
      .then((data: any) => {
        if (!data?.regimes?.length) return
        const latest = data.regimes[0]
        if (!latest) return
        const REGIME_LABELS: Record<string, string> = {
          bull: 'Bull Market', bear: 'Bear Market',
          range: 'Range', volatility: 'High Volatility',
          insufficient_data: 'Insufficient Data',
        }
        const r1d  = (latest.r_1d  ?? 0) * 100
        const r7d  = (latest.r_7d  ?? 0) * 100
        const vol  = (latest.vol_7d ?? 0) * 100
        const regimeData: RegimeData = {
          current:     REGIME_LABELS[latest.regime] ?? latest.regime ?? 'Unknown',
          confidence:  Math.round((latest.confidence ?? 0) * 100),
          persistence: 0,
          trend:       `${r7d >= 0 ? '+' : ''}${r7d.toFixed(1)}%`,
          dailyShift:  r1d > 3 ? 'High' : r1d > -3 ? 'Moderate' : 'Low',
          volatility:  `${vol.toFixed(0)}%`,
        }
        setRegime(regimeData)
        const rows  = data.regimes as { regime: string }[]
        const first = rows[0]?.regime
        let count = 0
        for (const row of rows) {
          if (row.regime !== first) break
          count++
        }
        setRegimeDay(count)
      })
      .catch(() => {})
  }, [userLoading, regimeWindow])

  // ── Fetch: metrics from /api/market (window-invariant) ────────────────
  useEffect(() => {
    fetch('/api/market')
      .then(r => r.ok ? r.json() : null)
      .then((data: any) => {
        if (!data) return
        setMetrics(data.metrics ?? null)
      })
      .catch(() => {})
  }, [])

  // ── Fetch: briefing (auth only) ────────────────────────────────────────
  useEffect(() => {
    if (isAnon) { setBriefingPending(false); return }
    fetch('/api/briefing')
      .then(r => r.ok ? r.json() : null)
      .then((data: BriefingApiResponse | null) => {
        if (!data) { setBriefingPending(false); return }
        if (data.status === 'ready') {
          setBriefingContent(data.content)
          setBriefingPending(false)
        } else {
          setBriefingPending(true)
        }
      })
      .catch(() => setBriefingPending(false))
  }, [isAnon])

  // ── Fetch: portfolio snapshot for posture label ────────────────────────
  useEffect(() => {
    if (isAnon) return
    fetch('/api/portfolio-snapshot')
      .then(r => r.ok ? r.json() : null)
      .then((data: any) => {
        if (!data) return
        const score = data.posture_score ?? null
        if (score === null) return
        if      (score >= 80) setPostureLabel('Aligned')
        else if (score >= 50) setPostureLabel('On track')
        else                  setPostureLabel('Off target')
      })
      .catch(() => {})
  }, [isAnon])

  // ── Handle question chip tap ───────────────────────────────────────────
  const handleQuestion = useCallback(async (questionId: string) => {
    if (isAnon) { openAuth('agent-prompt-question'); return }
    setActiveQuestion(questionId)
    setAnswer(null)

    // Find the question label from AgentPrompt QUESTIONS (sourced from component)
    const labelMap: Record<string, string> = {
      'market.regime_today':       'What regime are we in?',
      'market.regime_duration':    'How long has this regime lasted?',
      'market.signals_now':        'Key signals right now',
      'market.volatility_context': 'Is volatility normal?',
      'market.sentiment_meaning':  'What does sentiment mean?',
      'portfolio.my_posture':      'How is my portfolio positioned?',
      'portfolio.biggest_risk':    'My biggest risk right now',
      'portfolio.posture_score':   'Why is my posture score this?',
      'portfolio.alt_exposure':    'What does my ALT allocation mean?',
      'portfolio.watch_today':     'What to watch in my portfolio',
    }
    setAnswerQuestion(labelMap[questionId] ?? questionId)

    try {
      const res  = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_id: questionId, regime_window: regimeWindow }),
      })
      if (!res.ok) throw new Error(`ask ${res.status}`)
      const data: AskApiResponse = await res.json()
      setAnswer(data)
    } catch {
      // silently fail — AnswerCard won't appear
    } finally {
      setActiveQuestion(null)
    }
  }, [isAnon, openAuth, regimeWindow])

  const handleProTap = useCallback(() => {
    // Navigate to Profile where ProUpgradeCard is surfaced
    router.push('/profile')
  }, [router])

  // ── Derived display values ─────────────────────────────────────────────
  const name        = firstName(displayName)
  const greetText   = greeting()
  const dateText    = todayLabel()
  const regimeType  = regime?.current ?? ''           // already full label from mapRegime
  const labelText   = regimeType
  const labelColor  = regimeLabelColor(regimeType)

  // Gain % — regime.trend is already formatted like "+4.1%" from mapRegime
  const gainLabel   = regime?.trend ?? null

  const btcDom      = metrics?.btcDominance ?? null   // camelCase per MarketMetrics type

  // BTC + ETH prices from /api/market-context current_prices record
  const [btcPrice, setBtcPrice] = useState<number | null>(null)
  const [ethPrice,  setEthPrice] = useState<number | null>(null)
  useEffect(() => {
    fetch('/api/market-context?window=30&days=7')
      .then(r => r.ok ? r.json() : null)
      .then((data: any) => {
        const prices = data?.current_prices ?? {}   // snake_case per route.ts payload
        if (prices['BTC']?.price) setBtcPrice(prices['BTC'].price)
        if (prices['ETH']?.price) setEthPrice(prices['ETH'].price)
      })
      .catch(() => {})
  }, [])

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: '100dvh',
      background: M.bg,
      fontFamily: FONT_BODY,
      position: 'relative',
    }}>

      {/* ── Regime wash — colour reacts to current regime ── */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: 320,
        background: regimeGradientWash(regimeType),
        pointerEvents: 'none',
        zIndex: 0,
        transition: 'background 0.6s ease',
      }} />

      {/* ── Scrollable content ── */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: 430,
        margin: '0 auto',
        paddingBottom: 96,
        overflowX: 'hidden',
      }}>

        {/* ═══════════════════════════════════════════════════════════════
            HEADER — S211
        ════════════════════════════════════════════════════════════════ */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: '14px 20px 8px',
          ...anim(mounted, 0),
        }}>
          <div>
            <div style={{
              fontSize: 11,
              color: M.textMuted,
              fontWeight: 500,
              fontFamily: FONT_BODY,
              marginBottom: 4,
            }}>
              {dateText}
            </div>
            <div style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 26,
              fontWeight: 600,
              color: M.text,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
            }}>
              {greetText}{name ? `,\n${name}.` : '.'}
            </div>
          </div>

          {/* Bell — uses existing ActivityBadge */}
          <div style={{ marginTop: 4, flexShrink: 0 }}>
            <ActivityBadge count={1} />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            REGIME ROW — S211
        ════════════════════════════════════════════════════════════════ */}
        {regime && (
          <div style={{
            padding: '2px 20px 4px',
            ...anim(mounted, 1),
          }}>
            {/* Regime label */}
            <div style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase' as const,
              color: labelColor,
              marginBottom: 4,
            }}>
              {labelText}
            </div>

            {/* Stats row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexWrap: 'wrap' as const,
            }}>
              {regimeDay !== null && (
                <span style={{
                  fontSize: 12,
                  color: M.textMuted,
                }}>
                  {regimeDay}th day
                </span>
              )}
              {gainLabel && (
                <>
                  <span style={{ fontSize: 12, color: M.textMuted, opacity: 0.4 }}>·</span>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: M.positive,
                    fontFamily: FONT_BODY,
                  }}>
                    {gainLabel}
                  </span>
                </>
              )}
              {/* Window badge */}
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '1px 7px',
                borderRadius: 9,
                background: 'rgba(255,255,255,0.52)',
                color: M.textSecondary,
                fontSize: 10,
                fontWeight: 600,
                fontFamily: FONT_BODY,
                border: `1px solid rgba(255,255,255,0.7)`,
              }}>
                {regimeWindow}d
              </span>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            PRICES TRIO — S211
        ════════════════════════════════════════════════════════════════ */}
        {(btcPrice || ethPrice || btcDom) && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 20px 14px',
            ...anim(mounted, 2),
          }}>
            {[
              { sym: 'BTC',   val: btcPrice  !== null ? formatPrice(btcPrice)               : null },
              { sym: 'ETH',   val: ethPrice  !== null ? formatPrice(ethPrice)               : null },
              { sym: 'BTC.D', val: btcDom    !== null ? `${btcDom.toFixed(1)}%`             : null },
            ]
              .filter(item => item.val !== null)
              .map((item, i) => (
                <div key={item.sym} style={{ display: 'flex', alignItems: 'center' }}>
                  {i > 0 && (
                    <div style={{
                      width: 1,
                      height: 24,
                      background: `rgba(45,36,22,.1)`,
                      margin: '0 18px',
                    }} />
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{
                      fontSize: 10,
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.1em',
                      color: M.textMuted,
                      fontWeight: 600,
                      fontFamily: FONT_BODY,
                    }}>
                      {item.sym}
                    </div>
                    <div style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: M.text,
                      letterSpacing: '-0.01em',
                      fontFamily: FONT_BODY,
                    }}>
                      {item.val}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            BRIEFING — existing Briefing component (unchanged)
        ════════════════════════════════════════════════════════════════ */}
        {!isAnon && (
          <div style={{ padding: '0 16px 16px', ...anim(mounted, 3) }}>
            <Briefing
              content={briefingContent}
              isPending={briefingPending}
            />
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            POSTURE ROW — shown for authenticated users with posture data
        ════════════════════════════════════════════════════════════════ */}
        {!isAnon && postureLabel && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 20px 16px',
            ...anim(mounted, 4),
          }}>
            <Shield size={16} color={M.textMuted} />
            <span style={{ fontSize: 13, color: M.textSecondary }}>
              Positions aligned with regime
            </span>
            <div style={{
              marginLeft: 'auto',
              padding: '3px 10px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 600,
              background: postureLabel === 'Aligned' || postureLabel === 'On track'
                ? 'rgba(42,157,143,.12)'
                : M.volatilityDim,
              color: postureLabel === 'Aligned' || postureLabel === 'On track'
                ? M.positive
                : M.volatility,
              border: `1px solid ${
                postureLabel === 'Aligned' || postureLabel === 'On track'
                  ? 'rgba(42,157,143,.25)'
                  : 'rgba(212,160,23,.25)'
              }`,
              whiteSpace: 'nowrap' as const,
              fontFamily: FONT_BODY,
            }}>
              {postureLabel}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            AGENT PROMPT — existing component (unchanged)
        ════════════════════════════════════════════════════════════════ */}
        <div style={{ padding: '0 16px 16px', ...anim(mounted, 5) }}>
          <AgentPrompt
            isPro={isPro}
            activeQuestion={activeQuestion}
            onQuestion={handleQuestion}
            onProTap={handleProTap}
          />
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            ANSWER CARD — shown after chip tap (existing component)
        ════════════════════════════════════════════════════════════════ */}
        {answer && (
          <div style={{ padding: '0 16px 16px', ...anim(mounted, 6) }}>
            <AnswerCard
              answer={answer.answer}
              question={answerQuestion}
              generated_at={answer.generated_at}
              onDismiss={() => setAnswer(null)}
            />
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            SIGNALS — existing signal cards
        ════════════════════════════════════════════════════════════════ */}
        {signals.length > 0 && (
          <div style={{ padding: '0 16px 16px', ...anim(mounted, 7) }}>
            <div style={{
              fontSize: 10,
              fontFamily: FONT_BODY,
              color: M.textMuted,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.1em',
              marginBottom: 10,
              paddingLeft: 4,
            }}>
              Signals &amp; context
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {signals.slice(0, 3).map((sig, i) => (
                <InsightCard
                  key={sig.id ?? i}
                  text={sig.reason}
                  accentColor={
                    sig.severity >= 3 ? M.volatility
                    : sig.severity === 2 ? M.accent
                    : M.positive
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            ANONYMOUS CTA — shown only for anon users
        ════════════════════════════════════════════════════════════════ */}
        {isAnon && (
          <div style={{ padding: '0 16px 16px', ...anim(mounted, 5) }}>
            <div style={{
              ...card({ padding: 20 }),
              textAlign: 'center' as const,
            }}>
              <div style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 16,
                fontWeight: 600,
                color: M.text,
                marginBottom: 6,
              }}>
                Sign in for your full briefing
              </div>
              <p style={{
                fontSize: 13,
                color: M.textSecondary,
                lineHeight: 1.6,
                marginBottom: 16,
              }}>
                Personalised regime analysis, portfolio posture, and AI-powered answers.
              </p>
              <button
                onClick={handleOpenAuth}
                style={{
                  background: M.accentGradient,
                  color: 'white',
                  border: 'none',
                  borderRadius: 16,
                  padding: '11px 24px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: FONT_BODY,
                  boxShadow: `0 4px 14px ${M.accentGlow}`,
                }}
              >
                Sign in
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            DISCLAIMER
        ════════════════════════════════════════════════════════════════ */}
        <div style={{
          textAlign: 'center' as const,
          padding: '4px 20px 16px',
          fontSize: 10,
          color: M.textMuted,
          fontFamily: FONT_MONO,
        }}>
          Educational only · Not financial advice
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          BOTTOM NAV
      ═══════════════════════════════════════════════════════════════════ */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        maxWidth: 430,
        margin: '0 auto',
        height: 82,
        background: 'rgba(236,234,239,.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 8px 10px',
        zIndex: 30,
      }}>
        {NAV_TABS.map(tab => {
          const isActive = tab.id === 'home'
          const Icon     = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => router.push(tab.href)}
              style={{
                display: 'flex',
                flexDirection: 'column' as const,
                alignItems: 'center',
                gap: 3,
                opacity: isActive ? 1 : 0.32,
                flex: 1,
                padding: '4px 0',
                position: 'relative',
                cursor: 'pointer',
                background: 'none',
                border: 'none',
              }}
            >
              {/* Active indicator line */}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  top: -10,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 28,
                  height: 2,
                  borderRadius: 2,
                  background: `linear-gradient(90deg,${M.accent},${M.accentDeep})`,
                }} />
              )}
              <div style={{
                width: 36,
                height: 30,
                borderRadius: 10,
                background: isActive ? M.accentDim : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isActive ? M.accentDeep : M.textMuted,
              }}>
                <Icon size={18} />
              </div>
              <span style={{
                fontSize: 9,
                fontWeight: isActive ? 700 : 600,
                color: isActive ? M.accentDeep : M.text,
                fontFamily: FONT_BODY,
              }}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </nav>

    </div>
  )
}
