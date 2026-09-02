import config from '@payload-config'
import { RootPage } from '@payloadcms/next/views'
import { importMap } from '../../importMap'

type Args = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] }>
}

export default async function EmbedPage({ params, searchParams }: Args) {
  return RootPage({ config, params, searchParams, importMap })
}
