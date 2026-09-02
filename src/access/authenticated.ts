import type { Access, PayloadRequest } from 'payload'
import { randomUUID } from 'crypto'
import { and, eq } from 'drizzle-orm'
import type { ChaiUserPermissionOverride } from 'chaipro/types'

/**
 * App-scoped roles live in the chaipro `app_users` table (one row per user per app),
 * NOT on the Payload `users` record. `users.role` only marks the global platform owner
 * (`super_admin`) vs everyone else (`none`); real per-app authority comes from
 * `app_users.role` for the current app (`CHAIBUILDER_APP_KEY`).
 */
export type AppRole = 'admin' | 'editor' | 'designer' | 'viewer' | 'user'

/**
 * Lazy import breaks the module cycle:
 * chaibuilder.config → collections → authenticated → chaibuilder.server → chaibuilder.config
 */
const getCb = async () => {
  const { getChaiBuilder } = await import('@/chaibuilder.server')
  return getChaiBuilder()
}

/** The current user's membership in the current app: role plus per-user permission overrides. */
export type AppUser = {
  role: AppRole
  permissions: ChaiUserPermissionOverride
}

/** Roles allowed to create/update/delete content in this app. viewer/user are read-only. */
const WRITER_ROLES: ReadonlySet<AppRole> = new Set(['admin', 'editor', 'designer'])

/** Global platform owner (Payload `users.role`). Bypasses all app scoping. */
const isPlatformSuperAdmin = (req: PayloadRequest): boolean => req.user?.role === 'super_admin'

/**
 * Resolve the current user's role + permissions in the current app from `app_users`. Returns
 * null when unauthenticated, no app key, or no active membership row. `app_users` is a
 * chaipro-managed Drizzle table (not a Payload collection), so it is read through the
 * ChaiBuilder instance's `safeQuery`. Memoized on the request so repeated access/field checks
 * in one request hit the DB once.
 */
async function getAppUser(req: PayloadRequest): Promise<AppUser | null> {
  const user = req.user
  if (!user) return null

  const cache = req as PayloadRequest & { _chaiAppUser?: Promise<AppUser | null> }
  if (cache._chaiAppUser) return cache._chaiAppUser

  cache._chaiAppUser = (async () => {
    const appId = process.env.CHAIBUILDER_APP_KEY
    if (!appId) return null

    const cb = await getCb()
    const { data, error } = await cb.safeQuery(({ db, schema }) =>
      db
        .select({ role: schema.appUsers.role, permissions: schema.appUsers.permissions })
        .from(schema.appUsers)
        .where(
          and(
            eq(schema.appUsers.user, user.id),
            eq(schema.appUsers.app, appId),
            eq(schema.appUsers.status, 'active'),
          ),
        )
        .limit(1),
    )
    if (error) throw error

    const row = data?.[0]
    if (!row?.role) return null
    return {
      role: row.role as AppRole,
      permissions: (row.permissions ?? null) as ChaiUserPermissionOverride,
    }
  })()

  return cache._chaiAppUser
}

/** Resolve just the app role (null if not an active member). */
const getAppRole = async (req: PayloadRequest): Promise<AppRole | null> =>
  (await getAppUser(req))?.role ?? null

/** Any authenticated Payload user. Gate for global, non-app-scoped admin surfaces. */
export const authenticated: Access = ({ req }) => Boolean(req.user)

/** Platform owner, or any active member of the current app (any role). */
export const appMember: Access = async ({ req }) => {
  if (isPlatformSuperAdmin(req)) return true
  return (await getAppRole(req)) != null
}

/**
 * Write access for app-scoped content: the platform owner, or an app member whose
 * `app_users.role` is a writer role (admin/editor/designer). viewer/user are read-only.
 */
export const canWriteContent: Access = async ({ req }) => {
  if (!req.user) return false
  if (isPlatformSuperAdmin(req)) return true
  const role = await getAppRole(req)
  return role != null && WRITER_ROLES.has(role)
}

/**
 * Site-level admin: the global platform owner, or a user whose `app_users.role` is `admin`
 * for the current app. Gate for managing app membership (e.g. the Users collection).
 */
export const appAdmin: Access = async ({ req }) => {
  if (!req.user) return false
  if (isPlatformSuperAdmin(req)) return true
  return (await getAppRole(req)) === 'admin'
}

/**
 * Resolve an arbitrary user's active role in the current app (null if no active membership).
 * Unlike `getAppRole`, this reads a specific `userId` and is NOT memoized — used to display
 * each Users row's app role, which differs per row.
 */
export async function getAppRoleForUser(userId: string): Promise<AppRole | null> {
  const appId = process.env.CHAIBUILDER_APP_KEY
  if (!appId) return null

  const cb = await getCb()
  const { data, error } = await cb.safeQuery(({ db, schema }) =>
    db
      .select({ role: schema.appUsers.role })
      .from(schema.appUsers)
      .where(
        and(
          eq(schema.appUsers.user, userId),
          eq(schema.appUsers.app, appId),
          eq(schema.appUsers.status, 'active'),
        ),
      )
      .limit(1),
  )
  if (error) throw error
  return (data?.[0]?.role as AppRole | undefined) ?? null
}

/**
 * Set a user's role in the current app: reactivate/update their existing `app_users` row if one
 * exists (any status), otherwise insert a new active membership. `app_users` has no unique
 * (user, app) constraint, so we look up before writing rather than relying on upsert.
 */
export async function setAppRoleForUser(userId: string, role: AppRole): Promise<void> {
  const appId = process.env.CHAIBUILDER_APP_KEY
  if (!appId) throw new Error('CHAIBUILDER_APP_KEY not set')

  const cb = await getCb()
  const { data: existing, error: selError } = await cb.safeQuery(({ db, schema }) =>
    db
      .select({ id: schema.appUsers.id })
      .from(schema.appUsers)
      .where(and(eq(schema.appUsers.user, userId), eq(schema.appUsers.app, appId)))
      .limit(1),
  )
  if (selError) throw selError

  const row = existing?.[0]
  const { error: writeError } = await cb.safeQuery(({ db, schema }) =>
    row
      ? db
          .update(schema.appUsers)
          .set({ role, status: 'active' })
          .where(eq(schema.appUsers.id, row.id))
      : db.insert(schema.appUsers).values({
          id: randomUUID(),
          user: userId,
          app: appId,
          role,
          status: 'active',
        }),
  )
  if (writeError) throw writeError
}

/** Restricted to the global platform owner. Use for collections holding secrets/PII. */
export const superAdmin: Access = ({ req }) => req.user?.role === 'super_admin'

/** Public read of anything. Used by non-draft collections (e.g. media). */
export const anyone: Access = () => true

/**
 * Role-only read for draft-enabled content collections: the platform owner and any active
 * app member see everything; the public (and non-members) see published only. App scoping is
 * added on top by `chaiBuilderPlugin`, so these stay tenant-agnostic.
 */
export const memberOrPublished: Access = async ({ req }) => {
  if (!req.user) return { _status: { equals: 'published' } }
  if (isPlatformSuperAdmin(req)) return true
  const role = await getAppRole(req)
  return role != null ? true : { _status: { equals: 'published' } }
}

/** Access preset for app-scoped draft content collections. */
export const contentAccess = {
  create: canWriteContent,
  read: memberOrPublished,
  update: canWriteContent,
  delete: canWriteContent,
}

/** Access preset for app-scoped non-draft public collections (e.g. media). */
export const mediaAccess = {
  create: canWriteContent,
  read: anyone,
  update: canWriteContent,
  delete: canWriteContent,
}
