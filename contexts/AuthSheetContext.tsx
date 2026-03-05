// ━━━ Auth Sheet Context ━━━
// v1.0.0 · S160 · Sprint 33
// Allows any child page to trigger the inline auth sheet
'use client'

import { createContext, useContext } from 'react'

interface AuthSheetContextValue {
  openAuth: (trigger: string) => void
}

export const AuthSheetContext = createContext<AuthSheetContextValue>({
  openAuth: () => {},
})

export const useAuthSheet = () => useContext(AuthSheetContext)
