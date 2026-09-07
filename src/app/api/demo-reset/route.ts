import config from '@payload-config'
import { NextRequest } from 'next/server'
import { getPayload } from 'payload'
import { envDbCredentials, openDb } from '@/app/(setup)/lib/db'
import { isDemoSandboxEnabled } from '@/lib/demo-sandbox/constants'
import { sweepExpiredSandboxes } from '@/lib/demo-sandbox/sweep'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Hourly cron (see vercel.json): purges demo sandboxes older than the TTL.
 * Creation also sweeps lazily, so this is the backstop for quiet periods.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (!isDemoSandboxEnabled()) return Response.json({ ok: true, skipped: 'sandbox mode disabled' })

  const credentials = envDbCredentials()
  if (!credentials) return Response.json({ error: 'no database configured' }, { status: 500 })

  const payload = await getPayload({ config })
  const { purgedApps } = await sweepExpiredSandboxes(openDb(credentials), payload)
  return Response.json({ ok: true, purged: purgedApps.length })
}
