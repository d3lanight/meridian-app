// ━━━ Today Page ━━━
// v4.0.0 · S161 · Sprint 33
// Contextual intelligence layer: AI briefing, agent prompt, external signals, learn
// Replaces composeFeed pattern — no duplicated data from Pulse/Exposure
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { M } from '@/lib/meridian'
import { anim } from '@/lib/ui-helpers'
import { useAuthSheet } from '@/contexts/AuthSheetContext'
import { Shield, User } from 'lucide-react'

import {
  Briefing,
  RegimePill,
  AgentPrompt,
  InsightCard,
  ExternalCard,
  LearnCard,
  ActivityBadge,
  Divider,
} from '@/components/today'

// ── Fonts ──────────────────────────────────────
const FONT_DISPLAY = "'Outfit', sans-serif"
const FONT_BODY = "'DM Sans', sans-serif"

// ── Helpers ────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function getDateString(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

function scoreToLabel(score: number): string {
  if (score >= 60) return 'Aligned'
  if (score < 40) return 'Misaligned'
  return 'Neutral'
}

// ── Mock external signals (structure ready for API) ──
const EXTERNAL_SIGNALS = [
  {
    sourceIcon: 'x', source: 'X', author: '@CredibleCrypto',
    text: 'BTC just reclaimed the 200-day MA for the first time in 3 months. Last two times this happened, we saw a 20%+ move within 30 days.',
    time: '3h ago',
  },
  {
    sourceIcon: 'news', source: 'CoinDesk', author: 'CoinDesk',
    text: 'SEC postpones decision on Ethereum ETF options to Q3. Market reaction muted — ETH holding above key support.',
    time: '5h ago',
  },
  {
    sourceIcon: 'blog', source: 'Messari', author: 'Messari Research',
    text: 'Solana DeFi TVL hits new ATH at $14.2B. Network activity now exceeds Ethereum L1 in daily transactions for the third consecutive week.',
    time: '8h ago',
  },
]

// ── Mock learn content (contextual to market) ──
const LEARN_CARDS = [
  {
    text: "When Bitcoin reclaims its 200-day moving average during a bull regime, historical data shows continuation in 73% of cases over the following 30 days. However, the first 7 days after reclamation often show increased volatility as the market tests the level. This is why confidence in the regime classification matters — a reading above 70% during this period suggests the move has structural support, not just momentum.",
    topic: '200-day MA reclamation',
  },
  {
    text: "Alt rotation typically follows a predictable sequence in bull markets: BTC leads → large caps (ETH, SOL) follow within 3-7 days → mid-caps rotate 1-2 weeks later → small caps last. The ALT Season Index helps track where we are in this cycle. Currently at 38, we're still in the BTC-led phase. Watching for 50+ to signal the start of broader rotation.",
    topic: 'alt rotation cycles',
  },
]

// ── Anon CTA ───────────────────────────────────

function AnonCTA({ onAuth }: { onAuth: (trigger: string) => void }) {
  return (
    <>
      <div style={{
        background: `linear-gradient(135deg, ${M.accentMuted}, rgba(123,111,168,0.04))`,
        border: `1px solid ${M.borderAccent}`,
        borderRadius: 24, padding: 18,
        marginBottom: 12,
      }}>
        <p style={{ fontSize: 14, color: M.text, lineHeight: 1.65, margin: 0, fontFamily: FONT_BODY }}>
          Markets are moving. Sign in to see how your portfolio aligns with current conditions and get your personalized briefing.
        </p>
      </div>

      {[
        { trigger: 'Exposure', icon: Shield, color: M.accent, bg: M.accentDim, title: 'See your exposure', desc: 'Posture, allocation targets, regime context' },
        { trigger: 'Profile', icon: User, color: M.positive, bg: M.positiveDim, title: 'Track your portfolio', desc: 'Holdings, sparklines, performance' },
      ].map(item => (
        <button
          key={item.trigger}
          onClick={() => onAuth(item.trigger)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
            background: M.surface, backdropFilter: M.surfaceBlur,
            border: `1px solid ${M.border}`, borderRadius: 24,
            padding: 16, cursor: 'pointer', marginBottom: 10,
            textAlign: 'left',
          }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: item.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <item.icon size={18} color={item.color} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: M.text }}>{item.title}</div>
            <div style={{ fontSize: 12, color: M.textMuted }}>{item.desc}</div>
          </div>
        </button>
      ))}
    </>
  )
}

