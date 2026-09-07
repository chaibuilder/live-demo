import { cookies } from 'next/headers'
import { SANDBOX_COOKIE, SANDBOX_EXPIRED_SENTINEL, isDemoSandboxEnabled, showcaseAppId } from './constants'
import { verifySandboxCookie } from './cookie'

type ResolverArgs = { request?: { headers?: { get?: (name: string) => string | null } } }

const cookieFromHeader = (header: string | null | undefined): string | undefined => {
  if (!header) return undefined
  for (const part of header.split('; ')) {
    if (part.startsWith(`${SANDBOX_COOKIE}=`)) return part.slice(SANDBOX_COOKIE.length + 1)
  }
  return undefined
}

/**
 * Per-request tenant for sandbox mode.
 *
 * - Valid sandbox cookie → that sandbox, everywhere.
 * - No/invalid cookie on a page render (no `request`) → the showcase app. The
 *   static homepage prerenders with an empty cookie jar and lands here too.
 * - No/invalid cookie on a route handler (`request` present — builder actions,
 *   preview) → a dead sentinel id, so an expired editor session can never fall
 *   back to mutating the showcase site. The proxy redirects the editor to
 *   /demo/enter for a fresh sandbox before this is ever user-visible.
 */
export async function resolveDemoSandboxAppId(args: ResolverArgs): Promise<string> {
  const showcase = showcaseAppId() ?? ''
  if (!isDemoSandboxEnabled()) return showcase

  let raw = cookieFromHeader(args.request?.headers?.get?.('cookie'))
  if (raw === undefined) {
    try {
      raw = (await cookies()).get(SANDBOX_COOKIE)?.value
    } catch {
      raw = undefined
    }
  }

  const appId = await verifySandboxCookie(raw, process.env.PAYLOAD_SECRET)
  if (appId) return appId
  return args.request ? SANDBOX_EXPIRED_SENTINEL : showcase
}
