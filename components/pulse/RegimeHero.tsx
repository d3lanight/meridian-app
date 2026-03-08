// ━━━ RegimeHero ━━━
// v2.0.0 · S172 · Sprint 35
// Expandable regime history drawer.
// Changelog:
//   v2.0.0 — S172: Tappable hero row toggles history drawer.
//            Period tabs 7d/30d/90d (90d pro-locked).
//            Scrollable regime blocks + breakdown bar.
//            Confidence bar stays always visible.
//            regimeHistory prop from /api/market-context?days=90.
//   v1.0.0 — S162: Static hero with confidence bar + day count.

'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { ChevronDown, ChevronUp, Lock } from 'lucide-react'
import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'
import { compressToRuns, confTraj, getRegimeConfig } from '@/lib/regime-utils'
import type { RegimeRow } from '@/lib/regime-utils'

// ── Fonts ──────────────────────────────────────
const FONT_DISPLAY = "'Outfit', sans-serif"
const FONT_MONO    = "'DM Mono', monospace"
const FONT_BODY    = "'DM Sans', sans-serif"

// ── RC shorthand (local, consistent with Exposure/RegimeTimeline) ──
// TODO: migrate to shared RC after S174 ships
const RC: Record<string, { label: string; icon: string; color: string; dim: string; glow: string; bg: string }> = {
  bull:       { label: 'Bull',     icon: '↗', color: M.positive,    dim: M.positiveDim,    glow: 'rgba(42,157,143,0.3)',   bg: 'linear-gradient(135deg,#2A9D8F,#3DB8A9)' },
  bear:       { label: 'Bear',     icon: '↘', color: M.negative,    dim: M.negativeDim,    glow: 'rgba(231,111,81,0.3)',   bg: 'linear-gradient(135deg,#E76F51,#F08C70)' },
  range:      { label: 'Range',    icon: '→', color: '#5B7FA6',     dim: 'rgba(91,127,166,0.12)', glow: 'rgba(91,127,166,0.2)',  bg: 'linear-gradient(135deg,#5B7FA6,#7299BE)' },
  volatility: { label: 'Volatile', icon: '↕', color: '#C8782A',     dim: 'rgba(200,120,42,0.12)', glow: 'rgba(200,120,42,0.3)',  bg: 'linear-gradient(135deg,#C8782A,#D9904A)' },
}
function getRC(regime: string) {
  return RC[regime?.toLowerCase()] || RC.range
}

// ── Props ──────────────────────────────────────

interface RegimeHeroProps {
  regime: string
  confidence: number     // already ×100 (display value, e.g. 74)
  persistence: number    // day count
  regimeHistory?: RegimeRow[]
  isPro: boolean
}

// ── Component ──────────────────────────────────

