/**
 * Which host this deployment runs on, and a link to where its environment
 * variables are edited.
 *
 * Setup ends by asking the user to put variables somewhere and restart, so
 * detecting the host turns "on Vercel do this, on Netlify do that, on your own
 * machine do the other" into one set of instructions for the place they are
 * actually standing. `local` is the same wizard against a `.env` file: nothing
 * to paste into a dashboard, nothing to redeploy.
 */

export type Host = 'vercel' | 'netlify' | 'local' | 'unknown'

/**
 * Vercel's docs link to their own settings pages through a redirect that
 * resolves `[team]` and `[project]` against the signed-in user's dashboard.
 *
 * This exists because the dashboard URL is built from the team slug and project
 * name, and neither is exposed to a running deployment: `VERCEL_PROJECT_ID` is
 * available but no dashboard route accepts an id, and deriving the slugs from
 * `VERCEL_GIT_REPO_OWNER`/`VERCEL_GIT_REPO_SLUG` is wrong often enough to be
 * worse than no link — project names are lowercased, renameable, and one repo
 * can back several projects.
 */
const VERCEL_ENV_SETTINGS =
  'https://vercel.com/d?to=' +
  encodeURIComponent('/[team]/[project]/settings/environment-variables') +
  '&title=' +
  encodeURIComponent('Go to Environment Variables')

/** Hostnames that only ever mean "the machine the browser is running on". */
const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1'])

/**
 * The hostname out of a `Host` header, without its port.
 *
 * IPv6 literals are the awkward case: bracketed (`[::1]:3000`) the port is
 * whatever follows the closing bracket, bare (`::1`) every colon belongs to the
 * address. Only a single colon can safely be read as a port separator.
 */
function hostnameOf(requestHost: string): string {
  const value = requestHost.trim().toLowerCase()
  if (value.startsWith('[')) {
    const close = value.indexOf(']')
    return close === -1 ? value.slice(1) : value.slice(1, close)
  }
  return value.split(':').length === 2 ? value.split(':')[0] : value
}

/**
 * `VERCEL` is set at build and at runtime — but a project can switch system
 * variables off, so fall back to two other members of the same set rather than
 * mislabelling the host as unknown.
 *
 * Netlify is deliberately *not* detected through `NETLIFY`: that one is
 * build-only, and present under `netlify dev`, so relying on it works locally
 * and silently fails in production. Functions get `SITE_ID`, `SITE_NAME` and
 * `URL`, and nothing else.
 *
 * Local is what is left once no platform claims the deployment: a dev server is
 * always local, and a production build reached over loopback is someone running
 * `next start` or the Docker compose stack on their own machine. `requestHost`
 * is the request's `Host` header, which is the only thing that separates that
 * case from a self-hosted server on a real domain — pass it when there is one.
 */
export function detectHost(requestHost?: string | null): Host {
  if (process.env.VERCEL || process.env.VERCEL_URL || process.env.VERCEL_PROJECT_ID) return 'vercel'
  if (process.env.SITE_ID || process.env.SITE_NAME) return 'netlify'
  if (process.env.NODE_ENV !== 'production') return 'local'
  if (requestHost) {
    const hostname = hostnameOf(requestHost)
    if (LOOPBACK_HOSTNAMES.has(hostname) || hostname.endsWith('.localhost')) return 'local'
  }
  return 'unknown'
}

/**
 * Where to edit environment variables on this host, or null if we cannot say.
 *
 * Local has no such place on purpose: the variables go in a file the user
 * already has open, so the success screen sends them there instead of to a link.
 */
export function hostEnvUrl(host: Host): string | null {
  if (host === 'vercel') return VERCEL_ENV_SETTINGS
  // Netlify's path is keyed on the site name alone — no team segment to guess —
  // and `SITE_NAME` hands it over verbatim at runtime.
  if (host === 'netlify' && process.env.SITE_NAME) {
    return `https://app.netlify.com/projects/${process.env.SITE_NAME}/configuration/env`
  }
  return null
}
