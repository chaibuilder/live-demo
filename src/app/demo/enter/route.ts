import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { createAppRecord } from '@/app/(setup)/lib/create-app-record'
import { envDbCredentials, openDb } from '@/app/(setup)/lib/db'
import {
  MAX_LIVE_SANDBOXES,
  MAX_SANDBOXES_PER_IP_PER_HOUR,
  SANDBOX_COOKIE,
  SANDBOX_TTL_SECONDS,
  isDemoSandboxEnabled,
  showcaseAppId,
} from '@/lib/demo-sandbox/constants'
import { signSandboxCookie } from '@/lib/demo-sandbox/cookie'
import { sweepExpiredSandboxes } from '@/lib/demo-sandbox/sweep'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Best effort per instance; the global cap below is the real backstop. */
const recentByIp = new Map<string, number[]>()

const overIpLimit = (ip: string): boolean => {
  const now = Date.now()
  const stamps = (recentByIp.get(ip) ?? []).filter((t) => now - t < 60 * 60 * 1000)
  recentByIp.set(ip, stamps)
  return stamps.length >= MAX_SANDBOXES_PER_IP_PER_HOUR
}

const safeNext = (raw: string | null): string =>
  raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/admin/editor'

/**
 * Mints a fresh demo sandbox for the signed-in user: sweeps expired sandboxes,
 * creates a new app seeded with the CLI home page, and sets the signed cookie
 * that scopes every subsequent request (builder and public view) to it.
 */
export async function GET(request: NextRequest): Promise<Response> {
  if (!isDemoSandboxEnabled()) return NextResponse.redirect(new URL('/', request.url))

  const credentials = envDbCredentials()
  const secret = process.env.PAYLOAD_SECRET
  if (!credentials || !secret || !showcaseAppId()) {
    return new Response('Demo sandbox mode is not configured.', { status: 500 })
  }

  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (overIpLimit(ip)) {
    return new Response('Too many demo sites from this address. Please try again in an hour.', { status: 429 })
  }

  const client = openDb(credentials)
  await sweepExpiredSandboxes(client, payload).catch(() => {})

  const live = await client.execute({
    sql: 'SELECT count(*) AS n FROM apps WHERE id != ?',
    args: [showcaseAppId() ?? ''],
  })
  if (Number(live.rows[0]?.n ?? 0) >= MAX_LIVE_SANDBOXES) {
    return new Response('The demo is very busy right now. Please try again later.', { status: 503 })
  }

  const { appId } = await createAppRecord(client, { appName: 'Demo Sandbox', userId: String(user.id) })
  recentByIp.get(ip)?.push(Date.now()) ?? recentByIp.set(ip, [Date.now()])

  const expires = Math.floor(Date.now() / 1000) + SANDBOX_TTL_SECONDS
  const cookie = await signSandboxCookie(appId, expires, secret)

  const response = NextResponse.redirect(new URL(safeNext(request.nextUrl.searchParams.get('next')), request.url))
  response.cookies.set(SANDBOX_COOKIE, cookie, {
    maxAge: SANDBOX_TTL_SECONDS,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })
  return response
}
