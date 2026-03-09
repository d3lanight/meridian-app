'use client'

// app/(frontend)/(protected)/profile/page.tsx
// Profile v4.0.3 — Sub-view structural fix
// Sprint: 36
// Changelog:
//   4.0.3 - subViewWrapper changed to position:fixed inset:0 zIndex:20. Escapes layout
//           pb-[88px] so sub-views are truly full-screen. Eliminates phantom scroll on
//           short content (Risk Profile 3 items). Sticky header now works in all sub-views
//           including imported components (ChangePasswordSheet, EditNameSheet).
//           globals.css: scrollbar hidden globally (scrollbar-width:none + webkit).
//   4.0.0 - S167: IdentityHero replaces IdentityCard. AccentBanner + avatar overlap + connected
//           sources row + member since. EditNameSheet sub-view (saves to profiles.display_name).
//           S168: MenuRow dual badge (pro + coming simultaneously). Privacy toggle in Preferences
//           wired to usePrivacy(). ProUpgradeCard updated to v4 feature list. Badge assignments:
//           Target bands (PRO+SOON), Custom thresholds (PRO+SOON), Quiet hours (PRO+SOON),
//           Glossary (SOON), Export data (SOON), Delete account (SOON).
//   3.0.0 - (S87, S125): Profile v3 hub, IdentityCard, 9 menu sections, sub-view routing,
//           ChangePasswordSheet, Risk profile selector (S143), split useEffect 100ms delay.

import { useState, useEffect } from 'react'
import {
  Globe,
  Bell,
  Mail,
  EyeOff,
  Shield,
  SlidersHorizontal,
  BookOpen,
  Lock,
  Download,
  LogOut,
  Trash2,
  Crown,
  X,
} from 'lucide-react'
import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { createClient } from '@/lib/supabase/client'
import {
  IdentityHero,
  EditNameSheet,
  MenuCard,
  MenuRow,
  Toggle,
  ProUpgradeCard,
  SectionHeader,
  ChangePasswordSheet,
} from '@/components/profile'

// ── SubViewHeader — mobile-first top bar ─────
function SubViewHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div style={{
      position: 'sticky' as const,
      top: 0,
      zIndex: 10,
      background: M.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 20px 12px', borderBottom: `1px solid ${M.borderSubtle}`,
    }}>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 500, color: M.text, margin: 0 }}>{title}</h2>
      <button
        onClick={onClose}
        style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'rgba(139,117,101,0.1)', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0,
        }}
      >
        <X size={16} color={M.textSecondary} />
      </button>
    </div>
  )
}


// These remain as local components following the
// existing v3 pattern (section state routing, no new routes).

const FONT_DISPLAY = "'Outfit', sans-serif"
const FONT_BODY = "'DM Sans', sans-serif"
const FONTS_LINK =
  "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Mono:wght@400;500&display=swap"

// ── Display detail sub-view ──────────────────
function DisplayDetail({ onBack }: { onBack: () => void }) {
  return (
    <>
      <SubViewHeader title="Display" onClose={onBack} />
      <div style={{ padding: '20px', overflowY: 'auto' as const, flex: 1 }}>
        <MenuCard>
          {[
            { label: 'Timezone', options: ['Europe/Brussels', 'America/New_York', 'Asia/Tokyo', 'UTC'], def: 'Europe/Brussels' },
            { label: 'Date format', options: ['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY'], def: 'YYYY-MM-DD' },
            { label: 'Currency', options: ['USD', 'EUR', 'GBP', 'BTC'], def: 'USD' },
          ].map((item, i) => (
            <div key={i} style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: M.textMuted, marginBottom: 6 }}>{item.label}</div>
              <select
                defaultValue={item.def}
                style={{ width: '100%', background: 'transparent', border: 'none', fontSize: 14, fontWeight: 500, color: M.text, outline: 'none', cursor: 'pointer', fontFamily: FONT_BODY }}
              >
                {item.options.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </MenuCard>
      </div>
    </>
  )
}

// ── Notifications detail sub-view ────────────
function NotificationDetail({ onBack }: { onBack: () => void }) {
  const [posture, setPosture] = useState(true)
  const [regime, setRegime] = useState(true)
  const [alt, setAlt] = useState(true)
  const [band, setBand] = useState(false)

  return (
    <>
      <SubViewHeader title="Notifications" onClose={onBack} />
      <div style={{ padding: '20px', overflowY: 'auto' as const, flex: 1 }}>
        <MenuCard>
          {[
            { label: 'Posture mismatch', desc: 'When portfolio diverges from regime', on: posture, set: setPosture },
            { label: 'Regime change', desc: 'When market regime shifts', on: regime, set: setRegime },
            { label: 'ALT concentration', desc: 'When altcoin allocation is flagged', on: alt, set: setAlt },
            { label: 'Band breach', desc: 'When weights move outside targets', on: band, set: setBand },
          ].map((item, i) => (
            <div key={i} style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: M.text }}>{item.label}</div>
                <div style={{ fontSize: 11, color: M.textMuted, marginTop: 1 }}>{item.desc}</div>
              </div>
              <Toggle on={item.on} onToggle={item.set} />
            </div>
          ))}
        </MenuCard>
        <SectionHeader label="Pro" />
        <MenuCard>
          <MenuRow icon={Bell} label="Custom thresholds" desc="Set your own trigger levels" pro coming />
          <MenuRow icon={Bell} label="Quiet hours" desc="Pause notifications on schedule" pro coming />
        </MenuCard>
      </div>
    </>
  )
}

