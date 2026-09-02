// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { detectHost, hostEnvUrl } from '@/app/(setup)/lib/host'

/**
 * Host detection decides which set of closing instructions the last screen
 * shows — a dashboard and a redeploy, or a `.env` file and a restart — so a
 * wrong answer sends the user somewhere they cannot finish. The Netlify cases
 * matter most: the obvious variable to test for (`NETLIFY`) is build-only, so
 * detecting on it would pass under `netlify dev` and fail on the deployed site.
 */
const HOST_VARS = [
  'VERCEL',
  'VERCEL_URL',
  'VERCEL_PROJECT_ID',
  'NETLIFY',
  'SITE_ID',
  'SITE_NAME',
] as const

/**
 * Every test that cares states its own build mode. Left implicit, the suite runs
 * under `NODE_ENV=test`, which counts as local — so the production-only branches
 * would never be reached.
 */
function setNodeEnv(value: string) {
  vi.stubEnv('NODE_ENV', value as 'production' | 'development' | 'test')
}

afterEach(() => {
  for (const key of HOST_VARS) delete process.env[key]
  vi.unstubAllEnvs()
})

describe('detectHost', () => {
  it('returns unknown for a production build on a domain no platform claims', () => {
    setNodeEnv('production')
    expect(detectHost('example.com')).toBe('unknown')
  })

  it('detects Vercel from VERCEL', () => {
    process.env.VERCEL = '1'
    expect(detectHost()).toBe('vercel')
  })

  it.each(['VERCEL_URL', 'VERCEL_PROJECT_ID'])(
    'still detects Vercel from %s when system variables are switched off',
    (key) => {
      process.env[key] = 'x'
      expect(detectHost()).toBe('vercel')
    },
  )

  it('detects Netlify from the variables functions actually receive', () => {
    process.env.SITE_ID = '1d01c0c0-4554-4747-93b8-34ce3448ab95'
    expect(detectHost()).toBe('netlify')
  })

  it('does not treat NETLIFY alone as Netlify — it is build-only', () => {
    setNodeEnv('production')
    process.env.NETLIFY = 'true'
    expect(detectHost('example.com')).toBe('unknown')
  })

  it('prefers Vercel when both look present', () => {
    process.env.VERCEL = '1'
    process.env.SITE_ID = 'abc'
    expect(detectHost()).toBe('vercel')
  })

  it('treats a dev server as local, with or without a host header', () => {
    setNodeEnv('development')
    expect(detectHost()).toBe('local')
    expect(detectHost('localhost:3000')).toBe('local')
  })

  it.each([
    'localhost',
    'localhost:3000',
    '127.0.0.1:3000',
    '0.0.0.0:3000',
    '[::1]:3000',
    '::1',
    'chai.localhost:3000',
  ])('treats a production build reached over %s as local', (requestHost) => {
    setNodeEnv('production')
    expect(detectHost(requestHost)).toBe('local')
  })

  it('does not mistake a real domain for local because it mentions localhost', () => {
    setNodeEnv('production')
    expect(detectHost('localhost.example.com')).toBe('unknown')
  })

  it('lets the platform win over a loopback request', () => {
    // `vercel dev` serves on localhost while carrying the platform's variables;
    // the user still edits variables in the dashboard.
    setNodeEnv('development')
    process.env.VERCEL = '1'
    expect(detectHost('localhost:3000')).toBe('vercel')
  })
})

describe('hostEnvUrl', () => {
  it('uses Vercel’s own placeholder redirect rather than guessing slugs', () => {
    const url = hostEnvUrl('vercel')
    expect(url).toContain('https://vercel.com/d?to=')
    // Decoded, the target is /[team]/[project]/settings/environment-variables.
    expect(decodeURIComponent(url!)).toContain('/[team]/[project]/settings/environment-variables')
  })

  it('builds the Netlify URL from SITE_NAME', () => {
    process.env.SITE_NAME = 'petsof'
    expect(hostEnvUrl('netlify')).toBe(
      'https://app.netlify.com/projects/petsof/configuration/env',
    )
  })

  it('returns null for Netlify without a site name rather than a broken link', () => {
    expect(hostEnvUrl('netlify')).toBeNull()
  })

  it('returns null for an unknown host', () => {
    expect(hostEnvUrl('unknown')).toBeNull()
  })

  it('returns null for local — the variables go in a file, not a dashboard', () => {
    expect(hostEnvUrl('local')).toBeNull()
  })
})
