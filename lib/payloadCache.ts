/**
 * Cached Payload Queries
 * Version: 1.0
 * 
 * Wraps Payload queries with Next.js cache for better performance
 * Fixes "No cache host available" warnings in Vercel
 */

import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import type { SanitizedConfig } from 'payload'

type QueryOptions = {
  collection: string
  where?: any
  limit?: number
  depth?: number
  sort?: string
}

/**
 * Cached find query
 * @param options Query options
 * @param revalidate Cache duration in seconds (default: 60)
 * @param tags Cache tags for invalidation
 */
export async function cachedFind(
  config: Promise<SanitizedConfig>,
  options: QueryOptions,
  revalidate: number = 60,
  tags: string[] = []
) {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config: await config })
      return payload.find(options as any)
    },
    [`${options.collection}-${JSON.stringify(options.where || {})}`],
    {
      revalidate,
      tags: [options.collection, ...tags],
    }
  )()
}

/**
 * Cached findByID query
 * @param collection Collection name
 * @param id Document ID
 * @param revalidate Cache duration in seconds (default: 60)
 */
export async function cachedFindByID(
  config: Promise<SanitizedConfig>,
  collection: string,
  id: string,
  revalidate: number = 60
) {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config: await config })
      return payload.findByID({ collection, id, depth: 0 } as any)
    },
    [`${collection}-${id}`],
    {
      revalidate,
      tags: [collection, `${collection}-${id}`],
    }
  )()
}