// ━━━ Login Page ━━━
// v0.5.0 · ca-story66 · 2026-02-21
// Meridian v2: warm cream gradient, glassmorphic card
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F5F1ED, #E8DED6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif",
      padding: '20px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '380px',
      }}>
        {/* Logo + Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ marginBottom: '16px' }}>
            <circle cx="24" cy="24" r="20" stroke="#F4A261" strokeWidth="1.5" opacity="0.25" />
            <circle cx="24" cy="24" r="13" stroke="#F4A261" strokeWidth="1.5" opacity="0.5" />
            <line x1="24" y1="2" x2="24" y2="46" stroke="#F4A261" strokeWidth="1.5" />
            <line x1="12" y1="6" x2="36" y2="42" stroke="#F4A261" strokeWidth="1" opacity="0.35" />
            <circle cx="24" cy="24" r="3" fill="#F4A261" />
            <circle cx="24" cy="10" r="1.5" fill="#F4A261" opacity="0.5" />
            <circle cx="24" cy="38" r="1.5" fill="#F4A261" opacity="0.5" />
          </svg>
          <h1 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: '24px',
            fontWeight: 500,
            color: '#2D2416',
            letterSpacing: '-0.02em',
            margin: '0 0 4px',
          }}>
            Meridian
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#8B7565',
            margin: 0,
          }}>
            Sign in to your account
          </p>
        </div>

        {/* Login Form */}
        <div style={{
          background: 'rgba(255,255,255,0.6)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.8)',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: '#6B5A4A',
                marginBottom: '6px',
                letterSpacing: '0.03em',
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.8)',
                  border: '1px solid #E8DED6',
                  borderRadius: '12px',
                  color: '#2D2416',
                  fontSize: '14px',
                  fontFamily: "'DM Sans', sans-serif",
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                placeholder="you@example.com"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: '#6B5A4A',
                marginBottom: '6px',
                letterSpacing: '0.03em',
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.8)',
                  border: '1px solid #E8DED6',
                  borderRadius: '12px',
                  color: '#2D2416',
                  fontSize: '14px',
                  fontFamily: "'DM Sans', sans-serif",
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(231,111,81,0.1)',
                border: '1px solid rgba(231,111,81,0.2)',
                borderRadius: '12px',
                padding: '10px 14px',
                marginBottom: '16px',
                fontSize: '13px',
                color: '#E76F51',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: loading
                  ? '#F4A261'
                  : 'linear-gradient(90deg, #F4A261, #E76F51)',
                border: 'none',
                borderRadius: '16px',
                color: 'white',
                fontSize: '14px',
                fontWeight: 500,
                fontFamily: "'DM Sans', sans-serif",
                cursor: loading ? 'wait' : 'pointer',
                boxShadow: '0 4px 16px rgba(231,111,81,0.3)',
                opacity: loading ? 0.7 : 1,
                transition: 'opacity 0.2s ease',
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
