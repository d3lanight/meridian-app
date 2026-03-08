// ━━━ RegimeTimeline ━━━
// v1.1.0 · S174 · Sprint 35
// Import RC + getRegime from shared RegimeIcon (S174).
// Changelog:
//   v1.1.0 — S174: Remove local RC/gR. Import { RC, getRegime } from shared.
//            Use RegimeIcon component for SVG icons in blocks.
//   v1.0.0 — S163: Collapsible regime timeline with period tabs (7d/30d/90d),
//            rich blocks, breakdown pills.

'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { ChevronDown, ChevronUp, Lock } from 'lucide-react'
import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'
import { compressToRuns, confTraj } from '@/lib/regime-utils'
import type { RegimeRow, Run } from '@/lib/regime-utils'
import RegimeIcon, { getRegime } from '@/components/shared/RegimeIcon'

// ─── Fonts ────────────────────────────────────────────────────────────────────
const FONT_DISPLAY = "'Outfit', sans-serif"
const FONT_BODY = "'DM Sans', sans-serif"
const FONT_MONO = "'DM Mono', monospace"

// ─── Props ────────────────────────────────────────────────────────────────────

interface RegimeTimelineProps {
  /** Raw regime rows from /api/market-context (newest first) */
  regimeHistory: RegimeRow[]
  /** Current regime key (e.g. 'bull', 'bear') */
  currentRegime: string
  /** Current confidence as display % (0–100) */
  confidence: number
  /** Days in current regime */
  persistence: number
  /** Whether user has Pro tier */
  isPro: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeAgg(runs: Run[], totalDays: number) {
  const by: Record<string, { regime: string; totalDays: number; inst: number; confs: number[] }> = {}
  for (const r of runs) {
    const k = r.regime.toLowerCase()
    if (!by[k]) by[k] = { regime: r.regime, totalDays: 0, inst: 0, confs: [] }
    by[k].totalDays += r.days
    by[k].inst++
    by[k].confs.push(...r.confs)
  }
  const bd = Object.values(by).map(b => ({
    ...b,
    avgConf: b.confs.length ? Math.round((b.confs.reduce((s, c) => s + c, 0) / b.confs.length) * 100) : 0,
    pct: totalDays ? Math.round((b.totalDays / totalDays) * 100) : 0,
  })).sort((a, b) => b.totalDays - a.totalDays)
  return { bd, dom: bd[0] ?? null, tc: Math.max(0, runs.length - 1) }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RegimeTimeline({
  regimeHistory,
  currentRegime,
  confidence,
  persistence,
  isPro,
}: RegimeTimelineProps) {
  const [expanded, setExpanded] = useState(false)
  const [period, setPeriod] = useState<7 | 30 | 90>(30)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Filter history by selected period, then compress
  const filtered = useMemo(
    () => regimeHistory ? regimeHistory.slice(0, period) : [],
    [regimeHistory, period],
  )
  const runs = useMemo(() => compressToRuns(filtered), [filtered])
  const totalDays = filtered.length
  const agg = useMemo(() => computeAgg(runs, totalDays), [runs, totalDays])

  // Auto-scroll to rightmost (current) run on expand
  useEffect(() => {
    if (expanded && scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
    }
  }, [expanded, runs])

  const rc = getRegime(currentRegime)

  if (!regimeHistory?.length) return null

  return (
    <div style={{ ...card({ padding: 16 }), marginBottom: 12 }}>
      {/* ── Header: current regime + expand toggle ── */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left',
        }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: rc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 3px 10px ${rc.glow}`,
        }}>
          <RegimeIcon regime={currentRegime} size={18} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 600, color: M.text }}>
              {rc.label} Market
            </span>
            <span style={{
              fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 6,
              background: rc.dim, color: rc.color,
            }}>
              Day {persistence}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: M.textSecondary }}>
              {confidence}% confidence
            </span>
            {agg.dom && (
              <span style={{ fontSize: 10, color: M.textMuted }}>
                · {agg.tc} shift{agg.tc !== 1 ? 's' : ''} in {totalDays}d
              </span>
            )}
          </div>
        </div>
        <div style={{
          width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.5)',
          border: `1px solid ${M.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {expanded
            ? <ChevronUp size={14} color={M.textSecondary} />
            : <ChevronDown size={14} color={M.textSecondary} />}
        </div>
      </button>

      {/* ── Compact strip (always visible) ── */}
      <div style={{ display: 'flex', gap: 1.5, height: 6, borderRadius: 6, overflow: 'hidden', marginTop: 12 }}>
        {runs.map((run, i) => {
          const cfg = getRegime(run.regime)
          return (
            <div key={i} style={{
              flex: run.days, background: cfg.color,
              opacity: i === runs.length - 1 ? 1 : 0.5,
            }} />
          )
        })}
      </div>

      {/* ── Expanded: rich timeline blocks ── */}
      {expanded && (
        <div style={{ marginTop: 14 }}>
          {/* Period tabs: 7d / 30d / 90d */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {([7, 30, 90] as const).map(p => {
              const locked = p === 90 && !isPro
              const active = period === p && !locked
              return (
                <button
                  key={p}
                  onClick={() => { if (!locked) setPeriod(p) }}
                  style={{
                    flex: 1, padding: '7px 0', borderRadius: 12, border: 'none',
                    cursor: locked ? 'default' : 'pointer',
                    background: active ? M.accentGradient : 'rgba(255,255,255,0.5)',
                    color: active ? 'white' : locked ? M.textMuted : M.textSecondary,
                    fontSize: 12, fontWeight: 600, fontFamily: FONT_BODY,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    opacity: locked ? 0.55 : 1,
                    boxShadow: active ? `0 2px 8px ${M.accentGlow}` : 'none',
                  }}
                >
                  {p}d{locked && <Lock size={9} color={M.textMuted} />}
                </button>
              )
            })}
          </div>

          {/* Date labels: start — Today */}
          {(() => {
            const oldest = runs.length ? runs[0] : null
            const startLabel = oldest?.startDate
              ? new Date(oldest.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : `${totalDays}d ago`
            return (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, padding: '0 2px' }}>
                <span style={{ fontSize: 10, color: M.textMuted, fontFamily: FONT_MONO }}>{startLabel}</span>
                <span style={{ fontSize: 10, color: M.text, fontWeight: 600, fontFamily: FONT_MONO }}>Today</span>
              </div>
            )
          })()}

          {/* Scrollable rich blocks */}
          <div
            ref={scrollRef}
            style={{
              overflowX: 'auto', WebkitOverflowScrolling: 'touch',
              msOverflowStyle: 'none', scrollbarWidth: 'none', paddingBottom: 4,
            }}
          >
            <div style={{ display: 'flex', gap: 4, minWidth: 'max-content' }}>
              {runs.map((run, i) => {
                const isLast = i === runs.length - 1
                const cfg = getRegime(run.regime)
                const avgConf = run.confs.length
                  ? Math.round((run.confs.reduce((s, v) => s + v, 0) / run.confs.length) * 100) : 0
                const traj = confTraj(run.confs)
                const minW = Math.max(52, run.days * 5)
                const dateLbl = run.startDate
                  ? new Date(run.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : ''

                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: minW, flexShrink: 0 }}>
                    <div style={{
                      width: '100%',
                      background: isLast ? cfg.bg : cfg.dim,
                      borderRadius: 14,
                      padding: '8px 10px 7px',
                      border: isLast ? `1.5px solid ${cfg.color}` : `1px solid ${M.border}`,
                      position: 'relative',
                      display: 'flex', flexDirection: 'column', gap: 2,
                      minHeight: 62,
                    }}>
                      {/* Live dot */}
                      {isLast && (
                        <div style={{
                          position: 'absolute', top: 7, right: 7,
                          width: 5, height: 5, borderRadius: '50%',
                          background: 'white', opacity: 0.85,
                          boxShadow: '0 0 6px rgba(255,255,255,0.6)',
                        }} />
                      )}

                      {/* Icon + label */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <div style={{
                          width: 16, height: 16, borderRadius: '50%',
                          background: isLast ? 'rgba(255,255,255,0.25)' : cfg.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <RegimeIcon regime={run.regime} size={9} color="white" />
                        </div>
                        <span style={{
                          fontSize: 9, fontWeight: 600,
                          color: isLast ? 'white' : M.text,
                          whiteSpace: 'nowrap',
                        }}>{cfg.label}</span>
                      </div>

                      {/* Duration */}
                      <div style={{
                        fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700,
                        color: isLast ? 'white' : M.text, lineHeight: 1,
                        marginBottom: 'auto',
                      }}>{run.days}d</div>

                      {/* Confidence + trajectory */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <span style={{
                          fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600,
                          color: isLast ? 'rgba(255,255,255,0.7)' : M.textSecondary,
                        }}>{avgConf}%</span>
                        {run.days >= 3 && (
                          <span style={{
                            fontSize: 9, fontWeight: 600,
                            color: isLast ? 'rgba(255,255,255,0.5)'
                              : traj === '↑' ? M.positive
                              : traj === '↓' ? M.negative : M.textMuted,
                          }}>{traj}</span>
                        )}
                      </div>
                    </div>
                    {/* Date anchor */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 3 }}>
                      <div style={{ width: 1, height: 4, background: M.borderSubtle }} />
                      <span style={{
                        fontSize: 8, color: isLast ? M.text : M.textMuted,
                        fontFamily: FONT_MONO, whiteSpace: 'nowrap',
                        fontWeight: isLast ? 600 : 400,
                      }}>{isLast ? 'Now' : dateLbl}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Breakdown bar — proportional by regime */}
          <div style={{ display: 'flex', gap: 1.5, height: 10, borderRadius: 6, overflow: 'hidden', marginTop: 12 }}>
            {agg.bd.map((b) => {
              const cfg = getRegime(b.regime)
              return (
                <div key={b.regime} style={{
                  flex: b.totalDays,
                  background: cfg.color,
                  position: 'relative',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {b.pct >= 15 && (
                    <span style={{
                      fontSize: 7, fontWeight: 700, color: 'white',
                      textTransform: 'uppercase', letterSpacing: 0.5,
                      whiteSpace: 'nowrap',
                    }}>
                      {cfg.label}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