// ── Skeleton ────────────────────────────────────

function TodaySkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ height: 32, width: '60%', background: M.surfaceLight, borderRadius: 12 }} className="animate-pulse" />
      <div style={{ height: 16, width: '40%', background: M.surfaceLight, borderRadius: 8 }} className="animate-pulse" />
      <div style={{ height: 32, width: '35%', background: M.surfaceLight, borderRadius: 20 }} className="animate-pulse" />
      <div style={{ height: 120, background: M.surfaceLight, borderRadius: 24 }} className="animate-pulse" />
      <div style={{ height: 80, background: M.surfaceLight, borderRadius: 24 }} className="animate-pulse" />
    </div>
  )
}

// ── Page ────────────────────────────────────────

export default function TodayPage() {
  const [mounted, setMounted] = useState(false)
  const [isAnon, setIsAnon] = useState(true)
  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState('')
  const [regime, setRegime] = useState('')
  const [regimeDay, setRegimeDay] = useState(0)
  const [confidence, setConfidence] = useState(0)
  const [postureLabel, setPostureLabel] = useState('')
  const [portfolioNote, setPortfolioNote] = useState('')
  const [btcPrice, setBtcPrice] = useState<number | null>(null)
  const [btcChange, setBtcChange] = useState<number | null>(null)
  const [ethPrice, setEthPrice] = useState<number | null>(null)
  const [ethChange, setEthChange] = useState<number | null>(null)
  const { openAuth } = useAuthSheet()

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const anon = !user
      setIsAnon(anon)

      // Fetch market context (public) + market data
      try {
        const [mcRes, mRes] = await Promise.all([
          fetch('/api/market-context'),
          fetch('/api/market'),
        ])
        if (mcRes.ok) {
          const mc = await mcRes.json()
          // Regimes array: field is "regime" not "regime_type"
          if (mc.regimes?.length > 0) {
            const latest = mc.regimes[0]
            setRegime(latest.regime || 'range')
            setConfidence(Math.round((latest.confidence || 0) * 100))
          }
          if (mc.regimes?.length > 1) {
            const current = mc.regimes[0]?.regime
            let days = 1
            for (let i = 1; i < mc.regimes.length; i++) {
              if (mc.regimes[i].regime === current) days++
              else break
            }
            setRegimeDay(days)
          } else {
            setRegimeDay(1)
          }
          // current_prices is Record<symbol, {price, change_24h}>
          if (mc.current_prices) {
            const btc = mc.current_prices['BTC']
            const eth = mc.current_prices['ETH']
            if (btc) { setBtcPrice(btc.price); setBtcChange(btc.change_24h) }
            if (eth) { setEthPrice(eth.price); setEthChange(eth.change_24h) }
          }
        }
        // market API fallback handled by market-context current_prices above
      } catch {}

      // Fetch portfolio snapshot + profile (authenticated)
      if (!anon) {
        try {
          // Fetch display_name from profiles via API-compatible query
          const [snapRes, profileRes] = await Promise.all([
            fetch('/api/portfolio-snapshot'),
            supabase.from('profiles').select('display_name').eq('id', user!.id).maybeSingle(),
          ])

          if (profileRes.data?.display_name) {
            setDisplayName(profileRes.data.display_name)
          }

          if (snapRes.ok) {
            const snap = await snapRes.json()
            const score = snap.risk_score ?? 50
            setPostureLabel(scoreToLabel(score))

            // Generate contextual portfolio note
            const holdingsCount = snap.holdings_count ?? 0
            if (holdingsCount === 0) {
              setPortfolioNote('Add holdings to get personalized portfolio insights.')
            } else {
              const totalVal = snap.total_value_usd_all
              if (totalVal) {
                setPortfolioNote('No action items — hold and observe.')
              } else {
                setPortfolioNote('Your portfolio is being analyzed.')
              }
            }
          }
        } catch {}
      }

      setLoading(false)
    }
    load()
  }, [])

  const greeting = getGreeting()
  const nameDisplay = displayName || (isAnon ? '' : '')
  const title = nameDisplay ? `${greeting}, ${nameDisplay}` : greeting

  return (
    <div style={{ padding: '20px 20px 24px' }}>
      {loading ? (
        <TodaySkeleton />
      ) : (
        <>
          {/* Header: Greeting + Notification */}
          <div style={{
            ...anim(mounted, 0),
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            marginBottom: 12,
          }}>
            <div>
              <h1 style={{
                fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 400,
                color: M.text, lineHeight: 1.3, marginBottom: 6,
              }}>
                {title}
              </h1>
              <p style={{ fontSize: 12, color: M.textMuted, margin: 0 }}>{getDateString()}</p>
            </div>
            {!isAnon && <ActivityBadge count={0} />}
          </div>

          {/* Regime pill */}
          {regime && (
            <div style={{ ...anim(mounted, 1), marginBottom: 16 }}>
              <RegimePill regime={regime} confidence={confidence} day={regimeDay} />
            </div>
          )}

          {/* Anonymous path */}
          {isAnon && (
            <>
              {/* BTC / ETH prices */}
              {(btcPrice !== null) && (
                <div style={{ ...anim(mounted, 2), display: 'flex', gap: 10, marginBottom: 12 }}>
                  {[
                    { s: 'BTC', p: btcPrice, c: btcChange },
                    { s: 'ETH', p: ethPrice, c: ethChange },
                  ].filter(coin => coin.p).map(coin => (
                    <div key={coin.s} style={{
                      background: M.surface, backdropFilter: M.surfaceBlur,
                      WebkitBackdropFilter: M.surfaceBlur,
                      border: `1px solid ${M.border}`, borderRadius: 24,
                      padding: 14, flex: 1,
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: M.text, fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>{coin.s}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: M.text, fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>
                        ${(coin.p ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                      {coin.c != null && (
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          background: (coin.c ?? 0) >= 0 ? M.positiveDim : M.negativeDim,
                          borderRadius: 8, padding: '3px 8px',
                        }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: (coin.c ?? 0) >= 0 ? M.positive : M.negative }}>
                            {(coin.c ?? 0) >= 0 ? '+' : ''}{(coin.c ?? 0).toFixed(2)}%
                          </span>
                          <span style={{ fontSize: 9, color: (coin.c ?? 0) >= 0 ? M.positive : M.negative, opacity: 0.7 }}>24h</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div style={anim(mounted, 3)}>
                <AnonCTA onAuth={openAuth} />
              </div>
            </>
          )}

          {/* Authenticated path */}
          {!isAnon && (
            <>
              {/* AI Briefing */}
              <div style={{ ...anim(mounted, 2), marginBottom: 12 }}>
                <Briefing
                  regime={regime || 'range'}
                  regimeDay={regimeDay}
                  confidence={confidence}
                  postureLabel={postureLabel || 'Neutral'}
                  portfolioNote={portfolioNote || 'No action items — hold and observe.'}
                />
              </div>

              {/* Agent Prompt */}
              <div style={{ ...anim(mounted, 3), marginBottom: 12 }}>
                <AgentPrompt />
              </div>

              {/* Contextual insights */}
              <div style={anim(mounted, 4)}>
                <Divider label="What's moving" />
              </div>

              <div style={{ ...anim(mounted, 5), marginBottom: 12 }}>
                <InsightCard
                  text="Markets are in a sustained trend. Check your Exposure page to see how your allocation targets shift with the current regime."
                  linkLabel="View Exposure"
                  accentColor="#6B5FBF"
                />
              </div>
            </>
          )}

          {/* External signals — visible to all */}
          <div style={anim(mounted, isAnon ? 3 : 6)}>
            <Divider label="From the network" />
          </div>

          {EXTERNAL_SIGNALS.map((signal, i) => (
            <div key={signal.author} style={{ ...anim(mounted, (isAnon ? 4 : 7) + i), marginBottom: 12 }}>
              <ExternalCard {...signal} />
            </div>
          ))}

          {/* Learn cards — visible to all */}
          <div style={anim(mounted, isAnon ? 7 : 10)}>
            <Divider label="Learn" />
          </div>

          {LEARN_CARDS.map((lc, i) => (
            <div key={lc.topic} style={{ ...anim(mounted, (isAnon ? 8 : 11) + i), marginBottom: 12 }}>
              <LearnCard text={lc.text} topic={lc.topic} />
            </div>
          ))}

          {/* Footer */}
          <div style={{
            ...anim(mounted, isAnon ? 10 : 13),
            textAlign: 'center', padding: '12px 0', fontSize: 10, color: M.textMuted,
          }}>
            Content curated for educational purposes. Not financial advice.
          </div>
        </>
      )}
    </div>
  )
}
