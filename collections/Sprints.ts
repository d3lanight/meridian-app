// collections/Sprints.ts
// Story: ca-story28-sprints-metrics (stub for story 27 relationship)
// Version: 0.1.0 | 2026-02-15
// Purpose: Stub — full implementation in story 28
// Table: payload_sprints (via slug prefix convention)

import type { CollectionConfig } from 'payload'

export const Sprints: CollectionConfig = {
  slug: 'payload-sprints',

  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'status', 'updatedAt'],
    group: 'PM',
  },

  access: {
    read: () => true,
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },

  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Completed', value: 'completed' },
        { label: 'Paused', value: 'paused' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
