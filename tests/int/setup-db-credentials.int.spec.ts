// @vitest-environment node
import http from 'node:http'
import { afterEach, describe, expect, it } from 'vitest'
import { describeDbError } from '@/app/(setup)/lib/status'
import { openDb } from '@/app/(setup)/lib/db'
import { resolveDatabase } from '@/payload.config'

/**
 * Covers two bugs that together made "leave the token empty" fail with a
 * misleading authentication error.
 */
describe('setup database credentials', () => {
  const originalUrl = process.env.DATABASE_URL
  const originalToken = process.env.DATABASE_AUTH_TOKEN

  afterEach(() => {
    process.env.DATABASE_URL = originalUrl
    process.env.DATABASE_AUTH_TOKEN = originalToken
  })

  it('does not lend the deployment token to a different database', () => {
    process.env.DATABASE_URL = 'file:/tmp/deployment.db'
    process.env.DATABASE_AUTH_TOKEN = 'DEPLOYMENT-TOKEN'

    // A URL typed into the wizard, with the token field left blank.
    const typed = resolveDatabase({ url: 'libsql://somewhere-else.turso.io' })
    expect(typed.url).toBe('libsql://somewhere-else.turso.io')
    expect(typed.authToken).toBeUndefined()

    // With no override at all the environment is still used as a pair.
    const fromEnv = resolveDatabase()
    expect(fromEnv.url).toBe('file:/tmp/deployment.db')
    expect(fromEnv.authToken).toBe('DEPLOYMENT-TOKEN')
  })

  it('distinguishes a missing token from a rejected one', async () => {
    // A hosted database answers both cases with the same 401, so only the caller
    // knows whether a token was actually supplied.
    const server = http.createServer((_req, res) => {
      res.writeHead(401)
      res.end('{}')
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
    const url = `http://127.0.0.1:${(server.address() as { port: number }).port}`

    const messages: Record<string, string> = {}
    for (const [label, authToken] of [
      ['missing', undefined],
      ['rejected', 'a-token'],
    ] as const) {
      const client = openDb({ url, authToken })
      try {
        await client.execute('SELECT 1')
        throw new Error('expected a 401')
      } catch (error) {
        messages[label] = describeDbError(error, { hadToken: Boolean(authToken) })
      } finally {
        client.close()
      }
    }
    server.close()

    expect(messages.missing).toContain('needs an access token')
    expect(messages.rejected).toContain('rejected the auth token')
  }, 60_000)
})
