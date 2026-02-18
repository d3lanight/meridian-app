// collections/Phases.ts
// Version: 1.0.0 | 2026-02-18
// Purpose: Phase and stage tracking for PM layer
// Table: payload_phases (parent-child pattern)
// Phase row: phase_number set, stage_number null
// Stage row: phase_number matches parent, stage_number set, parent_phase relation

import type { CollectionConfig } from 'payload'
import {
  HeadingFeature,
  FixedToolbarFeature,
} from '@payloadcms/richtext-lexical'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const Phases: CollectionConfig = {
  slug: 'payload-phases',

  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'phase_number', 'stage_number', 'status', 'updatedAt'],
    group: 'PM',
    listSearchableFields: ['name'],
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
      admin: {
        description: 'Phase: "Interface, UX & Delivery". Stage: "Payload CMS & PM Layer".',
      },
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Phase: ca-phase2. Stage: ca-phase2-stage3.',
      },
    },
    {
      name: 'phase_number',
      type: 'number',
      required: true,
      admin: {
        position: 'sidebar',
        description: 'Phase number (e.g., 2). Same as parent for stages.',
      },
    },
    {
      name: 'stage_number',
      type: 'number',
      admin: {
        position: 'sidebar',
        description: 'Null = phase. Non-null = stage within that phase.',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'planned',
      options: [
        { label: 'Planned', value: 'planned' },
        { label: 'Active', value: 'active' },
        { label: 'Complete', value: 'complete' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
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
        description: 'For stages only — requirements and doc references. Phase narrative lives in knowledge entries.',
      },
    },
    {
      name: 'start_date',
      type: 'date',
      admin: {
        position: 'sidebar',
        description: 'When this phase/stage started.',
      },
    },
    {
      name: 'end_date',
      type: 'date',
      admin: {
        position: 'sidebar',
        description: 'When completed. Null if active/planned.',
      },
    },
    {
      name: 'parent_phase',
      type: 'relationship',
      relationTo: 'payload-phases',
      maxDepth: 1,
      admin: {
        description: 'Null = top-level phase. Set to parent phase for stages.',
      },
    },
  ],
}