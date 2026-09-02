import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { copyText } from '@/app/(setup)/setup/copy-text'

/**
 * The success screen copies the generated secrets and opens the host's
 * dashboard in the same click. The new tab takes focus straight away, and
 * `navigator.clipboard.writeText` refuses to run in a document that has lost
 * focus — so the copy has to be finished synchronously, before the navigation.
 * These tests pin that ordering: the async API is a fallback, never the path
 * taken when the synchronous one works.
 */
describe('copyText', () => {
  let writeText: ReturnType<typeof vi.fn>

  beforeEach(() => {
    writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('copies synchronously and never reaches for the async API', () => {
    const exec = vi.fn().mockReturnValue(true)
    document.execCommand = exec

    expect(copyText('A=1\nB=2')).toBe(true)
    expect(exec).toHaveBeenCalledWith('copy')
    expect(writeText).not.toHaveBeenCalled()
  })

  it('selects the whole text before copying', () => {
    let selected: string | undefined
    document.execCommand = vi.fn(() => {
      // Whatever is focused at this moment is what the browser will copy.
      const field = document.activeElement as HTMLTextAreaElement
      selected = field?.value?.slice(field.selectionStart ?? 0, field.selectionEnd ?? 0)
      return true
    })

    copyText('PAYLOAD_SECRET=abc\nCHAIBUILDER_APP_KEY=def')

    expect(selected).toBe('PAYLOAD_SECRET=abc\nCHAIBUILDER_APP_KEY=def')
  })

  it('falls back to the async API when the synchronous copy fails', () => {
    document.execCommand = vi.fn().mockReturnValue(false)

    expect(copyText('A=1')).toBe(false)
    expect(writeText).toHaveBeenCalledWith('A=1')
  })

  it('falls back when the synchronous copy throws', () => {
    document.execCommand = vi.fn(() => {
      throw new Error('unsupported')
    })

    expect(copyText('A=1')).toBe(false)
    expect(writeText).toHaveBeenCalledWith('A=1')
  })

  it('leaves no scratch element behind, whichever path ran', () => {
    document.execCommand = vi.fn().mockReturnValue(true)
    copyText('A=1')
    expect(document.querySelectorAll('textarea')).toHaveLength(0)

    document.execCommand = vi.fn().mockReturnValue(false)
    copyText('A=1')
    expect(document.querySelectorAll('textarea')).toHaveLength(0)
  })

  it('gives focus back to whatever had it', () => {
    document.execCommand = vi.fn().mockReturnValue(true)
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    copyText('A=1')

    expect(document.activeElement).toBe(input)
  })
})
