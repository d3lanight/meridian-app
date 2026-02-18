// ━━━ Portfolio Snapshot ━━━
// v1.0 · ca-story39 · 2026-02-18
// Source: portfolio-snapshot-B.jsx (Designer artifact, approved)
// Option A: no posture section (deferred to signals pipeline)
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  CheckCircle,
  AlertTriangle,
  Wallet,
  BookOpen,
} from 'lucide-react';
import { M } from '@/lib/meridian';
import type { PortfolioExposure, DisplayHolding } from '@/types';

const SEGMENT = {
  BTC: { color: '#F5B74D', dim: 'rgba(245,183,77,0.12)' },
  ETH: { color: '#60A5FA', dim: 'rgba(96,165,250,0.12)' },
  ALT: { color: '#A78BFA', dim: 'rgba(167,139,250,0.12)' },
} as const;

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const qty = (n: number) => n < 1 ? n.toFixed(4) : n < 100 ? n.toFixed(2) : n.toFixed(0);

const cardBase: React.CSSProperties = {
  background: M.surface, border: `1px solid ${M.borderSubtle}`,
  borderRadius: '16px', padding: '20px', marginBottom: '12px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '10px', letterSpacing: '0.1em',
  color: M.textMuted, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
};

export default function PortfolioPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<PortfolioExposure | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchExposure() {
      try {
        const res = await fetch('/api/portfolio-snapshot');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: PortfolioExposure = await res.json();
        setData(json);
      } catch (err) {
        console.error('[PortfolioPage] fetch error:', err);
        setError('Unable to load portfolio data');
      } finally {
        setLoading(false);
      }
    }
    fetchExposure();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const isEmpty = !data || data.isEmpty || data.holdings_count === 0;
  const altUnpriced: string[] = data ? JSON.parse(data.alt_unpriced || '[]') : [];
  const allPriced = altUnpriced.length === 0;

  const allHoldings: DisplayHolding[] =
    data && !isEmpty
      ? [
          ...(data.btc_weight_all > 0
            ? [{
                asset: 'BTC',
                quantity: data.holdings_json.find((h) => h.asset === 'BTC')?.quantity ?? 0,
                usd_price: data.btc_value_usd / (data.holdings_json.find((h) => h.asset === 'BTC')?.quantity || 1),
                value_usd: data.btc_value_usd,
                category: 'BTC' as const,
                weight: data.btc_weight_all,
              }]
            : []),
          ...(data.eth_weight_all > 0
            ? [{
                asset: 'ETH',
                quantity: data.holdings_json.find((h) => h.asset === 'ETH')?.quantity ?? 0,
                usd_price: data.eth_value_usd / (data.holdings_json.find((h) => h.asset === 'ETH')?.quantity || 1),
                value_usd: data.eth_value_usd,
                category: 'ETH' as const,
                weight: data.eth_weight_all,
              }]
            : []),
          ...data.alt_breakdown.map((a) => ({
            asset: a.asset, quantity: a.quantity, usd_price: a.usd_price,
            value_usd: a.value_usd, category: 'ALT' as const,
            weight: a.value_usd / data.total_value_usd_all,
          })),
        ].sort((a, b) => b.value_usd - a.value_usd)
      : [];
  const anim = (i: number): React.CSSProperties => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(12px)',
    transition: `all 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.08}s`,
  });

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: M.textMuted, fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}>Loading portfolio…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <AlertTriangle size={24} color={M.negative} style={{ marginBottom: '8px' }} />
          <div style={{ color: M.textSecondary, fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 16px' }}>
      <div style={{ padding: '16px 4px', display: 'flex', alignItems: 'center', gap: '12px', ...anim(0) }}>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            background: M.surfaceLight, border: 'none', borderRadius: '10px',
            width: '36px', height: '36px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
        >
          <ChevronLeft size={18} color={M.textSecondary} />
        </button>
        <span style={{
          fontFamily: "'Outfit', sans-serif", fontSize: '18px', fontWeight: 600,
          letterSpacing: '-0.02em', color: M.text,
        }}>
          Portfolio
        </span>
      </div>

      {isEmpty ? (
        <div style={{ ...cardBase, padding: '48px 24px', textAlign: 'center', ...anim(1) }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '20px', background: M.accentMuted,
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <Wallet size={28} color={M.accent} />
          </div>
          <div style={{
            fontFamily: "'Outfit', sans-serif", fontSize: '18px', fontWeight: 600,
            marginBottom: '8px', color: M.text,
          }}>
            No holdings yet
          </div>
          <div style={{
            fontSize: '13px', color: M.textSecondary, lineHeight: 1.5,
            maxWidth: '280px', margin: '0 auto 20px',
          }}>
            Add your portfolio holdings to see how your exposure is distributed across BTC, ETH, and altcoins.
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            fontSize: '11px', color: M.accent, fontWeight: 500,
          }}>
            <BookOpen size={14} />
            Understanding portfolio exposure
          </div>
        </div>
      ) : data && (
        <>
          <div style={{ ...anim(1), marginBottom: '16px', padding: '0 4px' }}>
            <div style={{ ...labelStyle, marginBottom: '6px' }}>TOTAL VALUE</div>
            <div style={{
              fontFamily: "'DM Mono', monospace", fontSize: '32px', fontWeight: 600,
              color: M.text, letterSpacing: '-0.03em', lineHeight: 1,
            }}>
              {fmt(data.total_value_usd_all)}
            </div>
            <div style={{ fontSize: '12px', color: M.textMuted, marginTop: '4px' }}>
              {data.holdings_count} holdings
            </div>
          </div>

          <div style={{ ...cardBase, ...anim(2) }}>
            <div style={{ ...labelStyle, marginBottom: '14px' }}>EXPOSURE BREAKDOWN</div>
            <div style={{
              display: 'flex', height: '12px', borderRadius: '100px',
              overflow: 'hidden', marginBottom: '16px',
            }}>
              <div style={{
                width: pct(data.btc_weight_all),
                background: `linear-gradient(90deg, ${SEGMENT.BTC.color}99, ${SEGMENT.BTC.color})`,
                transition: 'width 0.8s ease',
              }} />
              <div style={{
                width: pct(data.eth_weight_all),
                background: `linear-gradient(90deg, ${SEGMENT.ETH.color}88, ${SEGMENT.ETH.color})`,
                transition: 'width 0.8s ease',
              }} />
              <div style={{
                width: pct(data.alt_weight_all),
                background: `linear-gradient(90deg, ${SEGMENT.ALT.color}88, ${SEGMENT.ALT.color})`,
                transition: 'width 0.8s ease',
              }} />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {([
                { key: 'BTC' as const, weight: data.btc_weight_all, value: data.btc_value_usd },
                { key: 'ETH' as const, weight: data.eth_weight_all, value: data.eth_value_usd },
                { key: 'ALT' as const, weight: data.alt_weight_all, value: data.alt_value_usd },
              ]).map((seg) => (
                <div key={seg.key} style={{
                  flex: 1, background: M.surfaceLight, borderRadius: '12px', padding: '12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '3px',
                      background: SEGMENT[seg.key].color,
                    }} />
                    <span style={{
                      fontSize: '11px', fontFamily: "'DM Mono', monospace",
                      color: M.textSecondary, fontWeight: 500,
                    }}>
                      {seg.key}
                    </span>
                  </div>
                  <div style={{
                    fontFamily: "'Outfit', sans-serif", fontSize: '18px', fontWeight: 600,
                    color: SEGMENT[seg.key].color, letterSpacing: '-0.02em', lineHeight: 1.1,
                  }}>
                    {pct(seg.weight)}
                  </div>
                  <div style={{
                    fontFamily: "'DM Mono', monospace", fontSize: '11px', color: M.textMuted, marginTop: '2px',
                  }}>
                    {fmt(seg.value)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {data.alt_count > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 14px', borderRadius: '12px',
              background: allPriced ? M.positiveDim : M.accentMuted,
              marginBottom: '12px', ...anim(3),
            }}>
              {allPriced
                ? <CheckCircle size={14} color={M.positive} />
                : <AlertTriangle size={14} color={M.accent} />}
              <span style={{
                fontSize: '12px', fontWeight: 500,
                color: allPriced ? M.positive : M.accent,
              }}>
                {allPriced
                  ? `All ${data.alt_count} altcoins priced`
                  : `${altUnpriced.length} of ${data.alt_count} altcoins unpriced`}
              </span>
              {!allPriced && (
                <span style={{ fontSize: '11px', color: M.textMuted, marginLeft: 'auto' }}>
                  Values may be approximate
                </span>
              )}
            </div>
          )}

          <div style={{ ...anim(4) }}>
            <div style={{ ...labelStyle, padding: '0 4px', marginBottom: '10px' }}>HOLDINGS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {allHoldings.map((h, i) => {
                const seg = SEGMENT[h.category] || SEGMENT.ALT;
                return (
                  <div key={h.asset} style={{
                    background: M.surface, border: `1px solid ${M.borderSubtle}`,
                    borderRadius: '14px', padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: '12px',
                    ...anim(5 + i * 0.5),
                  }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: seg.dim,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <span style={{
                        fontFamily: "'Outfit', sans-serif", fontSize: '11px', fontWeight: 700, color: seg.color,
                      }}>
                        {h.asset.slice(0, 3)}
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', marginBottom: '6px',
                      }}>
                        <span style={{
                          fontFamily: "'Outfit', sans-serif", fontSize: '14px', fontWeight: 600, color: M.text,
                        }}>
                          {h.asset}
                        </span>
                        <span style={{
                          fontFamily: "'DM Mono', monospace", fontSize: '14px', fontWeight: 500, color: M.text,
                        }}>
                          {fmt(h.value_usd)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          flex: 1, height: '4px', background: M.surfaceLight,
                          borderRadius: '100px', overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${Math.min(h.weight * 100 * 2.5, 100)}%`,
                            background: `linear-gradient(90deg, ${seg.color}66, ${seg.color})`,
                            borderRadius: '100px', transition: 'width 0.8s ease',
                          }} />
                        </div>
                        <span style={{
                          fontFamily: "'DM Mono', monospace", fontSize: '11px', color: seg.color,
                          fontWeight: 500, minWidth: '38px', textAlign: 'right',
                        }}>
                          {pct(h.weight)}
                        </span>
                      </div>
                      <div style={{
                        fontSize: '11px', color: M.textMuted, marginTop: '4px', fontFamily: "'DM Mono', monospace",
                      }}>
                        {qty(h.quantity)} {h.asset}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: '16px 0', ...anim(10) }}>
            <div style={{ fontSize: '11px', color: M.textSubtle, lineHeight: 1.5 }}>
              Exposure data reflects current holdings, not recommendations.
              <br />
              Actual values may vary by exchange.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
