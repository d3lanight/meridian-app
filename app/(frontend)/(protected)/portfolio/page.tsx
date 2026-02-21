// ━━━ Portfolio Snapshot + CRUD ━━━
// v2.1 · ca-story48 · 2026-02-21
// Full CRUD: add, edit, remove holdings with optimistic UI
// Holdings list driven by CRUD data, enriched by snapshot
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  CheckCircle,
  AlertTriangle,
  Wallet,
  BookOpen,
  Plus,
  Edit2,
} from 'lucide-react';
import { M } from '@/lib/meridian';
import { usePortfolio } from '@/hooks/usePortfolio';
import AddHoldingSheet from '@/components/portfolio/AddHoldingSheet';
import EditHoldingSheet from '@/components/portfolio/EditHoldingSheet';
import type { PortfolioExposure, Holding } from '@/types';

const SEGMENT = {
  BTC: { color: '#F7931A', dim: 'rgba(247,147,26,0.12)' },
  ETH: { color: '#60A5FA', dim: 'rgba(96,165,250,0.12)' },
  ALT: { color: '#A78BFA', dim: 'rgba(167,139,250,0.12)' },
} as const;
type SegKey = keyof typeof SEGMENT;

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const qtyFmt = (n: number) => n < 1 ? n.toFixed(4) : n < 100 ? n.toFixed(2) : n.toFixed(0);

const cardBase: React.CSSProperties = {
  background: M.surface,
  backdropFilter: M.surfaceBlur,
  WebkitBackdropFilter: M.surfaceBlur,
  border: `1px solid ${M.border}`,
  borderRadius: '24px',
  padding: '20px',
  marginBottom: '12px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
};

const labelStyle: React.CSSProperties = {
  fontSize: '10px',
  letterSpacing: '0.1em',
  color: M.textMuted,
  fontWeight: 600,
  fontFamily: "'DM Sans', sans-serif",
};

function getSegKey(symbol: string): SegKey {
  if (symbol === 'BTC') return 'BTC';
  if (symbol === 'ETH') return 'ETH';
  return 'ALT';
}

type SheetState =
  | { type: 'closed' }
  | { type: 'add' }
  | { type: 'edit'; holding: Holding };

