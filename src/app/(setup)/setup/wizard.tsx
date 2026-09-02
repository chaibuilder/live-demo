'use client'

import { useEffect, useRef, useState } from 'react'
import { runSetup, testConnection } from './actions'
import { BrandHeader } from './BrandHeader'
import {
    EMPTY_EXTRAS,
    ExtrasFields,
    mediaPartlyFilled,
    type Extras,
} from './ExtrasFields'
import { NewTabLink } from './NewTabLink'
import { SuccessScreen, type Host } from './SuccessScreen'

type Progress = 'idle' | 'migrating' | 'creating-admin' | 'creating-app' | 'done'

const PROGRESS_LABELS: { key: Exclude<Progress, 'idle' | 'done'>; label: string }[] = [
  { key: 'migrating', label: 'Preparing your database' },
  { key: 'creating-admin', label: 'Creating your admin account' },
  { key: 'creating-app', label: 'Creating your site' },
]

type StepId = 'site' | 'database' | 'review'

/**
 * Three steps, deliberately. The two required ones ask only for what setup
 * cannot proceed without; storage and AI are optional and sit collapsed on the
 * last step, so whatever the user does fill in ships in the same block of
 * variables — one paste, one redeploy, whichever they choose.
 */
const ALL_STEPS: { id: StepId; title: string }[] = [
  { id: 'site', title: 'Your site' },
  { id: 'database', title: 'Database' },
  { id: 'review', title: 'Create' },
]

const CLI_COMMAND = 'npx chaibuilder-app create'

/**
 * Database credentials already present on this deployment, probed server-side.
 * The auth token deliberately never crosses to the client — when the state is
 * `ready`, setup runs against the environment credentials on the server.
 */
export type EnvDatabase =
  | { state: 'absent' }
  | { state: 'ready'; url: string }
  | { state: 'broken'; url: string; error: string }