// ── Email detail sub-view ────────────────────
function EmailDetail({ onBack }: { onBack: () => void }) {
  const [emailOn, setEmailOn] = useState(true)
  return (
    <>
      <SubViewHeader title="Email" onClose={onBack} />
      <div style={{ padding: '20px', overflowY: 'auto' as const, flex: 1 }}>
        <MenuCard>
          <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: M.text }}>Email alerts</div>
            <div style={{ fontSize: 11, color: M.textMuted, marginTop: 1 }}>Send signal alerts by email</div>
          </div>
          <Toggle on={emailOn} onToggle={setEmailOn} />
        </div>
        <div style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: M.textMuted, marginBottom: 6 }}>Minimum severity</div>
          <select
            defaultValue="Watch (notable)"
            disabled={!emailOn}
            style={{ width: '100%', background: 'transparent', border: 'none', fontSize: 14, fontWeight: 500, color: emailOn ? M.text : M.textMuted, outline: 'none', cursor: emailOn ? 'pointer' : 'not-allowed', fontFamily: FONT_BODY }}
          >
            {['Info (all)', 'Watch (notable)', 'Actionable (high)'].map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
      </MenuCard>
      </div>
    </>
  )
}

// ── Risk profile detail sub-view ─────────────
function RiskProfileDetail({
  current,
  onSelect,
  onBack,
}: {
  current: string | null
  onSelect: (v: string) => void
  onBack: () => void
}) {
  const opts = [
    { value: 'aggressive', label: 'Aggressive', desc: 'Growth-weighted — higher crypto exposure targets' },
    { value: 'neutral', label: 'Neutral', desc: 'Balanced default — moderate exposure across buckets' },
    { value: 'conservative', label: 'Conservative', desc: 'Stability-weighted — lower risk, higher stable targets' },
  ]
  const effective = current ?? 'neutral'

  return (
    <>
      <SubViewHeader title="Risk Profile" onClose={onBack} />
      <div style={{ padding: '20px', overflowY: 'auto' as const, flex: 1 }}>
        <p style={{ fontSize: 13, color: M.textSecondary, marginBottom: 16, marginTop: 0 }}>Sets your target allocation bands on the Exposure page</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {opts.map((opt) => {
          const sel = effective === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => onSelect(opt.value)}
              style={{
                ...card({ padding: 16 }),
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                border: sel ? `1.5px solid ${M.accentDeep}` : `1px solid ${M.border}`,
                background: sel ? `linear-gradient(135deg, ${M.accentMuted}, rgba(90,77,138,0.08))` : M.surface,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <div
                style={{
                  width: 20, height: 20, borderRadius: '50%',
                  border: `2px solid ${sel ? M.accentDeep : M.borderSubtle}`,
                  background: sel ? M.accentGradient : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {sel && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: sel ? 600 : 500, color: sel ? M.accentDeep : M.text, fontFamily: FONT_BODY }}>
                  {opt.label}
                  {opt.value === 'neutral' && current === null && (
                    <span style={{ fontSize: 10, color: M.textMuted, marginLeft: 6, fontWeight: 400 }}>default</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: M.textMuted, marginTop: 2 }}>{opt.desc}</div>
              </div>
            </button>
          )
        })}
        </div>
      </div>
    </>
  )
}

// ══════════════════════════════════════════════
// PROFILE PAGE v4.0.2
// ══════════════════════════════════════════════
export default function ProfilePage() {
  const [section, setSection] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [name, setName] = useState<string | null>(null)
  const [email, setEmail] = useState<string>('')
  const [tier, setTier] = useState<string | null>(null)
  const [memberSince, setMemberSince] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const [riskProfile, setRiskProfile] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  const { hidden, toggleHidden } = usePrivacy()

  // Split useEffect: mounted timing (100ms) + data fetch
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)
      setEmail(user.email ?? '')

      // Fetch profile + preferences in parallel
      const [profileRes, prefRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('display_name, tier, is_admin, created_at')
          .eq('id', user.id)
          .single(),
        supabase
          .from('user_preferences')
          .select('risk_profile')
          .eq('user_id', user.id)
          .single(),
      ])

      if (profileRes.data) {
        setName(profileRes.data.display_name ?? null)
        setTier(profileRes.data.tier ?? null)
        setIsAdmin(profileRes.data.is_admin ?? false)
        if (profileRes.data.created_at) {
          const d = new Date(profileRes.data.created_at)
          setMemberSince(
            d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }).replace(' ', " '")
          )
        }
      }

      if (prefRes.data) {
        setRiskProfile(prefRes.data.risk_profile ?? null)
      }

      setLoading(false)
    }

    fetchProfile()
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/dashboard'
  }

  const isPro = tier === 'pro'

  // Shared page wrapper style for sub-views
  const subViewWrapper = {
    position: 'fixed' as const,
    inset: 0,
    maxWidth: 430,
    margin: '0 auto',
    background: M.bg,
    fontFamily: FONT_BODY,
    color: M.text,
    display: 'flex' as const,
    flexDirection: 'column' as const,
    zIndex: 20,
  }

  // ── Sub-view routing ─────────────────────────
  if (section === 'display')
    return (
      <div style={subViewWrapper}>
        <link href={FONTS_LINK} rel="stylesheet" />
        <DisplayDetail onBack={() => setSection(null)} />
      </div>
    )

  if (section === 'notifications')
    return (
      <div style={subViewWrapper}>
        <link href={FONTS_LINK} rel="stylesheet" />
        <NotificationDetail onBack={() => setSection(null)} />
      </div>
    )

  if (section === 'email')
    return (
      <div style={subViewWrapper}>
        <link href={FONTS_LINK} rel="stylesheet" />
        <EmailDetail onBack={() => setSection(null)} />
      </div>
    )

  if (section === 'password')
    return (
      <div style={subViewWrapper}>
        <link href={FONTS_LINK} rel="stylesheet" />
        <ChangePasswordSheet onBack={() => setSection(null)} />
      </div>
    )

  if (section === 'risk-profile')
    return (
      <div style={subViewWrapper}>
        <link href={FONTS_LINK} rel="stylesheet" />
        <RiskProfileDetail
          current={riskProfile}
          onSelect={async (v) => {
            const supabase = createClient()
            await supabase
              .from('user_preferences')
              .update({ risk_profile: v })
              .eq('user_id', userId)
            setRiskProfile(v)
            setSection(null)
          }}
          onBack={() => setSection(null)}
        />
      </div>
    )

  if (section === 'edit-name')
    return (
      <div style={subViewWrapper}>
        <link href={FONTS_LINK} rel="stylesheet" />
        <EditNameSheet
          current={name}
          userId={userId}
          onSave={(v) => { setName(v); setSection(null) }}
          onBack={() => setSection(null)}
        />
      </div>
    )

  // ── Main profile view ────────────────────────
  const anim = (i: number) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'none' : 'translateY(12px)',
    transition: `opacity 0.5s ease ${i * 0.07}s, transform 0.5s ease ${i * 0.07}s`,
  })

  return (
    <div
      style={{
        fontFamily: FONT_BODY,
        color: M.text,
        maxWidth: 430,
        margin: '0 auto',
        background: M.bg,
        minHeight: '100vh',
        position: 'relative',
      }}
    >
      <link href={FONTS_LINK} rel="stylesheet" />
      <style>{`*,*::before,*::after{box-sizing:border-box} ::-webkit-scrollbar{width:0;height:0}`}</style>

      <div style={{ padding: '24px 20px 100px' }}>
        {/* Header */}
        <div style={{ ...anim(0), marginBottom: 20 }}>
          <h1
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 24,
              fontWeight: 500,
              color: M.text,
              marginBottom: 4,
            }}
          >
            Profile
          </h1>
          <p style={{ fontSize: 14, color: M.textSecondary }}>Account and preferences</p>
        </div>

        {/* Identity hero */}
        <div style={anim(1)}>
          {loading ? (
            <div
              style={{
                ...card({ padding: 20 }),
                marginBottom: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ height: 52, background: M.surfaceLight, borderRadius: 12 }} />
              <div style={{ height: 16, background: M.surfaceLight, borderRadius: 8, width: '50%' }} />
              <div style={{ height: 12, background: M.surfaceLight, borderRadius: 8, width: '70%' }} />
            </div>
          ) : (
            <IdentityHero
              name={name}
              email={email}
              tier={tier}
              memberSince={memberSince || "Jan '26"}
              onEditName={() => setSection('edit-name')}
            />
          )}
        </div>

        {/* Pro upgrade card — free users only */}
        {!isPro && (
          <div style={anim(2)}>
            <ProUpgradeCard />
          </div>
        )}

        {/* Preferences section */}
        <div style={anim(isPro ? 2 : 3)}>
          <SectionHeader label="Preferences" />
          <MenuCard>
            <MenuRow
              icon={Globe}
              label="Display"
              desc="Timezone, format, currency"
              onClick={() => setSection('display')}
            />
            <MenuRow
              icon={Bell}
              label="Notifications"
              desc="Signal triggers and alerts"
              coming
            />
            <MenuRow
              icon={Mail}
              label="Email"
              desc="Delivery and digest settings"
              coming
            />
            {/* Privacy toggle — wired to usePrivacy() context */}
            <div
              style={{
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: 'rgba(0,0,0,0.03)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <EyeOff size={15} color={M.textSecondary} strokeWidth={2} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: M.text }}>Privacy mode</div>
                  <div style={{ fontSize: 11, color: M.textMuted, marginTop: 1 }}>
                    Hide balances across all screens
                  </div>
                </div>
              </div>
              <Toggle on={hidden} onToggle={() => toggleHidden()} />
            </div>
          </MenuCard>
        </div>

        {/* Portfolio section */}
        <div style={anim(isPro ? 3 : 4)}>
          <SectionHeader label="Portfolio" />
          <MenuCard>
            <MenuRow
              icon={Shield}
              label="Risk profile"
              desc={
                riskProfile
                  ? riskProfile.charAt(0).toUpperCase() + riskProfile.slice(1)
                  : 'Neutral (default)'
              }
              onClick={() => setSection('risk-profile')}
            />
            <MenuRow
              icon={SlidersHorizontal}
              label="Target bands"
              desc="Allocation targets per regime"
              coming
            />
          </MenuCard>
        </div>

        {/* Learn section */}
        <div style={anim(isPro ? 4 : 5)}>
          <SectionHeader label="Learn" />
          <MenuCard>
            <MenuRow icon={BookOpen} label="Glossary" desc="Key terms explained" coming />
          </MenuCard>
        </div>

        {/* Account section */}
        <div style={anim(isPro ? 5 : 6)}>
          <SectionHeader label="Account" />
          <MenuCard>
            <MenuRow
              icon={Lock}
              label="Change password"
              desc="Update your login credentials"
              onClick={() => setSection('password')}
            />
            <MenuRow
              icon={Download}
              label="Export data"
              desc="Download your portfolio history"
              coming
            />
            {isAdmin && (
              <MenuRow
                icon={Crown}
                label={`Tier: ${isPro ? 'PRO' : 'FREE'}`}
                desc="Toggle Pro/Free for testing"
                badge={isPro ? '✓ Pro' : 'Free'}
                onClick={async () => {
                  const newTier = isPro ? 'free' : 'pro'
                  const supabase = createClient()
                  const { data: { user } } = await supabase.auth.getUser()
                  if (!user) return
                  await supabase.from('profiles').update({ tier: newTier }).eq('id', user.id)
                  window.location.reload()
                }}
              />
            )}
            <MenuRow icon={LogOut} label="Sign out" danger onClick={handleSignOut} />
          </MenuCard>
        </div>

        {/* Danger zone */}
        <div style={{ ...anim(isPro ? 6 : 7), marginTop: 8 }}>
          <MenuCard>
            <MenuRow
              icon={Trash2}
              label="Delete account"
              desc="Permanently remove all data"
              coming
            />
          </MenuCard>
        </div>

        {/* About */}
        <div
          style={{
            ...anim(isPro ? 7 : 8),
            ...card({ padding: 18 }),
            marginTop: 20,
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <svg width={36} height={36} viewBox="0 0 48 48" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="24" cy="24" r="20" stroke={M.accent} strokeWidth="1.5" opacity=".25" />
            <circle cx="24" cy="24" r="13" stroke={M.accent} strokeWidth="1.5" opacity=".5" />
            <line x1="24" y1="2" x2="24" y2="46" stroke={M.accent} strokeWidth="1.5" />
            <line x1="12" y1="6" x2="36" y2="42" stroke={M.accent} strokeWidth="1" opacity=".35" />
            <circle cx="24" cy="24" r="3" fill={M.accent} />
            <circle cx="24" cy="10" r="1.5" fill={M.accent} opacity=".5" />
            <circle cx="24" cy="38" r="1.5" fill={M.accent} opacity=".5" />
          </svg>
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: M.text,
                fontFamily: FONT_DISPLAY,
              }}
            >
              Meridian
            </div>
            <div style={{ fontSize: 11, color: M.textMuted, marginTop: 1 }}>v0.9</div>
          </div>
        </div>
      </div>
    </div>
  )
}
