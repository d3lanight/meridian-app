// ━━━ Profile Screen ━━━
// v1.0.0 · design-unification · 2026-02-22
// New user-facing settings page matching meridian-settings-v2.jsx artifact
// Replaces admin config editor (previously at /settings)
// Note: Toggles/selects are UI-only for now — backend persistence is future scope
'use client'

import { useState } from 'react'
import { Mail, Bell, Globe, DollarSign, ChevronRight, BookOpen } from 'lucide-react'
import { M } from '@/lib/meridian'
import Link from 'next/link'

// ── Shared Helpers ────────────────────────────

const card = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: M.surface,
  backdropFilter: M.surfaceBlur,
  WebkitBackdropFilter: M.surfaceBlur,
  borderRadius: '24px',
  padding: '20px',
  border: `1px solid ${M.border}`,
  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  ...extra,
})

// ── Toggle ────────────────────────────────────

function Toggle({
  label,
  desc,
  defaultValue = true,
  disabled = false,
}: {
  label: string
  desc?: string
  defaultValue?: boolean
  disabled?: boolean
}) {
  const [on, setOn] = useState(defaultValue)
  return (
    <div
      style={{
        ...card({ padding: '16px' }),
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: M.text, marginBottom: 2 }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: M.textMuted }}>{desc}</div>}
      </div>
      <button
        onClick={() => !disabled && setOn(!on)}
        style={{
          width: 48,
          height: 28,
          borderRadius: 28,
          background: on ? M.accentGradient : '#E8DED6',
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: 'white',
            position: 'absolute',
            top: 4,
            left: on ? 24 : 4,
            transition: 'left 0.2s ease',
          }}
        />
      </button>
    </div>
  )
}

// ── Select ────────────────────────────────────

function SelectField({
  label,
  options,
  defaultValue,
  disabled = false,
}: {
  label: string
  options: string[]
  defaultValue: string
  disabled?: boolean
}) {
  return (
    <div style={{ ...card({ padding: '16px' }), marginBottom: 12, opacity: disabled ? 0.5 : 1 }}>
      <label style={{ fontSize: 12, color: M.textMuted, display: 'block', marginBottom: 8 }}>
        {label}
      </label>
      <select
        defaultValue={defaultValue}
        disabled={disabled}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          fontSize: 14,
          fontWeight: 500,
          color: M.text,
          outline: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  )
}

// ── Section Detail Views ──────────────────────

function EmailSettings({ onBack }: { onBack: () => void }) {
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
        }}
      >
        ← Back
      </button>
      <h2
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 22,
          fontWeight: 500,
          color: M.text,
          margin: '0 0 4px',
        }}
      >
        Email
      </h2>
      <p style={{ fontSize: 14, color: M.textSecondary, margin: '0 0 24px' }}>
        Control when and how you receive emails
      </p>
      <Toggle label="Email notifications" desc="Master switch for all email" defaultValue={emailOn} />
      <SelectField
        label="Delivery frequency"
        options={['Immediately', 'Daily digest', 'Weekly digest']}
        defaultValue="Daily digest"
        disabled={!emailOn}
      />
      <SelectField
        label="Minimum severity"
        options={['Info (all)', 'Watch (notable)', 'Actionable (high)']}
        defaultValue="Watch (notable)"
        disabled={!emailOn}
      />
    </div>
  )
}

function NotificationSettings({ onBack }: { onBack: () => void }) {
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
        }}
      >
        ← Back
      </button>
      <h2
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 22,
          fontWeight: 500,
          color: M.text,
          margin: '0 0 4px',
        }}
      >
        Notifications
      </h2>
      <p style={{ fontSize: 14, color: M.textSecondary, margin: '0 0 24px' }}>
        Choose which signals trigger alerts
      </p>
      <Toggle label="Posture mismatch" desc="When portfolio diverges from regime" />
      <Toggle label="Regime change" desc="When market regime shifts" />
      <Toggle label="ALT concentration" desc="When altcoin allocation is flagged" />
      <Toggle label="Band breach" desc="When weights move outside targets" />
    </div>
  )
}

