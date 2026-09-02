// @vitest-environment node
import { vi, describe, it, expect, beforeAll, afterAll } from 'vitest'

vi.hoisted(() => {
  process.env.DATABASE_URL = 'file:./payload.db'
})

import { toAbsoluteUrl, mergeSitemapEntries } from '@/app/sitemap'
import type { MetadataRoute } from 'next'

describe('toAbsoluteUrl', () => {
  const originalServerUrl = process.env.NEXT_PUBLIC_SERVER_URL

  beforeAll(() => {
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://example.com'
  })

  afterAll(() => {
    if (originalServerUrl) {
      process.env.NEXT_PUBLIC_SERVER_URL = originalServerUrl
    } else {
      delete process.env.NEXT_PUBLIC_SERVER_URL
    }
  })

  it('builds a URL with leading slash', () => {
    expect(toAbsoluteUrl('/about')).toBe('https://example.com/about')
  })

  it('handles trailing slash in server URL', () => {
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://example.com/'
    expect(toAbsoluteUrl('/about')).toBe('https://example.com/about')
  })

  it('adds leading slash when missing', () => {
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://example.com'
    expect(toAbsoluteUrl('about')).toBe('https://example.com/about')
  })
})

describe('mergeSitemapEntries', () => {
  it('deduplicates by URL keeping newer lastModified', () => {
    const date1 = new Date('2024-01-01')
    const date2 = new Date('2024-06-01')

    const groupA: MetadataRoute.Sitemap = [
      { url: 'https://example.com/a', lastModified: date1 },
      { url: 'https://example.com/b', lastModified: date1 },
    ]
    const groupB: MetadataRoute.Sitemap = [
      { url: 'https://example.com/b', lastModified: date2 },
      { url: 'https://example.com/c', lastModified: date1 },
    ]

    const merged = mergeSitemapEntries([groupA, groupB])

    expect(merged).toHaveLength(3)
    expect(merged[0].url).toBe('https://example.com/a')
    expect(merged[1].url).toBe('https://example.com/b')
    expect(merged[1].lastModified).toBe(date2)
    expect(merged[2].url).toBe('https://example.com/c')
  })

  it('sorts entries by URL', () => {
    const entries: MetadataRoute.Sitemap = [
      { url: 'https://example.com/c' },
      { url: 'https://example.com/a' },
      { url: 'https://example.com/b' },
    ]

    const merged = mergeSitemapEntries([entries])

    expect(merged).toHaveLength(3)
    expect(merged[0].url).toBe('https://example.com/a')
    expect(merged[1].url).toBe('https://example.com/b')
    expect(merged[2].url).toBe('https://example.com/c')
  })

  it('keeps entry when no existing entry has same URL', () => {
    const entries: MetadataRoute.Sitemap = [
      { url: 'https://example.com/only' },
    ]

    const merged = mergeSitemapEntries([entries])

    expect(merged).toHaveLength(1)
    expect(merged[0].url).toBe('https://example.com/only')
  })

  it('handles undefined lastModified', () => {
    const date = new Date('2024-01-01')

    const groupA: MetadataRoute.Sitemap = [
      { url: 'https://example.com/a' },
    ]
    const groupB: MetadataRoute.Sitemap = [
      { url: 'https://example.com/a', lastModified: date },
    ]

    const merged = mergeSitemapEntries([groupA, groupB])

    expect(merged).toHaveLength(1)
    expect(merged[0].lastModified).toBe(date)
  })
})
