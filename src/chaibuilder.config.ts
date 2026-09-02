/**
 * ChaiBuilder configuration — plain data, deliberately free of framework imports
 * (`next/headers` and friends) so scripts, CI, and the Payload CLI can import it.
 * Per-request concerns — auth, tenancy, draft, site URL — live in `chaibuilder.server.ts`.
 */
import { Blog } from '@/collections/Blog'
import config from '@payload-config'
import { openRouterPlugin as openRouterProvider } from 'chaipro/ai/openrouter'
import { createLibsqlDB } from 'chaipro/db/libsql'
import {
  asChaiBuilderGlobalProvider,
  buildChaiBuilderConfig,
  payloadMediaPlugin,
} from 'chaipro/payload'
import { aiPlugin } from 'chaipro/plugins/ai-pro/server'
import { animationPlugin } from 'chaipro/plugins/animation/server'
import { redirectsPlugin } from 'chaipro/plugins/redirects/server'
import { revisionsPlugin } from 'chaipro/plugins/revisions/server'
import { trashPlugin } from 'chaipro/plugins/trash/server'
import type { ResolvedChaiBuilderServerConfig } from 'chaipro/types'

/**
 * The eight models the editor offers, picked for web design and front-end work.
 * Most take images too, so a screenshot or mockup can be attached to the prompt;
 * the text-only ones say so via `allowedFileTypes: []`. Each model is described
 * once and mapped to the provider's own slug — Vercel AI Gateway and OpenRouter
 * disagree on some vendor prefixes (`xai` vs `x-ai`, `zai` vs `z-ai`), so the id
 * has to follow whichever provider is wired up.
 */
const AI_MODELS = [
  {
    gateway: 'anthropic/claude-opus-5',
    openrouter: 'anthropic/claude-opus-5',
    name: 'Claude Opus 5',
    provider: 'anthropic',
    multiplier: 5,
    description: '5x Credits',
  },
  {
    gateway: 'anthropic/claude-sonnet-5',
    openrouter: 'anthropic/claude-sonnet-5',
    name: 'Claude Sonnet 5',
    provider: 'anthropic',
    multiplier: 3,
    description: '3x Credits',
  },
  {
    gateway: 'openai/gpt-5.5',
    openrouter: 'openai/gpt-5.5',
    name: 'GPT-5.5',
    provider: 'openai',
    multiplier: 5,
    description: '5x Credits',
  },
  {
    gateway: 'google/gemini-3.6-flash',
    openrouter: 'google/gemini-3.6-flash',
    name: 'Gemini 3.6 Flash',
    provider: 'google',
    multiplier: 2,
    description: '2x Credits',
  },
  {
    gateway: 'xai/grok-4.5',
    openrouter: 'x-ai/grok-4.5',
    name: 'Grok 4.5',
    provider: 'xai',
    multiplier: 3,
    description: '3x Credits',
  },
  {
    gateway: 'moonshotai/kimi-k3',
    openrouter: 'moonshotai/kimi-k3',
    name: 'Kimi K3',
    provider: 'moonshotai',
    multiplier: 3,
    description: '3x Credits',
  },
  {
    gateway: 'zai/glm-5.2',
    openrouter: 'z-ai/glm-5.2',
    name: 'GLM 5.2',
    provider: 'zai',
    multiplier: 1,
    description: '1x Credits',
    // text-only model — it cannot read images/files
    allowedFileTypes: [],
  },
  {
    gateway: 'deepseek/deepseek-v4-pro',
    openrouter: 'deepseek/deepseek-v4-pro',
    name: 'DeepSeek V4 Pro',
    provider: 'deepseek',
    multiplier: 1,
    description: '1x Credits',
    // text-only model — it cannot read images/files
    allowedFileTypes: [],
  },
]

/**
 * Mirrors chaipro's own provider resolution: an `OPENROUTER_API_KEY` wins,
 * otherwise requests go through the Vercel AI Gateway (`AI_GATEWAY_API_KEY`).
 */
const aiModels = AI_MODELS.map(({ gateway, openrouter, ...model }) => ({
  ...model,
  id: process.env.OPENROUTER_API_KEY ? openrouter : gateway,
}))

const chaiConfig: Readonly<ResolvedChaiBuilderServerConfig> = buildChaiBuilderConfig({
  payloadConfig: config,
  db: createLibsqlDB({
    // Falls back to a placeholder so a deployment with no environment variables
    // still boots and can serve `/setup`. See `src/payload.config.ts`.
    url: process.env.DATABASE_URL || 'file:/tmp/chai-placeholder.db',
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  }),
  plugins: [
    // Payload-backed DAM (asset actions + media trash entity). Non-Payload
    // hosts would register mediaPlugin({ storage }) instead.
    payloadMediaPlugin(),
    redirectsPlugin(),
    trashPlugin(),
    aiPlugin(),
    revisionsPlugin({ drafts: true, maxRevisions: 10 }),
    animationPlugin(),
  ],
  ai: {
    providers: process.env.OPENROUTER_API_KEY ? [openRouterProvider] : undefined,
    models: aiModels,
  },
  globalDataProvider: asChaiBuilderGlobalProvider({ slug: 'site-config' }),
  pageTypes: [
    {
      collection: Blog,
      helpText: 'A blog post page',
      dynamicSegments: '/[a-zA-Z0-9-]+',
      dataProviderDepth: 2,
    }
  ],
  collections: [Blog],
})

export default chaiConfig
