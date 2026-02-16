/**
 * ProjectDocs Collection
 * Version: 1.0
 * Created: 2026-02-16
 * Story: ca-story29-backlog-views
 * 
 * Manages project documentation including agent inits, skills, configs, and reference docs.
 * Maps to existing payload_project_docs table created in Sprint 7.
 */

import type { CollectionConfig } from 'payload'

export const ProjectDocs: CollectionConfig = {
  slug: 'payload-project-docs',
  admin: {
    useAsTitle: 'name',
    group: 'System',
    defaultColumns: ['name', 'doc_type', 'version', 'updated_at'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Document Name',
      admin: {
        description: 'Display name for this document',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Slug',
      admin: {
        description: 'Unique identifier (e.g., agent-console, topology, n8n-supabase)',
      },
    },
    {
      name: 'doc_type',
      type: 'select',
      required: true,
      options: [
        { label: 'Config', value: 'config' },
        { label: 'Agent Init', value: 'agent-init' },
        { label: 'Skill', value: 'skill' },
        { label: 'Reference', value: 'reference' },
      ],
      defaultValue: 'reference',
      label: 'Document Type',
      admin: {
        description: 'Categorizes the document purpose',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
      admin: {
        description: 'Short description of this document',
      },
    },
    {
      name: 'raw_markdown',
      type: 'textarea',
      required: true,
      label: 'Markdown Content',
      admin: {
        description: 'Full markdown content (NOT Lexical - this is raw markdown for agent loading)',
        rows: 20,
      },
    },
    {
      name: 'version',
      type: 'text',
      defaultValue: '1.0',
      label: 'Version',
      admin: {
        position: 'sidebar',
        description: 'Semantic version (e.g., 1.0, 2.1)',
      },
    },
    {
      name: 'depends_on',
      type: 'textarea',
      label: 'Dependencies',
      admin: {
        position: 'sidebar',
        description: 'Comma-separated list of slugs this document depends on',
        rows: 3,
      },
    },
    {
      name: 'version_lock',
      type: 'number',
      defaultValue: 1,
      admin: {
        hidden: true, // <-- hide completely
      },
    },
  ],
  timestamps: true,
}