function DisplaySettings({ onBack }: { onBack: () => void }) {
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
        }}
      >
        ← Back
      </button>
      <h2
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 22,
          fontWeight: 500,
          color: M.text,
          margin: '0 0 4px',
        }}
      >
        Display
      </h2>
      <p style={{ fontSize: 14, color: M.textSecondary, margin: '0 0 24px' }}>
        Customize how information appears
      </p>
      <SelectField
        label="Timezone"
        options={['Europe/Brussels', 'America/New_York', 'Asia/Tokyo', 'UTC']}
        defaultValue="Europe/Brussels"
      />
      <SelectField
        label="Date format"
        options={['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY']}
        defaultValue="YYYY-MM-DD"
      />
      <SelectField
        label="Currency"
        options={['USD', 'EUR', 'BTC']}
        defaultValue="USD"
      />
    </div>
  )
}

// ── Settings Item Config ──────────────────────

interface SettingsItem {
  id: string
  Icon: typeof Mail
  title: string
  desc: string
  disabled?: boolean
}

const SETTINGS_ITEMS: SettingsItem[] = [
  { id: 'email', Icon: Mail, title: 'Email', desc: 'Delivery and digest settings' },
  { id: 'notifications', Icon: Bell, title: 'Notifications', desc: 'Signal triggers and alerts' },
  { id: 'display', Icon: Globe, title: 'Display', desc: 'Timezone, format, currency' },
  { id: 'portfolio', Icon: DollarSign, title: 'Portfolio', desc: 'Target bands and benchmarks', disabled: true },
]

// ═══════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════

export default function SettingsPage() {
  const [section, setSection] = useState<string | null>(null)

  if (section === 'email') return <EmailSettings onBack={() => setSection(null)} />
  if (section === 'notifications') return <NotificationSettings onBack={() => setSection(null)} />
  if (section === 'display') return <DisplaySettings onBack={() => setSection(null)} />

  return (
    <div style={{ padding: '24px 20px' }}>
      {/* ── Page Header ── */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 24,
            fontWeight: 500,
            color: M.text,
            margin: '0 0 4px',
          }}
        >
          Settings
        </h1>
        <p style={{ fontSize: 14, color: M.textSecondary, margin: 0 }}>
          Preferences and notifications
        </p>
      </div>

      {/* ── Settings Cards ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {SETTINGS_ITEMS.map((item) => {
          const { Icon } = item
          return (
            <button
              key={item.id}
              onClick={() => !item.disabled && setSection(item.id)}
              style={{
                ...card({ padding: '16px' }),
                cursor: item.disabled ? 'not-allowed' : 'pointer',
                opacity: item.disabled ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                width: '100%',
                textAlign: 'left' as const,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(244,162,97,0.1), rgba(231,111,81,0.1))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={24} color={M.accentDeep} strokeWidth={2} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: M.text, marginBottom: 2 }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 12, color: M.textMuted }}>{item.desc}</div>
              </div>
              <ChevronRight size={20} color={M.textMuted} strokeWidth={2} />
            </button>
          )
        })}
</div>

      {/* ── Learn Section (S60) ── */}
      <h2
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 18,
          fontWeight: 600,
          color: M.text,
          margin: '28px 0 12px',
        }}
      >
        Learn
      </h2>
      <Link href="/profile/learn/glossary" style={{ textDecoration: 'none' }}>
        <div
          style={{
            ...card({ padding: '16px' }),
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            width: '100%',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(244,162,97,0.1), rgba(231,111,81,0.1))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <BookOpen size={24} color={M.accentDeep} strokeWidth={2} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: M.text, marginBottom: 2 }}>
              Glossary
            </div>
            <div style={{ fontSize: 12, color: M.textMuted }}>18 terms explained</div>
          </div>
          <ChevronRight size={20} color={M.textMuted} strokeWidth={2} />
        </div>
      </Link>
    </div>
  )
}
