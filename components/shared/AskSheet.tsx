// ━━━ Ask Sheet ━━━
// v1.0.0 · S215-global · Sprint 43
// Purpose: Global AI chat sheet — renders from layout so orb works on every screen.
//          Self-contained: owns all chat state, questions, typewriter, markdown.
// Changelog:
//   v1.0.0 — Extracted from dashboard/page.tsx. Typewriter runs once (completion tracked
//             internally, not re-fired on reopen). Speed: 6ms. Markdown rendering.
//             ChipStrip shows all questions with accent/muted state.
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Sparkles, X, ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { M } from '@/lib/meridian'
import { useUser } from '@/contexts/UserContext'
import { useAuthSheet } from '@/contexts/AuthSheetContext'
import BottomSheet from '@/components/shared/BottomSheet'

// ── Fonts ──────────────────────────────────────────────────────────────────
const FONT_DISPLAY = "'Outfit', sans-serif"
const FONT_BODY    = "'DM Sans', sans-serif"
const FONT_MONO    = "'DM Mono', monospace"

// ── Question registry ──────────────────────────────────────────────────────
interface Question { id: string; label: string; sub: string; proOnly: boolean }

const QUESTIONS: Question[] = [
  { id: 'market.regime_today',       label: 'What regime are we in?',           sub: 'Market overview',      proOnly: false },
  { id: 'market.regime_duration',    label: 'How long has this regime lasted?',  sub: 'Historical context',   proOnly: false },
  { id: 'market.signals_now',        label: 'Key signals right now',             sub: 'Signal digest',        proOnly: false },
  { id: 'market.volatility_context', label: 'Is volatility normal?',             sub: 'Vol analysis',         proOnly: false },
  { id: 'market.sentiment_meaning',  label: 'What does sentiment mean?',         sub: 'Fear & Greed context', proOnly: false },
  { id: 'portfolio.my_posture',      label: 'How is my portfolio positioned?',   sub: 'Posture analysis',     proOnly: true  },
  { id: 'portfolio.biggest_risk',    label: 'My biggest risk right now',         sub: 'Risk breakdown',       proOnly: true  },
  { id: 'portfolio.posture_score',   label: 'Why is my posture score this?',     sub: 'Score explanation',    proOnly: true  },
  { id: 'portfolio.alt_exposure',    label: 'What does my ALT allocation mean?', sub: 'ALT context',          proOnly: true  },
  { id: 'portfolio.watch_today',     label: 'What to watch in my portfolio',     sub: 'Daily watchlist',      proOnly: true  },
]

// ── Markdown renderer ──────────────────────────────────────────────────────
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n')
  const nodes: React.ReactNode[] = []
  let listItems: React.ReactNode[] = []
  let listType: 'ul' | 'ol' | null = null
  let key = 0

  function flushList() {
    if (!listItems.length) return
    if (listType === 'ul') nodes.push(<ul key={key++} style={{ margin: '4px 0 8px', paddingLeft: 18 }}>{listItems}</ul>)
    else nodes.push(<ol key={key++} style={{ margin: '4px 0 8px', paddingLeft: 18 }}>{listItems}</ol>)
    listItems = []
    listType = null
  }

  function inlineFormat(str: string): React.ReactNode[] {
    const parts: React.ReactNode[] = []
    const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g
    let last = 0, m: RegExpExecArray | null, ki = 0
    while ((m = re.exec(str)) !== null) {
      if (m.index > last) parts.push(<span key={ki++}>{str.slice(last, m.index)}</span>)
      if (m[2]) parts.push(<strong key={ki++} style={{ fontWeight: 700 }}>{m[2]}</strong>)
      else if (m[3]) parts.push(<em key={ki++} style={{ fontStyle: 'italic' }}>{m[3]}</em>)
      else if (m[4]) parts.push(<code key={ki++} style={{ fontFamily: FONT_MONO, fontSize: 12, background: 'rgba(123,111,168,0.1)', padding: '1px 5px', borderRadius: 4 }}>{m[4]}</code>)
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
      const size = hMatch[1].length === 1 ? 16 : hMatch[1].length === 2 ? 14 : 13
      nodes.push(<div key={key++} style={{ fontSize: size, fontWeight: 700, color: M.text, fontFamily: FONT_BODY, margin: '10px 0 4px', lineHeight: 1.3 }}>{inlineFormat(hMatch[2])}</div>)
    } else if (ulMatch) {
      if (listType !== 'ul') { flushList(); listType = 'ul' }
      listItems.push(<li key={listItems.length} style={{ fontSize: 14, lineHeight: 1.6, color: M.text, fontFamily: FONT_BODY, marginBottom: 2 }}>{inlineFormat(ulMatch[1])}</li>)
    } else if (olMatch) {
      if (listType !== 'ol') { flushList(); listType = 'ol' }
      listItems.push(<li key={listItems.length} style={{ fontSize: 14, lineHeight: 1.6, color: M.text, fontFamily: FONT_BODY, marginBottom: 2 }}>{inlineFormat(olMatch[1])}</li>)
    } else if (line.trim() === '') {
      flushList()
    } else {
      flushList()
      nodes.push(<p key={key++} style={{ margin: '0 0 6px', fontSize: 14, lineHeight: 1.6, color: M.text, fontFamily: FONT_BODY }}>{inlineFormat(line)}</p>)
    }
  }
  flushList()
  return nodes
}

