// ━━━ Root Redirect ━━━
// v0.3.1 · ca-story11 · 2026-02-11
// Redirects to dashboard. Auth gate added in story14.

import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/dashboard');
}
