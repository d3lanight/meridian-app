// ━━━ UserContext ━━━
// v1.1.0 · ca-story236 · 2026-03-15
//   - load() now returns { isPro } to allow post-load checks
//   - onAuthStateChange fires POST /api/briefing/trigger silently on SIGNED_IN for Pro users
// v1.0.0 · Sprint 42 — S209
//   - Loads user, tier, regime_display_window once at protected layout mount.
//   - All protected pages read from context — no per-page getUser() or pref fetches.
//   - refresh() can be called after login or pref changes (e.g. Profile window selector).

'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Types ─────────────────────────────────────

export interface UserState {
  /** null = not yet resolved, undefined = anon */
  userId: string | null | undefined
  email: string
  displayName: string
  tier: 'free' | 'pro' | null
  isPro: boolean
  isAdmin: boolean
  memberSince: string
  regimeWindow: number
  riskProfile: string | null
  isAnon: boolean
  /** true while first load is in flight */
  loading: boolean
}

interface UserContextValue extends UserState {
  /** Re-fetch user + prefs. Call after login, logout, or pref change. */
  refresh: () => Promise<void>
}

// ── Context ───────────────────────────────────

const UserContext = createContext<UserContextValue | null>(null)

// ── Hook ──────────────────────────────────────

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}

// ── Provider ──────────────────────────────────

const VALID_WINDOWS = [7, 30, 90, 180, 360]

const DEFAULT_STATE: UserState = {
  userId: null,
  email: '',
  displayName: '',
  tier: null,
  isPro: false,
  isAdmin: false,
  memberSince: '',
  regimeWindow: 30,
  riskProfile: null,
  isAnon: true,
  loading: true,
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UserState>(DEFAULT_STATE)

  // Returns { isPro } so callers can act on tier without reading stale closure state
  const load = useCallback(async (): Promise<{ isPro: boolean }> => {
    setState(prev => ({ ...prev, loading: true }))
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setState({ ...DEFAULT_STATE, loading: false, userId: undefined })
        return { isPro: false }
      }

      // Parallel fetch: profile + both pref rows
      const [profileRes, riskRes, windowRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('display_name, tier, is_admin, created_at')
          .eq('id', user.id)
          .single(),
        supabase
          .from('user_preferences')
          .select('value')
          .eq('user_id', user.id)
          .eq('name', 'risk_profile')
          .maybeSingle(),
        supabase
          .from('user_preferences')
          .select('value')
          .eq('user_id', user.id)
          .eq('name', 'regime_display_window')
          .maybeSingle(),
      ])

      const profile = profileRes.data
      const isPro = profile?.tier === 'pro'

      // regime_display_window — downgrade guard: non-30 requires Pro
      const parsedWindow = parseInt(windowRes.data?.value ?? '30', 10)
      const resolvedWindow = (VALID_WINDOWS.includes(parsedWindow) && (isPro || parsedWindow === 30))
        ? parsedWindow
        : 30

      // memberSince formatting
      let memberSince = ''
      if (profile?.created_at) {
        const d = new Date(profile.created_at)
        memberSince = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }).replace(' ', " '")
      }

      setState({
        userId: user.id,
        email: user.email ?? '',
        displayName: profile?.display_name ?? '',
        tier: (profile?.tier as 'free' | 'pro') ?? null,
        isPro,
        isAdmin: profile?.is_admin ?? false,
        memberSince,
        regimeWindow: resolvedWindow,
        riskProfile: riskRes.data?.value ?? null,
        isAnon: false,
        loading: false,
      })

      return { isPro }
    } catch {
      setState(prev => ({ ...prev, loading: false }))
      return { isPro: false }
    }
  }, [])

  // Boot load
  useEffect(() => {
    load()

    // Keep auth state in sync (login/logout)
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        setState({ ...DEFAULT_STATE, loading: false, userId: undefined })
      } else {
        load().then(({ isPro }) => {
          // Fire briefing trigger silently on login for Pro users only
          // Does not fire on TOKEN_REFRESHED or other events
          if (event === 'SIGNED_IN' && isPro) {
            fetch('/api/briefing/trigger', { method: 'POST' }).catch(() => {})
          }
        })
      }
    })
    return () => subscription.unsubscribe()
  }, [load])

  // Replace the context value line at the bottom of UserProvider:

const refresh = useCallback(async () => { await load() }, [load])

return (
  <UserContext.Provider value={{ ...state, refresh }}>
    {children}
  </UserContext.Provider>
)
}
