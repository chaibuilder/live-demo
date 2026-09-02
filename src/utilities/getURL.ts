import canUseDOM from './canUseDOM'

/** Dev / deploy fallback when request host is unavailable. Not used for per-tenant URLs. */
export const getServerSideURL = () => {
  return (
    process.env.NEXT_PUBLIC_SERVER_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000')
  )
}

type BuildOriginURLOptions = {
  host?: string | null
  protocol?: string | null
  forwardedProto?: string | null
}

/** Build origin from incoming request headers (multi-tenant safe). */
export function buildOriginURL(options: BuildOriginURLOptions): string {
  const host = options.host?.trim()
  if (!host) {
    return getServerSideURL().replace(/\/$/, '')
  }

  let scheme = options.forwardedProto?.split(',')[0]?.trim()
  if (!scheme && options.protocol) {
    scheme = options.protocol.replace(':', '')
  }
  if (!scheme) {
    scheme = 'http'
  }

  return `${scheme}://${host}`.replace(/\/$/, '')
}

export const getClientSideURL = () => {
  if (canUseDOM) {
    const protocol = window.location.protocol
    const domain = window.location.hostname
    const port = window.location.port

    return `${protocol}//${domain}${port ? `:${port}` : ''}`
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }

  return process.env.NEXT_PUBLIC_SERVER_URL || ''
}
