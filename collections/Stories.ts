// collections/Stories.ts
// Story: ca-story27-stories-collection
// Version: 1.1.0 | 2026-02-16
// Purpose: Sprint-level stories for PM layer
// Table: payload_stories (via slug prefix convention)
// Change: Removed dependency1/dependency2 self-relations (tracked in notes instead)
//         Added maxDepth: 1 to epic + sprint relations to prevent hydration loops

import type { CollectionConfig } from 'payload'
import {
  HeadingFeature,
  FixedToolbarFeature,
} from '@payloadcms/richtext-lexical'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const Stories: CollectionConfig = {
  slug: 'payload-stories',

  // ---------------------------------------------------------------------------
  // 1.0 Admin Panel
  // ---------------------------------------------------------------------------
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'status', 'complexity', 'effort', 'epic', 'sprint', 'updatedAt'],
    group: 'PM',
    listSearchableFields: ['name'],
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
      defaultValue: 'needs-refinement',
      options: [
        { label: 'Needs Refinement', value: 'needs-refinement' },
        { label: 'Sprint Ready', value: 'sprint-ready' },
        { label: 'In Progress', value: 'in-progress' },
        { label: 'Done', value: 'done' },
        { label: 'Deferred', value: 'deferred' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'complexity',
      type: 'select',
      required: true,
      defaultValue: 'medium',
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'effort',
      type: 'select',
      required: true,
      defaultValue: '2-3-days',
      options: [
        { label: '1 day', value: '1-day' },
        { label: '2-3 days', value: '2-3-days' },
        { label: '3-4 days', value: '3-4-days' },
        { label: '5+ days', value: '5-plus-days' },
      ],
      admin: {
        position: 'sidebar',
      },
    },

    // -------------------------------------------------------------------------
    // 3.2 Content Fields
    // -------------------------------------------------------------------------
    {
      name: 'notes',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          HeadingFeature({ enabledHeadingSizes: ['h3', 'h4'] }),
          FixedToolbarFeature(),
        ],
      }),
      admin: {
        description: 'Implementation notes, context, decisions, dependencies',
      },
    },
    {
      name: 'acceptanceCriteria',
      type: 'richText',
      label: 'Acceptance Criteria',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          HeadingFeature({ enabledHeadingSizes: ['h3', 'h4'] }),
          FixedToolbarFeature(),
        ],
      }),
      admin: {
        description: 'What must be true for this story to be Done',
      },
    },

    // -------------------------------------------------------------------------
    // 3.3 Relationships
    // -------------------------------------------------------------------------
    {
      name: 'epic',
      type: 'relationship',
      relationTo: 'payload-epics',
      required: true,
      maxDepth: 1,
      admin: {
        description: 'Parent epic (required)',
      },
    },
    {
      name: 'sprint',
      type: 'relationship',
      relationTo: 'payload-sprints',
      maxDepth: 1,
      admin: {
        description: 'Assigned sprint (null = backlog)',
      },
    },

    // -------------------------------------------------------------------------
    // 3.4 Migration Support
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
