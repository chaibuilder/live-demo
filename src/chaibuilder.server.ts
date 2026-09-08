import config from '@/chaibuilder.config'
import { resolveDemoSandboxAppId } from '@/lib/demo-sandbox/resolve-app-id'
import { createPayloadChaiBuilder } from 'chaipro/payload'

/**
 * The ChaiBuilder server handle for this app. Every server entry point imports `getChaiBuilder`
 * from here; creating the handle is what registers the request context, so there is no
 * separate registration step to forget.
 *
 * Everything the context needs comes from Payload: identity from the auth cookie or
 * `Authorization` header, tenant from `CHAIBUILDER_APP_KEY`, draft state, and the site origin.
 * What a user may do comes from their `app_users` membership — a Payload login by itself grants
 * no builder access.
 */
export const { getChaiBuilder } = createPayloadChaiBuilder(config, {
  // Sandbox mode (DEMO_SANDBOX=true): tenant comes from the signed sandbox
  // cookie; otherwise this resolves to CHAIBUILDER_APP_KEY as before.
  appId: resolveDemoSandboxAppId,
})
