import { defaultRichTextValue } from '@payloadcms/richtext-lexical'
import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'

const isLexicalEditorState = (value: unknown): value is SerializedEditorState => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false

  const root = (value as { root?: unknown }).root
  return !!root && typeof root === 'object' && !Array.isArray(root)
}

const sanitizeLexicalNode = (node: unknown): SerializedLexicalNode | null => {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return null

  const typedNode = node as SerializedLexicalNode & { children?: unknown[] }
  if (typeof typedNode.type !== 'string' || !typedNode.type) return null

  if (!Array.isArray(typedNode.children)) {
    return typedNode
  }

  const children = typedNode.children
    .map(sanitizeLexicalNode)
    .filter((child): child is SerializedLexicalNode => child !== null)

  return {
    ...typedNode,
    children,
  } as SerializedLexicalNode
}

export const sanitizeLexicalState = (value: unknown): SerializedEditorState | null | undefined => {
  if (value == null) return value as null | undefined
  if (!isLexicalEditorState(value)) return defaultRichTextValue

  const sanitizedRoot = sanitizeLexicalNode(value.root)
  if (!sanitizedRoot || sanitizedRoot.type !== 'root') {
    return defaultRichTextValue
  }

  return {
    root: sanitizedRoot as SerializedEditorState['root'],
  }
}
