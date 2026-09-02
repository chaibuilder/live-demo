import { getChaiBuilder } from '@/chaibuilder.server'
import chaiConfig from '@chaibuilder-config'
import payloadConfig from '@payload-config'
import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import { getServerSideURL } from '@/utilities/getURL'
import { isConfigured } from '@/lib/is-configured'
import { appWhere, hasSlugField, resolveAppId } from 'chaipro/payload'

const EXCLUDE_COLLECTIONS = ['users', 'media']
const APP_FIELD = 'app'

/** Build public URL for a collection item from a dynamic page base slug. */
export function buildDynamicItemPath(
  base: { slug: string; dynamicSlugCustom?: string | null },
  itemSlug: string,
): string {
  const normalizedBase = base.slug.endsWith('/') ? base.slug.slice(0, -1) : base.slug
  const normalizedItem = itemSlug.replace(/^\/+/, '')
  const custom = base.dynamicSlugCustom ?? ''
  return `${normalizedBase}/${normalizedItem}${custom}`
}


/** Join origin (NEXT_PUBLIC_SERVER_URL) with a path slug like `/about`. */
export function toAbsoluteUrl(path: string): string {
  const origin = getServerSideURL().replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${origin}${normalizedPath}`
}

/** Dedupe sitemap entries by URL, keeping the newest lastModified. */
export function mergeSitemapEntries(entryGroups: MetadataRoute.Sitemap[]): MetadataRoute.Sitemap {
  const map = new Map<string, { url: string; lastModified?: Date }>()

  const toDate = (v: string | Date | undefined): Date | undefined =>
    v ? (v instanceof Date ? v : new Date(v)) : undefined

  for (const group of entryGroups) {
    for (const entry of group) {
      const normalizedLastMod = toDate(entry.lastModified)
      const existing = map.get(entry.url)
      if (
        !existing ||
        (normalizedLastMod && (!existing.lastModified || normalizedLastMod > existing.lastModified))
      ) {
        map.set(entry.url, { url: entry.url, lastModified: normalizedLastMod })
      }
    }
  }

  return [...map.values()].sort((a, b) => a.url.localeCompare(b.url))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // No database to list pages from until setup has been completed.
  if (!isConfigured()) return []

  // Entries gathered so far, kept outside the try so a failure part-way through
  // still returns the pages that were already listed.
  const staticEntries: MetadataRoute.Sitemap = []

  try {
    return await collectSitemap(staticEntries)
  } catch (error) {
    // This route is prerendered, so throwing here fails the whole build — and a
    // sitemap is never worth a failed deploy. The environment can be configured
    // while the database is not yet reachable: tables not migrated, a sleeping
    // Turso instance, credentials that changed. Ship what we have; `revalidate`
    // picks the rest up within the hour once the database answers again.
    console.warn(
      '[sitemap] Could not list pages, so the sitemap is incomplete. This is usually a database that is unreachable or has not been migrated — visit /setup to check.',
      error,
    )
    return mergeSitemapEntries([staticEntries])
  }
}

/** The real work, split out so the caller above owns the failure handling. */
async function collectSitemap(
  staticEntries: MetadataRoute.Sitemap,
): Promise<MetadataRoute.Sitemap> {
  const localConfig = await chaiConfig
  const payloadCfg = await payloadConfig
  const cb = await getChaiBuilder()

  const pages = await cb.getPages('live', {
    fields: ['slug', 'updatedAt', 'dynamic', 'lang'],
  })

  staticEntries.push(
    ...pages
      .filter((page: any) => page.dynamic === false && page.slug?.trim())
      .map((page: any) => ({
        url: toAbsoluteUrl(page.slug),
        lastModified: page.updatedAt ? new Date(page.updatedAt) : undefined,
      })),
  )

  const pageTypeKeys = new Set((localConfig.pageTypes ?? []).map((pt: any) => pt.key))

  const collectionEntries: MetadataRoute.Sitemap = []
  const payload = await getPayload({ config: payloadCfg })
  const appId = await resolveAppId()

  for (const collection of payloadCfg.collections) {
    if (!hasSlugField(collection.fields ?? [])) continue
    if (!pageTypeKeys.has(collection.slug)) continue
    if (EXCLUDE_COLLECTIONS.includes(collection.slug)) continue

    const localization = payloadCfg.localization
    const locales: string[] = localization
      ? (localization.locales?.map((l: any) => (typeof l === 'string' ? l : l.code)) ?? ['en'])
      : ['en']
    const defaultLocale: string = localization ? (localization.defaultLocale ?? 'en') : 'en'

    for (const locale of locales) {
      let page = 1
      const limit = 100

      while (true) {
        const result = await payload.find({
          collection: collection.slug as any,
          where: appWhere(
            appId,
            {
              and: [{ _status: { equals: 'published' } }, { slug: { exists: true } }],
            },
            APP_FIELD,
          ),
          locale: locale as any,
          draft: false,
          limit,
          page,
          depth: 0,
          select: { slug: true, updatedAt: true },
        })

        const bases = await cb.getBaseSlugs(
          collection.slug,
          locale !== defaultLocale ? { lang: locale } : undefined,
        )

        if (bases.length === 0) break

        for (const doc of result.docs as any[]) {
          if (!doc.slug?.trim()) continue

          for (const base of bases) {
            collectionEntries.push({
              url: toAbsoluteUrl(buildDynamicItemPath(base, doc.slug)),
              lastModified: doc.updatedAt ? new Date(doc.updatedAt) : undefined,
            })
          }
        }

        if (page >= result.totalPages) break
        page++
      }
    }
  }

  return mergeSitemapEntries([staticEntries, collectionEntries])
}

export const revalidate = 3600
