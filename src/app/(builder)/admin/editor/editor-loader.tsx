'use client'

import dynamic from 'next/dynamic'

const Editor = dynamic(() => import('./editor'), { ssr: false })

export default function EditorLoader({ accessToken }: { accessToken: string }) {
  return <Editor accessToken={accessToken} />
}
