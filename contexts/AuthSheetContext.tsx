// ━━━ Auth Sheet Context ━━━
// v1.1.0 · S177 · Sprint 36
// Changelog:
//   v1.1.0 — S177: openAuth accepts optional mode ('login' | 'signup') to pre-select tab.
//   v1.0.0 — S160: Initial implementation.
// Allows any child page to trigger the inline auth sheet
'use client'

import { createContext, useContext } from 'react'

type AuthMode = 'login' | 'signup'

interface AuthSheetContextValue {
  openAuth: (trigger: string, mode?: AuthMode) => void
}

export const AuthSheetContext = createContext<AuthSheetContextValue>({
  openAuth: () => {},
})

export const useAuthSheet = () => useContext(AuthSheetContext)
