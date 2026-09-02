import type { Metadata } from 'next'
import './public.css'

export const metadata: Metadata = {
  title: 'ChaiBuilder',
  description: 'ChaiBuilder',
  icons: {
    icon: '/favicon.svg',
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
