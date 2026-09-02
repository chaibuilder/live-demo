import { getMeUser } from '@/utilities/getMeUser'
import { adminUrl } from '@/utilities/adminRoute'
import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './builder.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ChaiBuilder Editor',
  description: 'ChaiBuilder Editor',
  icons: {
    icon: '/favicon.svg',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Protect the route - redirect to login if not authenticated
  await getMeUser({
    nullUserRedirect: `${adminUrl('login')}?redirect=${encodeURIComponent(adminUrl('editor'))}`,
  })

  return (
    <html lang="en" className="dark">
      <body className={geist.className}>{children}</body>
    </html>
  )
}
