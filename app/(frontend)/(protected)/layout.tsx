// ━━━ Protected Layout ━━━
// v1.1.0 · S177 · Sprint 36
// Changelog:
//   v1.1.0 — S177: Thread initialMode through openAuth to AuthSheet.
//   v1.0.0 — S160: Initial implementation.
// Auth-aware layout: anonymous users see AuthSheet on protected tab taps
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import BottomNav from '@/components/navigation/BottomNav';
import AuthSheet from '@/components/auth/AuthSheet';
import type { NavTab } from '@/types';
import { PrivacyProvider } from '@/contexts/PrivacyContext';
import { M } from '@/lib/meridian';
import { createClient } from '@/lib/supabase/client';

const PROTECTED_TABS: NavTab[] = ['exposure', 'profile'];

function getTabFromPath(pathname: string): NavTab {
  if (pathname.startsWith('/exposure')) return 'exposure';
  if (pathname.startsWith('/market')) return 'market';
  if (pathname.startsWith('/profile')) return 'profile';
  return 'home';
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const activeTab = getTabFromPath(pathname);
  const [isAnon, setIsAnon] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authTrigger, setAuthTrigger] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAnon(!user);
      setAuthChecked(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAnon(!session?.user);
      if (session?.user) setShowAuth(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const openAuth = (trigger: string, mode: 'login' | 'signup' = 'login') => {
    setAuthTrigger(trigger);
    setAuthMode(mode);
    setShowAuth(true);
  };

  const handleTabChange = (tab: NavTab) => {
    if (isAnon && PROTECTED_TABS.includes(tab)) {
      const label = tab === 'exposure' ? 'Exposure' : 'Profile';
      openAuth(label);
      return;
    }
    const routes: Record<NavTab, string> = {
      home: '/dashboard',
      exposure: '/exposure',
      market: '/market',
      profile: '/profile',
    };
    window.location.href = routes[tab];
  };

  return (
    <PrivacyProvider>
      <div className="min-h-screen font-body text-text-primary max-w-[428px] mx-auto relative pb-[88px] overflow-hidden" style={{ background: M.bg }}>
        {children}
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        <AuthSheet
          isOpen={showAuth}
          onClose={() => setShowAuth(false)}
          trigger={authTrigger}
          initialMode={authMode}
        />
      </div>
    </PrivacyProvider>
  );
}
