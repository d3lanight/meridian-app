// ━━━ Auth Sheet ━━━
// v1.3.0 · S177 · Sprint 36
// Changelog:
//   v1.3.0 — S177: Refactored to use shared BottomSheet component. Removed inline wrapper/scroll-lock/drag-handle.
//   v1.2.0 — S177: initialMode prop to pre-select login/signup tab on open.
//   v1.1.0 — S169: sheet inset margin 12px; scroll lock useEffect.
//   v1.0.0 · S160 · Sprint 33
// Bottom sheet overlay for inline authentication
// Replaces full-page /login redirect for protected features
'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { M } from '@/lib/meridian'
import BottomSheet from '@/components/shared/BottomSheet'

// ── Icons ─────────────────────────────────────

function MeridianLogo() {
  return (
    <svg width={28} height={28} viewBox="0 0 48 48" fill="none">
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

function GoogleIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill={M.text}>
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  )
}

// ── Types ──────────────────────────────────────

type AuthMode = 'login' | 'signup'
type AuthView = 'form' | 'confirm' | 'reset-sent'

interface AuthSheetProps {
  initialMode?: 'login' | 'signup'
  isOpen: boolean
  onClose: () => void
  trigger?: string
}

// ── Shared styles ─────────────────────────────

const FONT_BODY = "'DM Sans', sans-serif"
const FONT_DISPLAY = "'Outfit', sans-serif"

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  background: 'rgba(255,255,255,0.8)',
  border: `1px solid ${M.borderSubtle}`,
  borderRadius: 12,
  color: M.text,
  fontSize: 16,
  fontFamily: FONT_BODY,
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: M.textSecondary,
  marginBottom: 6,
  letterSpacing: '0.03em',
}

const ssoButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  background: 'rgba(255,255,255,0.8)',
  border: `1px solid ${M.borderSubtle}`,
  borderRadius: 14,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  fontSize: 14,
  fontWeight: 500,
  color: M.text,
  fontFamily: FONT_BODY,
}

// ── Component ─────────────────────────────────

