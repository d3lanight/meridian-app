// src/collections/KnowledgeEntries.ts
// Story: ca-story22-knowledge-collection
// Version: 1.0.0 | 2026-02-15
// Purpose: Unified knowledge collection replacing 5 Notion knowledge DBs
//          (internal, phases, milestones, templates, public)
// Table: payload_knowledge_entries (via slug prefix convention)

import type { CollectionConfig } from 'payload'
import {
  FixedToolbarFeature,
  InlineCodeFeature,
} from '@payloadcms/richtext-lexical'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const KnowledgeEntries: CollectionConfig = {
  slug: 'payload-knowledge-entries',

  // ---------------------------------------------------------------------------
  // 1.0 Admin Panel
  // ---------------------------------------------------------------------------
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'category', 'audience', 'updatedAt'],
    group: 'Content',
    listSearchableFields: ['title', 'slug', 'summary'],
  },

  // ---------------------------------------------------------------------------
  // 2.0 Access Control
  // ---------------------------------------------------------------------------
  // Public read (educational content), authenticated create/update/delete
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
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
        description: 'URL-friendly identifier. Auto-generated from title if left empty.',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            // Auto-generate slug from title if not provided
            if (!value && data?.title) {
              return data.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
            }
            return value
          },
        ],
      },
    },
    {
      name: 'summary',
      type: 'textarea',
      admin: {
        description: 'Brief description for listings and search results.',
      },
    },
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          FixedToolbarFeature(),
          InlineCodeFeature(),
        ],
      }),
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Lower numbers appear first in ordered lists.',
      },
    },
    {
      name: 'tags',
      type: 'array',
      admin: {
        description: 'Freeform tags for filtering and search.',
      },
      fields: [
        {
          name: 'tag',
          type: 'text',
          required: true,
        },
      ],
    },

    // -------------------------------------------------------------------------
    // 3.2 Taxonomy Fields
    // -------------------------------------------------------------------------
    // These replace the 5-database navigation pattern from Notion.
    // category + audience distinguish content type and visibility.
    // dimension + phase provide structural context for internal docs.
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        // From ca-knowledge-internal
        { label: 'Concept', value: 'concept' },
        { label: 'How-To', value: 'how-to' },
        { label: 'Reference', value: 'reference' },
        { label: 'Glossary', value: 'glossary' },
        // From ca-knowledge-phases
        { label: 'Phase Overview', value: 'phase-overview' },
        // From ca-knowledge-milestones
        { label: 'Milestone', value: 'milestone' },
        // From ca-knowledge-templates
        { label: 'Template', value: 'template' },
        // From ca-knowledge-public
        { label: 'Release Note', value: 'release-note' },
        { label: 'Help Article', value: 'help-article' },
        { label: 'FAQ', value: 'faq' },
        { label: 'Roadmap', value: 'roadmap' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'audience',
      type: 'select',
      required: true,
      defaultValue: 'internal',
      options: [
        { label: 'Internal', value: 'internal' },
        { label: 'Public', value: 'public' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Internal = team docs. Public = site-facing content.',
      },
    },
    {
      name: 'dimension',
      type: 'select',
      options: [
        { label: 'Product', value: 'product' },
        { label: 'Flow', value: 'flow' },
        { label: 'Data', value: 'data' },
        { label: 'Agent', value: 'agent' },
        { label: 'UX', value: 'ux' },
        { label: 'Cross-cutting', value: 'cross-cutting' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Which naming dimension this entry relates to.',
        condition: (data) => data?.audience === 'internal',
      },
    },
    {
      name: 'phase',
      type: 'select',
      options: [
        { label: 'Phase 1', value: 'phase-1' },
        { label: 'Phase 2', value: 'phase-2' },
        { label: 'Phase 3', value: 'phase-3' },
        { label: 'Phase 4', value: 'phase-4' },
        { label: 'Phase 5', value: 'phase-5' },
        { label: 'Cross-Phase', value: 'cross-phase' },
        { label: 'Company', value: 'company' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Product phase this entry belongs to.',
        condition: (data) => data?.audience === 'internal',
      },
    },

    // -------------------------------------------------------------------------
    // 3.3 Cross-Layer References (UUID text fields)
    // -------------------------------------------------------------------------
    // Structure layer references use text fields storing UUIDs, not Payload
    // relationship fields. Full FK integration deferred to story 34.
    {
      name: 'relatedRegimeId',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'UUID of related regime from structure layer.',
        condition: (data) =>
          data?.category === 'concept' || data?.category === 'phase-overview',
      },
    },
    {
      name: 'relatedSignalId',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'UUID of related signal from structure layer.',
        condition: (data) =>
          data?.category === 'concept' || data?.category === 'how-to',
      },
    },

    // -------------------------------------------------------------------------
    // 3.4 Migration Tracking Fields
    // -------------------------------------------------------------------------
    {
      name: 'notion_id',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Original Notion page ID (migration reference).',
        readOnly: true,
      },
    },
    {
      name: 'source',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'Content origin: notion-import or manual.',
        readOnly: true,
      },
    },
  ],
}
