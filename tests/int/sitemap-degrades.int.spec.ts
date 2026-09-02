// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// `/sitemap.xml` is prerendered, so anything this route throws fails the whole
// build. The database can be unreachable while the environment looks configured
// — tables not yet migrated, a sleeping Turso instance, rotated credentials —
// and none of those should cost the user a deploy.
const { getChaiBuilder } = vi.hoisted(() => {
  process.env.DATABASE_URL = 'file:./payload.db'
  return { getChaiBuilder: vi.fn() }
})

vi.mock('@/chaibuilder.server', () => ({ getChaiBuilder }))

import sitemap from '@/app/sitemap'

const REQUIRED = ['DATABASE_URL', 'PAYLOAD_SECRET', 'CHAIBUILDER_APP_KEY'] as const
const saved: Record<string, string | undefined> = {}

beforeEach(() => {
  for (const key of REQUIRED) saved[key] = process.env[key]
  process.env.DATABASE_URL = 'file:./payload.db'
  process.env.PAYLOAD_SECRET = 'test-secret'
  process.env.CHAIBUILDER_APP_KEY = 'test-app'
  getChaiBuilder.mockReset()
})

afterEach(() => {
  for (const key of REQUIRED) {
    if (saved[key] === undefined) delete process.env[key]
    else process.env[key] = saved[key]
  }
})

describe('sitemap when the database is not usable', () => {
  it('returns an empty sitemap instead of throwing', async () => {
    getChaiBuilder.mockRejectedValue(new Error('Error getting pages: Failed query'))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await expect(sitemap()).resolves.toEqual([])

    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('survives a failure raised while listing pages', async () => {
    getChaiBuilder.mockResolvedValue({
      getPages: vi.fn().mockRejectedValue(new Error('no such table: app_pages_online')),
      getBaseSlugs: vi.fn(),
    })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await expect(sitemap()).resolves.toEqual([])

    warn.mockRestore()
  })

  it('returns nothing at all before setup has run', async () => {
    delete process.env.CHAIBUILDER_APP_KEY

    await expect(sitemap()).resolves.toEqual([])
    // The guard short-circuits, so the database is never opened.
    expect(getChaiBuilder).not.toHaveBeenCalled()
  })
})
