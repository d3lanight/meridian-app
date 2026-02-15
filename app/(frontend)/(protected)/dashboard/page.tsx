// ━━━ Dashboard (Home Screen) ━━━
// v0.4.0 · ca-story18 · 2026-02-14
// Meridian home screen with live Supabase data + demo fallback
'use client'

import { useEffect, useState } from 'react'
import { ChevronRight, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { M } from '@/lib/meridian'
import { useMarketData } from '@/hooks/useMarketData'
import MeridianMark from '@/components/brand/MeridianMark'
import RegimeCard from '@/components/regime/RegimeCard'
import PostureCard from '@/components/portfolio/PostureCard'
import SignalCard from '@/components/signals/SignalCard'
import MarketPulseCard from '@/components/market/MarketPulseCard'
import DevTools from '@/components/dev/DevTools'

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const {
    scenario,
    activeScenario,
    setScenario,
    pulseMetrics,
    lastAnalysis,
    isLoading,
    error,
    isLive,
    refresh,
  } = useMarketData()

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(t)
  }, [])

  // Staggered entrance animation helper
  const anim = (i: number): React.CSSProperties => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(12px)',
    transition: `all 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.08}s`,
  })

  return (
    <>
      {/* Dev-only scenario switcher */}
      <DevTools activeScenario={activeScenario === 'live' ? 'bull' : activeScenario} onScenarioChange={setScenario} />

      {/* ── Header ── */}
      <div className="px-5 pt-5 pb-4" style={anim(0)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MeridianMark size={28} />
            <span
              className="font-display text-lg font-semibold"
              style={{ letterSpacing: '-0.02em', color: M.text }}
            >
              Meridian
            </span>
            {/* Live indicator */}
            <div
              className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{
                color: isLive ? M.positive : M.textMuted,
                background: isLive ? `${M.positive}15` : `${M.textMuted}15`,
              }}
            >
              {isLive ? <Wifi size={10} /> : <WifiOff size={10} />}
              {isLive ? 'LIVE' : 'DEMO'}
            </div>
          </div>
          <button
            onClick={refresh}
            disabled={isLoading}
            className="text-[11px] font-medium rounded-lg px-2.5 py-[5px] flex items-center gap-1.5 border-none cursor-pointer"
            style={{ color: M.textMuted, background: M.surfaceLight }}
          >
            <RefreshCw size={11} className={isLoading ? 'animate-spin' : ''} />
            {lastAnalysis}
          </button>
        </div>
        {/* Error banner */}
        {error && (
          <div
            className="mt-2 text-[11px] px-3 py-2 rounded-lg"
            style={{ color: M.negative, background: `${M.negative}15` }}
          >
            Failed to load live data — showing demo. {error}
          </div>
        )}
      </div>

      {/* ── Loading skeleton ── */}
      {isLoading && !mounted ? (
        <div className="px-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl animate-pulse"
              style={{ background: M.surfaceLight, height: i === 1 ? 160 : 100 }}
            />
          ))}
        </div>
      ) : (
        /* ── Content ── */
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
              {scenario.signals.length === 0 ? (
                <div
                  className="text-center text-[12px] py-6 rounded-2xl"
                  style={{ color: M.textMuted, background: M.surfaceLight }}
                >
                  No active signals
                </div>
              ) : (
                scenario.signals.map((signal, i) => (
                  <div key={signal.id} style={anim(4 + i)}>
                    <SignalCard signal={signal} />
                  </div>
                ))
              )}
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
            Last analysis: {lastAnalysis}
          </div>
        </div>
      )}
    </>
  )
}
