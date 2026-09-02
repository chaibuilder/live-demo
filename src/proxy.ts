import { NextRequest, NextResponse } from 'next/server'
import { getAdminRoute, isCustomAdminRoute } from '@/utilities/adminRoute'
import { isConfigured } from '@/lib/is-configured'

export function proxy(request: NextRequest) {
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

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
