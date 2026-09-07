import { NextRequest, NextResponse } from 'next/server'
import { getAdminRoute, isCustomAdminRoute } from '@/utilities/adminRoute'
import { isConfigured } from '@/lib/is-configured'
import { SANDBOX_COOKIE, isDemoSandboxEnabled } from '@/lib/demo-sandbox/constants'
import { verifySandboxCookie } from '@/lib/demo-sandbox/cookie'

/** Paths that must never be rewritten to the per-visitor sandbox view. */
const isSiteContentPath = (pathname: string): boolean =>
  !pathname.startsWith('/admin') &&
  !pathname.startsWith('/api') &&
  !pathname.startsWith('/demo') &&
  !pathname.startsWith('/setup') &&
  !pathname.startsWith('/next') &&
  !pathname.startsWith('/sandbox-view') &&
  !pathname.startsWith('/_next')

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Before setup there is no database to serve anything from, so send the whole
  // site to the wizard rather than letting routes fail one by one.
  if (!isConfigured() && !pathname.startsWith('/setup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/setup'
    url.search = ''
    return NextResponse.redirect(url)
  }

  if (isCustomAdminRoute() && (pathname === '/admin' || pathname.startsWith('/admin/'))) {
    const url = request.nextUrl.clone()
    url.pathname = `${getAdminRoute()}${pathname.slice('/admin'.length)}`
    return NextResponse.redirect(url)
  }

  if (isDemoSandboxEnabled()) {
    const sandboxId = await verifySandboxCookie(
      request.cookies.get(SANDBOX_COOKIE)?.value,
      process.env.PAYLOAD_SECRET,
    )

    // The editor needs a live sandbox — mint one before it loads.
    if (pathname.startsWith('/admin/editor') && !sandboxId) {
      const url = request.nextUrl.clone()
      url.pathname = '/demo/enter'
      url.search = `?next=${encodeURIComponent(pathname + request.nextUrl.search)}`
      return NextResponse.redirect(url)
    }

    // Sandbox holders see their own site; everyone else (and every crawler)
    // stays on the statically served showcase.
    if (sandboxId && isSiteContentPath(pathname)) {
      const url = request.nextUrl.clone()
      url.pathname = `/sandbox-view${pathname === '/' ? '' : pathname}`
      return NextResponse.rewrite(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
