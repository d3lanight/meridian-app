// ━━━ Redis Cache Helper ━━━
// v1.0.0 · Sprint 42
// Shared server-side cache for public API routes.
// Graceful fallback: if Redis is unavailable, routes continue normally — never a hard failure.

import { createClient } from 'redis'

let client: ReturnType<typeof createClient> | null = null

async function getClient() {
  if (client) return client
  client = createClient({ url: process.env.REDIS_URL })
  client.on('error', (err) => {
    console.error('Redis client error:', err)
    client = null // reset so next call reconnects
  })
  await client.connect()
  return client
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = await getClient()
    const raw = await redis.get(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null // cache miss — caller falls through to Supabase
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    const redis = await getClient()
    await redis.set(key, JSON.stringify(value), { EX: ttlSeconds })
  } catch {
    // non-fatal — route still returns data
  }
}