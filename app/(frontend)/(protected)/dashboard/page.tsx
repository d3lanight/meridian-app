// ━━━ Today Page ━━━
// v5.7.0 · Sprint 46 — S228: Message feed integration
// Purpose: Today dashboard — Ask orb nav, Chat sheet, Sources sheet, Message center.
// Changelog:
//   v5.7.0 — S228: ActivityBadge wired to unread count from contextual_messages.
//             Message BottomSheet with MessageFeed (screen=today, limit=20).
//             "Mark all read" button visible when unread > 0.
//             Inline notice strip below Regime row (unread notice severity only,
//             hidden when empty). onMessageRead decrements ActivityBadge count.
//   v5.6.0 — S214: Ask orb centred in bottom nav (Sparkles, 52px, gradient, elevated -18px).
//             Orb opens Chat sheet. Gradient shifts when chat open.
//             S215: Chat sheet — BottomSheet shell, ChipStack (pre-message) / ChipStrip
//             (post-message), typewriter AiMessage, /api/ask wired, used-chip states.
//             PRO chips locked. Auto-scroll to latest. Empty state before first message.
//             S216: Sources sheet — BottomSheet, SOURCES_ENABLED gate, placeholder cards.
//   v5.3.0 — S213: SOURCES_ENABLED flag. Sources carousel with frosted overlay gate.
//             Signals wired to /api/market-user (auth-gated). Signal cards with coloured
//             icon badge, label (asset), timestamp. Severity 0-100 thresholds corrected.
//             Disclaimer footer. InsightCard replaced with inline signal card render.
//   v5.2.0 — S212: Inline briefing block replaces <Briefing> component.
//             Date separator (DM Mono + rule). Headline (Outfit 19px 500) clickable.
//             Collapsed: italic preview + "Read more →". Expanded: full body +
//             bullet list (ACCENT dots 0.4 opacity) + Collapse button.
//             briefExpanded local state. Removes <Briefing> component import.
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
import { TrendingUp, TrendingDown, Minus, Sparkles, X, ChevronLeft, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { M } from '@/lib/meridian'
import { card, anim } from '@/lib/ui-helpers'
import { getRegimeConfig } from '@/lib/regime-utils'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/contexts/UserContext'
import { useAuthSheet } from '@/contexts/AuthSheetContext'
import BottomSheet from '@/components/shared/BottomSheet'
import { MessageFeed } from '@/components/shared'
import {
  ActivityBadge,
  InsightCard,
  LearnCard,
} from '@/components/today'
import type { RegimeData, Signal, MarketMetrics } from '@/types'

// ── Font constants ─────────────────────────────────────────────────────────

const FONT_DISPLAY = "'Outfit', sans-serif"
const FONT_BODY    = "'DM Sans', sans-serif"
const FONT_MONO    = "'DM Mono', monospace"

// ── Feature flags ──────────────────────────────────────────────────────────
// Flip to true when sources backend is ready (S216+)
const SOURCES_ENABLED = false

// ── Regime gradient wash (top of page background) ─────────────────────────

function regimeGradientWash(regimeCurrent: string): string {
  const r = regimeCurrent.toLowerCase()
  if (r.includes('bull'))  return 'linear-gradient(180deg,rgba(42,157,143,.15) 0%,transparent 100%)'  // teal
  if (r.includes('bear'))  return 'linear-gradient(180deg,rgba(231,111,81,.13) 0%,transparent 100%)'   // coral
  if (r.includes('volat')) return 'linear-gradient(180deg,rgba(212,160,23,.13) 0%,transparent 100%)'   // amber
  return 'linear-gradient(180deg,rgba(91,127,166,.13) 0%,transparent 100%)'                            // steel blue (range)
}

// ── Briefing content parser ────────────────────────────────────────────────
// Content is plain prose. Split into: headline (s[0]), preview (s[1]), bullets (s[2+]).

interface ParsedBriefing {
  headline: string
  preview: string
  bullets: string[]
}

function parseBriefing(content: string): ParsedBriefing {
  const sentences = content
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean)
  return {
    headline: sentences[0] ?? '',
    preview:  sentences[1] ?? '',
    bullets:  sentences.slice(2),
  }
}

// ── Signal colour helper ───────────────────────────────────────────────────
// severity is 0-100 (stored as 0-1 × 100 in mapSignals)