// ── Typing dots ────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 5, padding: '14px 16px', alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%',
          background: M.accent, opacity: 0.4,
          animation: `dotBounce 1.2s ${i * 0.2}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  )
}

// ── AiMessage — typewriter runs once, never re-fires on reopen ─────────────
function AiMessage({ text, generated_at, isNew }: { text: string; generated_at: string; isNew: boolean }) {
  // Track whether this instance has completed its typewriter — persists across rerenders
  const doneRef = useRef(!isNew)  // if isNew=false from the start, already done
  const [displayed, setDisplayed] = useState(doneRef.current ? text : '')

  useEffect(() => {
    if (doneRef.current) return          // already completed, never re-run
    if (!isNew)          { setDisplayed(text); doneRef.current = true; return }
    setDisplayed('')
    let i = 0
    const tick = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) { clearInterval(tick); doneRef.current = true }
    }, 6)  // 6ms — snappy but readable
    return () => clearInterval(tick)
  }, []) // intentionally empty — runs once on mount only

  const content = displayed
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
          {renderMarkdown(content)}
          {!doneRef.current && content.length < text.length && (
            <span style={{ opacity: 0.5, animation: 'cursorBlink 0.8s step-end infinite', marginLeft: 1 }}>|</span>
          )}
        </div>
        <span style={{ fontSize: 10, color: M.textMuted, fontFamily: FONT_MONO }}>{ts}</span>
      </div>
    </div>
  )
}

// ── AskSheet ───────────────────────────────────────────────────────────────
interface AskSheetProps {
  isOpen:  boolean
  onClose: () => void
}

interface ChatMessage {
  role: 'user' | 'ai'
  text: string
  generated_at: string
  isNew?: boolean
}

export default function AskSheet({ isOpen, onClose }: AskSheetProps) {
  const router = useRouter()
  const { tier, isAnon, regimeWindow } = useUser()
  const { openAuth } = useAuthSheet()
  const isPro = tier === 'pro'

  const [chatTyping,   setChatTyping]   = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [usedChips,    setUsedChips]    = useState<Set<string>>(new Set())
  const [readingMode,  setReadingMode]  = useState(false)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  // Clear isNew on all messages when sheet closes — prevents re-typewrite on reopen
  const handleClose = useCallback(() => {
    onClose()
    setChatMessages(prev => prev.map(m => ({ ...m, isNew: false })))
  }, [onClose])

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (chatMessages.length > 0) {
      setTimeout(() => {
        chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' })
      }, 50)
    }
  }, [chatMessages, chatTyping])

  const handleChipTap = useCallback(async (q: Question) => {
    if (isAnon) { openAuth('chat-chip'); return }
    if (q.proOnly && !isPro) { router.push('/profile'); return }
    if (usedChips.has(q.id) || chatTyping) return

    setChatMessages(prev => [...prev, { role: 'user', text: q.label, generated_at: new Date().toISOString() }])
    setUsedChips(prev => new Set([...prev, q.id]))
    setReadingMode(true)
    setChatTyping(true)

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_id: q.id, regime_window: regimeWindow }),
      })
      if (!res.ok) throw new Error(`ask ${res.status}`)
      const data = await res.json()
      setChatTyping(false)
      setChatMessages(prev => [...prev, { role: 'ai', text: data.answer, generated_at: data.generated_at, isNew: true }])
    } catch {
      setChatTyping(false)
      setChatMessages(prev => [...prev, { role: 'ai', text: 'Something went wrong. Please try again.', generated_at: new Date().toISOString(), isNew: false }])
    }
  }, [isAnon, isPro, openAuth, regimeWindow, router, usedChips, chatTyping])

  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={handleClose} scrollable={false} maxHeight="76vh">

        {/* Fixed header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 10, background: M.accentGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 2px 8px ${M.accentGlow}` }}>
              <Sparkles size={13} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: M.text, fontFamily: FONT_DISPLAY }}>Ask Meridian</div>
              <div style={{ fontSize: 11, color: M.textMuted, fontFamily: FONT_BODY }}>Educational · Not financial advice</div>
            </div>
          </div>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: M.textMuted }}>
            <X size={18} />
          </button>
        </div>

        {/* Scrollable message area */}
        <div ref={chatScrollRef} style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain' }}>
          {chatMessages.length === 0 && !chatTyping && (
            <div style={{ padding: '12px 20px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>✦</div>
              <p style={{ fontSize: 13, color: M.textSecondary, fontFamily: FONT_BODY, lineHeight: 1.5, margin: 0 }}>
                Tap a question below to get an educational read on your market context.
              </p>
            </div>
          )}
          <div>
            {chatMessages.map((msg, i) => {
              if (msg.role === 'user') {
                return (
                  <div key={i} style={{ padding: '0 20px 10px', display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ maxWidth: '80%', background: M.accentGradient, borderRadius: '16px 16px 4px 16px', padding: '10px 14px' }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'white', fontFamily: FONT_BODY }}>{msg.text}</p>
                    </div>
                  </div>
                )
              }
              return <AiMessage key={i} text={msg.text} generated_at={msg.generated_at} isNew={!!msg.isNew} />
            })}
            {chatTyping && <TypingDots />}
          </div>
        </div>

        {/* Fixed footer — chip area */}
        <div style={{ borderTop: `1px solid ${M.borderSubtle}`, padding: '14px 20px 20px', flexShrink: 0 }}>

          {/* ChipStack — pre-message or after "Ask another" */}
          {!readingMode && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {QUESTIONS.map(q => {
                const isLocked  = q.proOnly && !isPro
                const isUsed    = usedChips.has(q.id)
                return (
                  <button
                    key={q.id}
                    onClick={() => !isUsed && !chatTyping && handleChipTap(q)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', borderRadius: 14,
                      border: `1px solid ${isUsed ? M.borderSubtle : M.border}`,
                      background: isUsed ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.7)',
                      cursor: isUsed || chatTyping ? 'default' : 'pointer',
                      opacity: isUsed ? 0.38 : 1,
                      textAlign: 'left',
                      pointerEvents: isUsed || chatTyping ? 'none' : 'auto',
                    }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: isLocked ? M.accentDim : 'rgba(123,111,168,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Sparkles size={13} color={isLocked ? M.accentDeep : M.accent} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: isUsed ? M.textMuted : M.text, fontFamily: FONT_BODY }}>{q.label}</div>
                      <div style={{ fontSize: 11, color: M.textMuted, fontFamily: FONT_BODY }}>{q.sub}</div>
                    </div>
                    {isLocked && (
                      <span style={{ padding: '2px 7px', borderRadius: 8, background: M.accentDim, border: `1px solid ${M.borderAccent}`, fontSize: 9, fontWeight: 700, color: M.accentDeep, fontFamily: FONT_BODY, letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>PRO</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Reading mode — Ask another + ChipStrip */}
          {readingMode && (
            <>
              <button
                onClick={() => setReadingMode(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: M.accent, fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, marginBottom: 10, padding: 0 }}
              >
                <ChevronLeft size={14} /> Ask another
              </button>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
                {QUESTIONS.map(q => {
                  const isUsed   = usedChips.has(q.id)
                  const isLocked = q.proOnly && !isPro
                  const canTap   = !isUsed && !chatTyping
                  return (
                    <button
                      key={q.id}
                      onClick={() => canTap && handleChipTap(q)}
                      style={{
                        padding: '6px 10px 6px 8px', borderRadius: 20,
                        border: `1px solid ${isUsed ? M.borderSubtle : M.borderAccent}`,
                        background: isUsed ? 'rgba(0,0,0,0.03)' : M.accentDim,
                        fontSize: 12, fontWeight: 500,
                        color: isUsed ? M.textMuted : M.accentDeep,
                        fontFamily: FONT_BODY, whiteSpace: 'nowrap',
                        cursor: canTap ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', gap: 5,
                        flexShrink: 0,
                        opacity: isUsed ? 0.45 : chatTyping ? 0.6 : 1,
                        transition: 'opacity 0.2s ease',
                        pointerEvents: isUsed ? 'none' : 'auto',
                      }}
                    >
                      <div style={{ width: 16, height: 16, borderRadius: 5, flexShrink: 0, background: isUsed ? 'rgba(0,0,0,0.06)' : 'rgba(123,111,168,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Sparkles size={9} color={isUsed ? M.textMuted : M.accent} />
                      </div>
                      {q.label}
                      {isLocked && !isUsed && (
                        <span style={{ padding: '1px 5px', borderRadius: 6, background: M.accentDim, fontSize: 8, fontWeight: 700, color: M.accentDeep, fontFamily: FONT_BODY, letterSpacing: '0.06em', textTransform: 'uppercase' }}>PRO</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </BottomSheet>

      <style>{`
        @keyframes dotBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes cursorBlink {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0; }
        }
      `}</style>
    </>
  )
}
