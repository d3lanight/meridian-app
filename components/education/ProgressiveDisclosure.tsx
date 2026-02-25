// ━━━ Progressive Disclosure Component ━━━
// v1.0.0 · ca-story57 · 2026-02-25
// Extracted from Pulse page InfoBtn/InfoPanel pattern
// L1 (summary) → L2 (context panel) → L3 (learn more link)
// Accordion behavior: one panel open per DisclosureGroup

'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { M } from '@/lib/meridian'

// ── Accordion Context ─────────────────────────
// Ensures only one disclosure is open per group (page-level)

interface DisclosureContextValue {
  activeId: string | null
  toggle: (id: string) => void
}

const DisclosureContext = createContext<DisclosureContextValue>({
  activeId: null,
  toggle: () => {},
})

/**
 * Wrap a set of ProgressiveDisclosure components in a DisclosureGroup
 * to enforce one-open-at-a-time accordion behavior.
 */
export function DisclosureGroup({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const toggle = useCallback(
    (id: string) => setActiveId((prev) => (prev === id ? null : id)),
    [],
  )
  return (
    <DisclosureContext.Provider value={{ activeId, toggle }}>
      {children}
    </DisclosureContext.Provider>
  )
}

// ── Props ─────────────────────────────────────

export interface ProgressiveDisclosureProps {
  /** Unique ID for accordion state (must be unique within a DisclosureGroup) */
  id: string
  /** L1: always-visible content — typically the data label or value row */
  summary: ReactNode
  /** L2: contextual explanation shown on expand */
  context: string
  /** L3: optional link href (e.g., glossary entry) */
  learnMoreHref?: string
  /** L3: link label — defaults to "Learn more" */
  learnMoreLabel?: string
}

// ── Component ─────────────────────────────────

export default function ProgressiveDisclosure({
  id,
  summary,
  context,
  learnMoreHref,
  learnMoreLabel = 'Learn more',
}: ProgressiveDisclosureProps) {
  const { activeId, toggle } = useContext(DisclosureContext)
  const isOpen = activeId === id

  return (
    <>
      {/* L1: Summary row with inline info button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {summary}
        <button
          onClick={() => toggle(id)}
          aria-expanded={isOpen}
          aria-controls={`disclosure-panel-${id}`}
          style={{
            width: 16,
            height: 16,
            // Outer button is 16px visible, but touch target is 44px via padding
            padding: 14,
            margin: -14,
            borderRadius: '50%',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            outline: 'none'
            // Touch target: 16 + 14*2 = 44px
          }}
        >
          <span
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width={10}
              height={10}
              viewBox="0 0 24 24"
              fill="none"
              stroke={M.textMuted}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </span>
        </button>
      </div>

      {/* L2: Expandable context panel */}
      <div
        id={`disclosure-panel-${id}`}
        role="region"
        aria-hidden={!isOpen}
        style={{
          overflow: 'hidden',
          maxHeight: isOpen ? 200 : 0,
          opacity: isOpen ? 1 : 0,
          transition: 'max-height 250ms ease, opacity 200ms ease',
        }}
      >
        <div
          style={{
            margin: '0 0 12px',
            padding: 12,
            background: M.accentGlow,
            borderRadius: 12,
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: M.textSecondary,
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {context}
          </p>

          {/* L3: Optional learn more link */}
          {learnMoreHref && (
            <a
              href={learnMoreHref}
              style={{
                display: 'inline-block',
                marginTop: 8,
                fontSize: 11,
                fontWeight: 500,
                color: M.accentDeep,
                textDecoration: 'none',
              }}
            >
              {learnMoreLabel} →
            </a>
          )}
        </div>
      </div>
    </>
  )
}
