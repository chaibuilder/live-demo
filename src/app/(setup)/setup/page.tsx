import { headers } from 'next/headers'
import { adminUrl } from '@/utilities/adminRoute'
import { isConfigured } from '@/lib/is-configured'
import { envDbCredentials, openDb } from '../lib/db'
import { detectHost, hostEnvUrl } from '../lib/host'
import { describeDbError, getSetupStatus } from '../lib/status'
import { SetupWizard, type EnvDatabase } from './wizard'
import { BrandHeader } from './BrandHeader'
import { NewTabLink } from './NewTabLink'

// Setup reflects live environment and database state, so it must never be
// cached or prerendered.
export const dynamic = 'force-dynamic'

const BADGE_SYMBOL = { ok: '✓', warn: '!', error: '✕' } as const
const DOCS_URL = 'https://www.chaibuilder.com/docs'

/**
 * Whether this deployment already carries usable database credentials, e.g. the
 * user filled them in while deploying. When they work the wizard skips asking.
 *
 * Only the URL is returned: `DATABASE_AUTH_TOKEN` must never reach the browser,
 * so setup runs against the environment credentials server-side instead.
 */
async function probeEnvDatabase(): Promise<EnvDatabase> {
  const credentials = envDbCredentials()
  if (!credentials) return { state: 'absent' }

  const client = openDb(credentials)
  try {
    await client.execute('SELECT 1')
    return { state: 'ready', url: credentials.url }
  } catch (error) {
    return {
      state: 'broken',
      url: credentials.url,
      error: describeDbError(error, { hadToken: Boolean(credentials.authToken) }),
    }
  } finally {
    client.close()
  }
}

/**
 * Whether uploads already have somewhere to live. Presence only — unlike the
 * database there is no cheap round-trip that proves a bucket works, so the
 * wizard never claims to have verified it. It only decides whether the success
 * screen warns that uploads will not survive a redeploy.
 */
function hasEnvMedia(): boolean {
  return Boolean(
    process.env.BUCKET_NAME && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY,
  )
}

/** Same presence-only rule, including the variable the forms no longer offer. */
function hasEnvAi(): boolean {
  return Boolean(
    process.env.AI_GATEWAY_API_KEY ||
      process.env.OPENROUTER_API_KEY ||
      process.env.OPENAI_COMPATIBLE_API_KEY,
  )
}

export default async function SetupPage() {
  // The `Host` header is what separates a production build served over loopback
  // — someone running `next start` or the compose stack on their own machine —
  // from a self-hosted deployment on a real domain.
  const host = detectHost((await headers()).get('host'))

  if (!isConfigured()) {
    return (
      <SetupWizard
        envDatabase={await probeEnvDatabase()}
        envMedia={hasEnvMedia()}
        envAi={hasEnvAi()}
        host={host}
        hostEnvUrl={hostEnvUrl(host)}
      />
    )
  }

  const status = await getSetupStatus()
  const problems = status.checks.filter((check) => check.state === 'error')
  // `getSetupStatus` is the single source of truth for what is configured: the
  // same check that renders a row also decides whether its form is offered.
  const needsMedia = status.checks.some((check) => check.id === 'media' && check.state === 'warn')
  const needsAi = status.checks.some((check) => check.id === 'ai' && check.state === 'warn')
  const needsSiteUrl = status.checks.some(
    (check) => check.id === 'site-url' && check.state === 'warn',
  )

  return (
    <div className="wrap">
      <BrandHeader />
      <h1>{problems.length === 0 ? 'Your site is set up' : 'Your site needs attention'}</h1>
      <p className="lede">
        {problems.length === 0
          ? 'Everything required is in place. Below is the current state of your site.'
          : 'Some required settings are not working. Details are below.'}
      </p>

      <div className="scroll-area">
        <div className="card">
          <ul className="checklist">
            {status.checks.map((check) => (
              <li key={check.id}>
                <span className={`badge ${check.state}`}>{BADGE_SYMBOL[check.state]}</span>
                <span>
                  <span className="check-label">{check.label}</span>
                  <br />
                  <span className="check-detail">{check.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {(needsMedia || needsAi || needsSiteUrl) && (
          <div className="card">
            <h2>Optional extras</h2>
            <p className="hint">
              {host === 'local'
                ? 'Each of these is a matter of adding environment variables to your .env file and restarting — there is no need to run setup a second time. '
                : 'Each of these is a matter of adding environment variables to your host and deploying again — there is no need to run setup a second time. '}
              <NewTabLink href={DOCS_URL}>The docs</NewTabLink> walk through each one.
            </p>
            <ul className="steps">
              {needsMedia && (
                <li>
                  <strong>Media storage</strong> — <code>BUCKET_NAME</code>,{' '}
                  <code>AWS_ACCESS_KEY_ID</code>, <code>AWS_SECRET_ACCESS_KEY</code>, plus{' '}
                  <code>S3_ENDPOINT</code> for Cloudflare R2. Without it, uploads are lost on every
                  deploy.
                </li>
              )}
              {needsAi && (
                <li>
                  <strong>AI</strong> — <code>AI_GATEWAY_API_KEY</code> for the Vercel AI Gateway,
                  or <code>OPENROUTER_API_KEY</code> for OpenRouter. One or the other, not both.
                </li>
              )}
              {needsSiteUrl && (
                <li>
                  <strong>Site address</strong> — <code>NEXT_PUBLIC_SERVER_URL</code>, so sitemaps
                  and shared links point at the right place.
                </li>
              )}
            </ul>
          </div>
        )}

        <div className="card">
          <h2>Your site</h2>
          {/* No ids, keys or values here on purpose: once setup has run this page
              is reachable by anyone who can reach the site, so it says what is
              working without repeating anything worth keeping secret. The values
              live in your host's settings and, for the site id, the editor. */}
          <div className="actions">
            {/* Styled links rather than buttons wrapped in anchors, which is
                invalid HTML and confuses keyboard and assistive-tech users. */}
            <NewTabLink className="button-link" href={adminUrl('editor')}>
              Open the editor
            </NewTabLink>
            <NewTabLink className="button-link secondary" href="/">
              View your site
            </NewTabLink>
          </div>
        </div>

        <div className="card">
          <h2>You can delete this route now</h2>
          <p className="hint">
            Setup has done its job. It refuses to run again while the site is configured, so it is
            safe to leave in place — but nothing here is needed any more, and deleting it removes
            the page entirely.
          </p>
          <ol className="steps">
            <li>
              Delete <code>src/app/(setup)</code>.
            </li>
            <li>
              Remove the <code>/setup</code> redirect from <code>src/proxy.ts</code>.
            </li>
            <li>
              {host === 'local'
                ? 'Restart the dev server.'
                : 'Commit and deploy — the route is gone from the next build onwards.'}
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
