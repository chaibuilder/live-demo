// @vitest-environment node
import { existsSync, rmSync } from 'node:fs'
import path from 'node:path'
import type { Migration } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { openDb } from '@/app/(setup)/lib/db'
import { createAppRecord, findUserIdByEmail } from '@/app/(setup)/lib/create-app-record'
import { DEFAULT_APP_THEME, DEFAULT_BLOCKS, getDefaultHomeSeo } from '@/app/(setup)/lib/defaults'

/**
 * Exercises the database work the `/setup` wizard performs, against a scratch
 * SQLite file. The wizard itself runs these through a server action; the value
 * here is proving the seeded rows match what the CLI produces, since the two
 * paths must create indistinguishable sites.
 */
const DB_FILE = path.resolve(process.cwd(), '.test.setup-wizard.db')
const DB_URL = `file:${DB_FILE}`

function cleanup() {
  for (const suffix of ['', '-wal', '-shm']) {
    const file = `${DB_FILE}${suffix}`
    if (existsSync(file)) rmSync(file)
  }
}

describe('setup wizard seeding', () => {
  let restorePush: (() => void) | undefined

  beforeAll(cleanup)
  afterAll(() => {
    restorePush?.()
    cleanup()
  })

  it('migrates a fresh database, creates the admin, and seeds the app', async () => {
    // Setup runs against a production-shaped database: schema comes from
    // migrations, not from Drizzle push (which the shared test setup enables).
    // Restored afterwards so it cannot change how later suites build their schema.
    const previousPush = process.env.PAYLOAD_DB_PUSH
    process.env.PAYLOAD_DB_PUSH = 'false'
    restorePush = () => {
      if (previousPush === undefined) delete process.env.PAYLOAD_DB_PUSH
      else process.env.PAYLOAD_DB_PUSH = previousPush
    }

    const { getPayload } = await import('payload')
    const { buildPayloadConfig } = await import('@/payload.config')

    const payload = await getPayload({
      config: buildPayloadConfig({
        database: { url: DB_URL },
        secret: 'test-transient-secret',
      }),
      key: `setup-test:${DB_URL}`,
    })

    const { migrations } = await import('@/migrations')
    // Same cast as the setup action: Payload types migrations as `(args: unknown)`
    // while its own generator emits typed arguments.
    await payload.db.migrate({ migrations: migrations as unknown as Migration[] })

    const client = openDb({ url: DB_URL })
    try {
      const tables = await client.execute(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('apps', 'apps_online', 'app_users', 'app_pages', 'app_pages_online', 'users', 'payload_migrations')",
      )
      const names = new Set(tables.rows.map((row) => String(row.name)))
      for (const table of [
        'apps',
        'apps_online',
        'app_users',
        'app_pages',
        'app_pages_online',
        'users',
        'payload_migrations',
      ]) {
        expect(names.has(table), `expected table ${table}`).toBe(true)
      }

      const created = await payload.create({
        collection: 'users',
        data: { email: 'owner@example.com', password: 'test1234' },
      })
      const userId = String(created.id)
      expect(await findUserIdByEmail(client, 'owner@example.com')).toBe(userId)

      // The created account must be able to sign in with the chosen password.
      await expect(
        payload.login({
          collection: 'users',
          data: { email: 'owner@example.com', password: 'test1234' },
        }),
      ).resolves.toBeTruthy()

      const { appId } = await createAppRecord(client, { appName: 'Test Site', userId })
      expect(appId).toMatch(/^[0-9a-f-]{36}$/)

      const app = await client.execute({
        sql: 'SELECT id, name, user, theme, fallbackLang FROM apps WHERE id = ?',
        args: [appId],
      })
      expect(app.rows).toHaveLength(1)
      expect(String(app.rows[0].name)).toBe('Test Site')
      expect(String(app.rows[0].user)).toBe(userId)
      expect(String(app.rows[0].fallbackLang)).toBe('en')
      expect(JSON.parse(String(app.rows[0].theme))).toEqual(JSON.parse(JSON.stringify(DEFAULT_APP_THEME)))

      const online = await client.execute({
        sql: 'SELECT id FROM apps_online WHERE id = ?',
        args: [appId],
      })
      expect(online.rows).toHaveLength(1)

      // The app_users row is what grants admin rights; without it the account
      // exists but cannot enter the admin panel.
      const membership = await client.execute({
        sql: 'SELECT role, permissions FROM app_users WHERE app = ? AND user = ?',
        args: [appId, userId],
      })
      expect(membership.rows).toHaveLength(1)
      expect(String(membership.rows[0].role)).toBe('admin')
      expect(JSON.parse(String(membership.rows[0].permissions))).toEqual(['*'])

      const page = await client.execute({
        sql: 'SELECT id, slug, name, pageType, seo, blocks FROM app_pages WHERE app = ?',
        args: [appId],
      })
      expect(page.rows).toHaveLength(1)
      expect(String(page.rows[0].slug)).toBe('/')
      expect(String(page.rows[0].name)).toBe('Home')
      expect(String(page.rows[0].pageType)).toBe('page')
      expect(JSON.parse(String(page.rows[0].seo))).toEqual(getDefaultHomeSeo('Test Site'))
      expect(JSON.parse(String(page.rows[0].blocks))).toEqual(
        JSON.parse(JSON.stringify(DEFAULT_BLOCKS)),
      )

      const publishedPage = await client.execute({
        sql: 'SELECT id FROM app_pages_online WHERE app = ?',
        args: [appId],
      })
      expect(publishedPage.rows).toHaveLength(1)
      expect(String(publishedPage.rows[0].id)).toBe(String(page.rows[0].id))
    } finally {
      client.close()
    }
  }, 120_000)

  /**
   * One database is meant to carry any number of sites, each identified by its
   * own `CHAIBUILDER_APP_KEY`. Running setup against a database that already
   * holds a site therefore has to add another one, not hand back the first.
   */
  it('adds a second site to a database that already has one', async () => {
    const client = openDb({ url: DB_URL })
    try {
      const before = await client.execute('SELECT id, name FROM apps')
      expect(before.rows).toHaveLength(1)
      const firstId = String(before.rows[0].id)

      const userId = await findUserIdByEmail(client, 'owner@example.com')
      expect(userId).not.toBeNull()

      const { appId: secondId } = await createAppRecord(client, {
        appName: 'Second Site',
        userId: userId!,
      })
      expect(secondId).not.toBe(firstId)

      const after = await client.execute('SELECT id, name FROM apps ORDER BY name')
      expect(after.rows.map((r) => String(r.name))).toEqual(['Second Site', 'Test Site'])

      // The first site keeps its own name, home page and membership: the new
      // one is alongside it, not on top of it.
      const firstStill = await client.execute({
        sql: 'SELECT name FROM apps WHERE id = ?',
        args: [firstId],
      })
      expect(String(firstStill.rows[0].name)).toBe('Test Site')

      for (const [id, name] of [
        [firstId, 'Test Site'],
        [secondId, 'Second Site'],
      ]) {
        const pages = await client.execute({
          sql: 'SELECT slug FROM app_pages WHERE app = ?',
          args: [id],
        })
        expect(pages.rows.map((r) => String(r.slug)), `home page for ${name}`).toEqual(['/'])

        const membership = await client.execute({
          sql: 'SELECT role FROM app_users WHERE app = ? AND user = ?',
          args: [id, userId!],
        })
        expect(membership.rows.map((r) => String(r.role)), `admin of ${name}`).toEqual(['admin'])
      }
    } finally {
      client.close()
    }
  }, 60_000)
})