/** 64 hex characters, the same shape the CLI generates for PAYLOAD_SECRET. */
function generateSecret(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function SetupWizard({
  envDatabase,
  envMedia,
  envAi,
  host,
  hostEnvUrl,
}: {
  envDatabase: EnvDatabase
  envMedia: boolean
  envAi: boolean
  host: Host
  hostEnvUrl: string | null
}) {
  const [step, setStep] = useState(0)
  const [furthestStep, setFurthestStep] = useState(0)

  const [appName, setAppName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  // A broken env URL is worth prefilling so the user can correct it rather than
  // retype it; the token is not available here and stays blank.
  const [dbUrl, setDbUrl] = useState(envDatabase.state === 'broken' ? envDatabase.url : '')
  const [dbToken, setDbToken] = useState('')
  const [extras, setExtras] = useState<Extras>(EMPTY_EXTRAS)

  // Which database credentials `testConnection` has already approved, so Next
  // does not re-test unnecessarily but does re-test after an edit.
  const [verifiedDb, setVerifiedDb] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [stepError, setStepError] = useState<string | null>(null)

  const [progress, setProgress] = useState<Progress>('idle')
  const [percent, setPercent] = useState(0)
  const [appId, setAppId] = useState<string | null>(null)
  const [secret] = useState(generateSecret)

  const headingRef = useRef<HTMLHeadingElement>(null)
  const running = progress !== 'idle' && progress !== 'done'
  const dbKey = JSON.stringify([dbUrl.trim(), dbToken.trim()])

  // The same wizard serves a deployment and a checkout on the user's own
  // machine. Only the last step really differs — a `.env` file and a restart
  // instead of a dashboard and a redeploy — but the promise made up front has to
  // match it, so the wording follows the host from the first screen.
  const isLocal = host === 'local'

  // Working credentials on the deployment mean there is nothing to ask for. The
  // step stays in the rail, ticked, so it is clear it was handled rather than
  // silently dropped — but it is not one of the steps the wizard walks through.
  const useEnvDatabase = envDatabase.state === 'ready'
  const steps = ALL_STEPS.filter((s) => !(useEnvDatabase && s.id === 'database'))
  const stepIndex = Math.min(step, steps.length - 1)
  const current = steps[stepIndex]
  const isLast = stepIndex === steps.length - 1

  // Keyboard and screen-reader users would otherwise stay focused wherever the
  // previous step's button was. Skipped on first render, where there is no
  // previous step and the focus ring would just look like a stray outline.
  const mounted = useRef(false)
  useEffect(() => {
    if (mounted.current) headingRef.current?.focus()
    else mounted.current = true
  }, [step])

  function goTo(id: StepId) {
    const next = steps.findIndex((s) => s.id === id)
    if (next < 0) return
    setStepError(null)
    setStep(next)
    setFurthestStep((f) => Math.max(f, next))
  }

  function goToIndex(next: number) {
    setStepError(null)
    setStep(next)
    setFurthestStep((f) => Math.max(f, next))
  }

  /** Returns an error message, or null when the step may be left. */
  async function validateStep(): Promise<string | null> {
    switch (current.id) {
      case 'site':
        if (!appName.trim()) return 'Enter a name for your site.'
        if (!email.trim()) return 'Enter an email address.'
        if (!email.includes('@')) return 'That does not look like an email address.'
        if (password.length < 4) return 'Password must be at least 4 characters.'
        return null
      case 'database': {
        if (!dbUrl.trim()) return 'Enter your database URL.'
        if (verifiedDb === dbKey) return null
        setChecking(true)
        const result = await testConnection({ url: dbUrl.trim(), authToken: dbToken.trim() })
        setChecking(false)
        if (!result.ok) return result.error
        setVerifiedDb(dbKey)
        return null
      }
      default:
        return null
    }
  }

  async function goNext(event?: React.FormEvent) {
    event?.preventDefault()
    const error = await validateStep()
    if (error) {
      setStepError(error)
      return
    }
    goToIndex(Math.min(stepIndex + 1, steps.length - 1))
  }

  async function handleCreate() {
    // A partial bucket config would ship variables that silently do not work, so
    // it is the one optional thing worth blocking on.
    if (mediaPartlyFilled(extras)) {
      setStepError(
        'Media storage needs the bucket name, access key ID and secret access key together — fill in all three, or clear them to skip.',
      )
      return
    }
    setStepError(null)

    // The action runs all three stages server-side without reporting back, so the
    // bar is an estimate: it eases towards 92% and only completes when the work
    // actually does. Creating the tables can take the better part of a minute and
    // a frozen button reads as a hang.
    setProgress('migrating')
    setPercent(0)
    const started = Date.now()
    const ticker = setInterval(() => {
      const elapsed = (Date.now() - started) / 1000
      setPercent(Math.min(92, 92 * (1 - Math.exp(-elapsed / 18))))
    }, 200)
    const advance = [
      setTimeout(() => setProgress((p) => (p === 'migrating' ? 'creating-admin' : p)), 6000),
      setTimeout(() => setProgress((p) => (p === 'creating-admin' ? 'creating-app' : p)), 9000),
    ]

    const result = await runSetup({
      database: useEnvDatabase
        ? { source: 'env' }
        : { source: 'input', url: dbUrl.trim(), authToken: dbToken.trim() || undefined },
      appName: appName.trim(),
      email: email.trim(),
      password,
    })
    advance.forEach(clearTimeout)
    clearInterval(ticker)

    if (!result.ok) {
      setStepError(result.error)
      setProgress('idle')
      setPercent(0)
      return
    }

    setPercent(100)
    setAppId(result.data.appId)
    setProgress('done')
  }

  if (progress === 'done' && appId) {
    return (
      <SuccessScreen
        appId={appId}
        secret={secret}
        useEnvDatabase={useEnvDatabase}
        dbUrl={dbUrl.trim()}
        dbToken={dbToken.trim()}
        extras={extras}
        envMedia={envMedia}
        envAi={envAi}
        host={host}
        hostEnvUrl={hostEnvUrl}
      />
    )
  }

  return (
    <div className="wrap">
      <BrandHeader />
      <h1>Set up your ChaiBuilder site</h1>
      <p className="lede">
        {isLocal
          ? 'Three steps, then one restart — and your site is running.'
          : 'Three steps, then one redeploy — and your site is live.'}
      </p>

      <ol className="stepper">
        {ALL_STEPS.map((entry) => {
          if (useEnvDatabase && entry.id === 'database') {
            return (
              <li key={entry.id} className="done satisfied">
                <span className="stepper-link">
                  <span className="stepper-num">✓</span>
                  <span className="stepper-title">{entry.title}</span>
                </span>
              </li>
            )
          }
          const index = steps.findIndex((s) => s.id === entry.id)
          const state = index === stepIndex ? 'current' : index < stepIndex ? 'done' : 'todo'
          const reachable = index <= furthestStep && !running
          return (
            <li
              key={entry.id}
              className={state}
              aria-current={index === stepIndex ? 'step' : undefined}
            >
              <button
                type="button"
                className="stepper-link"
                disabled={!reachable || index === stepIndex}
                onClick={() => goTo(entry.id)}
              >
                <span className="stepper-num">{state === 'done' ? '✓' : index + 1}</span>
                <span className="stepper-title">{entry.title}</span>
              </button>
            </li>
          )
        })}
      </ol>

      <form className="card" onSubmit={goNext} noValidate>
        <div className="step-head">
          <h2 ref={headingRef} tabIndex={-1}>
            {current.id === 'site'
              ? 'Your site and login'
              : current.id === 'database'
                ? 'Connect your database'
                : 'Create your site'}
          </h2>
        </div>

        <div className="card-body">
          {current.id === 'site' && (
            <>
              <p className="hint">
                The name and the account you will sign in with. Both can be changed later.
              </p>

              <label htmlFor="appName">Site name</label>
              <input
                id="appName"
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="My Company"
                autoFocus
              />

              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />

              <label htmlFor="password">Password</label>
              <div className="password-field">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 4 characters"
                />
                <button
                  type="button"
                  className="link"
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </>
          )}

          {current.id === 'database' && (
            <>
              {envDatabase.state === 'broken' && (
                <div className="note warn">
                  This deployment has database settings, but we could not use them:{' '}
                  {envDatabase.error} Enter them again below.
                </div>
              )}
              {isLocal ? (
                <p className="hint">
                  Your pages and content live in a libSQL database. On your own machine a file in
                  the project is enough — use <code>file:./payload.db</code> and it is created for
                  you. To point at a hosted database instead, paste its <code>libsql://</code>{' '}
                  address; a free one from <NewTabLink href="https://turso.tech">Turso</NewTabLink>{' '}
                  works well.
                </p>
              ) : (
                <p className="hint">
                  Your pages and content live in a hosted libSQL database — a free one from{' '}
                  <NewTabLink href="https://turso.tech">Turso</NewTabLink> works well. Create it,
                  then copy its <code>libsql://</code> address here.
                </p>
              )}

              <label htmlFor="dbUrl">Database URL</label>
              <input
                id="dbUrl"
                type="text"
                value={dbUrl}
                onChange={(e) => setDbUrl(e.target.value)}
                placeholder={isLocal ? 'file:./payload.db' : 'libsql://your-database.turso.io'}
              />

              <label htmlFor="dbToken">Database token</label>
              <div className="field-hint">
                {isLocal
                  ? 'Only for hosted databases — leave this empty when the URL is a file.'
                  : 'Your provider issues one alongside the URL and will refuse the connection without it.'}
              </div>
              <input
                id="dbToken"
                type="password"
                value={dbToken}
                onChange={(e) => setDbToken(e.target.value)}
                placeholder="eyJhbGciOi..."
              />
              <p className="field-hint">We check the connection before moving on.</p>
            </>
          )}

          {current.id === 'review' && (
            <>
              <p className="hint">
                We will create your database tables, your admin account, and your site. This can take
                up to a minute — keep this page open.
              </p>
              <dl className="review-list">
                <ReviewRow label="Site name" value={appName.trim()} onEdit={() => goTo('site')} />
                {useEnvDatabase ? (
                  <ReviewRow label="Database" value="Already configured on this deployment" />
                ) : (
                  <ReviewRow label="Database" value={dbUrl.trim()} onEdit={() => goTo('database')} />
                )}
                <ReviewRow label="Admin email" value={email.trim()} onEdit={() => goTo('site')} />
              </dl>

              <p className="field-hint extras-lede">
                Storage and AI are optional. Add them now and they ship with the same settings —
                otherwise leave them closed and follow the docs later.
              </p>
              <ExtrasFields
                value={extras}
                onChange={setExtras}
                envMedia={envMedia}
                envAi={envAi}
              />
            </>
          )}

          {stepError && <div className="note error">{stepError}</div>}

          {running && (
            <>
              <div className="progress-bar" role="progressbar" aria-valuenow={Math.round(percent)}>
                <div className="progress-fill" style={{ width: `${percent}%` }} />
              </div>
              <ul className="progress">
                {PROGRESS_LABELS.map((entry, index) => {
                  const currentIndex = PROGRESS_LABELS.findIndex((e) => e.key === progress)
                  const state =
                    index < currentIndex ? 'done' : index === currentIndex ? 'active' : ''
                  return (
                    <li key={entry.key} className={state}>
                      {state === 'done' ? '✓ ' : state === 'active' ? '→ ' : '   '}
                      {entry.label}
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </div>

        <div className="step-nav">
          {stepIndex > 0 && (
            <button
              type="button"
              className="secondary"
              onClick={() => goToIndex(stepIndex - 1)}
              disabled={running}
            >
              Back
            </button>
          )}
          <div className="step-nav-end">
            {isLast ? (
              <button type="button" onClick={handleCreate} disabled={running}>
                {running ? 'Setting up…' : 'Create my site'}
              </button>
            ) : (
              <button type="submit" disabled={checking}>
                {checking ? 'Checking…' : 'Next'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

function ReviewRow({
  label,
  value,
  onEdit,
}: {
  label: string
  value: string | null
  onEdit?: () => void
}) {
  return (
    <div className="review-row">
      <dt>{label}</dt>
      <dd>
        {value ? <span>{value}</span> : <span className="muted-value">Not set</span>}
        {onEdit && (
          <button type="button" className="link" onClick={onEdit}>
            Change
          </button>
        )}
      </dd>
    </div>
  )
}
