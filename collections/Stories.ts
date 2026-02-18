// collections/Stories.ts
// Story: ca-story27-stories-collection
// Version: 1.3.0 | 2026-02-18
// Purpose: Sprint-level stories for PM layer
// Table: payload_stories (via slug prefix convention)
// Change: Field descriptions aligned to locked story standard (Curator audit)

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
      admin: {
        description: 'Readable story name (e.g., "Sprint Dashboard")',
      },
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Unique identifier (e.g., "ca-story31-sprint-dashboard")',
      },
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
        { label: 'Cancelled',value: 'cancelled'},
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
    // 3.1b Phase Tagging
    // -------------------------------------------------------------------------
    {
      name: 'phase',
      type: 'select',
      options: [
        { label: 'Phase 1', value: '1' },
        { label: 'Phase 2', value: '2' },
        { label: 'Phase 3', value: '3' },
        { label: 'Phase 4', value: '4' },
        { label: 'Phase 5', value: '5' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Which phase this story belongs to.',
      },
    },
    {
      name: 'phase_stage',
      type: 'select',
      options: [
        { label: '1.1', value: '1.1' },
        { label: '1.2', value: '1.2' },
        { label: '1.3', value: '1.3' },
        { label: '2.1', value: '2.1' },
        { label: '2.2', value: '2.2' },
        { label: '2.3', value: '2.3' },
        { label: '2.4', value: '2.4' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Stage within the phase. Format: X.Y.',
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
        description: 'Internal scratch — not rendered on dashboards. Trim to 1-2 lines at closure.',
      },
    },
    {
      name: 'content',
      type: 'richText',
      admin: {
        description: 'Permanent story record — rendered on PM Dashboard. Locked sections: Problem, Approach, Dependencies, Outcome, What Was Delivered, Files Changed, What Was Skipped, Quality Pass.',
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
        description: 'Definition of Done checklist — rendered on PM Dashboard. Use: - [x] criterion',
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
