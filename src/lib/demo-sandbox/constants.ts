/**
 * Demo sandbox mode: every login gets its own throwaway site, old ones are
 * purged. Enabled only when DEMO_SANDBOX=true — without it the app behaves
 * exactly like the regular starter (single site from CHAIBUILDER_APP_KEY).
 */
export const isDemoSandboxEnabled = (): boolean => process.env.DEMO_SANDBOX === 'true'

export const SANDBOX_COOKIE = 'chai_demo_sandbox'

/**
 * How long a sandbox lives, from creation. The cookie's Max-Age matches, so a
 * browser always drops the cookie before (or exactly when) the purge is allowed
 * to delete the app — an in-use sandbox can never vanish under a valid cookie.
 */
export const SANDBOX_TTL_SECONDS = 6 * 60 * 60

/**
 * Admin/API requests without a valid sandbox cookie resolve to this dead id
 * instead of the showcase app, so an expired editor session (or a deliberately
 * cleared cookie) can never write to the curated showcase site. The id matches
 * no row: queries return nothing and the user has no membership for it.
 */
export const SANDBOX_EXPIRED_SENTINEL = 'demo-sandbox-expired'

/** Circuit breakers for the shared public login. */
export const MAX_LIVE_SANDBOXES = 300
export const MAX_SANDBOXES_PER_IP_PER_HOUR = 5

export const showcaseAppId = (): string | undefined => process.env.CHAIBUILDER_APP_KEY
