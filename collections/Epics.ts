// collections/Epics.ts
// Story: ca-story26-epics-collection
// Version: 1.0.0 | 2026-02-15
// Purpose: Epic-level planning for PM layer
// Table: payload_epics (via slug prefix convention)

import type { CollectionConfig } from 'payload'
import {
  HeadingFeature,
  FixedToolbarFeature,
} from '@payloadcms/richtext-lexical'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const Epics: CollectionConfig = {
  slug: 'payload-epics',

  // ---------------------------------------------------------------------------
  // 1.0 Admin Panel
  // ---------------------------------------------------------------------------
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'status', 'effort', 'updatedAt'],
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
  // 3.0 Fields
  // ---------------------------------------------------------------------------
  fields: [
    // -------------------------------------------------------------------------
    // 3.1 Core Fields
    // -------------------------------------------------------------------------
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'planned',
      options: [
        { label: 'Planned', value: 'planned' },
        { label: 'In Refinement', value: 'in-refinement' },
        { label: 'Active', value: 'active' },
        { label: 'Complete', value: 'complete' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'effort',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'Estimated effort (e.g., "5-7 weeks")',
      },
    },
    {
      name: 'recommendedStart',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'When this epic should begin (e.g., "After Sprint 5")',
      },
    },

    // -------------------------------------------------------------------------
    // 3.2 Strategic Content (Rich Text)
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
        description: 'What this epic aims to achieve',
      },
    },
    {
      name: 'scopeIn',
      type: 'richText',
      label: 'Scope — In',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          HeadingFeature({ enabledHeadingSizes: ['h3', 'h4'] }),
          FixedToolbarFeature(),
        ],
      }),
      admin: {
        description: 'What is in scope',
      },
    },
    {
      name: 'scopeOut',
      type: 'richText',
      label: 'Scope — Out',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          HeadingFeature({ enabledHeadingSizes: ['h3', 'h4'] }),
          FixedToolbarFeature(),
        ],
      }),
      admin: {
        description: 'What is explicitly out of scope',
      },
    },
    {
      name: 'risks',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          HeadingFeature({ enabledHeadingSizes: ['h3', 'h4'] }),
          FixedToolbarFeature(),
        ],
      }),
      admin: {
        description: 'Known risks and mitigations',
      },
    },
    {
      name: 'successCriteria',
      type: 'richText',
      label: 'Success Criteria',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          HeadingFeature({ enabledHeadingSizes: ['h3', 'h4'] }),
          FixedToolbarFeature(),
        ],
      }),
      admin: {
        description: 'How we know this epic is done',
      },
    },

    // -------------------------------------------------------------------------
    // 3.3 Migration Support
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
