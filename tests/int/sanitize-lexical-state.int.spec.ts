import { describe, expect, it } from 'vitest'
import { defaultRichTextValue } from '@payloadcms/richtext-lexical'
import { sanitizeLexicalState } from '../../src/fields/sanitizeLexicalState'

describe('sanitizeLexicalState', () => {
  it('returns null/undefined unchanged', () => {
    expect(sanitizeLexicalState(null)).toBeNull()
    expect(sanitizeLexicalState(undefined)).toBeUndefined()
  })

  it('replaces non-lexical values with default editor state', () => {
    expect(sanitizeLexicalState('bad')).toEqual(defaultRichTextValue)
    expect(sanitizeLexicalState({})).toEqual(defaultRichTextValue)
  })

  it('drops child nodes missing type', () => {
    const corrupt = {
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [{ detail: 0, format: 0, mode: 'normal', style: '', text: 'ok', version: 1 }],
            direction: null,
            format: '',
            indent: 0,
            textFormat: 0,
            textStyle: '',
            version: 1,
          },
        ],
        direction: null,
        format: '',
        indent: 0,
        version: 1,
      },
    }

    const sanitized = sanitizeLexicalState(corrupt)
    expect(sanitized?.root.children).toHaveLength(1)
    expect(
      (sanitized?.root.children[0] as unknown as { children: unknown[] }).children,
    ).toHaveLength(0)
  })

  it('returns default state when root is invalid', () => {
    expect(
      sanitizeLexicalState({
        root: {
          children: [],
        },
      }),
    ).toEqual(defaultRichTextValue)
  })
})
