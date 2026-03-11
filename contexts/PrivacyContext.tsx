// ═══════════════════════════════════════════════
// PrivacyContext v2.2.0 — App-wide privacy toggle
// Story: ca-story148-global-privacy-toggle | Sprint 31
// Persisted to user_preferences KV row name='privacy_mode'
// v2.2.0 — S190: Migrated from boolean column to KV row (privacy_mode col dropped).
//           Read: SELECT value WHERE name='privacy_mode' + maybeSingle()
//           Write: UPDATE value WHERE user_id=? AND name='privacy_mode'
// Default hidden until loaded (no flash of sensitive data)
// ═══════════════════════════════════════════════
'use client'

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PrivacyContextValue {
  hidden: boolean
  toggleHidden: () => void
  loaded: boolean
}

const PrivacyContext = createContext<PrivacyContextValue>({
  hidden: true,
  toggleHidden: () => {},
  loaded: false,
})

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const supabaseRef = useRef(createClient())

  useEffect(() => {
    const supabase = supabaseRef.current

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setHidden(false)
        setLoaded(true)
        return
      }

      supabase
        .from('user_preferences')
        .select('value')
        .eq('user_id', user.id)
        .eq('name', 'privacy_mode')
        .maybeSingle()
        .then(({ data }) => {
          setHidden(data?.value === 'true')
          setLoaded(true)
        })
    })
  }, [])

  const toggleHidden = () => {
    const next = !hidden
    setHidden(next)

    const supabase = supabaseRef.current
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('user_preferences')
        .update({ value: next ? 'true' : 'false' })
        .eq('user_id', user.id)
        .eq('name', 'privacy_mode')
        .then(({ error }) => {
          if (error) {
            console.error('[privacy] Failed to persist:', error)
            setHidden(!next)
          }
        })
    })
  }

  return (
    <PrivacyContext.Provider value={{ hidden, toggleHidden, loaded }}>
      {children}
    </PrivacyContext.Provider>
  )
}

export function usePrivacy() {
  return useContext(PrivacyContext)
}