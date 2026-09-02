'use client'

import { NewTabLink } from './NewTabLink'

/**
 * Where each provider's keys are made. Vercel's is the documented API-keys page
 * rather than a dashboard deep link: the dashboard path is built from the team
 * slug, which nothing here knows, and this page names the same
 * `AI_GATEWAY_API_KEY` the block below emits.
 */
const AI_KEY_URLS = {
  gateway: 'https://vercel.com/docs/ai-gateway/authentication-and-byok/api-keys',
  openrouter: 'https://openrouter.ai/keys',
} as const

/** The only two AI providers setup offers. Both need a single key, nothing else. */
export type AiProvider = 'gateway' | 'openrouter'

export type Extras = {
  bucket: string
  accessKeyId: string
  secretAccessKey: string
  s3Endpoint: string
  s3Region: string
  aiProvider: AiProvider
  aiKey: string
}

export const EMPTY_EXTRAS: Extras = {
  bucket: '',
  accessKeyId: '',
  secretAccessKey: '',
  s3Endpoint: '',
  s3Region: '',
  aiProvider: 'gateway',
  aiKey: '',
}

/** All three required bucket values present — a partial config is not usable. */
export function hasMedia(e: Extras): boolean {
  return Boolean(e.bucket.trim() && e.accessKeyId.trim() && e.secretAccessKey.trim())
}

/** Some but not all of them — the one state worth blocking on. */
export function mediaPartlyFilled(e: Extras): boolean {
  const filled = [e.bucket, e.accessKeyId, e.secretAccessKey].filter((v) => v.trim()).length
  return filled > 0 && filled < 3
}

/**
 * Optional storage and AI, offered on the last step so anything the user fills in
 * ships in the same block of variables as the rest — one paste, one redeploy.
 *
 * Both sections are collapsed to start: closing one is how you skip it, so there
 * is no extra button and no way to leave a half-filled section behind by
 * accident.
 */
export function ExtrasFields({
  value,
  onChange,
  envMedia,
  envAi,
}: {
  value: Extras
  onChange: (next: Extras) => void
  envMedia: boolean
  envAi: boolean
}) {
  const set = <K extends keyof Extras>(key: K, v: Extras[K]) => onChange({ ...value, [key]: v })

  return (
    <>
      <details className="extra">
        <summary>
          Media storage <span className="extra__tag">Optional</span>
        </summary>
        {envMedia ? (
          <p className="field-hint">Already set on this deployment — nothing to fill in here.</p>
        ) : (
          <>
            <p className="field-hint">
              Without a bucket, uploaded images are lost on every deploy. Works with Amazon S3,
              Cloudflare R2, Backblaze B2, MinIO and other S3-compatible storage.
            </p>
            <div className="field-grid">
              <div>
                <label htmlFor="bucket">Bucket name</label>
                <input
                  id="bucket"
                  type="text"
                  value={value.bucket}
                  onChange={(e) => set('bucket', e.target.value)}
                  placeholder="my-site-media"
                />
              </div>
              <div>
                <label htmlFor="accessKeyId">Access key ID</label>
                <input
                  id="accessKeyId"
                  type="text"
                  value={value.accessKeyId}
                  onChange={(e) => set('accessKeyId', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="secretAccessKey">Secret access key</label>
                <input
                  id="secretAccessKey"
                  type="password"
                  value={value.secretAccessKey}
                  onChange={(e) => set('secretAccessKey', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="s3Region">Region</label>
                <input
                  id="s3Region"
                  type="text"
                  value={value.s3Region}
                  onChange={(e) => set('s3Region', e.target.value)}
                  placeholder="auto"
                />
              </div>
              <div className="span-2">
                <label htmlFor="s3Endpoint">Endpoint</label>
                <div className="field-hint">
                  Required for Cloudflare R2 and similar. Leave empty for Amazon S3.
                </div>
                <input
                  id="s3Endpoint"
                  type="text"
                  value={value.s3Endpoint}
                  onChange={(e) => set('s3Endpoint', e.target.value)}
                  placeholder="https://<account-id>.r2.cloudflarestorage.com"
                />
              </div>
            </div>
          </>
        )}
      </details>

      <details className="extra">
        <summary>
          AI <span className="extra__tag">Optional</span>
        </summary>
        {envAi ? (
          <p className="field-hint">Already set on this deployment — nothing to fill in here.</p>
        ) : (
          <>
            <p className="field-hint">Add a provider key to write and edit content with AI.</p>
            <fieldset className="provider-choice">
              <legend>Provider</legend>
              <label>
                <input
                  type="radio"
                  name="aiProvider"
                  checked={value.aiProvider === 'gateway'}
                  onChange={() => set('aiProvider', 'gateway')}
                />
                <span>
                  <strong>
                    <NewTabLink href={AI_KEY_URLS.gateway}>Vercel AI Gateway</NewTabLink>
                  </strong>{' '}
                  — create a key in your Vercel dashboard.
                </span>
              </label>
              <label>
                <input
                  type="radio"
                  name="aiProvider"
                  checked={value.aiProvider === 'openrouter'}
                  onChange={() => set('aiProvider', 'openrouter')}
                />
                <span>
                  <strong>
                    <NewTabLink href={AI_KEY_URLS.openrouter}>OpenRouter</NewTabLink>
                  </strong>{' '}
                  — create a key at openrouter.ai.
                </span>
              </label>
            </fieldset>

            <label htmlFor="aiKey">API key</label>
            <input
              id="aiKey"
              type="password"
              value={value.aiKey}
              onChange={(e) => set('aiKey', e.target.value)}
              placeholder={value.aiProvider === 'gateway' ? 'vck_...' : 'sk-or-...'}
            />
          </>
        )}
      </details>
    </>
  )
}
