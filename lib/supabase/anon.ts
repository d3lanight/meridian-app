// ━━━ Supabase Anon Client ━━━
// v1.0.0 · S207-fix · Sprint 42
// Cookie-free Supabase client for public, cacheable API routes.
// Using createClient() from server.ts reads cookies() — Next.js marks the route as dynamic
// and Vercel bypasses CDN cache entirely. Use this client for routes that require no auth.

import { createClient } from '@supabase/supabase-js'

export function createAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}