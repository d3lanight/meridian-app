// ━━━ Glossary Page ━━━
// v1.0.0 · ca-story60 · 2026-02-25
// Route: /settings/learn/glossary
// Alphabetical list, search filter, tap-to-expand definitions
// Data from GET /api/glossary (cached client-side after first fetch)

'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, ChevronLeft, ChevronDown, ChevronRight, BookOpen } from 'lucide-react'
import { M } from '@/lib/meridian'
import Link from 'next/link'

// ── Types ─────────────────────────────────────

interface GlossaryEntry {
  slug: string
  title: string
  summary: string
  raw_markdown: string
  related_regime_id: string | null
  sort_order: number
}

// ── Shared Helpers ────────────────────────────

const card = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: M.surface,
  backdropFilter: M.surfaceBlur,
  WebkitBackdropFilter: M.surfaceBlur,
  borderRadius: '24px',
  padding: '20px',
  border: `1px solid ${M.border}`,
  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  ...extra,
})

// ── Glossary Entry Card ───────────────────────

function GlossaryCard({
  entry,
  isExpanded,
  onToggle,
}: {
  entry: GlossaryEntry
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <button
      id={entry.slug}
      onClick={onToggle}
      style={{
        ...card({ padding: 16 }),
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        display: 'block',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: M.text, marginBottom: 4 }}>
            {entry.title}
          </div>
          <p style={{ fontSize: 12, color: M.textSecondary, lineHeight: 1.5, margin: 0 }}>
            {entry.summary}
          </p>
        </div>
        <div
          style={{
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: 2,
            transition: 'transform 200ms ease',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <ChevronDown size={16} color={M.textMuted} strokeWidth={2} />
        </div>
      </div>

      {/* Expanded: full definition */}
      <div
        style={{
          overflow: 'hidden',
          maxHeight: isExpanded ? 400 : 0,
          opacity: isExpanded ? 1 : 0,
          transition: 'max-height 300ms ease, opacity 200ms ease',
        }}
      >
        <div
          style={{
            marginTop: 12,
            padding: 12,
            background: M.accentGlow,
            borderRadius: 12,
          }}
        >
          <p
            style={{
              fontSize: 13,
              color: M.textSecondary,
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            {entry.raw_markdown}
          </p>
          {entry.related_regime_id && (
            <div
              style={{
                marginTop: 8,
                fontSize: 11,
                color: M.textMuted,
                fontFamily: "'DM Mono', monospace",
              }}
            >
              Related regime: {entry.related_regime_id}
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

// ── Skeleton ──────────────────────────────────

function Skeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="animate-pulse"
          style={{
            background: M.surfaceLight,
            borderRadius: 24,
            height: 72,
          }}
        />
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════

export default function GlossaryPage() {
  const [entries, setEntries] = useState<GlossaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null)

  useEffect(() => {
    async function fetchGlossary() {
      try {
        const res = await fetch('/api/glossary')
        if (res.ok) {
          const data: GlossaryEntry[] = await res.json()
          setEntries(data)
        }
      } catch (err) {
        console.error('Glossary fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchGlossary()
  }, [])

  // Check for hash in URL to auto-expand an entry
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.slice(1)
      setExpandedSlug(hash)
      // Scroll to element after render
      setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 300)
    }
  }, [entries])

  const filtered = useMemo(() => {
    if (!search.trim()) return entries
    const q = search.toLowerCase()
    return entries.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.summary.toLowerCase().includes(q),
    )
  }, [entries, search])

  // Group alphabetically
  const grouped = useMemo(() => {
    const sorted = [...filtered].sort((a, b) =>
      a.title.localeCompare(b.title),
    )
    const groups: Record<string, GlossaryEntry[]> = {}
    for (const entry of sorted) {
      const letter = entry.title[0].toUpperCase()
      if (!groups[letter]) groups[letter] = []
      groups[letter].push(entry)
    }
    return groups
  }, [filtered])

  return (
    <div style={{ padding: '24px 20px 0' }}>
      {/* Back nav */}
      <Link
        href="/settings"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          background: 'none',
          border: 'none',
          fontSize: 14,
          color: M.accentDeep,
          fontWeight: 500,
          textDecoration: 'none',
          marginBottom: 24,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <ChevronLeft size={16} color={M.accentDeep} strokeWidth={2} />
        Settings
      </Link>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <BookOpen size={20} color={M.accentDeep} strokeWidth={2} />
          <h1
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 24,
              fontWeight: 500,
              color: M.text,
              margin: 0,
            }}
          >
            Glossary
          </h1>
        </div>
        <p style={{ fontSize: 14, color: M.textSecondary, margin: '4px 0 0' }}>
          {entries.length} terms · Tap any term to learn more
        </p>
      </div>

      {/* Search */}
      <div
        style={{
          ...card({ padding: 14, marginBottom: 20 }),
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Search size={18} color={M.textMuted} strokeWidth={2} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search terms..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            fontSize: 14,
            color: M.text,
            outline: 'none',
            fontFamily: "'DM Sans', sans-serif",
          }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 12,
              color: M.textMuted,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <Skeleton />
      ) : filtered.length === 0 ? (
        <div style={{ ...card(), textAlign: 'center', padding: '32px 20px' }}>
          <p style={{ fontSize: 14, color: M.textSecondary, margin: '0 0 4px' }}>
            No matching terms
          </p>
          <p style={{ fontSize: 12, color: M.textMuted, margin: 0 }}>
            Try a different search
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([letter, items]) => (
          <div key={letter} style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: M.textMuted,
                fontFamily: "'DM Mono', monospace",
                marginBottom: 8,
                paddingLeft: 4,
              }}
            >
              {letter}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map((entry) => (
                <GlossaryCard
                  key={entry.slug}
                  entry={entry}
                  isExpanded={expandedSlug === entry.slug}
                  onToggle={() =>
                    setExpandedSlug((prev) =>
                      prev === entry.slug ? null : entry.slug,
                    )
                  }
                />
              ))}
            </div>
          </div>
        ))
      )}

      {/* Bottom spacing */}
      <div style={{ height: 24 }} />
    </div>
  )
}
