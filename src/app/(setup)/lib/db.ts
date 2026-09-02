import { createClient } from '@libsql/client'

export type LibsqlClient = ReturnType<typeof createClient>

export type DbCredentials = { url: string; authToken?: string }

/**
 * Raw libSQL client, used by setup and the status page.
 *
 * Deliberately independent of Payload: status checks have to work even when
 * Payload itself cannot boot (unmigrated schema, missing secret), and the wizard
 * connects with credentials that are not yet in the environment.
 */
export function openDb(credentials: DbCredentials): LibsqlClient {
  return createClient({ url: credentials.url, authToken: credentials.authToken || undefined })
}

/** Credentials from the environment; null when the deployment has no database yet. */
export function envDbCredentials(): DbCredentials | null {
  const url = process.env.DATABASE_URL
  if (!url) return null
  return { url, authToken: process.env.DATABASE_AUTH_TOKEN || undefined }
}
