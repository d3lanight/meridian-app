// ━━━ BottomSheet — Shared bottom sheet shell ━━━
// v1.1.0 · bug fix — full bleed + bottom breathing room
// Changelog:
//   v1.1.0 — Remove side margin (0 12px → 0). Sheet now touches screen edges.
//             Add paddingBottom to inner scroll container: env(safe-area-inset-bottom)
//             + 24px fixed offset. Last item no longer abuts the screen edge.
//   v1.0.0 — S177: Initial implementation. Extracted from AuthSheet / inline sheet wrappers.
//             scrollable prop controls inner scroll behaviour.
//             Scroll lock always active (body overflow hidden).
//             Back-page scroll prevention: onWheel + onTouchMove on backdrop + non-scrollable body.
// Location: components/shared/BottomSheet.tsx

'use client'

import { useEffect, useRef } from 'react'
import { M } from '@/lib/meridian'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  /** 
   * true  — inner content is scrollable (Add Holding, Auth, Coin Info etc.)
   * false — fixed height, no scroll, gestures don't bleed to back page (Edit Holding)
   */
  scrollable?: boolean
  /** Override max height. Defaults to '92vh'. */
  maxHeight?: string
  children: React.ReactNode
}

export default function BottomSheet({
  isOpen,
  onClose,
  scrollable = true,
  maxHeight = '92vh',
  children,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)

  // ── Scroll lock — always, regardless of scrollable prop ──────────────────
  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // ── Prevent wheel events from reaching the back page ─────────────────────
  // For non-scrollable sheets: block on the sheet body itself too.
  // For scrollable sheets: overscrollBehavior: contain handles it at scroll end.
  const handleWheel = (e: React.WheelEvent) => {
    if (!scrollable) {
      e.preventDefault()
      return
    }
    // Scrollable: only prevent if already at scroll boundary
    const el = sheetRef.current
    if (!el) return
    const atTop = el.scrollTop === 0 && e.deltaY < 0
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight && e.deltaY > 0
    if (atTop || atBottom) e.preventDefault()
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!scrollable) e.preventDefault()
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        maxWidth: 430,
        margin: '0 auto',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        pointerEvents: 'auto',
      }}
    >
      {/* Backdrop — blocks all scroll passthrough */}
      <div
        onClick={onClose}
        onWheel={e => e.preventDefault()}
        onTouchMove={e => e.preventDefault()}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.2)',
        }}
      />

      {/* Sheet container — full bleed, no side margin */}
      <div
        style={{
          position: 'relative',
          background: 'rgba(255,255,255,0.9)',
          borderRadius: '24px 24px 0 0',
          padding: '12px 0 0',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.08)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          maxHeight,
          overflow: 'hidden',       // THE KEY: container always clips
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Drag handle */}
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: M.borderSubtle,
            margin: '0 auto 12px',
            flexShrink: 0,
          }}
        />

        {scrollable ? (
          // Scrollable inner body — the ONLY scroll surface
          // paddingBottom leaves breathing room above the screen edge
          <div
            ref={sheetRef}
            onWheel={handleWheel}
            onTouchMove={handleTouchMove}
            style={{
              flex: 1,
              overflowY: 'auto',
              overscrollBehavior: 'contain',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
            }}
          >
            {children}
          </div>
        ) : (
          // Non-scrollable body — blocks all scroll gestures
          <div
            onWheel={handleWheel}
            onTouchMove={handleTouchMove}
            style={{
              flex: 1,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
            }}
          >
            {children}
          </div>
        )}
      </div>
    </div>
  )
}
