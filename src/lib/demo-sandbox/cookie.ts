/**
 * Signed sandbox cookie: `<appId>.<expiresEpochSeconds>.<hmac>`. HMAC-SHA256
 * over `<appId>.<expires>` keyed with PAYLOAD_SECRET. Uses Web Crypto only, so
 * the same code runs in the proxy (edge) and in route handlers (node).
 */

const encoder = new TextEncoder()

// No Buffer: the proxy runs on the edge runtime, where only Web APIs are safe.
const toBase64Url = (buf: ArrayBuffer): string => {
  let bin = ''
  for (const b of new Uint8Array(buf)) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function hmac(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return toBase64Url(await crypto.subtle.sign('HMAC', key, encoder.encode(payload)))
}

export async function signSandboxCookie(
  appId: string,
  expiresEpochSeconds: number,
  secret: string,
): Promise<string> {
  const payload = `${appId}.${expiresEpochSeconds}`
  return `${payload}.${await hmac(payload, secret)}`
}

/** The appId when the cookie is well-formed, correctly signed, and unexpired; null otherwise. */
export async function verifySandboxCookie(
  value: string | undefined,
  secret: string | undefined,
  nowEpochSeconds = Math.floor(Date.now() / 1000),
): Promise<string | null> {
  if (!value || !secret) return null
  const parts = value.split('.')
  if (parts.length !== 3) return null
  const [appId, expiresRaw, signature] = parts
  const expires = Number(expiresRaw)
  if (!appId || !Number.isFinite(expires) || expires <= nowEpochSeconds) return null
  const expected = await hmac(`${appId}.${expiresRaw}`, secret)
  if (signature.length !== expected.length) return null
  // Constant-time-ish compare; the HMAC output length is fixed so this leaks nothing useful.
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= signature.charCodeAt(i) ^ expected.charCodeAt(i)
  return diff === 0 ? appId : null
}
