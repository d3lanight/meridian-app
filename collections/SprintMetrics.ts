// collections/SprintMetrics.ts
// Story: ca-story28-sprints-metrics
// Version: 1.0.0 | 2026-02-15
// Purpose: Quality metrics per sprint — separate collection for independent queries
// Table: payload_sprint_metrics (via slug prefix convention)

import type { CollectionConfig } from 'payload'

export const SprintMetrics: CollectionConfig = {
  slug: 'payload-sprint-metrics',

  // ---------------------------------------------------------------------------
  // 1.0 Admin Panel
  // ---------------------------------------------------------------------------
  admin: {
    useAsTitle: 'sprint',
    defaultColumns: ['sprint', 'reliability', 'hygiene', 'analystQuality', 'futureProofing', 'updatedAt'],
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
    // 3.1 Sprint Relationship (one-to-one)
    // -------------------------------------------------------------------------
    {
      name: 'sprint',
      type: 'relationship',
      relationTo: 'payload-sprints',
      required: true,
      unique: true,
      admin: {
        description: 'The sprint these metrics belong to (one-to-one)',
      },
    },

    // -------------------------------------------------------------------------
    // 3.2 Quality Scores (0-100)
    // -------------------------------------------------------------------------
    {
      name: 'reliability',
      type: 'number',
      min: 0,
      max: 100,
      admin: {
        description: 'Execution reliability score (0-100)',
      },
    },
    {
      name: 'hygiene',
      type: 'number',
      min: 0,
      max: 100,
      admin: {
        description: 'Sprint hygiene score (0-100) — naming, docs, tracking',
      },
    },
    {
      name: 'analystQuality',
      type: 'number',
      label: 'Analyst Quality',
      min: 0,
      max: 100,
      admin: {
        description: 'Analyst output quality score (0-100)',
      },
    },
    {
      name: 'futureProofing',
      type: 'number',
      label: 'Future-Proofing',
      min: 0,
      max: 100,
      admin: {
        description: 'Architecture & reusability score (0-100)',
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
