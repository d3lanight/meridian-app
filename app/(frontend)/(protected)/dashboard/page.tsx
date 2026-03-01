// ━━━ Today — Journal Feed ━━━
// v2.1.0 · ca-story84 · Sprint 20
// S84: Data wiring — skeleton, temporal grouping, empty CTA, richer snippets

'use client'

import { useEffect, useState, useMemo } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { M } from '@/lib/meridian'
import { createClient } from '@/lib/supabase/client'
import { useMarketData } from '@/hooks/useMarketData'
import DevTools from '@/components/dev/DevTools'
import { anim } from '@/lib/ui-helpers'
import { composeFeed } from '@/lib/feed-composer'
import type { FeedEntry } from '@/lib/feed-types'
import type { MarketMetrics } from '@/types'
import {
  EntryGreeting,
  EntryRegime,
  EntryPricePair,
  EntryPosture,
  EntryInsight,
  EntryMarketSnippet,
  EntrySignal,
  EntryLearn,
  EntryDivider,
} from '@/components/feed'
import type { ScenarioId } from '@/lib/demo-data'
import FeedSkeleton from '@/components/feed/FeedSkeleton'
import EmptyPortfolioCTA from '@/components/feed/EmptyPortfolioCTA'
import EntryAnonCta from '@/components/feed/EntryAnonCta'
import { usePrivacy } from '@/contexts/PrivacyContext'

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const [isAnon, setIsAnon] = useState(true)
  const [userName, setUserName] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<MarketMetrics | null>(null)
  const [prices, setPrices] = useState<{
    btcPrice: number; btcChange: number; ethPrice: number; ethChange: number
  } | null>(null)
  const [regimeExplainer, setRegimeExplainer] = useState<{ summary: string; slug: string } | null>(null)
  const [learnEntries, setLearnEntries] = useState<{ summary: string; slug: string; topic: string }[]>([])
  const [hasHoldings, setHasHoldings] = useState<boolean | undefined>(undefined)

  const {
    scenario,
    activeScenario,
    setScenario,
    lastAnalysis,
    isLoading,
    error,
    isLive,
    refresh,
  } = useMarketData()

  const { hidden, toggleHidden } = usePrivacy()

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(t)
  }, [])

  // Auth check + user name
 useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAnon(!user)
      if (user?.user_metadata?.display_name) {
        setUserName(user.user_metadata.display_name)
      } else if (user?.email) {
        setUserName(user.email.split('@')[0])
      }
      // Check if user has holdings
      if (user) {
        supabase
          .from('portfolio_holdings')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .then(({ count }) => {
            setHasHoldings((count ?? 0) > 0)
          })
      }
    })
  }, [])

  // Fetch metrics + prices from /api/market
  useEffect(() => {
    async function fetchMarket() {
      try {
        const res = await fetch('/api/market')
        if (res.ok) {
          const json = await res.json()
          if (json.metrics) setMetrics(json.metrics)
          // Extract prices from regime data
          if (json.regime) {
            const r = json.regime
            // Prices come from the raw regime row — extract from trend string or use API
            // For now, use a separate price fetch
          }
        }
      } catch {
        // Non-critical
      }
    }
    fetchMarket()
  }, [])

  // Fetch current prices
  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch('/api/market-context?days=7')
        if (res.ok) {
          const json = await res.json()
          const latest = json.regimes?.[0]
          if (latest) {
            setPrices({
              btcPrice: latest.price_now,
              btcChange: (latest.r_1d ?? 0) * 100,
              ethPrice: latest.eth_price_now,
              ethChange: (latest.eth_r_7d ?? 0) * 100,
            })
          }
        }
      } catch {
        // Non-critical
      }
    }
    fetchPrices()
  }, [])

 const { regime, portfolio, signals } = scenario
  
