import type React from 'react'

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <style
        // biome-ignore lint/security/noDangerouslySetInnerHtml: intentional CSS injection
        dangerouslySetInnerHTML={{
          __html: `
            .nav,
            .nav__wrap,
            .nav__scroll,
            .nav__header,
            .doc-header,
            .nav__footer,
            button[aria-label='Open Menu'],
            button[aria-label='invisible'],
            button[aria-label='Account'] {
              display: none !important;
            }

            [class*='step-nav'] { display: none !important; }

            .template-default,
            .template-default__wrap {
              padding-left: 0 !important;
              margin-left: 0 !important;
            }

            .app, .app__wrap { padding: 0 !important; }

            body, html, .app, .payload { background: transparent !important; }

            .doc-controls,
            .doc-controls__content { display: flex !important; }
            .template-default, .template-default--nav-open{ grid-template-columns: auto!important}
            

          `,
        }}
      />
      {children}
    </>
  )
}
