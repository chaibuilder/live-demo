// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { envBlock, envLine } from '@/app/(setup)/lib/env-lines'

/**
 * The wizard's success screen and the optional media/AI forms both build their
 * blocks from these, and both are pasted straight into a host's environment
 * settings — where a stray newline silently becomes a second, bogus variable.
 */
describe('envLine', () => {
  it('formats a KEY=value pair', () => {
    expect(envLine('PAYLOAD_SECRET', 'abc123')).toBe('PAYLOAD_SECRET=abc123')
  })

  it('collapses line breaks in a pasted value', () => {
    expect(envLine('DATABASE_AUTH_TOKEN', 'ey.Jh\r\nbGci')).toBe('DATABASE_AUTH_TOKEN=ey.Jh bGci')
  })

  it('trims surrounding whitespace', () => {
    expect(envLine('BUCKET_NAME', '  my-media  ')).toBe('BUCKET_NAME=my-media')
  })
})

describe('envBlock', () => {
  it('joins lines with newlines so hosts split them into variables', () => {
    expect(envBlock([envLine('A', '1'), envLine('B', '2')])).toBe('A=1\nB=2')
  })
})
