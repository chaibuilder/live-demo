import type { Metadata, Viewport } from 'next'
import './setup.css'

/**
 * Setup is never a page anyone should reach from a search result: before it runs
 * it accepts credentials, and after it runs it reports on the site's own
 * configuration. `nocache` and the explicit Googlebot block matter as much as
 * `index: false` — without them a page that was crawled once can stay in the
 * index as a cached copy.
 */
export const metadata: Metadata = {
  title: 'Set up your site | ChaiBuilder',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
}

/**
 * Declared explicitly rather than relying on the framework default: the shell is
 * exactly one viewport tall, so a phone that lays the page out at desktop width
 * would push the primary button off-screen. `viewportFit: 'cover'` lets the
 * stylesheet pad for notches and home indicators via `env(safe-area-inset-*)`.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
