import { registerCustomBlocks } from '@/blocks'
import { getChaiBuilder } from '@/chaibuilder.server'
import { registerProjectFonts } from '@/fonts'
import { ChaiPageCSS, RenderChaiBlocks } from 'chaipro/nextjs/render'
import { PreviewBanner } from 'chaipro/nextjs/render-client'
import { loadWebBlocks } from 'chaipro/web-blocks'
import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { AnalyticsScripts } from '@/components/AnalyticsScripts'

registerProjectFonts()
loadWebBlocks()
registerCustomBlocks()

/**
 * Per-visitor render of a demo sandbox. The proxy rewrites public paths here
 * whenever the request carries a valid sandbox cookie; anonymous visitors and
 * crawlers keep hitting the static showcase route. Throwaway content, so never
 * indexed.
 */
export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ slug?: string[] }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

const getSlugFromParams = (slug?: string[]) =>
  slug && slug.length > 0 ? `/${slug.join('/')}` : '/'

export const generateMetadata = async (props: PageProps): Promise<Metadata> => {
  const { slug: slugParams } = await props.params
  const slug = getSlugFromParams(slugParams)
  const cb = await getChaiBuilder(props)
  const metadataPayload = await cb.getPageMetadataPayload(slug)
  const metadata = await cb.generateMetaData(metadataPayload)
  return { ...metadata, robots: { index: false, follow: false } }
}

export default async function SandboxPage(props: PageProps) {
  const { slug: slugParams } = await props.params
  const slug = getSlugFromParams(slugParams)
  const cb = await getChaiBuilder(props)
  const { isEnabled } = await draftMode()
  const { page, settings, pageData, pageProps } = await cb.getPagePayload(slug)

  return (
    <html className={`scroll-smooth`} lang={page.lang}>
      <head>
        <ChaiPageCSS page={page} />
      </head>
      <body className={`font-body antialiased`}>
        <PreviewBanner show={isEnabled} />
        <RenderChaiBlocks pageData={pageData} settings={settings} page={page} pageProps={pageProps} />
        <AnalyticsScripts />
      </body>
    </html>
  )
}
