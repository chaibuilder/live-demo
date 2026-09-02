import { envDbCredentials, openDb } from './db'

export type CheckState = 'ok' | 'warn' | 'error'

export type SetupCheck = {
  id: string
  label: string
  state: CheckState
  detail: string
}

export type SetupStatus = {
  configured: boolean
  appId: string | null
  appName: string | null
  checks: SetupCheck[]
}

/**
 * Health of a configured deployment, rendered as the `/setup` checklist.
 *
 * Every check is defensive: one failure (unreachable database, missing table)
 * must still produce a readable page, because this is the screen a user lands on
 * when something has gone wrong.
 */
export async function getSetupStatus(): Promise<SetupStatus> {
  const checks: SetupCheck[] = []
  const envAppKey = process.env.CHAIBUILDER_APP_KEY || null
  let appId: string | null = null
  let appName: string | null = null

  const credentials = envDbCredentials()
  if (!credentials) {
    checks.push({
      id: 'database',
      label: 'Database',
      state: 'error',
      detail: 'DATABASE_URL is not set on this deployment.',
    })
    return { configured: false, appId: null, appName: null, checks }
  }

  const client = openDb(credentials)
  try {
    await client.execute('SELECT 1')
    checks.push({
      id: 'database',
      label: 'Database',
      state: 'ok',
      detail: 'Connected successfully.',
    })

    const tables = await client.execute(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('apps', 'users', 'app_users', 'payload_migrations')",
    )
    const tableNames = new Set(tables.rows.map((row) => String(row.name)))
    // `app_users` matters as much as the other two: without it an account can
    // exist yet hold no admin membership, which locks the owner out.
    const schemaReady =
      tableNames.has('apps') && tableNames.has('users') && tableNames.has('app_users')
    checks.push({
      id: 'schema',
      label: 'Database tables',
      state: schemaReady ? 'ok' : 'error',
      detail: schemaReady
        ? 'All tables are present.'
        : 'Tables are missing. Re-run setup to create them.',
    })

    if (schemaReady) {
      // One database can hold any number of sites, so the deployment's own key
      // decides which row this page is reporting on — not whichever happens to
      // come back first.
      const owned = envAppKey
        ? await client.execute({
            sql: 'SELECT id, name FROM apps WHERE id = ? LIMIT 1',
            args: [envAppKey],
          })
        : null
      const match = owned?.rows[0]

      if (match) {
        appId = String(match.id)
        appName = match.name == null ? null : String(match.name)
        checks.push({
          id: 'app',
          label: 'Your site',
          state: 'ok',
          detail: appName ? `"${appName}" is ready.` : 'Ready.',
        })
      } else {
        // Either the key names a site that is not here, or there is no key to
        // go on. Two rows is enough to tell "the only site" from "one of many".
        const others = await client.execute('SELECT id, name FROM apps LIMIT 2')
        const only = others.rows.length === 1 ? others.rows[0] : null
        appId = only?.id == null ? null : String(only.id)
        appName = only?.name == null ? null : String(only.name)

        // Deliberately no ids in the text: this page is reachable by anyone who
        // can reach the site, so it reports what is wrong without ever printing
        // a value the reader could not already have.
        checks.push({
          id: 'app',
          label: 'Your site',
          state: 'error',
          detail:
            others.rows.length === 0
              ? 'No site found in the database. Re-run setup to create one.'
              : !envAppKey
                ? 'CHAIBUILDER_APP_KEY is not set, so there is no way to tell which site this deployment serves.'
                : 'CHAIBUILDER_APP_KEY does not match a site in this database. Check that you copied the whole value setup gave you, or re-run setup to create a new site.',
        })
      }

      const users = await client.execute('SELECT COUNT(*) AS count FROM users')
      const userCount = Number(users.rows[0]?.count ?? 0)
      checks.push({
        id: 'admin',
        label: 'Admin account',
        state: userCount > 0 ? 'ok' : 'error',
        detail:
          userCount > 0
            ? `${userCount} account${userCount === 1 ? '' : 's'} can sign in.`
            : 'No admin account exists. Re-run setup to create one.',
      })
    }
  } catch (error) {
    checks.push({
      id: 'database',
      label: 'Database',
      state: 'error',
      detail: describeDbError(error),
    })
  } finally {
    client.close()
  }

  const mediaConfigured = Boolean(
    process.env.BUCKET_NAME && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY,
  )
  checks.push({
    id: 'media',
    label: 'Media storage',
    state: mediaConfigured ? 'ok' : 'warn',
    detail: mediaConfigured
      ? 'Uploads are stored in your bucket.'
      : 'Not configured. Uploaded images will disappear on the next deploy. Use the form below.',
  })

  // `OPENAI_COMPATIBLE_API_KEY` is no longer offered by the setup forms, but the
  // engine still honours it — a deployment already using one must not be told
  // its AI features are off.
  const aiConfigured = Boolean(
    process.env.AI_GATEWAY_API_KEY ||
      process.env.OPENROUTER_API_KEY ||
      process.env.OPENAI_COMPATIBLE_API_KEY,
  )
  checks.push({
    id: 'ai',
    label: 'AI features',
    state: aiConfigured ? 'ok' : 'warn',
    detail: aiConfigured
      ? 'An AI provider key is set.'
      : 'Optional. Add a Vercel AI Gateway or OpenRouter key below to write content with AI.',
  })

  const siteUrlConfigured = Boolean(
    process.env.NEXT_PUBLIC_SERVER_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL,
  )
  checks.push({
    id: 'site-url',
    label: 'Site address',
    state: siteUrlConfigured ? 'ok' : 'warn',
    detail: siteUrlConfigured
      ? 'Used for sitemaps and links.'
      : 'NEXT_PUBLIC_SERVER_URL is not set, so sitemap links may point at localhost.',
  })

  return {
    configured: checks.every((check) => check.state !== 'error'),
    appId,
    appName,
    checks,
  }
}

/**
 * Turn libSQL connection failures into something a non-technical user can act on.
 *
 * `hadToken` matters: a hosted database answers an authenticated and an
 * unauthenticated request with the same "HTTP status 401", so only the caller
 * knows whether the user actually supplied a token. Without it, someone who left
 * the field empty is told their token was rejected.
 */
export function describeDbError(error: unknown, opts: { hadToken?: boolean } = {}): string {
  const message = error instanceof Error ? error.message : String(error)
  if (/unauthor|authentication|\b401\b|\b403\b/i.test(message)) {
    return opts.hadToken === false
      ? 'This database needs an access token. Create one with your database provider and paste it above.'
      : 'The database rejected the auth token. Check that you copied the whole token.'
  }
  if (/not found|404|ENOTFOUND|getaddrinfo|dns/i.test(message)) {
    return 'That database URL could not be reached. Check the address for typos.'
  }
  if (/econnrefused|timeout|ETIMEDOUT|network/i.test(message)) {
    return 'Could not reach the database. It may be paused, or the network blocked the request.'
  }
  return message
}
