import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest): Promise<Response> {
  const draft = await draftMode()
  draft.disable()

  const { searchParams } = new URL(req.url)
  const path = searchParams.get('path')

  if (path && path.startsWith('/')) {
    redirect(path)
  }

  return new Response('Draft mode is disabled')
}