function signalColor(severity: number): string {
  if (severity >= 70) return '#E76F51'   // coral — high
  if (severity >= 40) return '#D4A017'   // amber — medium
  return '#2A9D8F'                        // teal — informational
}

function signalIcon(action: string) {
  if (action === 'BUY')  return TrendingUp
  if (action === 'SELL') return TrendingDown
  return Minus
}

// ── Mock sources (shown beneath overlay until SOURCES_ENABLED = true) ──────

const MOCK_SOURCES = [
  { id: 1, dot: '#F4A261', source: 'COINDESK',   time: '14m ago', headline: 'Bitcoin ETF inflows hit $380M in a single session', tag: 'Market' },
  { id: 2, dot: '#7B6FA8', source: 'THE BLOCK',  time: '1h ago',  headline: 'SEC signals softer stance on crypto ETF approvals for altcoins', tag: 'Regulation' },
  { id: 3, dot: '#2A9D8F', source: 'DECRYPT',    time: '2h ago',  headline: 'Ethereum staking rate climbs to 28% ahead of next upgrade', tag: 'ETH' },
]

// ── Question registry (mirrors AgentPrompt + /api/ask) ────────────────────

interface Question { id: string; label: string; sub: string; proOnly: boolean }

const QUESTIONS: Question[] = [
  { id: 'market.regime_today',       label: 'What regime are we in?',           sub: 'Market overview',         proOnly: false },
  { id: 'market.regime_duration',    label: 'How long has this regime lasted?',  sub: 'Historical context',      proOnly: false },
  { id: 'market.signals_now',        label: 'Key signals right now',             sub: 'Signal digest',           proOnly: false },
  { id: 'market.volatility_context', label: 'Is volatility normal?',             sub: 'Vol analysis',            proOnly: false },
  { id: 'market.sentiment_meaning',  label: 'What does sentiment mean?',         sub: 'Fear & Greed context',    proOnly: false },
  { id: 'portfolio.my_posture',      label: 'How is my portfolio positioned?',   sub: 'Posture analysis',        proOnly: true  },
  { id: 'portfolio.biggest_risk',    label: 'My biggest risk right now',         sub: 'Risk breakdown',          proOnly: true  },
  { id: 'portfolio.posture_score',   label: 'Why is my posture score this?',     sub: 'Score explanation',       proOnly: true  },
  { id: 'portfolio.alt_exposure',    label: 'What does my ALT allocation mean?', sub: 'ALT context',             proOnly: true  },
  { id: 'portfolio.watch_today',     label: 'What to watch in my portfolio',     sub: 'Daily watchlist',         proOnly: true  },
]

// ── useTypewriter — character-by-character reveal ─────────────────────────

function useTypewriter(text: string, active: boolean, speed = 18): string {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    if (!active || !text) { setDisplayed(''); return }
    setDisplayed('')
    let i = 0
    const tick = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) clearInterval(tick)
    }, speed)
    return () => clearInterval(tick)
  }, [text, active, speed])
  return displayed
}

