// collections/Articles.ts
// Story: ca-story23-glossary-articles
// Version: 1.0.0 | 2026-02-15
// Purpose: Educational articles with SEO and publishing workflow
// Table: payload_articles (via slug prefix convention)

import type { CollectionConfig } from 'payload'
import {
  HeadingFeature,
  FixedToolbarFeature,
  InlineCodeFeature,
} from '@payloadcms/richtext-lexical'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const Articles: CollectionConfig = {
  slug: 'payload-articles',

  // ---------------------------------------------------------------------------
  // 1.0 Admin Panel
  // ---------------------------------------------------------------------------
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'status', 'publishedAt', 'updatedAt'],
    group: 'Content',
    listSearchableFields: ['title', 'slug', 'excerpt'],
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
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Readable article title',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
        description: 'Unique identifier for URL routing',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
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
      name: 'excerpt',
      type: 'textarea',
      admin: {
        description: 'Short summary for listings and social sharing.',
      },
    },
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
          FixedToolbarFeature(),
          InlineCodeFeature(),
        ],
      }),
    },

    // -------------------------------------------------------------------------
    // 3.2 Publishing
    // -------------------------------------------------------------------------
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Market Analysis', value: 'market-analysis' },
        { label: 'Portfolio Strategy', value: 'portfolio-strategy' },
        { label: 'Technical Explainer', value: 'technical-explainer' },
        { label: 'Getting Started', value: 'getting-started' },
        { label: 'Product Update', value: 'product-update' },
      ],
      admin: {
        position: 'sidebar',
      },
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
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        description: 'Publication date. Set when status changes to published.',
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },
    {
      name: 'author',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'Author name for byline display.',
      },
    },

    // -------------------------------------------------------------------------
    // 3.3 SEO Fields
    // -------------------------------------------------------------------------
    {
      name: 'seoTitle',
      type: 'text',
      label: 'SEO Title',
      admin: {
        description: 'Override for page title tag. Falls back to article title.',
      },
    },
    {
      name: 'seoDescription',
      type: 'textarea',
      label: 'SEO Description',
      admin: {
        description: 'Meta description for search engines. ~155 chars recommended.',
      },
    },
    {
      name: 'seoKeywords',
      type: 'array',
      label: 'SEO Keywords',
      admin: {
        description: 'Keywords for search engine optimization.',
      },
      fields: [
        {
          name: 'keyword',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
}
