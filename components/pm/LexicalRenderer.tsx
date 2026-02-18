/* Recursive Lexical JSON → React renderer for Meridian PM pages.
   Handles: heading, paragraph, list (ul/ol), listitem, text, linebreak.
   Ignores unknown node types gracefully. */

import React from 'react'

interface LexicalNode {
  type: string
  tag?: string
  text?: string
  format?: number | string
  children?: LexicalNode[]
  listType?: string
  value?: number
  direction?: string
  indent?: number
  mode?: string
  style?: string
  version?: number
  [key: string]: any
}

interface LexicalRoot {
  root?: {
    children?: LexicalNode[]
    [key: string]: any
  }
}

const IS_BOLD = 1
const IS_ITALIC = 2
const IS_STRIKETHROUGH = 4
const IS_UNDERLINE = 8
const IS_CODE = 16

function renderTextNode(node: LexicalNode, i: number): React.ReactNode {
  if (node.type === 'linebreak') return <br key={i} />
  if (node.type !== 'text' || !node.text) return null

  const fmt = typeof node.format === 'number' ? node.format : 0
  let el: React.ReactNode = node.text

  if (fmt & IS_CODE) {
    el = (
      <code
        key={i}
        className="font-mono"
        style={{
          fontSize: 13, color: '#F5B74D',
          background: 'rgba(245,183,77,0.12)',
          padding: '1px 6px', borderRadius: 4,
        }}
      >
        {el}
      </code>
    )
    return el
  }
  if (fmt & IS_BOLD) el = <strong key={`b-${i}`}>{el}</strong>
  if (fmt & IS_ITALIC) el = <em key={`i-${i}`}>{el}</em>
  if (fmt & IS_UNDERLINE) el = <u key={`u-${i}`}>{el}</u>
  if (fmt & IS_STRIKETHROUGH) el = <s key={`s-${i}`}>{el}</s>

  return <React.Fragment key={i}>{el}</React.Fragment>
}

function renderChildren(children?: LexicalNode[]): React.ReactNode {
  if (!children) return null
  return children.map((child, i) => {
    if (child.type === 'text' || child.type === 'linebreak') {
      return renderTextNode(child, i)
    }
    return renderNode(child, i)
  })
}

function renderNode(node: LexicalNode, i: number): React.ReactNode {
  switch (node.type) {
    case 'heading': {
      const Tag = (node.tag || 'h2') as keyof React.JSX.IntrinsicElements
      return (
        <Tag
          key={i}
          className="font-display font-semibold text-[#F1F5F9]"
          style={{
            fontSize: node.tag === 'h2' ? 18 : node.tag === 'h3' ? 16 : 14,
            margin: '16px 0 8px',
          }}
        >
          {renderChildren(node.children)}
        </Tag>
      )
    }

    case 'paragraph':
      return (
        <p
          key={i}
          className="font-body"
          style={{
            fontSize: 14, color: '#94A3B8', lineHeight: 1.7,
            margin: '0 0 8px',
          }}
        >
          {renderChildren(node.children)}
        </p>
      )

    case 'list': {
      const Tag = node.listType === 'number' ? 'ol' : 'ul'
      return (
        <Tag
          key={i}
          style={{
            margin: '0 0 8px', paddingLeft: 20,
            listStyleType: node.listType === 'number' ? 'decimal' : 'disc',
          }}
        >
          {renderChildren(node.children)}
        </Tag>
      )
    }

    case 'listitem':
      return (
        <li
          key={i}
          className="font-body"
          style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.7, marginBottom: 4 }}
        >
          {renderChildren(node.children)}
        </li>
      )

    case 'text':
    case 'linebreak':
      return renderTextNode(node, i)

    default:
      if (node.children) return <React.Fragment key={i}>{renderChildren(node.children)}</React.Fragment>
      return null
  }
}

export function LexicalContent({ content }: { content: LexicalRoot | null | undefined }) {
  if (!content?.root?.children?.length) {
    return <p className="font-body text-sm text-[#64748B]">No content</p>
  }
  return <>{content.root.children.map((node, i) => renderNode(node, i))}</>
}

export interface ContentSection {
  title: string
  nodes: LexicalNode[]
}

export function splitContentSections(content: LexicalRoot | null | undefined): ContentSection[] {
  if (!content?.root?.children?.length) return []

  const sections: ContentSection[] = []
  let current: ContentSection | null = null

  for (const node of content.root.children) {
    if (node.type === 'heading' && node.tag === 'h2') {
      const title = (node.children || [])
        .filter((c: LexicalNode) => c.type === 'text')
        .map((c: LexicalNode) => c.text || '')
        .join('')

      current = { title, nodes: [] }
      sections.push(current)
    } else if (current) {
      current.nodes.push(node)
    } else {
      if (!sections.length || sections[0].title !== '') {
        current = { title: '', nodes: [node] }
        sections.unshift(current)
      } else {
        sections[0].nodes.push(node)
      }
    }
  }

  return sections
}

export function LexicalNodes({ nodes }: { nodes: LexicalNode[] }) {
  if (!nodes.length) return <p className="font-body text-sm text-[#64748B]">No content</p>
  return <>{nodes.map((node, i) => renderNode(node, i))}</>
}

export interface ACItem {
  text: string
  done: boolean
}

export function extractACItems(content: LexicalRoot | null | undefined): ACItem[] {
  if (!content?.root?.children?.length) return []
  const items: ACItem[] = []

  function walkList(nodes: LexicalNode[]) {
    for (const node of nodes) {
      if (node.type === 'listitem') {
        const text = (node.children || [])
          .filter((c: LexicalNode) => c.type === 'text')
          .map((c: LexicalNode) => c.text || '')
          .join('')
          .trim()
        if (text) {
          const done = text.startsWith('[x]') || text.startsWith('[X]')
          const cleanText = text.replace(/^\[[ xX]\]\s*/, '')
          items.push({ done, text: cleanText })
        }
      } else if (node.children) {
        walkList(node.children)
      }
    }
  }

  walkList(content.root.children)
  return items
}
