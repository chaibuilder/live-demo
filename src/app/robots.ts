import type { MetadataRoute } from 'next'
import { adminUrl } from '@/utilities/adminRoute'
import { getServerSideURL } from '@/utilities/getURL'

/**
 * Paths that must not be crawled (prefix match). Keep in sync with app route
 * groups.
 *
 * `/setup` also sends `noindex` in its own metadata; it is listed here as well
 * because a crawler that never fetches the page never sees that tag, and the
 * page names the site's own environment variables.
 */
export function getRobotsDisallowPaths(): readonly string[] {
  return [`${adminUrl()}/`, '/api/', '/next/', '/setup']
}

/** @deprecated Use getRobotsDisallowPaths() for dynamic admin route support. */
export const ROBOTS_DISALLOW_PATHS = getRobotsDisallowPaths()

export function buildRobots(): MetadataRoute.Robots {
  const origin = getServerSideURL().replace(/\/$/, '')
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [...getRobotsDisallowPaths()],
    },
    sitemap: `${origin}/sitemap.xml`,
  }
}

export default function robots(): MetadataRoute.Robots {
  return buildRobots()
}

/** Robots rules change rarely; refresh daily. */
export const revalidate = 86400
