// collections/Media.ts
// Story: ca-story24-media-storage
// Version: 1.0.0 | 2026-02-15
// Purpose: Media uploads stored in Supabase Storage (S3-compatible)
// Table: payload_media (via slug prefix convention)

import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'payload-media',

  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'category', 'updatedAt'],
    group: 'Content',
  },

  upload: {
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 640,
        height: 480,
        position: 'centre',
      },
      {
        name: 'hero',
        width: 1280,
        height: undefined,
        position: 'centre',
      },
    ],
    mimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'],
  },

  access: {
    read: () => true,
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },

  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      label: 'Alt Text',
      admin: {
        description: 'Descriptive text for accessibility and SEO.',
      },
    },
    {
      name: 'caption',
      type: 'textarea',
      admin: {
        description: 'Optional caption displayed below the image.',
      },
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Chart', value: 'chart' },
        { label: 'Diagram', value: 'diagram' },
        { label: 'Screenshot', value: 'screenshot' },
        { label: 'Icon', value: 'icon' },
        { label: 'Hero Image', value: 'hero' },
        { label: 'Other', value: 'other' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Helps organize media in the library.',
      },
    },
  ],
}
