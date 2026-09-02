'use server'

import { getPayload, type Migration } from 'payload'
import { buildPayloadConfig } from '@/payload.config'
import { isConfigured } from '@/lib/is-configured'
import { createAppRecord, findUserIdByEmail } from '../lib/create-app-record'
import { describeDbError } from '../lib/status'
import { envDbCredentials, openDb, type DbCredentials } from '../lib/db'
import { migrations } from '@/migrations'

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }

/**
 * Where the database credentials come from. `env` means this deployment already
 * has them, so they are read server-side — `DATABASE_AUTH_TOKEN` is never sent
 * to the browser and so cannot be sent back.
 */
export type DatabaseSource =
  | { source: 'env' }
  | { source: 'input'; url: string; authToken?: string }

export type SetupInput = {
  database: DatabaseSource
  appName: string
  email: string
  password: string
}

/**
 * A throwaway secret for the wizard's Payload instance. Password hashes do not
 * depend on it — Payload stores a salt and hash on the user row — so the account
 * created here still works once the real PAYLOAD_SECRET is in place.
 */
const TRANSIENT_SECRET = 'chai-setup-transient-secret'

/** Whether the database already has the core tables, i.e. schema work is done. */
async function hasCoreTables(credentials: { url: string; authToken?: string }): Promise<boolean> {
  const client = openDb(credentials)
  try {
    const result = await client.execute(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('users', 'apps')",
    )
    return result.rows.length === 2
  } finally {
    client.close()
  }
}

/** Resolve the credentials setup should run against, or an error to show. */
function resolveCredentials(
  database: DatabaseSource,
): { ok: true; credentials: DbCredentials } | { ok: false; error: string } {
  if (database.source === 'env') {
    const credentials = envDbCredentials()
    if (!credentials) {
      return {
        ok: false,
        error: 'The database settings on this deployment are no longer available. Reload and try again.',
      }
    }
    return { ok: true, credentials }
  }

  if (!database.url) return { ok: false, error: 'Enter a database URL.' }
  return { ok: true, credentials: { url: database.url, authToken: database.authToken } }
}

/** Reject setup requests on a deployment that is already configured. */
function guard(): string | null {
  return isConfigured()
    ? 'This site is already set up. Remove its environment variables before running setup again.'
    : null
}

/** Verify the database credentials the user pasted, before they go any further. */
export async function testConnection(credentials: {
  url: string
  authToken?: string
}): Promise<ActionResult<{ message: string }>> {
  const blocked = guard()
  if (blocked) return { ok: false, error: blocked }

  if (!credentials.url) return { ok: false, error: 'Enter a database URL.' }

  const client = openDb(credentials)
  try {
    await client.execute('SELECT 1')
    return { ok: true, data: { message: 'Connected to your database.' } }
  } catch (error) {
    return { ok: false, error: describeDbError(error, { hadToken: Boolean(credentials.authToken) }) }
  } finally {
    client.close()
  }
}

/**
 * Create the site: migrate the database, create (or reuse) the admin account,
 * then seed the app record. This mirrors `chaibuilder-app create` in the CLI, so
 * the resulting database is the same either way.
 *
 * Credentials either arrive with the request and are never persisted — the user
 * copies them into their host's environment variables at the end of the wizard —
 * or already exist on the deployment, in which case they are read server-side.
 */
export async function runSetup(input: SetupInput): Promise<ActionResult<{ appId: string }>> {
  const blocked = guard()
  if (blocked) return { ok: false, error: blocked }

  const appName = input.appName.trim()
  const email = input.email.trim().toLowerCase()

  const resolved = resolveCredentials(input.database)
  if (!resolved.ok) return { ok: false, error: resolved.error }
  const credentials = resolved.credentials
  const hadToken = Boolean(credentials.authToken)

  if (!appName) return { ok: false, error: 'Enter a name for your site.' }
  if (!email) return { ok: false, error: 'Enter an email address.' }
  if (!email.includes('@')) return { ok: false, error: 'That does not look like an email address.' }
  if (!input.password || input.password.length < 4) {
    return { ok: false, error: 'Password must be at least 4 characters.' }
  }

  let payload: Awaited<ReturnType<typeof getPayload>>
  try {
    payload = await getPayload({
      config: buildPayloadConfig({
        database: credentials,
        secret: TRANSIENT_SECRET,
      }),
      // `getPayload` caches instances by key. The wizard connects to a database
      // that is not in the environment, so it must not take over the default
      // instance — key it by target database instead.
      key: `setup:${credentials.url}`,
    })
  } catch (error) {
    return { ok: false, error: describeDbError(error, { hadToken }) }
  }

  try {
    if (await hasCoreTables(credentials)) {
      // Schema is already there — a database reused from local development, or
      // a second run of setup. Migrating anyway risks Payload's interactive
      // "data loss will occur" prompt, which nothing can answer here.
      payload.logger.info('Setup: database already has tables, skipping migration.')
    } else {
      // Pass the migrations explicitly: the default path reads migration files
      // from disk, which is not reliable inside a bundled serverless deployment.
      // The cast bridges Payload's `(args: unknown)` migration signature and the
      // typed arguments its own generator emits.
      await payload.db.migrate({ migrations: migrations as unknown as Migration[] })
    }
  } catch (error) {
    return {
      ok: false,
      error: `Could not create the database tables: ${describeDbError(error, { hadToken })}`,
    }
  }

  // Reuse an existing account when the email is already taken, matching the
  // CLI's behaviour — but only when the password proves ownership.
  let userId: string
  try {
    const client = openDb(credentials)
    let existingId: string | null = null
    try {
      existingId = await findUserIdByEmail(client, email)
    } finally {
      client.close()
    }

    if (existingId) {
      try {
        await payload.login({
          collection: 'users',
          data: { email, password: input.password },
        })
      } catch {
        return {
          ok: false,
          error:
            'An account with that email already exists in this database, and the password does not match. Use the existing password, or a different email.',
        }
      }
      userId = existingId
    } else {
      const created = await payload.create({
        collection: 'users',
        data: { email, password: input.password },
      })
      userId = String(created.id)
    }
  } catch (error) {
    return { ok: false, error: `Could not create the admin account: ${describeDbError(error, { hadToken })}` }
  }

  const client = openDb(credentials)
  try {
    // Always a new site, even when the database already holds others: one
    // database is meant to carry any number of them, each identified by its own
    // CHAIBUILDER_APP_KEY. Setup only runs on a deployment that has no key yet,
    // so reaching here means the user is asking for a site they do not have.
    const { appId } = await createAppRecord(client, { appName, userId })
    return { ok: true, data: { appId } }
  } catch (error) {
    return { ok: false, error: `Could not create your site: ${describeDbError(error, { hadToken })}` }
  } finally {
    client.close()
  }
}
