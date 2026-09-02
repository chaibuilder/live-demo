/**
 * Whether this deployment has been through setup.
 *
 * Deliberately a pure environment check with no database access, so it is safe
 * to call from middleware (`src/proxy.ts`) on every request. The three variables
 * below are exactly what the `/setup` wizard produces: a database to talk to, a
 * secret to sign sessions with, and the id of the seeded app.
 */
export function isConfigured(): boolean {
  return Boolean(
    process.env.DATABASE_URL && process.env.PAYLOAD_SECRET && process.env.CHAIBUILDER_APP_KEY,
  )
}

/** Environment variables that must be present before the app can serve traffic. */
export function missingRequiredEnv(): string[] {
  return (['DATABASE_URL', 'PAYLOAD_SECRET', 'CHAIBUILDER_APP_KEY'] as const).filter(
    (name) => !process.env[name],
  )
}
