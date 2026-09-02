import { Analytics } from '@vercel/analytics/next'
import Script from 'next/script'

export function AnalyticsScripts() {
  return (
    <>
      <Analytics />
      {process.env.NEXT_PUBLIC_CLARITY_ID && (
        <Script id="clarity-script" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_CLARITY_ID}");
          `}
        </Script>
      )}
    </>
  )
}