export default function PortfolioPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [snapshot, setSnapshot] = useState<PortfolioExposure | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(true);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SheetState>({ type: 'closed' });

  const {
    holdings,
    assets,
    isLoading: holdingsLoading,
    addHolding,
    updateHolding,
    removeHolding,
  } = usePortfolio();

  const fetchSnapshot = async () => {
    try {
      const res = await fetch('/api/portfolio-snapshot');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: PortfolioExposure = await res.json();
      setSnapshot(json);
    } catch (err) {
      console.error('[PortfolioPage] snapshot error:', err);
      setSnapshotError('Unable to load exposure data');
    } finally {
      setSnapshotLoading(false);
    }
  };

  useEffect(() => { fetchSnapshot(); }, []);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const heldSymbols = useMemo(() => holdings.map(h => h.asset), [holdings]);

  // Build price lookup from snapshot data
  const priceLookup = useMemo(() => {
    const map: Record<string, { usd_price: number; value_usd: number; weight: number }> = {};
    if (!snapshot || snapshot.isEmpty) return map;
    const btcQty = snapshot.holdings_json.find(h => h.asset === 'BTC')?.quantity || 0;
    if (btcQty > 0) {
      map['BTC'] = {
        usd_price: snapshot.btc_value_usd / btcQty,
        value_usd: snapshot.btc_value_usd,
        weight: snapshot.btc_weight_all,
      };
    }
    const ethQty = snapshot.holdings_json.find(h => h.asset === 'ETH')?.quantity || 0;
    if (ethQty > 0) {
      map['ETH'] = {
        usd_price: snapshot.eth_value_usd / ethQty,
        value_usd: snapshot.eth_value_usd,
        weight: snapshot.eth_weight_all,
      };
    }
    for (const a of snapshot.alt_breakdown) {
      map[a.asset] = {
        usd_price: a.usd_price,
        value_usd: a.value_usd,
        weight: snapshot.total_value_usd_all > 0 ? a.value_usd / snapshot.total_value_usd_all : 0,
      };
    }
    return map;
  }, [snapshot]);

  const handleAdd = async (asset: string, quantity: number, costBasis?: number | null) => {
    const ok = await addHolding(asset, quantity, costBasis);
    if (ok) fetchSnapshot();
    return ok;
  };

  const handleUpdate = async (id: string, updates: any) => {
    const ok = await updateHolding(id, updates);
    if (ok) fetchSnapshot();
    return ok;
  };

  const handleRemove = async (id: string) => {
    const ok = await removeHolding(id);
    if (ok) fetchSnapshot();
    return ok;
  };

  const anim = (i: number): React.CSSProperties => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(12px)',
    transition: `all 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.08}s`,
  });

  const loading = snapshotLoading || holdingsLoading;

  // ── KEY CHANGE: isEmpty is driven by CRUD holdings, not snapshot ──
  const isEmpty = holdings.length === 0;
  const hasSnapshot = snapshot && !snapshot.isEmpty && snapshot.total_value_usd_all > 0;
  const totalValue = snapshot?.total_value_usd_all || 0;
  const altUnpriced: string[] = snapshot ? JSON.parse(snapshot.alt_unpriced || '[]') : [];
  const allPriced = altUnpriced.length === 0;

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: M.textMuted, fontSize: '13px' }}>Loading portfolio…</div>
      </div>
    );
  }

  // Sheet overlay
  if (sheet.type !== 'closed') {
    return (
      <div style={{ minHeight: '100vh' }}>
        {sheet.type === 'add' && (
          <AddHoldingSheet
            assets={assets}
            heldSymbols={heldSymbols}
            onAdd={handleAdd}
            onClose={() => setSheet({ type: 'closed' })}
          />
        )}
        {sheet.type === 'edit' && (
          <EditHoldingSheet
            holding={sheet.holding}
            onUpdate={handleUpdate}
            onRemove={handleRemove}
            onClose={() => setSheet({ type: 'closed' })}
          />
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '0 16px', position: 'relative' }}>
      {/* Header */}
      <div style={{ padding: '16px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...anim(0) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              background: 'rgba(255,255,255,0.4)',
              border: 'none',
              borderRadius: '12px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ChevronLeft size={18} color={M.textSecondary} />
          </button>
          <div>
            <span style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '18px',
              fontWeight: 500,
              letterSpacing: '-0.02em',
              color: M.text,
            }}>
              Your portfolio
            </span>
            {!isEmpty && (
              <div style={{ fontSize: '12px', color: M.textMuted, marginTop: '2px' }}>
                {holdings.length} holding{holdings.length !== 1 ? 's' : ''}
                {hasSnapshot ? ` • ${fmt(totalValue)}` : ''}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => setSheet({ type: 'add' })}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${M.accent}, ${M.negative})`,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(231,111,81,0.3)',
          }}
        >
          <Plus size={22} color="white" strokeWidth={2.5} />
        </button>
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
            fontFamily: "'Outfit', sans-serif", fontSize: '18px', fontWeight: 500,
            marginBottom: '8px', color: M.text,
          }}>
            No holdings yet
          </div>
          <div style={{
            fontSize: '13px', color: M.textSecondary, lineHeight: 1.5,
            maxWidth: '280px', margin: '0 auto 20px',
          }}>
            Add your first holding to see how your exposure is distributed across BTC, ETH, and altcoins.
          </div>
          <button
            onClick={() => setSheet({ type: 'add' })}
            style={{
              background: `linear-gradient(90deg, ${M.accent}, ${M.negative})`,
              color: 'white',
              border: 'none',
              borderRadius: '16px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(231,111,81,0.3)',
            }}
          >
            <Plus size={18} /> Add first holding
          </button>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            fontSize: '11px', color: M.accent, fontWeight: 500, marginTop: '20px',
          }}>
            <BookOpen size={14} />
            Understanding portfolio exposure
          </div>
        </div>
      ) : (
        <>
          {/* Total value — only if snapshot has prices */}
          {hasSnapshot && (
            <div style={{ ...anim(1), marginBottom: '16px', padding: '0 4px' }}>
              <div style={{ ...labelStyle, marginBottom: '6px' }}>TOTAL VALUE</div>
              <div style={{
                fontFamily: "'DM Mono', monospace", fontSize: '32px', fontWeight: 600,
                color: M.text, letterSpacing: '-0.03em', lineHeight: 1,
              }}>
                {fmt(totalValue)}
              </div>
              <div style={{ fontSize: '12px', color: M.textMuted, marginTop: '4px' }}>
                {holdings.length} holding{holdings.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}

          {/* Exposure breakdown — only if snapshot data exists */}
          {hasSnapshot && (
            <div style={{ ...cardBase, ...anim(2) }}>
              <div style={{ ...labelStyle, marginBottom: '14px' }}>EXPOSURE BREAKDOWN</div>
              <div style={{
                display: 'flex', height: '12px', borderRadius: '100px',
                overflow: 'hidden', marginBottom: '16px',
              }}>
                {snapshot!.btc_weight_all > 0 && (
                  <div style={{
                    width: pct(snapshot!.btc_weight_all),
                    background: `linear-gradient(90deg, ${SEGMENT.BTC.color}99, ${SEGMENT.BTC.color})`,
                    transition: 'width 0.8s ease',
                  }} />
                )}
                {snapshot!.eth_weight_all > 0 && (
                  <div style={{
                    width: pct(snapshot!.eth_weight_all),
                    background: `linear-gradient(90deg, ${SEGMENT.ETH.color}88, ${SEGMENT.ETH.color})`,
                    transition: 'width 0.8s ease',
                  }} />
                )}
                {snapshot!.alt_weight_all > 0 && (
                  <div style={{
                    width: pct(snapshot!.alt_weight_all),
                    background: `linear-gradient(90deg, ${SEGMENT.ALT.color}88, ${SEGMENT.ALT.color})`,
                    transition: 'width 0.8s ease',
                  }} />
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {([
                  { key: 'BTC' as SegKey, weight: snapshot!.btc_weight_all, value: snapshot!.btc_value_usd },
                  { key: 'ETH' as SegKey, weight: snapshot!.eth_weight_all, value: snapshot!.eth_value_usd },
                  { key: 'ALT' as SegKey, weight: snapshot!.alt_weight_all, value: snapshot!.alt_value_usd },
                ]).map((seg) => (
                  <div key={seg.key} style={{
                    flex: 1, background: 'rgba(255,255,255,0.4)', borderRadius: '16px', padding: '12px',
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
          )}

          {/* No snapshot notice */}
          {!hasSnapshot && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '12px 14px', borderRadius: '16px',
              background: M.accentMuted,
              marginBottom: '12px', ...anim(2),
            }}>
              <AlertTriangle size={14} color={M.accent} />
              <span style={{ fontSize: '12px', fontWeight: 500, color: M.accent }}>
                Exposure data will update on next analysis cycle
              </span>
            </div>
          )}

          {/* Alt pricing status */}
          {hasSnapshot && snapshot!.alt_count > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 14px', borderRadius: '16px',
              background: allPriced ? M.positiveDim : M.accentMuted,
              marginBottom: '12px', ...anim(3),
            }}>
              {allPriced
                ? <CheckCircle size={14} color={M.positive} />
                : <AlertTriangle size={14} color={M.accent} />}
              <span style={{ fontSize: '12px', fontWeight: 500, color: allPriced ? M.positive : M.accent }}>
                {allPriced
                  ? `All ${snapshot!.alt_count} altcoins priced`
                  : `${altUnpriced.length} of ${snapshot!.alt_count} altcoins unpriced`}
              </span>
            </div>
          )}

          {/* Holdings list — driven by CRUD data, enriched by snapshot */}
          <div style={{ ...anim(4) }}>
            <div style={{ ...labelStyle, padding: '0 4px', marginBottom: '10px' }}>HOLDINGS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {holdings.map((h, i) => {
                const segKey = getSegKey(h.asset);
                const seg = SEGMENT[segKey];
                const price = priceLookup[h.asset];
                const valueUsd = price ? price.usd_price * h.quantity : null;
                const weight = price?.weight ?? null;

                return (
                  <div key={h.id} style={{
                    ...cardBase,
                    marginBottom: 0,
                    padding: '16px',
                    opacity: h.include_in_exposure ? 1 : 0.6,
                    ...anim(5 + i * 0.5),
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '14px',
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
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{
                            fontFamily: "'Outfit', sans-serif", fontSize: '14px', fontWeight: 500, color: M.text,
                          }}>
                            {h.asset}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {valueUsd !== null && (
                              <span style={{
                                fontFamily: "'DM Mono', monospace", fontSize: '14px', fontWeight: 500, color: M.text,
                              }}>
                                {fmt(valueUsd)}
                              </span>
                            )}
                            <button
                              onClick={() => setSheet({ type: 'edit', holding: h })}
                              style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '50%',
                                background: 'rgba(255,255,255,0.6)',
                                border: `1px solid ${M.border}`,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <Edit2 size={12} color={M.textSecondary} />
                            </button>
                          </div>
                        </div>

                        <div style={{ fontSize: '12px', color: M.textMuted, marginBottom: '8px', fontFamily: "'DM Mono', monospace" }}>
                          {qtyFmt(h.quantity)} {h.asset}
                          {h.cost_basis != null && (
                            <span style={{ marginLeft: '8px', color: M.textMuted }}>
                              @ {fmt(h.cost_basis)}
                            </span>
                          )}
                        </div>

                        {weight !== null && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              flex: 1, height: '4px', background: M.surfaceLight,
                              borderRadius: '100px', overflow: 'hidden',
                            }}>
                              <div style={{
                                height: '100%',
                                width: `${Math.min(weight * 100 * 2.5, 100)}%`,
                                background: `linear-gradient(90deg, ${seg.color}66, ${seg.color})`,
                                borderRadius: '100px',
                                transition: 'width 0.8s ease',
                              }} />
                            </div>
                            <span style={{
                              fontFamily: "'DM Mono', monospace", fontSize: '11px', color: seg.color,
                              fontWeight: 500, minWidth: '38px', textAlign: 'right',
                            }}>
                              {pct(weight)}
                            </span>
                          </div>
                        )}

                        {!h.include_in_exposure && (
                          <div style={{
                            marginTop: '6px',
                            fontSize: '10px',
                            color: M.textMuted,
                            fontStyle: 'italic',
                          }}>
                            Excluded from exposure
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', padding: '16px 0', ...anim(10) }}>
            <div style={{ fontSize: '11px', color: M.textMuted, lineHeight: 1.5 }}>
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
