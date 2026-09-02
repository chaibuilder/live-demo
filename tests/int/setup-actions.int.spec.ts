// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { runSetup, testConnection } from '@/app/(setup)/setup/actions'

/**
 * Server-side validation for the wizard's merged first step.
 *
 * The client validates the same rules, but it is the only thing between a
 * malformed request and Payload: these all have to reject before the action
 * boots an instance, which is why they are cheap enough to test directly.
 */
const DB = { source: 'input', url: 'file:./.test.payload.db' } as const
const VALID = { appName: 'Test Site', email: 'owner@example.com', password: 'secret' }

describe('runSetup validation', () => {
  it('rejects a missing site name', async () => {
    const result = await runSetup({ database: DB, ...VALID, appName: '   ' })
    expect(result).toEqual({ ok: false, error: 'Enter a name for your site.' })
  })

  it('rejects a missing email', async () => {
    const result = await runSetup({ database: DB, ...VALID, email: '' })
    expect(result).toEqual({ ok: false, error: 'Enter an email address.' })
  })

  it('rejects an email with no @', async () => {
    const result = await runSetup({ database: DB, ...VALID, email: 'owner.example.com' })
    expect(result).toEqual({ ok: false, error: 'That does not look like an email address.' })
  })

  it('rejects a password shorter than 4 characters', async () => {
    const result = await runSetup({ database: DB, ...VALID, password: 'abc' })
    expect(result).toEqual({ ok: false, error: 'Password must be at least 4 characters.' })
  })

  it('rejects a missing database URL', async () => {
    const result = await runSetup({
      database: { source: 'input', url: '' },
      ...VALID,
    })
    expect(result).toEqual({ ok: false, error: 'Enter a database URL.' })
  })
})

describe('testConnection', () => {
  it('rejects an empty URL without opening a client', async () => {
    expect(await testConnection({ url: '' })).toEqual({ ok: false, error: 'Enter a database URL.' })
  })

  it('connects to a reachable database', async () => {
    const result = await testConnection({ url: 'file:./.test.payload.db' })
    expect(result.ok).toBe(true)
  })
})
