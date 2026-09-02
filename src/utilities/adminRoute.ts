/** Default Payload / ChaiBuilder admin base path. */
export const DEFAULT_ADMIN_ROUTE = '/admin'

/**
 * Normalize and validate a custom admin route from env (no leading slash).
 * Any path is allowed; must be at least 4 characters.
 */
export function parseAdminRoute(raw?: string | null): string {
  const value = raw?.trim()
  if (!value) {
    return DEFAULT_ADMIN_ROUTE
  }

  const normalized = value
    .replace(/^\/+|\/+$/g, '')
    .replace(/\/{2,}/g, '/')

  if (!normalized || normalized === 'admin') {
    return DEFAULT_ADMIN_ROUTE
  }

  if (/[:?*+(){}\[\]|\\]/.test(normalized)) {
    throw new Error('PAYLOAD_ADMIN_ROUTE contains unsupported characters')
  }

  if (normalized.length < 4) {
    throw new Error('PAYLOAD_ADMIN_ROUTE must be at least 4 characters')
  }

  return `/${normalized}`
}

/** Resolved admin base path from env (server + client). */
export function getAdminRoute(): string {
  return parseAdminRoute(
    process.env.PAYLOAD_ADMIN_ROUTE ?? process.env.NEXT_PUBLIC_PAYLOAD_ADMIN_ROUTE,
  )
}

/** Admin path without leading slash — for Next.js rewrite rules. */
export function getAdminRouteSegment(): string {
  return getAdminRoute().replace(/^\//, '')
}

export function isCustomAdminRoute(): boolean {
  return getAdminRoute() !== DEFAULT_ADMIN_ROUTE
}

/** Join admin base path with optional segments. */
export function adminUrl(...segments: string[]): string {
  const base = getAdminRoute()
  const suffix = segments
    .map((segment) => segment.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/')

  return suffix ? `${base}/${suffix}` : base
}
