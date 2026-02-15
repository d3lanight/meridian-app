// payload.config.ts
// Version: 1.5.0 | 2026-02-15
// Changelog:
//   1.0.0 — Story 21: Initial Payload install, Users collection inline
//   1.1.0 — Story 22: Add KnowledgeEntries collection
//   1.2.0 — Story 23: Add GlossaryEntries + Articles collections
//   1.3.0 — Story 24: Add Media collection + S3 storage plugin (Supabase Storage)
//   1.4.0 — Story 26: Add Epics collection (PM group)
//   1.5.0 — Story 27: Add Stories collection (PM group)

import path from 'path'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import sharp from 'sharp'
import type { CollectionConfig } from 'payload'

// Collections
import { KnowledgeEntries } from './collections/KnowledgeEntries'
import { GlossaryEntries } from './collections/GlossaryEntries'
import { Articles } from './collections/Articles'
import { Media } from './collections/Media'
import { Epics } from './collections/Epics'
import { Stories } from './collections/Stories'
import { Sprints } from './collections/Sprints'

const Users: CollectionConfig = {
  slug: 'payload-users',
  admin: {
    useAsTitle: 'email',
    group: 'System',
  },
  auth: true,
  access: {
    read: ({ req }) => !!req.user,
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  fields: [],
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(process.cwd()),
    },
    dashboard: {
      widgets: [],
    },
  },

  collections: [
    Users,
    KnowledgeEntries,
    GlossaryEntries,
    Articles,
    Media,
    Epics,
    Stories,
    Sprints,
  ],

  editor: lexicalEditor(),

  secret: process.env.PAYLOAD_SECRET || '',

  typescript: {
    outputFile: path.resolve(process.cwd(), 'payload-types.ts'),
  },

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
      max: 5,
    },
    push: true,
    tablesFilter: ['payload_*'],
  }),

  plugins: [
    s3Storage({
      collections: {
        'payload-media': true,
      },
      bucket: process.env.S3_BUCKET || 'payload-media',
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
        region: process.env.S3_REGION || '',
        endpoint: process.env.S3_ENDPOINT || '',
        forcePathStyle: true,
      },
    }),
  ],

  sharp,
})
