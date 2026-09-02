'use client'

import { useCallback } from 'react'

import { logoutAction } from '@/app/(builder)/admin/actions/logout'
import { registerCustomBlocks } from '@/blocks'
import { registerProjectFonts } from '@/fonts'
import { adminUrl } from '@/utilities/adminRoute'
import { defaultChaiLibrary, registerChaiLibrary } from 'chaipro'
import { ChaiWebsiteBuilder } from 'chaipro/payload/builder'
import { aiProClientPlugin } from 'chaipro/plugins/ai-pro/client'
import { animationClientPlugin } from 'chaipro/plugins/animation/client'
import { pageErrorsClientPlugin } from 'chaipro/plugins/page-errors/client'
import { redirectsClientPlugin } from 'chaipro/plugins/redirects/client'
import { revisionsClientPlugin } from 'chaipro/plugins/revisions/client'
import { trashClientPlugin } from 'chaipro/plugins/trash/client'

// Mirrors the server list in src/chaibuilder.config.ts — only these feature
// UIs ship in the editor bundle. One import per plugin (not the
// `chaipro/plugins/client` barrel) so an unused feature UI cannot reach the
// chunk. media/form-submissions have no client UI; pageErrors is client-only
// (no server counterpart).
const chaiClientPlugins = [
  redirectsClientPlugin,
  trashClientPlugin,
  aiProClientPlugin,
  pageErrorsClientPlugin,
  revisionsClientPlugin,
  animationClientPlugin,
]

registerProjectFonts()
registerCustomBlocks()
registerChaiLibrary('chai-library', defaultChaiLibrary())

export default function Editor({ accessToken }: { accessToken: string }) {
  const getAccessToken = useCallback(async () => accessToken, [accessToken])
  const getPreviewUrl = useCallback((path: string) => `/next/preview?path=${path}`, [])
  const getLiveUrl = useCallback((path: string) => `/next/exit-preview?path=${path}`, [])

  const logoutUser = useCallback(async () => {
    await logoutAction()
    window.location.href = adminUrl('login')
  }, [])

  return (
    <>
      <ChaiWebsiteBuilder
        onError={(error) => {
          console.error(error)
        }}
        autoSave
        autoSaveActionsCount={5}
        plugins={chaiClientPlugins}
        getAccessToken={getAccessToken}
        apiUrl="api"
        getPreviewUrl={getPreviewUrl}
        getLiveUrl={getLiveUrl}
        onLogout={logoutUser}
        currentUser={null}
      />
    </>
  )
}
