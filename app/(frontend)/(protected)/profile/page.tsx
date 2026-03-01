// ━━━ Profile Screen ━━━
// ═══════════════════════════════════════════════
// Profile v3.0.0 — Identity hub with preferences,
// pro CTA, detail sub-views, sign out
// Story: ca-story87-profile-page-v3 | Sprint 21
// Target: app/(frontend)/(protected)/profile/page.tsx
// Replaces: SettingsPage (flat toggle list)
// ═══════════════════════════════════════════════
'use client'

import { useState, useEffect } from 'react'
import {
  Globe,
  Bell,
  Mail,
  DollarSign,
  Shield,
  BookOpen,
  Lock,
  Download,
  LogOut,
  Trash2,
} from 'lucide-react'

import { M } from '@/lib/meridian'
import { card, anim } from '@/lib/ui-helpers'
import { createClient } from '@/lib/supabase/client'

import {
  IdentityCard,
  MenuCard,
  MenuRow,
  Toggle,
  ProUpgradeCard,
  SectionHeader,
  ChangePasswordSheet,
} from '@/components/profile'

// ═══════════════════════════════════════════════
// Profile v3.0.0 — Profile hub with identity,
// preferences, pro CTA, detail sub-views, sign out
// Story: ca-story87-profile-page-v3
// Sprint: 21 (E14 Close)
// ═══════════════════════════════════════════════

type Section = 'display' | 'notifications' | 'email' | 'password' | null

interface ProfileData {
  display_name: string | null
  created_at: string
  tier: 'free' | 'pro'
}

// ── Detail: Display ──────────────────────────

function DisplayDetail({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ padding: '24px 20px' }}>
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          fontSize: 14,
          color: M.accentDeep,
          fontWeight: 500,
          cursor: 'pointer',
          marginBottom: 24,
          padding: 0,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        ← Back
      </button>
      <h2
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 20,
          fontWeight: 500,
          color: M.text,
          marginBottom: 4,
        }}
      >
        Display
      </h2>
      <p style={{ fontSize: 13, color: M.textSecondary, marginBottom: 20 }}>
        Customize how information appears
      </p>

      <MenuCard>
        {[
          {
            label: 'Timezone',
            options: ['Europe/Brussels', 'America/New_York', 'Asia/Tokyo', 'UTC'],
            def: 'Europe/Brussels',
          },
          {
            label: 'Date format',
            options: ['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY'],
            def: 'YYYY-MM-DD',
          },
          {
            label: 'Currency',
            options: ['USD', 'EUR', 'GBP', 'BTC'],
            def: 'USD',
          },
        ].map((item, i) => (
          <div key={i} style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: M.textMuted, marginBottom: 6 }}>
              {item.label}
            </div>
            <select
              defaultValue={item.def}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                fontSize: 14,
                fontWeight: 500,
                color: M.text,
                outline: 'none',
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {item.options.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
        ))}
      </MenuCard>
    </div>
  )
}

// ── Detail: Notifications ────────────────────

function NotificationDetail({ onBack }: { onBack: () => void }) {
  const [posture, setPosture] = useState(true)
  const [regime, setRegime] = useState(true)
  const [alt, setAlt] = useState(true)
  const [band, setBand] = useState(false)

  return (
    <div style={{ padding: '24px 20px' }}>
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          fontSize: 14,
          color: M.accentDeep,
          fontWeight: 500,
          cursor: 'pointer',
          marginBottom: 24,
          padding: 0,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        ← Back
      </button>
      <h2
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 20,
          fontWeight: 500,
          color: M.text,
          marginBottom: 4,
        }}
      >
        Notifications
      </h2>
      <p style={{ fontSize: 13, color: M.textSecondary, marginBottom: 20 }}>
        Choose which signals trigger alerts
      </p>

      <MenuCard>
        {[
          {
            label: 'Posture mismatch',
            desc: 'When portfolio diverges from regime',
            on: posture,
            set: setPosture,
          },
          {
            label: 'Regime change',
            desc: 'When market regime shifts',
            on: regime,
            set: setRegime,
          },
          {
            label: 'ALT concentration',
            desc: 'When altcoin allocation is flagged',
            on: alt,
            set: setAlt,
          },
          {
            label: 'Band breach',
            desc: 'When weights move outside targets',
            on: band,
            set: setBand,
          },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
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
        <MenuRow icon={Bell} label="Custom thresholds" desc="Set your own trigger levels" pro />
        <MenuRow icon={Bell} label="Quiet hours" desc="Pause notifications on schedule" pro />
      </MenuCard>
    </div>
  )
}

// ── Detail: Email ────────────────────────────

function EmailDetail({ onBack }: { onBack: () => void }) {
  const [emailOn, setEmailOn] = useState(true)

  return (
    <div style={{ padding: '24px 20px' }}>
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          fontSize: 14,
          color: M.accentDeep,
          fontWeight: 500,
          cursor: 'pointer',
          marginBottom: 24,
          padding: 0,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        ← Back
      </button>
      <h2
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 20,
          fontWeight: 500,
          color: M.text,
          marginBottom: 4,
        }}
      >
        Email
      </h2>
      <p style={{ fontSize: 13, color: M.textSecondary, marginBottom: 20 }}>
        Control when and how you receive emails
      </p>

      <MenuCard>
        <div
          style={{
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: M.text }}>Email notifications</div>
            <div style={{ fontSize: 11, color: M.textMuted, marginTop: 1 }}>
              Master switch for all email
            </div>
          </div>
          <Toggle on={emailOn} onToggle={setEmailOn} />
        </div>
      </MenuCard>

      <MenuCard>
        <div style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: M.textMuted, marginBottom: 6 }}>
            Delivery frequency
          </div>
          <select
            defaultValue="Daily digest"
            disabled={!emailOn}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              fontSize: 14,
              fontWeight: 500,
              color: emailOn ? M.text : M.textMuted,
              outline: 'none',
              cursor: emailOn ? 'pointer' : 'not-allowed',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {['Immediately', 'Daily digest', 'Weekly digest'].map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>
        <div style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: M.textMuted, marginBottom: 6 }}>
            Minimum severity
          </div>
          <select
            defaultValue="Watch (notable)"
            disabled={!emailOn}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              fontSize: 14,
              fontWeight: 500,
              color: emailOn ? M.text : M.textMuted,
              outline: 'none',
              cursor: emailOn ? 'pointer' : 'not-allowed',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {['Info (all)', 'Watch (notable)', 'Actionable (high)'].map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>
      </MenuCard>
    </div>
  )
}

