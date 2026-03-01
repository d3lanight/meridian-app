// ━━━ useTier Hook ━━━
// v1.0.0 · ca-story90 · Sprint 24
// Reads profiles.tier from Supabase, provides Pro gating state

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Tier = 'free' | 'pro'

interface UseTierReturn {
  tier: Tier
  isPro: boolean
  isLoading: boolean
}

export function useTier(): UseTierReturn {
  const [tier, setTier] = useState<Tier>('free')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    async function fetchTier() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || cancelled) {
          setIsLoading(false)
          return
        }

        const { data } = await supabase
          .from('profiles')
          .select('tier')
          .eq('id', user.id)
          .single()

        if (!cancelled) {
          setTier((data?.tier as Tier) ?? 'free')
        }
      } catch {
        // Default to free on error
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchTier()
    return () => { cancelled = true }
  }, [])

  return { tier, isPro: tier === 'pro', isLoading }
}
