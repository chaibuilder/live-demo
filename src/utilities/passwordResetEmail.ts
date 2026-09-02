import type { PayloadRequest } from 'payload'
import { adminUrl } from '@/utilities/adminRoute'
import { buildOriginURL } from './getURL'

/** Admin reset route used by Payload's built-in ResetPassword view. */
export function getAdminPasswordResetURL(token: string, req?: PayloadRequest): string {
  let protocol: string | null = null
  if (req?.url) {
    try {
      protocol = new URL(req.url).protocol
    } catch {
      // ignore malformed req.url
    }
  }

  const base = buildOriginURL({
    host: req?.headers?.get('x-forwarded-host') ?? req?.headers?.get('host'),
    protocol,
    forwardedProto: req?.headers?.get('x-forwarded-proto'),
  })

  return `${base}${adminUrl('reset', encodeURIComponent(token))}`
}

type ForgotPasswordEmailArgs = {
  token: string
  user?: { email: string }
  req?: PayloadRequest
}

export function buildForgotPasswordEmailSubject(_args: ForgotPasswordEmailArgs): string {
  return `Reset your ChaiBuilder password`
}

export function buildForgotPasswordEmailHTML({ token, user, req }: ForgotPasswordEmailArgs): string {
  const resetURL = getAdminPasswordResetURL(token, req)
  const email = user?.email ?? 'there'

  return `<!doctype html>
<html>
  <body style="font-family: sans-serif; line-height: 1.5;">
    <h1>Reset your password</h1>
    <p>Hello ${email},</p>
    <p>We received a request to reset your ChaiBuilder account password.</p>
    <p><a href="${resetURL}">Click here to reset your password</a></p>
    <p>If you did not request this, you can ignore this email.</p>
    <p style="color: #666; font-size: 12px;">This link expires after a limited time.</p>
  </body>
</html>`
}
