// collections/GlossaryEntries.ts
// Story: ca-story23-glossary-articles
// Version: 1.0.0 | 2026-02-15
// Purpose: Crypto/finance glossary with self-referential related terms
// Table: payload_glossary_entries (via slug prefix convention)

import type { CollectionConfig } from 'payload'
import {
  HeadingFeature,
  FixedToolbarFeature,
  InlineCodeFeature,
} from '@payloadcms/richtext-lexical'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const GlossaryEntries: CollectionConfig = {
  slug: 'payload-glossary-entries',

  // ---------------------------------------------------------------------------
  // 1.0 Admin Panel
  // ---------------------------------------------------------------------------
  admin: {
    useAsTitle: 'term',
    defaultColumns: ['term', 'slug', 'updatedAt'],
    group: 'Content',
    listSearchableFields: ['term', 'slug', 'definition'],
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
      name: 'term',
      type: 'text',
      required: true,
      label: 'Term',
      admin: {
        description: 'Readable glossary term',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
        description: 'Unique identifier for URL routing. Auto-generated from term if left empty.',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (!value && data?.term) {
              return data.term
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
      name: 'definition',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Short plain-text definition shown in tooltips and listings.',
      },
    },
    {
      name: 'extended',
      type: 'richText',
      label: 'Extended Explanation',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
          FixedToolbarFeature(),
          InlineCodeFeature(),
        ],
      }),
      admin: {
        description: 'Detailed explanation with examples, formulas, context.',
      },
    },

    // -------------------------------------------------------------------------
    // 3.2 Relationships
    // -------------------------------------------------------------------------
    // Self-referential: intra-collection, so Payload relationship is appropriate
    {
      name: 'relatedTerms',
      type: 'relationship',
      relationTo: 'payload-glossary-entries',
      hasMany: true,
      admin: {
        description: 'Other glossary terms related to this one.',
      },
    },
    // Cross-collection: glossary → knowledge uses UUID text for v1
    // Full Payload relationship deferred to story 34
    {
      name: 'relatedKnowledgeId',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'UUID of related knowledge entry (cross-collection, v1).',
      },
    },
  ],
}
