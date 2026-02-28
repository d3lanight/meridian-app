// ━━━ TimelineStrip ━━━
// v1.0.0 · ca-story80 · Sprint 19
// Horizontal scrollable regime timeline with proportional blocks
// Source: Designer artifact regime-history-production.jsx

'use client'

import { useRef, useEffect } from 'react'
import { M } from '@/lib/meridian'
import { getRegimeConfig, confTraj } from '@/lib/regime-utils'
import type { Run } from '@/lib/regime-utils'

interface TimelineStripProps {
  runs: Run[]
  totalDays: number
  period: 7 | 30 | 90
}

export default function TimelineStrip({ runs, totalDays, period }: TimelineStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to current (rightmost) run on mount / data change
  useEffect(() => {
    if (scrollRef.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
        }
      })
    }
  }, [runs, period])

  if (!runs.length) return null

  const pxPerDay = period <= 7 ? 44 : period <= 30 ? 18 : 10
  const minBlock = 44
  const totalW = Math.max(totalDays * pxPerDay, 320)

  // Date axis ticks
  const startD = new Date(runs[0].startDate + 'T00:00:00')
  const interval = period <= 7 ? 1 : period <= 30 ? 5 : 10
  const ticks: { off: number; lbl: string }[] = []
  for (let d = 0; d <= totalDays; d += interval) {
    const dt = new Date(startD)
    dt.setDate(dt.getDate() + d)
    ticks.push({
      off: totalDays > 0 ? d / totalDays : 0,
      lbl: dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    })
  }
  if (ticks.length && ticks[ticks.length - 1].off < 0.98) {
    ticks.push({ off: 1, lbl: 'Today' })
  } else if (ticks.length) {
    ticks[ticks.length - 1].lbl = 'Today'
  }

  const startLbl = startD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Start / Today labels */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 6,
          padding: '0 2px',
        }}
      >
        <span style={{ fontSize: 10, color: M.textMuted, fontFamily: "'DM Mono', monospace" }}>
          {startLbl}
        </span>
        <span
          style={{
            fontSize: 10,
            color: M.text,
            fontWeight: 600,
            fontFamily: "'DM Mono', monospace",
          }}
        >
          Today
        </span>
      </div>

      {/* Scrollable strip */}
      <div
        ref={scrollRef}
        style={{
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          paddingBottom: 2,
        }}
      >
        <div style={{ minWidth: totalW, position: 'relative' }}>
          {/* Regime blocks row */}
          <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
            {runs.map((run, i) => {
              const isLast = i === runs.length - 1
              const rc = getRegimeConfig(run.regime)
              const bw = Math.max(minBlock, Math.round((run.days / totalDays) * totalW) - 3)
              const avgConf = run.confs.length
                ? Math.round((run.confs.reduce((s, v) => s + v, 0) / run.confs.length) * 100)
                : 0
              const traj = confTraj(run.confs)
              const showLabel = bw >= 56

              const fg1 = isLast ? 'white' : M.text
              const fg2 = isLast ? 'rgba(255,255,255,0.75)' : M.textSecondary
              const trajColor = isLast
                ? 'rgba(255,255,255,0.6)'
                : traj === '↑'
                  ? M.positive
                  : traj === '↓'
                    ? M.accentDeep
                    : M.textMuted

              return (
                <div
                  key={i}
                  style={{
                    width: bw,
                    flexShrink: 0,
                    background: isLast ? rc.bg : rc.d,
                    borderRadius: 16,
                    padding: '10px 10px 8px',
                    border: isLast ? `1.5px solid ${rc.s}` : `1px solid ${M.border}`,
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 76,
                    cursor: 'default',
                  }}
                >
                  {isLast && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: 'white',
                        opacity: 0.9,
                        boxShadow: '0 0 6px rgba(255,255,255,0.7)',
                        animation: 'livePulse 2s ease-in-out infinite',
                      }}
                    />
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: isLast ? 'rgba(255,255,255,0.25)' : rc.s,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        color: 'white',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {rc.icon}
                    </div>
                    {showLabel && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: fg1,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {rc.l}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: bw >= 80 ? 22 : 16,
                      fontWeight: 700,
                      fontFamily: "'Outfit', sans-serif",
                      color: fg1,
                      lineHeight: 1,
                      marginBottom: 'auto',
                    }}
                  >
                    {run.days}d
                  </div>

                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        fontFamily: "'DM Mono', monospace",
                        color: fg2,
                      }}
                    >
                      {avgConf}%
                    </span>
                    {run.days >= 3 && (
                      <span style={{ fontSize: 10, color: trajColor, fontWeight: 600 }}>
                        {traj}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Date axis */}
          <div
            style={{
              position: 'relative',
              height: 20,
              borderTop: `1px solid ${M.borderSubtle}`,
            }}
          >
            {ticks.map((t, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${t.off * 100}%`,
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: 1,
                    height: 4,
                    background: M.borderSubtle,
                    marginBottom: 2,
                  }}
                />
                <span
                  style={{
                    fontSize: 8,
                    color: M.textMuted,
                    fontFamily: "'DM Mono', monospace",
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t.lbl}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
