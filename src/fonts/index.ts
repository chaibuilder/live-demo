import { registerChaiFont } from 'chaipro/registry'
import type { ChaiFontBySrc } from 'chaipro/types'

let didRegister = false

type ProjectFont = {
  family: string
  fallback: string
  path: string
}

const PROJECT_FONTS: ProjectFont[] = [
  { family: 'Inter', fallback: 'ui-sans-serif, system-ui, sans-serif', path: '/fonts/inter/inter-latin-wght-normal.woff2' },
  { family: 'Geist', fallback: 'ui-sans-serif, system-ui, sans-serif', path: '/fonts/geist/geist-variable.woff2' },
  { family: 'Roboto', fallback: 'ui-sans-serif, system-ui, sans-serif', path: '/fonts/roboto/roboto-latin-wght-normal.woff2' },
  { family: 'Open Sans', fallback: 'ui-sans-serif, system-ui, sans-serif', path: '/fonts/open-sans/open-sans-latin-wght-normal.woff2' },
  { family: 'Plus Jakarta Sans', fallback: 'ui-sans-serif, system-ui, sans-serif', path: '/fonts/plus-jakarta-sans/plus-jakarta-sans-latin-wght-normal.woff2' },
  { family: 'Montserrat', fallback: 'ui-sans-serif, system-ui, sans-serif', path: '/fonts/montserrat/montserrat-latin-wght-normal.woff2' },
  { family: 'DM Sans', fallback: 'ui-sans-serif, system-ui, sans-serif', path: '/fonts/dm-sans/dm-sans-latin-wght-normal.woff2' },
]

const toChaiFont = (font: ProjectFont): Omit<ChaiFontBySrc, 'family'> => ({
  fallback: font.fallback,
  src: [
    {
      url: font.path,
      format: 'woff2',
      fontWeight: '100 900',
      fontStyle: 'normal',
      fontDisplay: 'swap',
    },
  ],
})

/** Register self-hosted fonts for builder theme UI and public page render. Idempotent. */
export function registerProjectFonts(): void {
  if (didRegister) return
  didRegister = true
  for (const font of PROJECT_FONTS) {
    registerChaiFont(font.family, toChaiFont(font) as Omit<ChaiFontBySrc, 'family'>)
  }
}
