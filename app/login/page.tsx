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
      background: 'linear-gradient(180deg, #0B1120 0%, #0D1526 50%, #0B1120 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif",
      padding: '20px',
    }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      <div style={{
        width: '100%',
        maxWidth: '380px',
      }}>
        {/* Logo + Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ marginBottom: '16px' }}>
            <circle cx="24" cy="24" r="20" stroke="#F5B74D" strokeWidth="1.5" opacity="0.25" />
            <circle cx="24" cy="24" r="13" stroke="#F5B74D" strokeWidth="1.5" opacity="0.5" />
            <line x1="24" y1="2" x2="24" y2="46" stroke="#F5B74D" strokeWidth="1.5" />
            <line x1="12" y1="6" x2="36" y2="42" stroke="#F5B74D" strokeWidth="1" opacity="0.35" />
            <circle cx="24" cy="24" r="3" fill="#F5B74D" />
            <circle cx="24" cy="10" r="1.5" fill="#F5B74D" opacity="0.5" />
            <circle cx="24" cy="38" r="1.5" fill="#F5B74D" opacity="0.5" />
          </svg>
          <h1 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: '24px',
            fontWeight: 600,
            color: '#F1F5F9',
            letterSpacing: '-0.02em',
            margin: '0 0 4px',
          }}>
            Crypto Analyst
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#64748B',
            margin: 0,
          }}>
            Sign in to your account
          </p>
        </div>

        {/* Login Form */}
        <div style={{
          background: '#131B2E',
          border: '1px solid rgba(148, 163, 184, 0.08)',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: '#94A3B8',
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
                  background: '#0B1120',
                  border: '1px solid rgba(148, 163, 184, 0.12)',
                  borderRadius: '10px',
                  color: '#F1F5F9',
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
                color: '#94A3B8',
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
                  background: '#0B1120',
                  border: '1px solid rgba(148, 163, 184, 0.12)',
                  borderRadius: '10px',
                  color: '#F1F5F9',
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
                background: 'rgba(248, 113, 113, 0.12)',
                border: '1px solid rgba(248, 113, 113, 0.2)',
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '16px',
                fontSize: '13px',
                color: '#F87171',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: loading ? '#C4923E' : '#F5B74D',
                border: 'none',
                borderRadius: '10px',
                color: '#0B1120',
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                cursor: loading ? 'wait' : 'pointer',
                transition: 'background 0.2s ease',
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
