// ━━━ AggSection ━━━
// v1.0.0 · ca-story81 · Sprint 19
// Regime aggregation: period summary + per-regime breakdown cards
// Source: Designer artifact regime-history-production.jsx

'use client'

import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'
import { getRegimeConfig } from '@/lib/regime-utils'
import GradientBar from '@/components/shared/GradientBar'
import type { RegimeAgg } from '@/lib/regime-utils'

// ── StatBlock (internal) ──────────────────────

function StatBlock({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          fontFamily: "'DM Mono', monospace",
          color: M.text,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 10, color: M.textMuted, marginTop: 1 }}>{label}</div>
    </div>
  )
}

// ── AggSection ────────────────────────────────

interface AggSectionProps {
  agg: RegimeAgg
}

export default function AggSection({ agg }: AggSectionProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Period summary card */}
      <div
        style={{
          ...card({ padding: '16px' }),
          background: M.accentGlow,
          border: `1px solid ${M.borderAccent}`,
        }}
      >
        {/* Top: dominant regime + BTC period change */}
        {agg.dom && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: getRegimeConfig(agg.dom.regime).bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  color: 'white',
                  fontWeight: 700,
                }}
              >
                {getRegimeConfig(agg.dom.regime).icon}
              </div>
              <div>
                <span style={{ fontSize: 13, color: M.text, fontWeight: 500 }}>
                  Predominantly{' '}
                  <span
                    style={{ color: getRegimeConfig(agg.dom.regime).s, fontWeight: 700 }}
                  >
                    {getRegimeConfig(agg.dom.regime).l}
                  </span>
                </span>
                {agg.dom.pct >= 50 && (
                  <span style={{ fontSize: 11, color: M.textMuted, marginLeft: 4 }}>
                    ({agg.dom.pct}%)
                  </span>
                )}
              </div>
            </div>
            {agg.btcChange !== null && (
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "'DM Mono', monospace",
                  color: agg.btcChange >= 0 ? M.positive : M.negative,
                  flexShrink: 0,
                }}
              >
                {agg.btcChange >= 0 ? '+' : ''}
                {agg.btcChange.toFixed(1)}%
              </span>
            )}
          </div>
        )}

        {/* Mini stat row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            textAlign: 'center',
            padding: '10px 0 2px',
            borderTop: `1px solid ${M.borderSubtle}`,
          }}
        >
          <StatBlock value={agg.td} label="days" />
          <div style={{ width: 1, background: M.borderSubtle, alignSelf: 'stretch' }} />
          <StatBlock value={agg.tc} label={`shift${agg.tc !== 1 ? 's' : ''}`} />
          <div style={{ width: 1, background: M.borderSubtle, alignSelf: 'stretch' }} />
          <StatBlock value={`${agg.ac}%`} label="avg conf" />
        </div>
      </div>

      {/* Per-regime breakdown cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {agg.bd.map((b) => {
          const rc = getRegimeConfig(b.regime)
          return (
            <div
              key={b.regime}
              style={{
                ...card({ padding: '14px', borderRadius: '20px' }),
                borderLeft: `3px solid ${rc.s}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: rc.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      color: 'white',
                      fontWeight: 700,
                    }}
                  >
                    {rc.icon}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: M.text }}>{rc.l}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontFamily: "'DM Mono', monospace",
                      fontWeight: 600,
                      color: M.textSecondary,
                    }}
                  >
                    {b.avgConf}%
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color:
                        b.traj === '↑'
                          ? M.positive
                          : b.traj === '↓'
                            ? M.accentDeep
                            : M.textMuted,
                    }}
                  >
                    {b.traj}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: 6 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: 12, color: M.textSecondary }}>
                    <span
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontWeight: 600,
                        color: M.text,
                        fontSize: 14,
                      }}
                    >
                      {b.totalDays}
                    </span>{' '}
                    of {agg.td} days
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: "'DM Mono', monospace",
                      fontWeight: 600,
                      color: M.textMuted,
                    }}
                  >
                    {b.pct}%
                  </span>
                </div>
                <GradientBar pct={b.pct} gradient={rc.bg} h={6} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
