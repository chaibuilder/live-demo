'use client'

import { useState } from 'react'
import { envBlock, envLine } from '../lib/env-lines'
import { hasMedia, type Extras } from './ExtrasFields'
import { BrandHeader } from './BrandHeader'
import { copyText } from './copy-text'
import { CopyButton } from './CopyButton'
import { NewTabLink } from './NewTabLink'

/** Which host this deployment is running on, detected server-side. */
export type Host = 'vercel' | 'netlify' | 'local' | 'unknown'

const DOCS_URL = 'https://www.chaibuilder.com/docs'

/**
 * Browsers refuse to save a file called `.env`: a leading dot marks a hidden
 * file, so it is stripped, and a `text/plain` blob then picks up `.txt` on the
 * way out — which is how the download arrived as `env.txt`. A real basename
 * survives intact, and `application/octet-stream` stops the extension being
 * second-guessed.
 */
const DOWNLOAD_NAME = 'chaibuilder.env'

/**
 * The one screen that matters after setup runs: the variables to copy, and the
 * single redeploy that applies them. Instructions are written for the host we
 * detected rather than making the user pick their own out of a list.
 */
export function SuccessScreen({
  appId,
  secret,
  useEnvDatabase,
  dbUrl,
  dbToken,
  extras,
  envMedia,
  envAi,
  host,
  hostEnvUrl,
}: {
  appId: string
  secret: string
  useEnvDatabase: boolean
  dbUrl: string
  dbToken: string
  extras: Extras
  envMedia: boolean
  envAi: boolean
  host: Host
  hostEnvUrl: string | null
}) {
  const [sent, setSent] = useState(false)

  // Running on the user's own machine there is no dashboard and no deploy: the
  // same variables go into the `.env` file next to the code, and the dev server
  // picks them up on restart.
  const isLocal = host === 'local'
  const siteUrl = typeof window === 'undefined' ? '' : window.location.origin
  const mediaAdded = hasMedia(extras) && !envMedia
  const aiAdded = Boolean(extras.aiKey.trim()) && !envAi

  const block = envBlock([
    // Already set on this deployment when the credentials came from the
    // environment; the auth token is not available here in any case.
    ...(useEnvDatabase
      ? []
      : [
          envLine('DATABASE_URL', dbUrl),
          ...(dbToken ? [envLine('DATABASE_AUTH_TOKEN', dbToken)] : []),
        ]),
    envLine('PAYLOAD_SECRET', secret),
    envLine('CHAIBUILDER_APP_KEY', appId),
    envLine('NEXT_PUBLIC_SERVER_URL', siteUrl),
    ...(mediaAdded
      ? [
          envLine('BUCKET_NAME', extras.bucket),
          envLine('AWS_ACCESS_KEY_ID', extras.accessKeyId),
          envLine('AWS_SECRET_ACCESS_KEY', extras.secretAccessKey),
          ...(extras.s3Region.trim() ? [envLine('S3_REGION', extras.s3Region)] : []),
          ...(extras.s3Endpoint.trim() ? [envLine('S3_ENDPOINT', extras.s3Endpoint)] : []),
        ]
      : []),
    ...(aiAdded
      ? [
          extras.aiProvider === 'gateway'
            ? envLine('AI_GATEWAY_API_KEY', extras.aiKey)
            : envLine('OPENROUTER_API_KEY', extras.aiKey),
        ]
      : []),
  ])

  // Vercel calls it a project, Netlify calls it a site; say whichever the user
  // is about to be looking at.
  const hostNoun = host === 'netlify' ? 'site' : 'project'

  function download() {
    const url = URL.createObjectURL(new Blob([block], { type: 'application/octet-stream' }))
    const a = document.createElement('a')
    a.href = url
    a.download = DOWNLOAD_NAME
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * The action this screen actually wants: take the variables, go paste them.
   *
   * The copy runs to completion here, before the browser follows the link — a
   * real anchor rather than `window.open`, so nothing is popup-blocked and
   * nothing races the new tab for focus.
   */
  function copyThenFollow() {
    copyText(block)
    setSent(true)
  }

  return (
    <div className="wrap">
      <BrandHeader />
      <h1>Your site is ready — one last step</h1>
      <p className="lede">
        {isLocal
          ? 'Add these environment variables to your .env file and restart the dev server — that is the last step.'
          : 'Add these environment variables to your host and redeploy once — that is the last step.'}
      </p>

      <div className="scroll-area">
        <div className="card">
          <h2>1. Copy your environment variables</h2>
          <p className="hint">
            {useEnvDatabase
              ? `DATABASE_URL is already set ${isLocal ? 'in your environment' : 'on this deployment'}, so it is not repeated here. `
              : ''}
            This is the only time the password-like values are shown.
          </p>
          <pre className="env-block">
            <code>{block}</code>
          </pre>
          <div className="actions actions--tight">
            {hostEnvUrl && (
              <a
                className="button-link"
                href={hostEnvUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={copyThenFollow}
              >
                {sent ? '✓ Copied — opened' : `Copy and go to ${hostNoun}`}
              </a>
            )}
            <button type="button" className="secondary" onClick={download}>
              Download .env
            </button>
            <CopyButton
              value={block}
              className={hostEnvUrl ? 'secondary' : undefined}
              label="Copy env vars"
              copiedLabel="✓ Copied"
            />
          </div>
        </div>

        <div className="card">
          <h2>
            {isLocal
              ? '2. Paste them into .env and restart'
              : '2. Paste them in and redeploy — once'}
          </h2>
          {isLocal ? (
            <ol className="steps">
              <li>
                Open <code>.env</code> in the root of your project — create it if it is not there
                yet. It is already in <code>.gitignore</code>, so these values stay off GitHub.
              </li>
              <li>
                Paste the whole block in and save. Replace any of these keys that are already in the
                file rather than adding a second copy — the last one set wins, and a stale{' '}
                <code>CHAIBUILDER_APP_KEY</code> points at a site that is not the one just created.
              </li>
              <li>
                Restart the dev server: stop it with <code>Ctrl+C</code> and run{' '}
                <code>pnpm dev</code> again.
              </li>
            </ol>
          ) : host === 'netlify' ? (
            <ol className="steps">
              <li>
                {hostEnvUrl ? (
                  <>
                    The button above opens{' '}
                    <NewTabLink href={hostEnvUrl}>this site&rsquo;s environment variables</NewTabLink>{' '}
                    in a new tab.
                  </>
                ) : (
                  <>
                    In the Netlify dashboard, open this site &rarr;{' '}
                    <strong>Site configuration</strong> &rarr;{' '}
                    <strong>Environment variables</strong>.
                  </>
                )}
              </li>
              <li>
                Choose <strong>Import from a .env file</strong> and paste the whole block.
              </li>
              <li>
                <strong>Deploys</strong> &rarr; <strong>Trigger deploy</strong>. Usually a minute or
                two.
              </li>
            </ol>
          ) : (
            <ol className="steps">
              <li>
                {hostEnvUrl ? (
                  <>
                    The button above opens{' '}
                    <NewTabLink href={hostEnvUrl}>
                      this project&rsquo;s environment variables
                    </NewTabLink>{' '}
                    in a new tab.
                  </>
                ) : (
                  <>
                    Open{' '}
                    <NewTabLink href="https://vercel.com/dashboard">vercel.com/dashboard</NewTabLink>
                    , click this project, then <strong>Settings</strong> &rarr;{' '}
                    <strong>Environment Variables</strong>.
                  </>
                )}
              </li>
              <li>Paste the whole block and save. Vercel splits it into separate variables.</li>
              <li>
                <strong>Deployments</strong> &rarr; <strong>⋯</strong> on the latest one &rarr;{' '}
                <strong>Redeploy</strong>. Usually a minute or two.
              </li>
            </ol>
          )}
          <p>
            {isLocal ? 'Once it is back up' : 'When it finishes'}, sign in at <code>/admin</code>{' '}
            with the email and password you just chose.
          </p>
        </div>

        <p className="hint">
          {!mediaAdded &&
            !envMedia &&
            (isLocal ? (
              <>
                You skipped media storage, so uploads are written to local disk — fine while you are
                developing, but add a bucket before you deploy.{' '}
                <NewTabLink href={DOCS_URL}>The docs</NewTabLink> cover it.{' '}
              </>
            ) : (
              <>
                You skipped media storage, so uploaded images will not survive a redeploy —{' '}
                <NewTabLink href={DOCS_URL}>the docs</NewTabLink> cover adding it later.{' '}
              </>
            ))}
          Setup disables itself once configured: safe to leave, or delete{' '}
          <code>src/app/(setup)</code> to remove it.
        </p>
      </div>
    </div>
  )
}
