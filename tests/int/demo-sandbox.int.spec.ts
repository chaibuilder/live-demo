import { createClient } from '@libsql/client'
import { describe, expect, it } from 'vitest'
import { signSandboxCookie, verifySandboxCookie } from '@/lib/demo-sandbox/cookie'
import { findExpiredSandboxes, purgeSandboxes } from '@/lib/demo-sandbox/sweep'

const SECRET = 'test-secret'
const now = Math.floor(Date.now() / 1000)

describe('sandbox cookie', () => {
  it('round-trips a signed cookie', async () => {
    const cookie = await signSandboxCookie('app-1', now + 600, SECRET)
    expect(await verifySandboxCookie(cookie, SECRET)).toBe('app-1')
  })

  it('rejects an expired cookie', async () => {
    const cookie = await signSandboxCookie('app-1', now - 1, SECRET)
    expect(await verifySandboxCookie(cookie, SECRET)).toBeNull()
  })

  it('rejects tampering with the app id or expiry', async () => {
    const cookie = await signSandboxCookie('app-1', now + 600, SECRET)
    const [, expires, sig] = cookie.split('.')
    expect(await verifySandboxCookie(`app-2.${expires}.${sig}`, SECRET)).toBeNull()
    expect(await verifySandboxCookie(`app-1.${Number(expires) + 9999}.${sig}`, SECRET)).toBeNull()
  })

  it('rejects a cookie signed with a different secret', async () => {
    const cookie = await signSandboxCookie('app-1', now + 600, 'other-secret')
    expect(await verifySandboxCookie(cookie, SECRET)).toBeNull()
  })

  it('rejects malformed values without throwing', async () => {
    for (const value of [undefined, '', 'a.b', 'a.b.c.d', 'app-1.not-a-number.sig']) {
      expect(await verifySandboxCookie(value, SECRET)).toBeNull()
    }
  })
})

describe('sandbox sweep', () => {
  const setupDb = async () => {
    const client = createClient({ url: ':memory:' })
    await client.execute(
      `CREATE TABLE apps (id TEXT PRIMARY KEY, name TEXT, createdAt TEXT DEFAULT (datetime('now')))`,
    )
    await client.execute(`CREATE TABLE apps_online (id TEXT PRIMARY KEY, name TEXT)`)
    await client.execute(`CREATE TABLE app_pages (id TEXT PRIMARY KEY, app TEXT, slug TEXT)`)
    await client.execute(`CREATE TABLE app_users (id TEXT PRIMARY KEY, app TEXT, user TEXT)`)
    // App-scoped table the code has never heard of — runtime discovery must catch it.
    await client.execute(`CREATE TABLE custom_widgets (id TEXT PRIMARY KEY, app TEXT)`)
    return client
  }

  const seedApp = async (client: Awaited<ReturnType<typeof setupDb>>, id: string, ageSeconds: number) => {
    await client.execute({
      sql: `INSERT INTO apps (id, name, createdAt) VALUES (?, ?, datetime('now', ?))`,
      args: [id, id, `-${ageSeconds} seconds`],
    })
    await client.execute({ sql: `INSERT INTO apps_online (id, name) VALUES (?, ?)`, args: [id, id] })
    await client.execute({ sql: `INSERT INTO app_pages (id, app, slug) VALUES (?, ?, '/')`, args: [`p-${id}`, id] })
    await client.execute({ sql: `INSERT INTO app_users (id, app, user) VALUES (?, ?, 'u1')`, args: [`m-${id}`, id] })
    await client.execute({ sql: `INSERT INTO custom_widgets (id, app) VALUES (?, ?)`, args: [`w-${id}`, id] })
  }

  it('finds only sandboxes past the TTL and never the showcase app', async () => {
    process.env.CHAIBUILDER_APP_KEY = 'showcase'
    const client = await setupDb()
    await seedApp(client, 'showcase', 100 * 60 * 60)
    await seedApp(client, 'old-sandbox', 7 * 60 * 60)
    await seedApp(client, 'fresh-sandbox', 60)

    expect(await findExpiredSandboxes(client)).toEqual(['old-sandbox'])
  })

  it('purges every app-scoped row, including tables discovered at runtime', async () => {
    process.env.CHAIBUILDER_APP_KEY = 'showcase'
    const client = await setupDb()
    await seedApp(client, 'showcase', 100 * 60 * 60)
    await seedApp(client, 'old-sandbox', 7 * 60 * 60)

    const { purgedApps } = await purgeSandboxes(client, ['old-sandbox'])
    expect(purgedApps).toEqual(['old-sandbox'])

    for (const table of ['apps', 'apps_online']) {
      const rows = await client.execute(`SELECT id FROM ${table}`)
      expect(rows.rows.map((r) => r.id)).toEqual(['showcase'])
    }
    for (const table of ['app_pages', 'app_users', 'custom_widgets']) {
      const rows = await client.execute(`SELECT app FROM ${table}`)
      expect(rows.rows.map((r) => r.app)).toEqual(['showcase'])
    }
  })

  it('is a no-op for an empty id list', async () => {
    const client = await setupDb()
    await seedApp(client, 'showcase', 100)
    expect((await purgeSandboxes(client, [])).purgedApps).toEqual([])
    expect((await client.execute('SELECT count(*) AS n FROM apps')).rows[0].n).toBe(1)
  })
})
