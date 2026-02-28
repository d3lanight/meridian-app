// ━━━ Auth Screen ━━━
// v1.0.0 · ca-story73 · 2026-02-28
// Unified login/signup with tab toggle, SSO slots, forgot password
// Design ref: meridian-auth-v3.jsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { M } from '@/lib/meridian'

// ── Meridian Logo ─────────────────────────────
function MeridianLogo() {
  return (
    <svg width={48} height={48} viewBox="0 0 48 48" fill="none">
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

// ── Google Icon ───────────────────────────────
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

// ── Apple Icon ────────────────────────────────
function AppleIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill={M.text}>
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  )
}

// ── Types ─────────────────────────────────────
type AuthMode = 'login' | 'signup'
type AuthView = 'form' | 'confirm' | 'reset-sent'

export default function LoginPage() {
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

  // ── Handlers ──────────────────────────────
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
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) {
        setError(signInError.message)
        setLoading(false)
      } else {
        router.push('/')
        router.refresh()
      }
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Enter your email address first')
      return
    }
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

  const handleSSOClick = () => {
    setError('SSO coming soon — use email for now')
  }

  const switchMode = (m: AuthMode) => {
    setMode(m)
    setView('form')
    setError('')
    setPassword('')
    setConfirmPassword('')
  }

  // ── Shared styles ─────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    background: 'rgba(255,255,255,0.8)',
    border: `1px solid ${M.borderSubtle}`,
    borderRadius: 12,
    color: M.text,
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
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

  // ── Confirmation view ─────────────────────
  if (view === 'confirm') {
    return (
      <Shell>
        <Logo />
        <div style={{
          background: M.surface,
          backdropFilter: M.surfaceBlur,
          WebkitBackdropFilter: M.surfaceBlur,
          border: `1px solid ${M.border}`,
          borderRadius: 24,
          padding: 28,
          textAlign: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: M.positiveDim,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={M.positive} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 6 6 18" /><path d="m2 12 4 6" /><path d="M22 6 12 12" />
            </svg>
          </div>
          <h2 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 20, fontWeight: 500, color: M.text,
            margin: '0 0 8px',
          }}>
            Check your email
          </h2>
          <p style={{ fontSize: 13, color: M.textSecondary, lineHeight: 1.6, margin: '0 0 6px' }}>
            We sent a confirmation link to
          </p>
          <p style={{ fontSize: 14, fontWeight: 600, color: M.text, margin: '0 0 20px' }}>
            {email}
          </p>
          <p style={{ fontSize: 12, color: M.textMuted, lineHeight: 1.5, margin: 0 }}>
            Click the link in your email to activate your account, then return here to sign in.
          </p>
          <button
            onClick={() => switchMode('login')}
            style={{
              marginTop: 20, padding: '12px 24px',
              background: 'rgba(255,255,255,0.8)',
              border: `1px solid ${M.borderSubtle}`,
              borderRadius: 14, cursor: 'pointer',
              fontSize: 13, fontWeight: 500, color: M.text,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Back to sign in
          </button>
        </div>
        <Footer />
      </Shell>
    )
  }

  // ── Reset sent view ───────────────────────
  if (view === 'reset-sent') {
    return (
      <Shell>
        <Logo />
        <div style={{
          background: M.surface,
          backdropFilter: M.surfaceBlur,
          WebkitBackdropFilter: M.surfaceBlur,
          border: `1px solid ${M.border}`,
          borderRadius: 24,
          padding: 28,
          textAlign: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: M.accentDim,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={M.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
          <h2 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 20, fontWeight: 500, color: M.text,
            margin: '0 0 8px',
          }}>
            Reset link sent
          </h2>
          <p style={{ fontSize: 13, color: M.textSecondary, lineHeight: 1.6, margin: '0 0 6px' }}>
            Check your inbox at
          </p>
          <p style={{ fontSize: 14, fontWeight: 600, color: M.text, margin: '0 0 20px' }}>
            {email}
          </p>
          <p style={{ fontSize: 12, color: M.textMuted, lineHeight: 1.5, margin: 0 }}>
            Follow the link in the email to reset your password.
          </p>
          <button
            onClick={() => { setView('form'); setError('') }}
            style={{
              marginTop: 20, padding: '12px 24px',
              background: 'rgba(255,255,255,0.8)',
              border: `1px solid ${M.borderSubtle}`,
              borderRadius: 14, cursor: 'pointer',
              fontSize: 13, fontWeight: 500, color: M.text,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Back to sign in
          </button>
        </div>
        <Footer />
      </Shell>
    )
  }

  // ── Main form view ────────────────────────
  return (
    <Shell>
      <Logo />

      {/* Tab toggle */}
      <div style={{
        display: 'flex',
        background: 'rgba(255,255,255,0.4)',
        borderRadius: 14,
        padding: 3,
        marginBottom: 20,
        border: `1px solid ${M.borderSubtle}`,
      }}>
        {(['login', 'signup'] as const).map(m => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 11,
              border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              background: mode === m ? 'rgba(255,255,255,0.9)' : 'transparent',
              color: mode === m ? M.text : M.textMuted,
              boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {m === 'login' ? 'Sign in' : 'Create account'}
          </button>
        ))}
      </div>

      {/* Auth card */}
      <div style={{
        background: M.surface,
        backdropFilter: M.surfaceBlur,
        WebkitBackdropFilter: M.surfaceBlur,
        border: `1px solid ${M.border}`,
        borderRadius: 24,
        padding: 22,
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }}>
        {/* SSO buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          <button onClick={handleSSOClick} style={{
            width: '100%', padding: '13px 16px',
            background: 'rgba(255,255,255,0.8)',
            border: `1px solid ${M.borderSubtle}`, borderRadius: 14,
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 10,
            fontSize: 14, fontWeight: 500, color: M.text,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>
          <button onClick={handleSSOClick} style={{
            width: '100%', padding: '13px 16px',
            background: 'rgba(255,255,255,0.8)',
            border: `1px solid ${M.borderSubtle}`, borderRadius: 14,
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 10,
            fontSize: 14, fontWeight: 500, color: M.text,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            <AppleIcon />
            <span>Continue with Apple</span>
          </button>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
          <div style={{ flex: 1, height: 1, background: M.borderSubtle }} />
          <span style={{ fontSize: 11, color: M.textMuted, fontWeight: 500 }}>or</span>
          <div style={{ flex: 1, height: 1, background: M.borderSubtle }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={inputStyle}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: isSignup ? 14 : 0 }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={isSignup ? 'Min. 6 characters' : '••••••••'}
              required
              minLength={6}
              style={inputStyle}
            />
          </div>

          {/* Confirm password (signup) */}
          {isSignup && (
            <div style={{ marginBottom: 0 }}>
              <label style={labelStyle}>Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                required
                style={inputStyle}
              />
              {passwordMismatch && (
                <div style={{
                  fontSize: 11, color: M.negative,
                  marginTop: 6,
                }}>
                  Passwords don&apos;t match
                </div>
              )}
            </div>
          )}

          {/* Forgot password (login) */}
          {!isSignup && (
            <div style={{ textAlign: 'right', marginBottom: 16, marginTop: 8 }}>
              <button
                type="button"
                onClick={handleForgotPassword}
                style={{
                  background: 'none', border: 'none',
                  fontSize: 12, color: M.accentDeep, fontWeight: 500,
                  cursor: 'pointer', padding: 0,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: M.negativeDim,
              border: '1px solid rgba(231,111,81,0.2)',
              borderRadius: 12,
              padding: '10px 14px',
              marginBottom: 14,
              marginTop: isSignup ? 14 : 0,
              fontSize: 12,
              color: M.negative,
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!isValid || loading}
            style={{
              width: '100%', padding: 14,
              background: loading ? M.accent : M.accentGradient,
              border: 'none', borderRadius: 16,
              color: 'white', fontSize: 14, fontWeight: 500,
              fontFamily: "'DM Sans', sans-serif",
              cursor: loading ? 'wait' : 'pointer',
              boxShadow: '0 4px 16px rgba(231,111,81,0.3)',
              opacity: (!isValid || loading) ? 0.6 : 1,
              transition: 'opacity 0.2s',
              marginTop: isSignup ? 8 : 0,
            }}
          >
            {loading
              ? (isSignup ? 'Creating account...' : 'Signing in...')
              : (isSignup ? 'Create account' : 'Sign in')
            }
          </button>
        </form>
      </div>

      {/* Terms (signup) */}
      {isSignup && (
        <p style={{
          fontSize: 10, color: M.textMuted, textAlign: 'center',
          lineHeight: 1.5, marginTop: 14,
        }}>
          By creating an account, you agree to Meridian&apos;s{' '}
          <span style={{ color: M.accentDeep, fontWeight: 500 }}>Terms of Service</span>
          {' '}and{' '}
          <span style={{ color: M.accentDeep, fontWeight: 500 }}>Privacy Policy</span>
        </p>
      )}

      <Footer />
    </Shell>
  )
}

// ── Layout wrappers ─────────────────────────
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: M.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif",
      padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {children}
      </div>
    </div>
  )
}

function Logo() {
  return (
    <div style={{ textAlign: 'center', marginBottom: 28 }}>
      <div style={{ marginBottom: 14 }}>
        <MeridianLogo />
      </div>
      <h1 style={{
        fontFamily: "'Outfit', sans-serif",
        fontSize: 24, fontWeight: 500,
        color: M.text, letterSpacing: '-0.02em',
        margin: '0 0 4px',
      }}>
        Meridian
      </h1>
      <p style={{ fontSize: 13, color: M.textMuted, margin: 0 }}>
        Market &amp; portfolio intelligence
      </p>
    </div>
  )
}

function Footer() {
  return (
    <div style={{ textAlign: 'center', marginTop: 20 }}>
      <p style={{ fontSize: 10, color: M.textMuted }}>Meridian v0.8 · De La Night</p>
    </div>
  )
}
