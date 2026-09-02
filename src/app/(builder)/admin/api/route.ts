import { getChaiBuilder } from '@/chaibuilder.server'
import { handleChaiActionRequest, type ChaiBuilderRouteProps } from 'chaipro/nextjs/server'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest, props: ChaiBuilderRouteProps) {
  const cb = await getChaiBuilder(props, req as any)
  return handleChaiActionRequest(req, cb.handleHttpAction)
}