// Fetch regime-contextual glossary entries
  useEffect(() => {
    const regimeId = regime?.current?.toLowerCase().replace(/\s+/g, '')
    const endpoint = regimeId ? `/api/glossary?regime=${regimeId}` : '/api/glossary?random=2'
    fetch(endpoint)
      .then(r => r.ok ? r.json() : null)
      .then(entries => {
        if (Array.isArray(entries) && entries.length > 0) {
          setRegimeExplainer({ summary: entries[0].summary, slug: entries[0].slug })
          if (entries.length > 1) {
            setLearnEntries(entries.slice(0, 3).map((e: any) => ({
              summary: e.summary,
              slug: e.slug,
              topic: e.title,
            })))
          }
        } else if (entries?.summary) {
          setRegimeExplainer({ summary: entries.summary, slug: entries.slug })
        }
      })
      .catch(() => {})
  }, [regime?.current])

  // ── Compose feed ──
  const { entries: feed, showEmptyPortfolioCTA } = useMemo(
    () =>
      composeFeed({
        regime,
        metrics,
        btcPrice: prices?.btcPrice,
        btcChange: prices?.btcChange,
        ethPrice: prices?.ethPrice,
        ethChange: prices?.ethChange,
        persistence: regime?.persistence,
        portfolio: isAnon ? null : portfolio,
        signals: isAnon ? [] : signals,
        userName: isAnon ? null : userName,
        regimeExplainer,
        hasHoldings: isAnon ? undefined : hasHoldings,
        learnEntries,
      }),
    [regime, metrics, prices, portfolio, signals, isAnon, userName, regimeExplainer, hasHoldings]
  )

  return (
    <>
     <DevTools
        activeScenario={activeScenario as ScenarioId}
        onScenarioChange={setScenario}
      />

      <div style={{ padding: '24px 20px 0' }}>
        {/* ── Header with privacy toggle ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: 4,
            ...anim(mounted, 0),
          }}
        >
          <button
            onClick={toggleHidden}
            aria-label={hidden ? 'Show amounts' : 'Hide amounts'}
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.5)',
              border: `1px solid ${M.border}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {hidden ? (
              <EyeOff size={16} color={M.textMuted} strokeWidth={2} />
            ) : (
              <Eye size={16} color={M.textSecondary} strokeWidth={2} />
            )}
          </button>
        </div>

        {/* ── Loading state ── */}
       {isLoading && (
          <div style={{ padding: '0 0 24px' }}>
            <FeedSkeleton />
          </div>
        )}

        {/* ── Error state ── */}
        {error && !isLoading && (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: M.textSecondary,
              fontSize: 13,
            }}
          >
            <p style={{ margin: '0 0 8px' }}>Couldn&apos;t load market data</p>
            <button
              onClick={refresh}
              style={{
                background: M.surface,
                border: `1px solid ${M.border}`,
                borderRadius: 12,
                padding: '8px 16px',
                fontSize: 12,
                color: M.text,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        )}

        {/* ── Feed ── */}
        {!isLoading && !error && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              paddingBottom: 24,
            }}
          >
            {feed.map((entry, i) => (
              <div key={`${entry.type}-${i}`} style={anim(mounted, i * 0.3)}>
                <FeedEntryRenderer entry={entry} hidden={hidden} />
              </div>
            ))}
            {showEmptyPortfolioCTA && (
              <div style={anim(mounted, feed.length * 0.3)}>
                <EmptyPortfolioCTA />
              </div>
            )}
          </div>
        )}

        {/* ── Timestamp ── */}
        {lastAnalysis && !isLoading && (
          <div
            style={{
              textAlign: 'center',
              fontSize: 10,
              color: M.textSubtle,
              fontFamily: "'DM Mono', monospace",
              padding: '0 0 16px',
            }}
          >
            Last updated {lastAnalysis}
          </div>
        )}
      </div>
    </>
  )
}

// ── Feed Entry Renderer ──

function FeedEntryRenderer({ entry, hidden }: { entry: FeedEntry; hidden: boolean }) {
  switch (entry.type) {
    case 'greeting':
      return <EntryGreeting data={entry.data} />
    case 'regime':
      return <EntryRegime data={entry.data} />
    case 'price_pair':
      return <EntryPricePair data={entry.data} />
    case 'posture':
      return <EntryPosture data={entry.data} hidden={hidden} />
    case 'insight':
      return <EntryInsight data={entry.data} />
    case 'market_snippet':
      return <EntryMarketSnippet data={entry.data} />
    case 'signal':
      return <EntrySignal data={entry.data} />
    case 'learn':
      return <EntryLearn data={entry.data} />
    case 'divider':
      return <EntryDivider data={entry.data} />
    case 'anon_cta':
      return <EntryAnonCta data={entry.data} />
    default:
      return null
  }
}