// ── Meridian Logo SVG ────────────────────────

function MeridianLogoSvg() {
  return (
    <svg width={36} height={36} viewBox="0 0 48 48" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="24" cy="24" r="20" stroke={M.accent} strokeWidth="1.5" opacity="0.25" />
      <circle cx="24" cy="24" r="13" stroke={M.accent} strokeWidth="1.5" opacity="0.5" />
      <line x1="24" y1="2" x2="24" y2="46" stroke={M.accent} strokeWidth="1.5" />
      <line x1="12" y1="6" x2="36" y2="42" stroke={M.accent} strokeWidth="1" opacity="0.35" />
      <circle cx="24" cy="24" r="3" fill={M.accent} />
      <circle cx="24" cy="10" r="1.5" fill={M.accent} opacity="0.5" />
      <circle cx="24" cy="38" r="1.5" fill={M.accent} opacity="0.5" />
    </svg>
  )
}

// ── Main Page ────────────────────────────────

export default function ProfilePage() {
  const [section, setSection] = useState<Section>(null)
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState('')
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  // Tier from profiles table (default 'free')
  const tier: 'free' | 'pro' = profile?.tier ?? 'free'

  useEffect(() => {
    setMounted(true)

    async function loadProfile() {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          setEmail(user.email ?? '')

          const { data } = await supabase
            .from('profiles')
            .select('display_name, created_at, tier')
            .eq('id', user.id)
            .single()

          if (data) {
            setProfile(data)
          }
        }
      } catch {
        // Silently fail — page renders with fallback data
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  // Format member since date
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : ''

  const displayName = profile?.display_name || ''

  // ── Detail sub-views ─────────────────────

  if (section === 'display') return <DisplayDetail onBack={() => setSection(null)} />
  if (section === 'notifications') return <NotificationDetail onBack={() => setSection(null)} />
  if (section === 'email') return <EmailDetail onBack={() => setSection(null)} />
  if (section === 'password') return <ChangePasswordSheet onBack={() => setSection(null)} />

  // ── Main view ────────────────────────────

  return (
    <div style={{ padding: '24px 20px', paddingBottom: 24 }}>
      {/* Page header */}
      <div style={{ marginBottom: 20, ...anim(mounted, 0) }}>
        <h1
          style={{
            fontFamily: "'Outfit', sans-serif",
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

      {/* Identity card */}
      {!loading && (
        <div style={anim(mounted, 1)}>
          <IdentityCard
            name={displayName}
            email={email}
            tier={tier}
            memberSince={memberSince}
          />
        </div>
      )}

      {/* Pro upgrade card (free users only) */}
      {tier === 'free' && (
        <div style={anim(mounted, 2)}>
          <ProUpgradeCard />
        </div>
      )}

      {/* Preferences */}
      <div style={anim(mounted, 3)}>
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
            onClick={() => setSection('notifications')}
          />
          <MenuRow
            icon={Mail}
            label="Email"
            desc="Delivery and digest settings"
            onClick={() => setSection('email')}
          />
        </MenuCard>
      </div>

      {/* Portfolio settings */}
      <div style={anim(mounted, 4)}>
        <SectionHeader label="Portfolio" />
        <MenuCard>
          <MenuRow
            icon={DollarSign}
            label="Target bands"
            desc="Allocation targets per regime"
            pro
          />
          <MenuRow
            icon={Shield}
            label="Risk profile"
            desc="Conservative, moderate, aggressive"
            pro
          />
        </MenuCard>
      </div>

      {/* Learn */}
      <div style={anim(mounted, 5)}>
        <SectionHeader label="Learn" />
        <MenuCard>
          <MenuRow
            icon={BookOpen}
            label="Glossary"
            desc="Key terms explained"
            onClick={() => {
              /* Future: navigate to glossary view */
            }}
          />
        </MenuCard>
      </div>

      {/* Account */}
      <div style={anim(mounted, 6)}>
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
            onClick={() => {
              /* Future: export flow */
            }}
          />
          <MenuRow icon={LogOut} label="Sign out" danger onClick={handleSignOut} />
        </MenuCard>
      </div>

      {/* Danger zone */}
      <div style={{ marginTop: 8, ...anim(mounted, 7) }}>
        <MenuCard>
          <MenuRow
            icon={Trash2}
            label="Delete account"
            desc="Permanently remove all data"
            danger
            onClick={() => {
              /* Future: delete confirmation flow */
            }}
          />
        </MenuCard>
      </div>

      {/* About card */}
      <div
        style={{
          ...card({ padding: 18 }),
          marginTop: 20,
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          ...anim(mounted, 8),
        }}
      >
        <MeridianLogoSvg />
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: M.text,
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            Meridian
          </div>
          <div style={{ fontSize: 11, color: M.textMuted, marginTop: 1 }}>
            v0.9 · De La Night
          </div>
        </div>
      </div>
    </div>
  )
}
