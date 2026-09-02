/**
 * Processes media resource URL to ensure proper formatting
 * @param url The original URL from the resource
 * @param cacheTag Optional cache tag to append to the URL
 * @returns Properly formatted URL with cache tag if provided
 *
 * Local paths (e.g. `/api/media/file/image.webp`) are kept relative so
 * Next.js image optimization treats them as local rather than fetching
 * through `remotePatterns`, which blocks private IPs since Next.js 16.
 */
export const getMediaUrl = (url: string | null | undefined, cacheTag?: string | null): string => {
  if (!url) return ''
  if (!cacheTag) return url

  try {
    const urlObj = new URL(url, 'http://payload.local')
    urlObj.searchParams.set('t', String(cacheTag))
    return `${urlObj.pathname}${urlObj.search}`
  } catch {
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}t=${encodeURIComponent(String(cacheTag))}`
  }
}
