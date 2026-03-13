// ━━━ Protected Layout ━━━
// v1.4.0 · S214-fix · Sprint 43
// Changelog:
//   v1.4.0 — S214-fix: Wire onAskTap + askOpen to BottomNav. pb-[88px] → pb-[110px]
//             (extra clearance for elevated orb). chatOpen state added.
// v1.3.0 · Sprint 42 — S209: Wrap with UserProvider. Auth check reads from context.
// v1.2.0 · S177 — Mount AuthSheetContext.Provider
// v1.1.0 · S177 — Thread initialMode through openAuth to AuthSheet
// v1.0.0 · S160 — Initial implementation
'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import BottomNav from '@/components/navigation/BottomNav'
import AuthSheet from '@/components/auth/AuthSheet'
import type { NavTab } from '@/types'
import { PrivacyProvider } from '@/contexts/PrivacyContext'
import { AuthSheetContext } from '@/contexts/AuthSheetContext'
import { UserProvider, useUser } from '@/contexts/UserContext'
import { M } from '@/lib/meridian'

const PROTECTED_TABS: NavTab[] = ['exposure', 'profile']

function getTabFromPath(pathname: string): NavTab {
  if (pathname.startsWith('/exposure')) return 'exposure'
  if (pathname.startsWith('/market')) return 'market'
  if (pathname.startsWith('/profile')) return 'profile'
  return 'home'
}

function LayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const activeTab = getTabFromPath(pathname)
  const { isAnon } = useUser()

  const [showAuth,   setShowAuth]   = useState(false)
  const [authTrigger, setAuthTrigger] = useState('')
  const [authMode,   setAuthMode]   = useState<'login' | 'signup'>('login')
  const [chatOpen,   setChatOpen]   = useState(false)

  const openAuth = (trigger: string, mode: 'login' | 'signup' = 'login') => {
    setAuthTrigger(trigger)
    setAuthMode(mode)
    setShowAuth(true)
  }

  const handleTabChange = (tab: NavTab) => {
    if (isAnon && PROTECTED_TABS.includes(tab)) {
      const label = tab === 'exposure' ? 'Exposure' : 'Profile'
      openAuth(label)
      return
    }
    const routes: Record<NavTab, string> = {
      home:     '/dashboard',
      exposure: '/exposure',
      market:   '/market',
      profile:  '/profile',
    }
    window.location.href = routes[tab]
  }

  return (
    <AuthSheetContext.Provider value={{ openAuth }}>
      <div
        className="min-h-screen font-body text-text-primary max-w-[428px] mx-auto relative pb-[110px] overflow-hidden"
        style={{ background: M.bg }}
      >
        {children}
        <BottomNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onAskTap={() => setChatOpen(o => !o)}
          askOpen={chatOpen}
        />
        <AuthSheet
          isOpen={showAuth}
          onClose={() => setShowAuth(false)}
          trigger={authTrigger}
          initialMode={authMode}
        />
      </div>
    </AuthSheetContext.Provider>
  )
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <PrivacyProvider>
      <UserProvider>
        <LayoutInner>{children}</LayoutInner>
      </UserProvider>
    </PrivacyProvider>
  )
}
