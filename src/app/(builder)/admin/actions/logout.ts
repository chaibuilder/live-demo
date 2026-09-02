'use server'

import config from '@payload-config'
import { buildOriginURL } from '@/utilities/getURL'
import { cookies, headers } from 'next/headers'
import { getPayload } from 'payload'

export async function logoutAction(): Promise<void> {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const cookieStore = await cookies()
  const cookieName = `${payload.config.cookiePrefix}-token`
  const token = cookieStore.get(cookieName)?.value

  if (token) {
    const requestHeaders = await headers()
    const origin = buildOriginURL({
      host: requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host'),
      forwardedProto: requestHeaders.get('x-forwarded-proto') ?? 'http',
    })

    await fetch(`${origin}/api/users/logout`, {
      method: 'POST',
      headers: {
        Authorization: `JWT ${token}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
      cache: 'no-store',
    }).catch(() => undefined)
  }

  cookieStore.delete(cookieName)
}
