// ━━━ Dashboard (Home Screen) ━━━
// v0.3.1 · ca-story12 · 2026-02-11
// Meridian home screen with scenario-aware data hook

'use client';

import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { M } from '@/lib/meridian';
import { useMarketData } from '@/hooks/useMarketData';

import MeridianMark from '@/components/brand/MeridianMark';
import RegimeCard from '@/components/regime/RegimeCard';
import PostureCard from '@/components/portfolio/PostureCard';
import SignalCard from '@/components/signals/SignalCard';
import MarketPulseCard from '@/components/market/MarketPulseCard';
import DevTools from '@/components/dev/DevTools';

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const { scenario, activeScenario, setScenario, pulseMetrics } = useMarketData();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Staggered entrance animation helper
  const anim = (i: number): React.CSSProperties => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(12px)',
    transition: `all 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.08}s`,
  });

  return (
    <>
      {/* Dev-only scenario switcher */}
      <DevTools activeScenario={activeScenario} onScenarioChange={setScenario} />

      {/* ── Status Bar ── */}
      <div
        className="flex justify-between items-center text-xs font-medium px-5 pt-3"
        style={{ color: M.textMuted }}
      >
        <span>9:41</span>
        <div className="flex gap-1 items-center">
          <div
            className="rounded-sm p-px"
            style={{
              width: '14px',
              height: '10px',
              border: `1px solid ${M.textMuted}`,
            }}
          >
            <div
              className="rounded-[1px]"
              style={{
                width: '70%',
                height: '100%',
                background: M.textMuted,
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Header ── */}
      <div className="px-5 pt-5 pb-4" style={anim(0)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MeridianMark size={28} />
            <span
              className="font-display text-lg font-semibold"
              style={{ letterSpacing: '-0.02em', color: M.text }}
            >
              Crypto Analyst
            </span>
          </div>
          <div
            className="text-[11px] font-medium rounded-lg px-2.5 py-[5px]"
            style={{ color: M.textMuted, background: M.surfaceLight }}
          >
            Today, 9:41 AM
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4">
        {/* Regime hero */}
        <div style={anim(1)}>
          <RegimeCard data={scenario.regime} />
        </div>

        {/* Portfolio posture */}
        <div style={anim(2)}>
          <PostureCard data={scenario.portfolio} />
        </div>

        {/* Active signals */}
        <div style={anim(3)} className="mb-3">
          <div className="flex items-center justify-between px-1 mb-2.5">
            <span
              className="text-[10px] font-semibold font-body"
              style={{ letterSpacing: '0.1em', color: M.textMuted }}
            >
              ACTIVE SIGNALS
            </span>
            <button
              className="text-[11px] font-medium flex items-center gap-0.5 bg-transparent border-none cursor-pointer"
              style={{ color: M.accent }}
            >
              View all <ChevronRight size={14} />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {scenario.signals.map((signal, i) => (
              <div key={signal.id} style={anim(4 + i)}>
                <SignalCard signal={signal} />
              </div>
            ))}
          </div>
        </div>

        {/* Market pulse */}
        <div style={anim(7)}>
          <MarketPulseCard metrics={pulseMetrics} />
        </div>

        {/* Last updated */}
        <div
          className="text-center text-[11px] py-2 pb-4"
          style={{ color: M.textSubtle, ...anim(8) }}
        >
          Last analysis: Today, 9:41 AM · Next in 14h 19m
        </div>
      </div>
    </>
  );
}