export default function RegimeHero({
  regime,
  confidence,
  persistence,
  regimeHistory,
  isPro,
}: RegimeHeroProps) {
  const [open, setOpen] = useState(false)
  const [period, setPeriod] = useState(30)
  const scrollRef = useRef<HTMLDivElement>(null)
  const rc = getRC(regime)

  // Slice history to selected period
  const filtered = useMemo(
    () => (regimeHistory ? regimeHistory.slice(0, period) : []),
    [regimeHistory, period]
  )
  const runs = useMemo(() => compressToRuns(filtered), [filtered])
  const totalDays = filtered.length

  // Scroll to end (most recent = rightmost) when drawer opens
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
    }
  }, [open, runs])

  // Aggregate breakdown
  const agg = useMemo(() => {
    const by: Record<string, { regime: string; totalDays: number; confs: number[] }> = {}
    for (const r of runs) {
      const k = r.regime.toLowerCase()
      if (!by[k]) by[k] = { regime: r.regime, totalDays: 0, confs: [] }
      by[k].totalDays += r.days
      by[k].confs.push(...r.confs)
    }
    const bd = Object.values(by).map(b => ({
      ...b,
      pct: totalDays ? Math.round((b.totalDays / totalDays) * 100) : 0,
    })).sort((a, b) => b.totalDays - a.totalDays)
    const tc = Math.max(0, runs.length - 1)
    return { bd, tc }
  }, [runs, totalDays])

  return (
    <div style={{
      ...card({ padding: 0 }),
      background: `linear-gradient(135deg, ${rc.dim}, rgba(255,255,255,0.4))`,
      border: `1px solid ${rc.color}33`,
      overflow: 'hidden',
      marginBottom: 12,
    }}>

      {/* ── Tappable hero row ── */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => e.key === 'Enter' && setOpen(o => !o)}
        style={{
          padding: '18px 20px 16px',
          display: 'flex', alignItems: 'center', gap: 14,
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
          userSelect: 'none',
        }}
      >
        {/* Regime icon */}
        <div style={{
          width: 52, height: 52, borderRadius: 16, background: rc.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 16px ${rc.glow}`, flexShrink: 0,
        }}>
          <span style={{ fontSize: 24, color: 'white' }}>{rc.icon}</span>
        </div>

        {/* Label + stats */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 600, color: M.text }}>
              {rc.label}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 8,
              background: rc.dim, color: rc.color,
            }}>
              Day {persistence}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <span style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 600, color: rc.color }}>
              {confidence}%
            </span>
            <span style={{ fontSize: 11, color: M.textMuted }}>confidence</span>
            {agg.tc > 0 && (
              <span style={{ fontSize: 11, color: M.textMuted }}>
                · {agg.tc} shifts in {totalDays}d
              </span>
            )}
          </div>
        </div>

        {/* "history" label + chevron — opacity 0.45 per spec */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          opacity: 0.45,
        }}>
          <span style={{ fontSize: 9, color: M.textMuted, letterSpacing: 0.3, fontFamily: FONT_BODY }}>
            history
          </span>
          {open
            ? <ChevronUp size={14} color={M.textMuted} />
            : <ChevronDown size={14} color={M.textMuted} />
          }
        </div>
      </div>

      {/* ── Confidence bar — always visible ── */}
      <div style={{ height: 4, background: M.surfaceLight, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${Math.min(100, Math.max(0, confidence))}%`,
          background: rc.bg,
          transition: 'width 0.5s ease',
        }} />
      </div>

      {/* ── Expandable drawer ── */}
      {open && regimeHistory && regimeHistory.length > 0 && (
        <div style={{ borderTop: `1px solid ${M.borderSubtle}`, padding: '14px 20px 18px' }}>

          {/* Period tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {([7, 30, 90] as const).map(p => {
              const locked = p === 90 && !isPro
              const active = period === p && !locked
              return (
                <button
                  key={p}
                  onClick={e => {
                    e.stopPropagation()
                    if (!locked) setPeriod(p)
                  }}
                  style={{
                    flex: 1, padding: '7px 0', borderRadius: 12, border: 'none',
                    cursor: locked ? 'default' : 'pointer',
                    background: active ? M.accentGradient : 'rgba(255,255,255,0.5)',
                    color: active ? 'white' : locked ? M.textMuted : M.textSecondary,
                    fontSize: 12, fontWeight: 600, fontFamily: FONT_BODY,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    opacity: locked ? 0.55 : 1,
                    boxShadow: active ? `0 2px 8px ${M.accentGlow}` : 'none',
                    transition: 'background 0.15s ease',
                  }}
                >
                  {p}d {locked && <Lock size={9} color={M.textMuted} />}
                </button>
              )
            })}
          </div>

          {/* Date range labels */}
          {(() => {
            const oldest = runs[0]
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

          {/* Scrollable regime blocks — current is rightmost */}
          <div
            ref={scrollRef}
            style={{
              overflowX: 'auto', WebkitOverflowScrolling: 'touch',
              msOverflowStyle: 'none', scrollbarWidth: 'none', paddingBottom: 4,
            }}
          >
            <div style={{ display: 'flex', gap: 4, minWidth: 'max-content' }}>
              {runs.map((run, i) => {
                const isNow = i === runs.length - 1
                const cfg = getRC(run.regime)
                const avgConf = run.confs.length
                  ? Math.round((run.confs.reduce((s, v) => s + v, 0) / run.confs.length) * 100)
                  : 0
                const traj = confTraj(run.confs)
                const minW = Math.max(52, run.days * 5)
                const dateLbl = run.startDate
                  ? new Date(run.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : ''

                return (
                  <div key={i} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    minWidth: minW, flexShrink: 0,
                  }}>
                    <div style={{
                      width: '100%',
                      background: isNow ? cfg.bg : cfg.dim,
                      borderRadius: 14, padding: '8px 10px 7px',
                      border: isNow ? `1.5px solid ${cfg.color}` : `1px solid rgba(255,255,255,0.6)`,
                      position: 'relative', display: 'flex', flexDirection: 'column', gap: 2, minHeight: 62,
                    }}>
                      {/* Live dot on current block */}
                      {isNow && (
                        <div style={{
                          position: 'absolute', top: 7, right: 7,
                          width: 5, height: 5, borderRadius: '50%',
                          background: 'white', opacity: 0.85,
                          boxShadow: '0 0 6px rgba(255,255,255,0.6)',
                        }} />
                      )}
                      {/* Regime icon + label */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{
                          width: 16, height: 16, borderRadius: 5,
                          background: isNow ? 'rgba(255,255,255,0.2)' : cfg.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <span style={{ fontSize: 8, color: 'white', lineHeight: 1 }}>{cfg.icon}</span>
                        </div>
                        <span style={{
                          fontSize: 9, fontWeight: 600,
                          color: isNow ? 'white' : M.text,
                          whiteSpace: 'nowrap', fontFamily: FONT_BODY,
                        }}>
                          {cfg.label}
                        </span>
                      </div>
                      {/* Day count */}
                      <div style={{
                        fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700,
                        color: isNow ? 'white' : M.text, lineHeight: 1, marginBottom: 'auto',
                      }}>
                        {run.days}d
                      </div>
                      {/* Avg conf + trajectory */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <span style={{
                          fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600,
                          color: isNow ? 'rgba(255,255,255,0.7)' : M.textSecondary,
                        }}>
                          {avgConf}%
                        </span>
                        {traj && traj !== '→' && (
                          <span style={{
                            fontSize: 9, fontWeight: 600,
                            color: isNow
                              ? 'rgba(255,255,255,0.5)'
                              : traj === '↑' ? M.positive : M.negative,
                          }}>
                            {traj}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Date label below block */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 3 }}>
                      <div style={{ width: 1, height: 4, background: M.borderSubtle }} />
                      <span style={{
                        fontSize: 8, fontFamily: FONT_MONO, whiteSpace: 'nowrap',
                        color: isNow ? M.text : M.textMuted,
                        fontWeight: isNow ? 600 : 400,
                      }}>
                        {isNow ? 'Now' : dateLbl}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Regime breakdown bar + legend */}
          {agg.bd.length > 0 && (
            <div style={{ marginTop: 14 }}>
              {/* Proportional colour bar */}
              <div style={{ display: 'flex', gap: 2, height: 8, borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
                {agg.bd.map(b => {
                  const cfg = getRC(b.regime)
                  return (
                    <div key={b.regime} style={{ flex: b.pct, background: cfg.color, opacity: 0.7 }} />
                  )
                })}
              </div>
              {/* Legend */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
                {agg.bd.map(b => {
                  const cfg = getRC(b.regime)
                  return (
                    <div key={b.regime} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 6, height: 6, borderRadius: 2, background: cfg.color }} />
                      <span style={{ fontSize: 10, fontWeight: 600, color: M.text, fontFamily: FONT_BODY }}>{cfg.label}</span>
                      <span style={{ fontSize: 10, color: M.textMuted, fontFamily: FONT_MONO }}>{b.pct}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
