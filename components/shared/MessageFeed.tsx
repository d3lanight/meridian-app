// MessageFeed v1.1.0
// Sprint 46 — ca-story228-today-message-integration
// Updated: 2026-03-14
// Changes:
//   v1.1.0 — S228: Added unreadOnly, severity, hideWhenEmpty props for inline strips
//   v1.0.0 — S227: Initial build

'use client'

import { useEffect, useState } from 'react'
import * as LucideIcons from 'lucide-react'
import { Check } from 'lucide-react'
import { M } from '@/lib/meridian'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/contexts/UserContext'

// ── Font constants ────────────────────────────
const FONT_BODY = "'DM Sans', sans-serif"
const FONT_MONO = "'DM Mono', monospace"

// ── Types ─────────────────────────────────────

interface ContextualMessage {
  id: string
  message_type: string
  topic: string
  icon: string
  body: string
  severity: 'info' | 'watch' | 'notice'
  screens: string[]
  read: boolean
  read_at: string | null
  created_at: string
}

// ── Severity config ───────────────────────────

const SEVERITY_CONFIG: Record<string, { badgeBg: string; iconColor: string }> = {
  info:   { badgeBg: 'rgba(139,117,101,0.12)', iconColor: M.textMuted },
  watch:  { badgeBg: 'rgba(212,160,23,0.12)',  iconColor: '#D4A017'   },
  notice: { badgeBg: 'rgba(123,111,168,0.12)', iconColor: M.accent    },
}

// ── Helpers ───────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function resolveIcon(name: string) {
  const PascalName = name
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as any)[PascalName]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Icon ?? (LucideIcons as any)['Bell']
}

// ── Sub-components ────────────────────────────

function SkeletonRow() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', animation: 'mf-pulse 1.2s ease-in-out infinite' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: M.surfaceLight, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 2 }}>
        <div style={{ height: 10, width: '45%', borderRadius: 6, background: M.surfaceLight }} />
        <div style={{ height: 13, width: '80%', borderRadius: 6, background: M.surfaceLight }} />
      </div>
    </div>
  )
}

// ── Props ─────────────────────────────────────

export interface MessageFeedProps {
  screen: string
  limit?: number
  showHeader?: boolean
  onMessageRead?: (id: string) => void
  /** Filter to unread messages only */
  unreadOnly?: boolean
  /** Filter to a specific severity */
  severity?: 'info' | 'watch' | 'notice'
  /** Render null instead of the empty state — for inline strips */
  hideWhenEmpty?: boolean
}

// ── Component ─────────────────────────────────

export function MessageFeed({
  screen,
  limit = 5,
  showHeader = true,
  onMessageRead,
  unreadOnly = false,
  severity,
  hideWhenEmpty = false,
}: MessageFeedProps) {
  const { userId, isAnon } = useUser()
  const [messages, setMessages] = useState<ContextualMessage[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(false)

  useEffect(() => {
    if (isAnon || !userId) { setLoading(false); return }
    const supabase = createClient()

    async function fetchMessages() {
      try {
        let query = supabase
          .from('contextual_messages')
          .select('*')
          .eq('user_id', userId)
          .contains('screens', [screen])
          .order('created_at', { ascending: false })
          .limit(limit)

        if (unreadOnly) query = query.eq('read', false)
        if (severity)   query = query.eq('severity', severity)

        const { data, error: fetchError } = await query
        if (fetchError) throw fetchError
        setMessages(data ?? [])
      } catch (err) {
        console.error('[MessageFeed] fetch error:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
  }, [userId, isAnon, screen, limit, unreadOnly, severity])

  if (isAnon || !userId) return null

  // Loading — inline strips with hideWhenEmpty skip skeleton to avoid layout flash
  if (loading) {
    if (hideWhenEmpty) return null
    return (
      <div>
        {showHeader && (
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: M.textMuted, marginBottom: 8 }}>
            Updates
          </div>
        )}
        <style>{`@keyframes mf-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
        {[0, 1, 2].map((i) => <SkeletonRow key={i} />)}
      </div>
    )
  }

  // Error
  if (error) {
    if (hideWhenEmpty) return null
    return <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: M.textMuted, margin: 0, padding: '8px 0' }}>Could not load updates</p>
  }

  // Empty
  if (messages.length === 0) {
    if (hideWhenEmpty) return null
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 0', gap: 6 }}>
        <Check size={14} color={M.textMuted} />
        <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: M.textMuted, margin: 0 }}>You are up to date</p>
      </div>
    )
  }

  // Message list
  return (
    <div>
      {showHeader && (
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: M.textMuted, marginBottom: 8 }}>
          Updates
        </div>
      )}
      <style>{`@keyframes mf-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {messages.map((msg) => {
          const cfg  = SEVERITY_CONFIG[msg.severity] ?? SEVERITY_CONFIG.info
          const Icon = resolveIcon(msg.icon)
          return (
            <button
              key={msg.id}
              onClick={() => onMessageRead?.(msg.id)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '12px 0', background: 'none', border: 'none',
                cursor: onMessageRead ? 'pointer' : 'default',
                textAlign: 'left', width: '100%',
                borderBottom: `1px solid ${M.borderSubtle}`,
                position: 'relative',
                opacity: msg.read ? 0.7 : 1,
                transition: 'opacity 0.2s ease',
              }}
            >
              {!msg.read && (
                <div style={{
                  position: 'absolute', left: -10, top: '50%', transform: 'translateY(-50%)',
                  width: 6, height: 6, borderRadius: '50%', background: M.accent, flexShrink: 0,
                }} />
              )}
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: cfg.badgeBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon size={16} color={cfg.iconColor} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: M.textSecondary, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {msg.topic}
                </div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: M.text, lineHeight: 1.5 }}>
                  {msg.body}
                </div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: M.textMuted, marginTop: 4 }}>
                  {relativeTime(msg.created_at)}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}