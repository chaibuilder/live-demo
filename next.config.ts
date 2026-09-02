import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'
import { getAdminRouteSegment, isCustomAdminRoute } from './src/utilities/adminRoute'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const adminRouteSegment = getAdminRouteSegment()

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_PAYLOAD_ADMIN_ROUTE: adminRouteSegment,
  },
  serverExternalPackages: ['tailwindcss'],
  // Page-style dedup reads public/chaistyles.css from the server at runtime (fs.readFile with a
  // computed path), which file tracing can't see — include it in every serverless function.
  outputFileTracingIncludes: {
    '/**': ['./public/chaistyles.css'],
  },
  async rewrites() {
    if (!isCustomAdminRoute()) {
      return []
    }

    return [
      {
        source: `/${adminRouteSegment}`,
        destination: '/admin',
      },
      {
        source: `/${adminRouteSegment}/:path*`,
        destination: '/admin/:path*',
      },
    ]
  },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
    remotePatterns: [
      {
        hostname: '*.chaibuilder.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: '*.picsum.photos',
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    webpackConfig.resolve.alias = {
      ...webpackConfig.resolve.alias,
      '@chaibuilder-config': path.resolve(dirname, 'src/chaibuilder.config.ts'),
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
    resolveAlias: {
      '@chaibuilder-config': './src/chaibuilder.config.ts',
    },
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
