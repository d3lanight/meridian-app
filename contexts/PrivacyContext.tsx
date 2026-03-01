// ═══════════════════════════════════════════════
// PrivacyContext v1.0.0 — App-wide privacy toggle
// Story: ca-story89-privacy-toggle | Sprint 21
// Client-side only, not persisted to backend
// ═══════════════════════════════════════════════
'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

interface PrivacyContextValue {
  hidden: boolean
  toggleHidden: () => void
}

const PrivacyContext = createContext<PrivacyContextValue>({
  hidden: false,
  toggleHidden: () => {},
})

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false)
  const toggleHidden = () => setHidden((h) => !h)

  return (
    <PrivacyContext.Provider value={{ hidden, toggleHidden }}>
      {children}
    </PrivacyContext.Provider>
  )
}

export function usePrivacy() {
  return useContext(PrivacyContext)
}
