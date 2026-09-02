import { cookies, headers as nextHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import configPromise from '@payload-config'

import type { User } from '../payload-types'

export const getMeUser = async (args?: {
  nullUserRedirect?: string
  validUserRedirect?: string
}): Promise<{
  token: string
  user: User | null
}> => {
  const { nullUserRedirect, validUserRedirect } = args || {}
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value

  // Verify the session against Payload's Local API instead of fetching our own `/api/users/me`
  // over HTTP. A server-side self-fetch resolves to the incoming request host, which on a Vercel
  // preview is a protection-gated `*.vercel.app` URL — Vercel's auth wall answers with an HTML
  // login page (HTTP 200), and `.json()` then throws
  // `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`, surfacing as a 500.
  // The Local API runs in-process: no network hop, no origin guessing, no protection wall.
  let user: User | null = null

  if (token) {
    try {
      const payload = await getPayload({ config: configPromise })
      const result = await payload.auth({ headers: await nextHeaders() })
      user = (result.user as User | null) ?? null
    } catch (error) {
      user = null
      // eslint-disable-next-line no-console
      console.error('getMeUser: failed to verify session', error)
    }
  }

  if (validUserRedirect && user) {
    redirect(validUserRedirect)
  }

  if (nullUserRedirect && !user) {
    redirect(nullUserRedirect)
  }

  // Token will exist here because if it doesn't the user will be redirected
  return {
    token: token!,
    user,
  }
}