export default function AuthSheet({ isOpen, onClose, trigger, initialMode }: AuthSheetProps) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [view, setView] = useState<AuthView>('form')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const isSignup = mode === 'signup'
  const passwordMismatch = isSignup && confirmPassword.length > 0 && password !== confirmPassword
  const isValid = email.length > 0 && password.length >= 6 && (!isSignup || (confirmPassword.length > 0 && !passwordMismatch))

  // Apply initialMode when sheet opens
  useEffect(() => {
    if (isOpen && initialMode) {
      setMode(initialMode)
    }
  }, [isOpen, initialMode])

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setMode('login')
      setView('form')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setError('')
      setLoading(false)
    }
  }, [isOpen])

  // ── Handlers ────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (isSignup) {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
      } else {
        setLoading(false)
        setView('confirm')
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError(signInError.message)
        setLoading(false)
      } else {
        onClose()
        router.refresh()
      }
    }
  }

  const handleForgotPassword = async () => {
    if (!email) { setError('Enter your email address first'); return }
    setLoading(true)
    setError('')
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    })
    if (resetError) {
      setError(resetError.message)
      setLoading(false)
    } else {
      setLoading(false)
      setView('reset-sent')
    }
  }

  const handleSSOClick = () => setError('SSO coming soon — use email for now')

  const switchMode = (m: AuthMode) => {
    setMode(m)
    setView('form')
    setError('')
    setPassword('')
    setConfirmPassword('')
  }

  // ── Confirmation view ─────────────────────

  const renderConfirm = () => (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: M.positiveDim,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 14px',
      }}>
        <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={M.positive} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 6 6 18" /><path d="m2 12 4 6" /><path d="M22 6 12 12" />
        </svg>
      </div>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 500, color: M.text, margin: '0 0 8px' }}>
        Check your email
      </h2>
      <p style={{ fontSize: 13, color: M.textSecondary, lineHeight: 1.6, margin: '0 0 4px' }}>
        We sent a confirmation link to
      </p>
      <p style={{ fontSize: 14, fontWeight: 600, color: M.text, margin: '0 0 16px' }}>{email}</p>
      <button onClick={() => switchMode('login')} style={{
        padding: '10px 20px', background: 'rgba(255,255,255,0.8)',
        border: `1px solid ${M.borderSubtle}`, borderRadius: 14,
        cursor: 'pointer', fontSize: 13, fontWeight: 500,
        color: M.text, fontFamily: FONT_BODY,
      }}>
        Back to sign in
      </button>
    </div>
  )

  // ── Reset-sent view ───────────────────────

  const renderResetSent = () => (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: M.accentDim,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 14px',
      }}>
        <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={M.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      </div>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 500, color: M.text, margin: '0 0 8px' }}>
        Reset link sent
      </h2>
      <p style={{ fontSize: 13, color: M.textSecondary, lineHeight: 1.6, margin: '0 0 4px' }}>
        Check your inbox at
      </p>
      <p style={{ fontSize: 14, fontWeight: 600, color: M.text, margin: '0 0 16px' }}>{email}</p>
      <button onClick={() => { setView('form'); setError('') }} style={{
        padding: '10px 20px', background: 'rgba(255,255,255,0.8)',
        border: `1px solid ${M.borderSubtle}`, borderRadius: 14,
        cursor: 'pointer', fontSize: 13, fontWeight: 500,
        color: M.text, fontFamily: FONT_BODY,
      }}>
        Back to sign in
      </button>
    </div>
  )

  // ── Render ──────────────────────────────────

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} scrollable={true} maxHeight="82vh">
      <div style={{ padding: '0 20px 28px' }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MeridianLogo />
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: M.text, fontFamily: FONT_DISPLAY }}>
                Sign in to Meridian
              </div>
              {trigger && (
                <div style={{ fontSize: 11, color: M.textMuted }}>
                  {trigger} requires an account
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.5)',
              border: `1px solid ${M.border}`,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={14} color={M.textMuted} />
          </button>
        </div>

        {/* View routing */}
        {view === 'confirm' && renderConfirm()}
        {view === 'reset-sent' && renderResetSent()}
        {view === 'form' && (
          <>
            {/* Tab toggle */}
            <div style={{
              display: 'flex', background: 'rgba(255,255,255,0.4)',
              borderRadius: 14, padding: 3, marginBottom: 16,
              border: `1px solid ${M.borderSubtle}`,
            }}>
              {(['login', 'signup'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 11,
                    border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600, fontFamily: FONT_BODY,
                    background: mode === m ? 'rgba(255,255,255,0.9)' : 'transparent',
                    color: mode === m ? M.text : M.textMuted,
                    boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  {m === 'login' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>

            {/* SSO buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <button onClick={handleSSOClick} style={ssoButtonStyle}>
                <GoogleIcon /> <span>Continue with Google</span>
              </button>
              <button onClick={handleSSOClick} style={ssoButtonStyle}>
                <AppleIcon /> <span>Continue with Apple</span>
              </button>
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 16px' }}>
              <div style={{ flex: 1, height: 1, background: M.borderSubtle }} />
              <span style={{ fontSize: 11, color: M.textMuted, fontWeight: 500 }}>or</span>
              <div style={{ flex: 1, height: 1, background: M.borderSubtle }} />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required style={inputStyle} />
              </div>
              <div style={{ marginBottom: isSignup ? 14 : 0 }}>
                <label style={labelStyle}>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder={isSignup ? 'Min. 6 characters' : '••••••••'}
                  required minLength={6} style={inputStyle} />
              </div>
              {isSignup && (
                <div style={{ marginBottom: 0 }}>
                  <label style={labelStyle}>Confirm password</label>
                  <input type="password" value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password" required style={inputStyle} />
                  {passwordMismatch && (
                    <div style={{ fontSize: 11, color: M.negative, marginTop: 6 }}>
                      Passwords don&apos;t match
                    </div>
                  )}
                </div>
              )}
              {!isSignup && (
                <div style={{ textAlign: 'right', marginBottom: 16, marginTop: 8 }}>
                  <button type="button" onClick={handleForgotPassword} style={{
                    background: 'none', border: 'none', fontSize: 12,
                    color: M.accentDeep, fontWeight: 500, cursor: 'pointer',
                    padding: 0, fontFamily: FONT_BODY,
                  }}>
                    Forgot password?
                  </button>
                </div>
              )}
              {error && (
                <div style={{
                  background: M.negativeDim,
                  border: '1px solid rgba(231,111,81,0.2)',
                  borderRadius: 12, padding: '10px 14px',
                  marginBottom: 14, marginTop: isSignup ? 14 : 0,
                  fontSize: 12, color: M.negative,
                }}>
                  {error}
                </div>
              )}
              <button type="submit" disabled={!isValid || loading} style={{
                width: '100%', padding: 14,
                background: loading ? M.accent : M.accentGradient,
                border: 'none', borderRadius: 16,
                color: 'white', fontSize: 14, fontWeight: 500,
                fontFamily: FONT_BODY,
                cursor: loading ? 'wait' : 'pointer',
                boxShadow: `0 4px 16px ${M.accentGlow}`,
                opacity: (!isValid || loading) ? 0.6 : 1,
                marginTop: isSignup ? 8 : 0,
              }}>
                {loading
                  ? (isSignup ? 'Creating account...' : 'Signing in...')
                  : (isSignup ? 'Create account' : 'Sign in')}
              </button>
            </form>

            {isSignup && (
              <p style={{
                fontSize: 10, color: M.textMuted, textAlign: 'center',
                lineHeight: 1.5, marginTop: 14,
              }}>
                By creating an account, you agree to Meridian&apos;s{' '}
                <span style={{ color: M.accentDeep, fontWeight: 500 }}>Terms</span> and{' '}
                <span style={{ color: M.accentDeep, fontWeight: 500 }}>Privacy Policy</span>
              </p>
            )}
          </>
        )}
      </div>
    </BottomSheet>
  )
}