// ── Typing dots component (inline) ────────────────────────────────────────

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 5, padding: '14px 16px', alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%',
          background: M.accent,
          opacity: 0.4,
          animation: `dotBounce 1.2s ${i * 0.2}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  )
}

// ── Markdown renderer ─────────────────────────────────────────────────────
// Converts plain markdown to React nodes. Handles: **bold**, *italic*, `code`,
// # headers, - bullets, 1. numbered lists, paragraphs.

function renderMarkdown(text: string, fontBody: string, fontMono: string, textColor: string, mutedColor: string): React.ReactNode[] {
  const lines = text.split('\n')
  const nodes: React.ReactNode[] = []
  let listItems: React.ReactNode[] = []
  let listType: 'ul' | 'ol' | null = null
  let key = 0

  function flushList() {
    if (!listItems.length) return
    if (listType === 'ul') {
      nodes.push(<ul key={key++} style={{ margin: '4px 0 8px', paddingLeft: 18 }}>{listItems}</ul>)
    } else {
      nodes.push(<ol key={key++} style={{ margin: '4px 0 8px', paddingLeft: 18 }}>{listItems}</ol>)
    }
    listItems = []
    listType = null
  }

  function inlineFormat(str: string): React.ReactNode[] {
    const parts: React.ReactNode[] = []
    const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g
    let last = 0, m: RegExpExecArray | null
    let ki = 0
    while ((m = re.exec(str)) !== null) {
      if (m.index > last) parts.push(<span key={ki++}>{str.slice(last, m.index)}</span>)
      if (m[2]) parts.push(<strong key={ki++} style={{ fontWeight: 700 }}>{m[2]}</strong>)
      else if (m[3]) parts.push(<em key={ki++} style={{ fontStyle: 'italic' }}>{m[3]}</em>)
      else if (m[4]) parts.push(<code key={ki++} style={{ fontFamily: fontMono, fontSize: 12, background: 'rgba(123,111,168,0.1)', padding: '1px 5px', borderRadius: 4 }}>{m[4]}</code>)
      last = m.index + m[0].length
    }
    if (last < str.length) parts.push(<span key={ki++}>{str.slice(last)}</span>)
    return parts
  }

  for (const line of lines) {
    const hMatch = line.match(/^(#{1,3})\s+(.+)/)
    const ulMatch = line.match(/^[-*]\s+(.+)/)
    const olMatch = line.match(/^\d+\.\s+(.+)/)

    if (hMatch) {
      flushList()
      const level = hMatch[1].length
      const size = level === 1 ? 16 : level === 2 ? 14 : 13
      nodes.push(<div key={key++} style={{ fontSize: size, fontWeight: 700, color: textColor, fontFamily: fontBody, margin: '10px 0 4px', lineHeight: 1.3 }}>{inlineFormat(hMatch[2])}</div>)
    } else if (ulMatch) {
      if (listType !== 'ul') { flushList(); listType = 'ul' }
      listItems.push(<li key={listItems.length} style={{ fontSize: 14, lineHeight: 1.6, color: textColor, fontFamily: fontBody, marginBottom: 2 }}>{inlineFormat(ulMatch[1])}</li>)
    } else if (olMatch) {
      if (listType !== 'ol') { flushList(); listType = 'ol' }
      listItems.push(<li key={listItems.length} style={{ fontSize: 14, lineHeight: 1.6, color: textColor, fontFamily: fontBody, marginBottom: 2 }}>{inlineFormat(olMatch[1])}</li>)
    } else if (line.trim() === '') {
      flushList()
    } else {
      flushList()
      nodes.push(<p key={key++} style={{ margin: '0 0 6px', fontSize: 14, lineHeight: 1.6, color: textColor, fontFamily: fontBody }}>{inlineFormat(line)}</p>)
    }
  }
  flushList()
  return nodes
}

// ── AiMessage component (inline) ──────────────────────────────────────────

function AiMessage({ text, generated_at, isNew }: { text: string; generated_at: string; isNew: boolean }) {
  const displayed = useTypewriter(text, isNew)
  const content   = isNew ? displayed : text
  const ts = new Date(generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return (
    <div style={{ padding: '0 20px 16px' }}>
      <div style={{
        background: 'rgba(123,111,168,0.06)',
        border: `1px solid ${M.borderAccent}`,
        borderRadius: 16,
        padding: '14px 16px',
      }}>
        <div style={{ marginBottom: 8 }}>
          {renderMarkdown(content, FONT_BODY, FONT_MONO, M.text, M.textMuted)}
          {isNew && content.length < text.length && (
            <span style={{ opacity: 0.5, animation: 'cursorBlink 0.8s step-end infinite', marginLeft: 1 }}>|</span>
          )}
        </div>
        <span style={{ fontSize: 10, color: M.textMuted, fontFamily: FONT_MONO }}>{ts}</span>
      </div>
    </div>
  )
}

// ── Placeholder source cards (SOURCES_ENABLED = false) ────────────────────

const PLACEHOLDER_SOURCES = [
  { id: 1, dot: '#F4A261', source: 'COINDESK',  time: '—', headline: 'Market analysis and crypto news will appear here', tag: 'Market' },
  { id: 2, dot: '#7B6FA8', source: 'THE BLOCK', time: '—', headline: 'Regulatory updates and industry coverage coming soon', tag: 'Regulation' },
  { id: 3, dot: '#2A9D8F', source: 'DECRYPT',   time: '—', headline: 'On-chain insights and protocol news on the way', tag: 'On-chain' },
]

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
  const [briefExpanded,    setBriefExpanded]    = useState(false)

  // ── Posture ────────────────────────────────────────────────────────────
  const [postureLabel, setPostureLabel] = useState<string | null>(null)

  // ── Message center — S228 ──────────────────────────────────────────────
  const [unreadCount,  setUnreadCount]  = useState(0)
  const [msgSheetOpen, setMsgSheetOpen] = useState(false)

  // ── Sources sheet ──────────────────────────────────────────────────────
  const [sourcesSheetOpen, setSourcesSheetOpen] = useState(false)

  // ── Chat sheet — global in layout via AskSheet ────────────────────────────


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
    const fetches: Promise<Response>[] = [fetch('/api/market')]
    if (!isAnon) fetches.push(fetch('/api/market-user'))

    Promise.all(fetches)
      .then(async ([mRes, muRes]) => {
        if (mRes?.ok) {
          const data = await mRes.json()
          setMetrics(data.metrics ?? null)
        }
        if (muRes?.ok) {
          const data = await muRes.json()
          setSignals(data.signals ?? [])
        }
      })
      .catch(() => {})
  }, [isAnon])

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

  // ── Fetch: unread count — S228 ────────────────────────────────────────
  useEffect(() => {
    if (isAnon || !userId) return
    const supabase = createClient()
    async function fetchUnreadCount() {
      try {
        const { count } = await supabase
          .from('contextual_messages')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('read', false)
          .contains('screens', ['today'])
        setUnreadCount(count ?? 0)
      } catch {
        // silent
      }
    }
    fetchUnreadCount()
  }, [isAnon, userId])

  // ── Mark all read — S228 ──────────────────────────────────────────────
  async function markAllRead() {
    if (!userId) return
    const supabase = createClient()
    await supabase
      .from('contextual_messages')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('read', false)
      .contains('screens', ['today'])
    setUnreadCount(0)
  }

  // ── Handle single message read — S228 ─────────────────────────────────
  function handleMessageRead(_id: string) {
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

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
    const fetches: Promise<Response>[] = [fetch('/api/market')]
    if (!isAnon) fetches.push(fetch('/api/market-user'))

    Promise.all(fetches)
      .then(async ([mRes, muRes]) => {
        if (mRes?.ok) {
          const data = await mRes.json()
          setMetrics(data.metrics ?? null)
        }
        if (muRes?.ok) {
          const data = await muRes.json()
          setSignals(data.signals ?? [])
        }
      })
      .catch(() => {})
  }, [isAnon])

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
        maxWidth: 430,
        margin: '0 auto',
        paddingBottom: 140,
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

          {/* Bell — S228: tappable, wired to unread count, auth only */}
          {!isAnon && (
            <div
              onClick={() => setMsgSheetOpen(true)}
              style={{ marginTop: 4, flexShrink: 0, cursor: 'pointer' }}
            >
              <ActivityBadge count={unreadCount} />
            </div>
          )}
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
            INLINE NOTICE STRIP — S228
            Unread notice messages only. Hidden entirely when empty.
        ════════════════════════════════════════════════════════════════ */}
        {!isAnon && (
          <div style={{ padding: '8px 20px 0', paddingLeft: 30 }}>
            <MessageFeed
              screen="today"
              limit={3}
              showHeader={false}
              unreadOnly
              severity="notice"
              hideWhenEmpty
              onMessageRead={handleMessageRead}
            />
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
            BRIEFING — S212 inline expandable block
        ════════════════════════════════════════════════════════════════ */}
        {!isAnon && (
          <div style={{ padding: '0 20px 20px', ...anim(mounted, 3) }}>

            {/* Date separator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 14,
            }}>
              <span style={{
                fontSize: 10,
                fontFamily: FONT_MONO,
                fontWeight: 500,
                color: M.textMuted,
                letterSpacing: '0.1em',
                textTransform: 'uppercase' as const,
                whiteSpace: 'nowrap' as const,
              }}>
                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}
              </span>
              <div style={{ flex: 1, height: 1, background: M.borderSubtle }} />
            </div>

            {/* Briefing body */}
            {briefingPending || !briefingContent ? (
              /* Pending skeleton */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                <p style={{
                  fontSize: 12,
                  color: M.textMuted,
                  margin: '0 0 6px',
                  fontFamily: FONT_BODY,
                  fontStyle: 'italic',
                }}>
                  Your briefing is being prepared…
                </p>
                {[1, 0.9, 0.72].map((w, i) => (
                  <div key={i} style={{
                    height: 12,
                    borderRadius: 6,
                    width: `${w * 100}%`,
                    background: M.borderSubtle,
                    opacity: 0.5,
                  }} />
                ))}
              </div>
            ) : (() => {
              const { headline, preview, bullets } = parseBriefing(briefingContent)
              return (
                <>
                  {/* Headline — clickable to toggle */}
                  <div
                    onClick={() => setBriefExpanded(e => !e)}
                    style={{ cursor: 'pointer', marginBottom: 10 }}
                  >
                    <p style={{
                      fontFamily: FONT_DISPLAY,
                      fontSize: 19,
                      fontWeight: 500,
                      color: M.text,
                      lineHeight: 1.35,
                      margin: 0,
                      letterSpacing: '-0.01em',
                    }}>
                      {headline}
                    </p>
                  </div>

                  {/* Collapsed: italic preview + Read more */}
                  {!briefExpanded && (
                    <div>
                      {preview && (
                        <p style={{
                          fontFamily: FONT_BODY,
                          fontSize: 14,
                          fontStyle: 'italic',
                          color: M.textSecondary,
                          lineHeight: 1.6,
                          margin: '0 0 8px',
                        }}>
                          {preview}
                        </p>
                      )}
                      <span
                        onClick={() => setBriefExpanded(true)}
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: M.accent,
                          cursor: 'pointer',
                          fontFamily: FONT_BODY,
                        }}
                      >
                        Read more →
                      </span>
                    </div>
                  )}

                  {/* Expanded: full body + bullets + Collapse */}
                  {briefExpanded && (
                    <div>
                      {preview && (
                        <p style={{
                          fontFamily: FONT_BODY,
                          fontSize: 14,
                          color: M.textSecondary,
                          lineHeight: 1.65,
                          margin: '0 0 12px',
                        }}>
                          {preview}
                        </p>
                      )}
                      {bullets.length > 0 && (
                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {bullets.map((b, i) => (
                            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                              <span style={{
                                width: 5,
                                height: 5,
                                borderRadius: '50%',
                                background: M.accent,
                                opacity: 0.4,
                                flexShrink: 0,
                                marginTop: 7,
                              }} />
                              <span style={{
                                fontFamily: FONT_BODY,
                                fontSize: 14,
                                color: M.textSecondary,
                                lineHeight: 1.6,
                              }}>
                                {b}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <span
                        onClick={() => setBriefExpanded(false)}
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: M.accent,
                          cursor: 'pointer',
                          fontFamily: FONT_BODY,
                          opacity: 0.7,
                        }}
                      >
                        Collapse ↑
                      </span>
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            POSTURE ROW — S212 upgraded pill colours
        ════════════════════════════════════════════════════════════════ */}
        {!isAnon && postureLabel && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 20px 20px',
            ...anim(mounted, 4),
          }}>
            <Shield size={16} color={M.textMuted} />
            <span style={{ fontSize: 13, color: M.textSecondary, fontFamily: FONT_BODY }}>
              Positions aligned with regime
            </span>
            <div style={{
              marginLeft: 'auto',
              padding: '3px 10px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 600,
              whiteSpace: 'nowrap' as const,
              fontFamily: FONT_BODY,
              ...(postureLabel === 'Aligned'    ? { background: 'rgba(42,157,143,.12)',  color: M.positive,   border: '1px solid rgba(42,157,143,.25)' }  :
                  postureLabel === 'On track'   ? { background: `rgba(123,111,168,.12)`, color: M.accent,     border: `1px solid rgba(123,111,168,.25)` }  :
                  /* Off target */                { background: M.volatilityDim,         color: M.volatility, border: '1px solid rgba(212,160,23,.25)' }),
            }}>
              {postureLabel}
            </div>
          </div>
        )}



        {/* ═══════════════════════════════════════════════════════════════
            SOURCES CAROUSEL — S213 (coming-soon gate via SOURCES_ENABLED)
        ════════════════════════════════════════════════════════════════ */}
        <div style={{ padding: '0 0 20px', ...anim(mounted, 7) }}>
          {/* Header row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px 10px',
          }}>
            <span style={{
              fontSize: 10,
              fontFamily: FONT_MONO,
              fontWeight: 500,
              color: M.textMuted,
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
            }}>
              From the web
            </span>
            <button
              onClick={() => SOURCES_ENABLED && setSourcesSheetOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '5px 12px',
                borderRadius: 20,
                border: `1.5px solid ${M.border}`,
                background: 'rgba(255,255,255,0.6)',
                fontSize: 12,
                fontWeight: 700,
                color: M.text,
                cursor: SOURCES_ENABLED ? 'pointer' : 'default',
                fontFamily: FONT_BODY,
              }}
            >
              See all <span style={{ fontSize: 11 }}>›</span>
            </button>
          </div>

          {/* Carousel + coming-soon overlay wrapper */}
          <div style={{ position: 'relative' }}>
            {/* Horizontal scroll cards */}
            <div style={{
              display: 'flex',
              gap: 12,
              overflowX: 'auto' as const,
              scrollbarWidth: 'none' as const,
              padding: '0 20px 4px',
            }}>
              {MOCK_SOURCES.map(src => (
                <div key={src.id} style={{
                  ...card({ padding: 16 }),
                  flexShrink: 0,
                  width: 220,
                  display: 'flex',
                  flexDirection: 'column' as const,
                  gap: 8,
                }}>
                  {/* Dot + source + time */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: src.dot,
                      flexShrink: 0,
                    }} />
                    <span style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      color: M.textMuted,
                      fontFamily: FONT_MONO,
                      textTransform: 'uppercase' as const,
                      flex: 1,
                    }}>
                      {src.source}
                    </span>
                    <span style={{
                      fontSize: 10,
                      color: M.textMuted,
                      fontFamily: FONT_MONO,
                    }}>
                      {src.time}
                    </span>
                  </div>
                  {/* Headline */}
                  <p style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: M.text,
                    lineHeight: 1.45,
                    margin: 0,
                    fontFamily: FONT_BODY,
                  }}>
                    {src.headline}
                  </p>
                  {/* Tag chip */}
                  <div style={{
                    alignSelf: 'flex-start' as const,
                    padding: '2px 8px',
                    borderRadius: 8,
                    background: 'rgba(255,193,7,0.12)',
                    color: '#D4A017',
                    fontSize: 10,
                    fontWeight: 600,
                    fontFamily: FONT_BODY,
                  }}>
                    {src.tag}
                  </div>
                </div>
              ))}
            </div>

            {/* Coming-soon overlay — removed when SOURCES_ENABLED = true */}
            {!SOURCES_ENABLED && (
              <div style={{
                position: 'absolute' as const,
                inset: 0,
                borderRadius: 16,
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                background: 'rgba(236,234,239,0.72)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'all' as const,
              }}>
                <span style={{
                  fontSize: 11,
                  fontFamily: FONT_MONO,
                  color: M.textMuted,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase' as const,
                }}>
                  Coming soon
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            SIGNALS — S213 live from /api/market-user with coloured badges
        ════════════════════════════════════════════════════════════════ */}
        {!isAnon && signals.length > 0 && (
          <div style={{ padding: '0 20px 8px', ...anim(mounted, 8) }}>
            <div style={{
              fontSize: 10,
              fontFamily: FONT_MONO,
              fontWeight: 500,
              color: M.textMuted,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.1em',
              marginBottom: 12,
            }}>
              Signals &amp; context
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {signals.slice(0, 3).map((sig, i) => {
                const color = signalColor(sig.severity)
                const Icon  = signalIcon(sig.action)
                return (
                  <div key={sig.id ?? i} style={{
                    ...card({ padding: '14px 16px' }),
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                  }}>
                    {/* Coloured icon badge */}
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: `${color}18`,
                      border: `1px solid ${color}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={15} color={color} />
                    </div>
                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: M.text,
                        lineHeight: 1.5,
                        margin: '0 0 5px',
                        fontFamily: FONT_BODY,
                      }}>
                        {sig.reason}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: '0.1em',
                          color: M.textMuted,
                          fontFamily: FONT_MONO,
                          textTransform: 'uppercase' as const,
                        }}>
                          {sig.asset}
                        </span>
                        <span style={{ fontSize: 10, color: M.textMuted, opacity: 0.5 }}>·</span>
                        <span style={{
                          fontSize: 10,
                          color: M.textMuted,
                          fontFamily: FONT_MONO,
                        }}>
                          {sig.time}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
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
        {!isAnon && (
          <div style={{
            textAlign: 'center' as const,
            padding: '8px 20px 20px',
            fontSize: 10,
            color: M.textMuted,
            fontFamily: FONT_MONO,
            letterSpacing: '0.04em',
          }}>
            Educational only · Not financial advice
          </div>
        )}

      </div>


      {/* ═══════════════════════════════════════════════════════════════════
          MESSAGE SHEET — S228
      ═══════════════════════════════════════════════════════════════════ */}
      <BottomSheet
        isOpen={msgSheetOpen}
        onClose={() => setMsgSheetOpen(false)}
        scrollable={true}
        maxHeight="82vh"
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px 4px',
          flexShrink: 0,
        }}>
          <span style={{
            fontFamily: FONT_MONO,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase' as const,
            color: M.text,
          }}>
            Updates
          </span>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              style={{
                background: 'none',
                border: 'none',
                padding: '6px 0',
                fontSize: 13,
                fontWeight: 600,
                color: M.accent,
                cursor: 'pointer',
                fontFamily: FONT_BODY,
              }}
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Feed */}
        <div style={{ padding: '8px 20px 24px', paddingLeft: 30 }}>
          <MessageFeed
            screen="today"
            limit={20}
            showHeader={false}
            onMessageRead={handleMessageRead}
          />
        </div>
      </BottomSheet>

      {/* ═══════════════════════════════════════════════════════════════════
          SOURCES SHEET — S216: (coming-soon gate via SOURCES_ENABLED)
      ═══════════════════════════════════════════════════════════════════ */}
      <BottomSheet
        isOpen={sourcesSheetOpen}
        onClose={() => setSourcesSheetOpen(false)}
        scrollable={true}
        maxHeight="82vh"
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px 16px',
        }}>
          <span style={{
            fontSize: 10, fontFamily: FONT_MONO, fontWeight: 500,
            color: M.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase' as const,
          }}>From the web</span>
          <button
            onClick={() => setSourcesSheetOpen(false)}
            style={{
              padding: '5px 14px', borderRadius: 20,
              border: `1px solid ${M.border}`, background: 'rgba(255,255,255,0.6)',
              fontSize: 12, fontWeight: 700, color: M.text, cursor: 'pointer', fontFamily: FONT_BODY,
            }}
          >Done</button>
        </div>

        {!SOURCES_ENABLED && (
          <div style={{
            margin: '0 20px 16px', padding: '12px 16px', borderRadius: 12,
            background: 'rgba(123,111,168,0.06)', border: `1px solid ${M.borderAccent}`,
          }}>
            <p style={{ margin: 0, fontSize: 12, color: M.textMuted, fontFamily: FONT_BODY, lineHeight: 1.5 }}>
              Web sources are on the way. These cards show you what's coming.
            </p>
          </div>
        )}

        <div style={{ padding: '0 20px 24px', display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          {PLACEHOLDER_SOURCES.map(src => (
            <div key={src.id} style={{ ...card({ padding: '16px' }), opacity: SOURCES_ENABLED ? 1 : 0.65 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: src.dot, flexShrink: 0 }} />
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: M.textMuted,
                  fontFamily: FONT_MONO, textTransform: 'uppercase' as const, flex: 1,
                }}>{src.source}</span>
                <span style={{ fontSize: 10, color: M.textMuted, fontFamily: FONT_MONO }}>{src.time}</span>
              </div>
              <p style={{ fontSize: 14, fontWeight: 500, color: M.text, lineHeight: 1.45, margin: '0 0 6px', fontFamily: FONT_BODY }}>
                {src.headline}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{
                  padding: '2px 8px', borderRadius: 8,
                  background: 'rgba(255,193,7,0.12)', color: '#D4A017',
                  fontSize: 10, fontWeight: 600, fontFamily: FONT_BODY,
                }}>{src.tag}</div>
                <span style={{
                  fontSize: 11, color: M.textMuted, fontFamily: FONT_BODY, fontWeight: 600, opacity: 0.4,
                }}>Coming soon</span>
              </div>
            </div>
          ))}
        </div>
      </BottomSheet>

      {/* Keyframes */}
      <style>{`
        @keyframes dotBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; } 50% { opacity: 0; }
        }
      `}</style>

    </div>
  )
}
