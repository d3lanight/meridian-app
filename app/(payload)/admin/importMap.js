// app/(payload)/admin/importMap.js
// Manual importMap — Payload CLI cannot generate this on Node 24 (ESM incompatibility)
// Updated: Story 24 — added S3ClientUploadHandler for storage-s3 plugin

import { RscEntryLexicalCell } from '@payloadcms/richtext-lexical/rsc'
import { RscEntryLexicalField } from '@payloadcms/richtext-lexical/rsc'
import { BoldFeature } from '@payloadcms/richtext-lexical/client'
import { ItalicFeature } from '@payloadcms/richtext-lexical/client'
import { UnderlineFeature } from '@payloadcms/richtext-lexical/client'
import { StrikethroughFeature } from '@payloadcms/richtext-lexical/client'
import { SubscriptFeature } from '@payloadcms/richtext-lexical/client'
import { SuperscriptFeature } from '@payloadcms/richtext-lexical/client'
import { InlineCodeFeature } from '@payloadcms/richtext-lexical/client'
import { ParagraphFeature } from '@payloadcms/richtext-lexical/client'
import { HeadingFeature } from '@payloadcms/richtext-lexical/client'
import { AlignFeature } from '@payloadcms/richtext-lexical/client'
import { IndentFeature } from '@payloadcms/richtext-lexical/client'
import { UnorderedListFeature } from '@payloadcms/richtext-lexical/client'
import { OrderedListFeature } from '@payloadcms/richtext-lexical/client'
import { ChecklistFeature } from '@payloadcms/richtext-lexical/client'
import { LinkFeature } from '@payloadcms/richtext-lexical/client'
import { RelationshipFeature } from '@payloadcms/richtext-lexical/client'
import { BlockquoteFeature } from '@payloadcms/richtext-lexical/client'
import { UploadFeature } from '@payloadcms/richtext-lexical/client'
import { HorizontalRuleFeature } from '@payloadcms/richtext-lexical/client'
import { InlineToolbarFeature } from '@payloadcms/richtext-lexical/client'
import { FixedToolbarFeature } from '@payloadcms/richtext-lexical/client'
import { CollectionCards } from '@payloadcms/ui/rsc'
import { S3ClientUploadHandler } from '@payloadcms/storage-s3/client'

export const importMap = {
  "@payloadcms/richtext-lexical/rsc#RscEntryLexicalCell": RscEntryLexicalCell,
  "@payloadcms/richtext-lexical/rsc#RscEntryLexicalField": RscEntryLexicalField,
  "@payloadcms/richtext-lexical/client#BoldFeature": BoldFeature,
  "@payloadcms/richtext-lexical/client#ItalicFeature": ItalicFeature,
  "@payloadcms/richtext-lexical/client#UnderlineFeature": UnderlineFeature,
  "@payloadcms/richtext-lexical/client#StrikethroughFeature": StrikethroughFeature,
  "@payloadcms/richtext-lexical/client#SubscriptFeature": SubscriptFeature,
  "@payloadcms/richtext-lexical/client#SuperscriptFeature": SuperscriptFeature,
  "@payloadcms/richtext-lexical/client#InlineCodeFeature": InlineCodeFeature,
  "@payloadcms/richtext-lexical/client#ParagraphFeature": ParagraphFeature,
  "@payloadcms/richtext-lexical/client#HeadingFeature": HeadingFeature,
  "@payloadcms/richtext-lexical/client#AlignFeature": AlignFeature,
  "@payloadcms/richtext-lexical/client#IndentFeature": IndentFeature,
  "@payloadcms/richtext-lexical/client#UnorderedListFeature": UnorderedListFeature,
  "@payloadcms/richtext-lexical/client#OrderedListFeature": OrderedListFeature,
  "@payloadcms/richtext-lexical/client#ChecklistFeature": ChecklistFeature,
  "@payloadcms/richtext-lexical/client#LinkFeature": LinkFeature,
  "@payloadcms/richtext-lexical/client#RelationshipFeature": RelationshipFeature,
  "@payloadcms/richtext-lexical/client#BlockquoteFeature": BlockquoteFeature,
  "@payloadcms/richtext-lexical/client#UploadFeature": UploadFeature,
  "@payloadcms/richtext-lexical/client#HorizontalRuleFeature": HorizontalRuleFeature,
  "@payloadcms/richtext-lexical/client#InlineToolbarFeature": InlineToolbarFeature,
  "@payloadcms/richtext-lexical/client#FixedToolbarFeature": FixedToolbarFeature,
  "@payloadcms/next/rsc#CollectionCards": CollectionCards,
  "@payloadcms/storage-s3/client#S3ClientUploadHandler": S3ClientUploadHandler,
}
