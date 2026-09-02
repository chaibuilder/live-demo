import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { chaiBuilderPlugin, chaiBuilderSchemaHookSqlite } from 'chaipro/payload'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { Blog } from './collections/Blog'
import { BlogCategories } from './collections/BlogCategories'
import { FormSubmissions } from './collections/FormSubmissions'
import { Media } from './collections/Media'
import { SiteConfig } from './collections/SiteConfig'
import { Users } from './collections/Users'

import { getAdminRoute } from '@/utilities/adminRoute'
import { getMediaStoragePrefix } from '@/utilities/getAppStoragePrefix'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * Placeholder connection used when DATABASE_URL is unset. A fresh deployment
 * (e.g. "Deploy to Vercel" with no environment variables) must still boot far
 * enough to serve `/setup`; every other route is redirected there by
 * `src/proxy.ts`, so this database is never actually read from or written to.
 */
const PLACEHOLDER_DATABASE_URL = 'file:/tmp/chai-placeholder.db'
const PLACEHOLDER_SECRET = 'chai-unconfigured-placeholder-secret'

export type PayloadConfigOverrides = {
  /**
   * Database connection as a single unit. A caller supplying a URL supplies its
   * token too — merging an override URL with the environment's token would send
   * one database's credentials to another.
   */
  database?: { url: string; authToken?: string }
  secret?: string
}

/**
 * Media uploads only survive a redeploy when object storage is configured; the
 * `/setup` status page surfaces this so the user is not silently losing files.
 */
export const mediaStorageActive = Boolean(
  process.env.BUCKET_NAME && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY,
)

/**
 * Resolve which database to connect to.
 *
 * All-or-nothing on purpose: an override supplies both the URL and its token, or
 * neither. Falling back to `DATABASE_AUTH_TOKEN` for an overridden URL would send
 * one database's credentials to another, which fails as a confusing auth error.
 */
export function resolveDatabase(
  override?: { url: string; authToken?: string },
): { url: string; authToken: string | undefined } {
  if (override) return { url: override.url, authToken: override.authToken || undefined }
  return {
    url: process.env.DATABASE_URL || PLACEHOLDER_DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  }
}

/**
 * Builds the Payload config. The overrides let the `/setup` wizard boot a
 * throwaway instance against credentials the user has just typed in, before
 * those credentials exist as environment variables on the deployment.
 */
export function buildPayloadConfig(overrides: PayloadConfigOverrides = {}) {
  const { url: databaseUrl, authToken: databaseAuthToken } = resolveDatabase(overrides.database)
  const secret = overrides.secret || process.env.PAYLOAD_SECRET || PLACEHOLDER_SECRET
  const mediaStoragePrefix = getMediaStoragePrefix()

  return buildConfig({
    routes: {
      admin: getAdminRoute(),
    },
    localization: {
      defaultLocale: 'en',
      locales: ['en'],
      fallback: true,
    },
    admin: {
      user: Users.slug,
      importMap: {
        baseDir: path.resolve(dirname),
      },
      meta: {
        titleSuffix: '| ChaiBuilder',
        description: 'ChaiBuilder CMS',
        icons: [
          {
            rel: 'icon',
            type: 'image/svg+xml',
            url: '/favicon.svg',
          },
        ],
        openGraph: {
          title: 'ChaiBuilder',
          siteName: 'ChaiBuilder',
          images: [
            {
              url: '/favicon.svg',
              width: 48,
              height: 48,
            },
          ],
        },
      },
      components: {
        providers: ['chaipro/payload/client#IframeBridge'],
        graphics: {
          Logo: '@/components/admin/Logo#Logo',
          Icon: '@/components/admin/Icon#Icon',
        },
        views: {
          login: {
            Component: '@/components/CustomLoginView#CustomLoginView',
          },
        },
      },
      theme: 'dark',
    },
    collections: [Users, Blog, BlogCategories, Media, SiteConfig, FormSubmissions],
    globals: [],
    editor: lexicalEditor(),
    secret,
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
    db: sqliteAdapter({
      client: {
        url: databaseUrl,
        authToken: databaseAuthToken,
      },
      push: process.env.PAYLOAD_DB_PUSH === 'true',
      beforeSchemaInit: [chaiBuilderSchemaHookSqlite],
      idType: 'uuid',
      transactionOptions: {},
      migrationDir: path.resolve(dirname, 'migrations'),
      // Deliberately no `prodMigrations`: it migrates on every production
      // `payload.init`, including during `next build`. Against a database whose
      // schema came from Drizzle push, that hits an interactive "data loss will
      // occur" prompt which has nothing to answer it, and the build hangs.
      // `/setup` migrates explicitly instead; upgrades run `payload migrate`.
    }),
    sharp,
    plugins: [
      seoPlugin({
        collections: ['blog', 'site-config'],
        uploadsCollection: 'media',
        generateTitle: ({ doc }) => doc?.title || doc?.name || '',
        generateDescription: ({ doc }) => doc?.excerpt || doc?.tagline || doc?.title || '',
        tabbedUI: true,
      }),
      chaiBuilderPlugin({
        revalidateCollections: ['blog'],
        appCollections: [
          'blog',
          'blog-categories',
          'media',
          'site-config',
          'form-submissions',
        ],
      }),
      // Local disk uploads do not survive a redeploy on serverless hosts, so S3
      // is registered whenever the bucket credentials are present. The app key
      // is required too, since the storage prefix is derived from it — an empty
      // prefix means one of the two is missing.
      ...(mediaStoragePrefix
        ? [
            s3Storage({
              collections: {
                media: { prefix: mediaStoragePrefix },
              },
              bucket: process.env.BUCKET_NAME!,
              config: {
                forcePathStyle: true,
                credentials: {
                  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
                },
                region: process.env.S3_REGION || 'auto',
                endpoint: process.env.S3_ENDPOINT || undefined,
              },
            }),
          ]
        : []),
    ],
  })
}

export default buildPayloadConfig()
