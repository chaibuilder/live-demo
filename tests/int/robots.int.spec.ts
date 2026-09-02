// @vitest-environment node
import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { buildRobots, ROBOTS_DISALLOW_PATHS } from '@/app/robots'

describe('robots.txt builder', () => {
  const original = process.env.NEXT_PUBLIC_SERVER_URL

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_SERVER_URL
    } else {
      process.env.NEXT_PUBLIC_SERVER_URL = original
    }
  })

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://example.com'
  })

  it('disallows admin, api, preview, and example routes', () => {
    expect(ROBOTS_DISALLOW_PATHS).toEqual(
      expect.arrayContaining(['/admin/', '/api/', '/next/']),
    )
  })

  // The setup wizard takes database credentials and reports on the site's
  // configuration; it also sends `noindex`, but a crawler that never fetches it
  // never sees that header.
  it('keeps crawlers away from /setup', () => {
    expect(ROBOTS_DISALLOW_PATHS).toContain('/setup')
  })

  it('allows public site root', () => {
    const robots = buildRobots()
    const rules = Array.isArray(robots.rules) ? robots.rules[0] : robots.rules
    expect(rules.allow).toBe('/')
  })

  it('points sitemap at absolute /sitemap.xml on configured origin', () => {
    const robots = buildRobots()
    expect(robots.sitemap).toBe('https://example.com/sitemap.xml')
  })

  it('strips trailing slash from origin before joining sitemap path', () => {
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://example.com/'
    const robots = buildRobots()
    expect(robots.sitemap).toBe('https://example.com/sitemap.xml')
  })
})
