// collections/Sprints.ts
// Story: ca-story28-sprints-metrics
// Version: 1.0.0 | 2026-02-15
// Purpose: Sprint tracking for PM layer with computed story counts
// Table: payload_sprints (via slug prefix convention)

import type { CollectionConfig } from 'payload'
import {
  HeadingFeature,
  FixedToolbarFeature,
} from '@payloadcms/richtext-lexical'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const Sprints: CollectionConfig = {
  slug: 'payload-sprints',

  // ---------------------------------------------------------------------------
  // 1.0 Admin Panel
  // ---------------------------------------------------------------------------
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'sprintNumber', 'status', 'startDate', 'endDate', 'updatedAt'],
    group: 'PM',
  },

  // ---------------------------------------------------------------------------
  // 2.0 Access Control
  // ---------------------------------------------------------------------------
  access: {
    read: () => true,
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },

  // ---------------------------------------------------------------------------
  // 3.0 Hooks — Computed Fields
  // ---------------------------------------------------------------------------
  hooks: {
    beforeRead: [
      async ({ doc, req }) => {
        if (!doc?.id || !req.payload) return doc
        try {
          const total = await req.payload.find({
            collection: 'payload-stories',
            where: { sprint: { equals: doc.id } },
            limit: 0,
          })
          const done = await req.payload.find({
            collection: 'payload-stories',
            where: {
              and: [
                { sprint: { equals: doc.id } },
                { status: { equals: 'done' } },
              ],
            },
            limit: 0,
          })
          doc.storiesTotal = total.totalDocs
          doc.storiesCompleted = done.totalDocs
        } catch {
          doc.storiesTotal = 0
          doc.storiesCompleted = 0
        }
        return doc
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 4.0 Fields
  // ---------------------------------------------------------------------------
  fields: [
    // -------------------------------------------------------------------------
    // 4.1 Core Fields
    // -------------------------------------------------------------------------
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Identifier (e.g., "ca-sprint7")',
      },
    },
    {
      name: 'sprintNumber',
      type: 'number',
      required: true,
      admin: {
        position: 'sidebar',
        description: 'Sequential sprint number',
      },
    },
    {
      name: 'sprintName',
      type: 'text',
      admin: {
        description: 'Descriptive name (e.g., "PM Layer + Content Migration")',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
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
    {
      name: 'startDate',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },
    {
      name: 'endDate',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },

    // -------------------------------------------------------------------------
    // 4.2 Content
    // -------------------------------------------------------------------------
    {
      name: 'goal',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          HeadingFeature({ enabledHeadingSizes: ['h3', 'h4'] }),
          FixedToolbarFeature(),
        ],
      }),
      admin: {
        description: 'Sprint goal — what we aim to deliver',
      },
    },

    // -------------------------------------------------------------------------
    // 4.3 Computed Fields (read-only, populated by beforeRead hook)
    // -------------------------------------------------------------------------
    {
      name: 'storiesTotal',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Auto-computed: total stories assigned to this sprint',
      },
    },
    {
      name: 'storiesCompleted',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Auto-computed: stories with status = Done',
      },
    },

    // -------------------------------------------------------------------------
    // 4.4 Migration Support
    // -------------------------------------------------------------------------
    {
      name: 'notionId',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Source Notion page ID (for migration dedup)',
      },
    },
  ],
}
