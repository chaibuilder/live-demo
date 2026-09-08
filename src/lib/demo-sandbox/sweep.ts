import type { Payload } from 'payload'
import type { LibsqlClient } from '@/app/(setup)/lib/db'
import { SANDBOX_TTL_SECONDS, showcaseAppId } from './constants'

/**
 * Payload-owned collections are deleted through the Payload API so version rows
 * and stored files go with them; everything else app-scoped is swept by SQL.
 */
const PAYLOAD_APP_COLLECTIONS = ['media', 'blog', 'blog-categories', 'form-submissions', 'site-config'] as const

export type SweepResult = { purgedApps: string[] }

/** Sandbox app ids older than the TTL. The showcase app is never eligible. */
export async function findExpiredSandboxes(client: LibsqlClient): Promise<string[]> {
  const showcase = showcaseAppId()
  const result = await client.execute({
    sql: `SELECT id FROM apps WHERE id != ? AND createdAt < datetime('now', ?)`,
    args: [showcase ?? '', `-${SANDBOX_TTL_SECONDS} seconds`],
  })
  return result.rows.map((row) => String(row.id))
}

/** Every table carrying an `app` column, discovered at runtime so schema drift can't orphan rows. */
async function appScopedTables(client: LibsqlClient): Promise<string[]> {
  const tables = await client.execute(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`,
  )
  const scoped: string[] = []
  for (const row of tables.rows) {
    const name = String(row.name)
    if (name === 'apps' || name === 'apps_online') continue
    const cols = await client.execute(`PRAGMA table_info("${name}")`)
    if (cols.rows.some((c) => String(c.name) === 'app')) scoped.push(name)
  }
  return scoped
}

export async function purgeSandboxes(
  client: LibsqlClient,
  appIds: string[],
  payload?: Payload,
): Promise<SweepResult> {
  if (appIds.length === 0) return { purgedApps: [] }

  if (payload) {
    for (const collection of PAYLOAD_APP_COLLECTIONS) {
      try {
        await payload.delete({
          collection: collection as never,
          where: { app: { in: appIds } },
          overrideAccess: true,
        })
      } catch {
        // Missing collection or field: the SQL pass below still removes the rows.
      }
    }
  }

  const placeholders = appIds.map(() => '?').join(',')
  for (const table of await appScopedTables(client)) {
    await client.execute({
      sql: `DELETE FROM "${table}" WHERE app IN (${placeholders})`,
      args: appIds,
    })
  }
  await client.execute({ sql: `DELETE FROM apps_online WHERE id IN (${placeholders})`, args: appIds })
  await client.execute({ sql: `DELETE FROM apps WHERE id IN (${placeholders})`, args: appIds })

  return { purgedApps: appIds }
}

export async function sweepExpiredSandboxes(client: LibsqlClient, payload?: Payload): Promise<SweepResult> {
  return purgeSandboxes(client, await findExpiredSandboxes(client), payload)
}
