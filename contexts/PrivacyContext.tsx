// ═══════════════════════════════════════════════
// PrivacyContext v2.1.0 — App-wide privacy toggle
// Story: ca-story148-global-privacy-toggle | Sprint 31
// Persisted to user_preferences.privacy_mode
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
        .select('privacy_mode')
        .eq('user_id', user.id)
        .limit(1)
        .then(({ data }) => {
          setHidden(data?.[0]?.privacy_mode ?? false)
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
        .update({ privacy_mode: next })
        .eq('user_id', user.id)
        .limit(1)
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