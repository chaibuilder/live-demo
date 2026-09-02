/**
 * A link that opens in a new tab, which is every link setup shows.
 *
 * The success screen prints the only copy of the generated secrets the user
 * will ever see, so following a link away from it — to the host's settings, of
 * all places — would lose them. The rest of the flow follows the same rule so
 * the behaviour is not a surprise on one screen and not another.
 *
 * `rel` is not optional company for `target="_blank"`: without `noopener` the
 * opened page gets a handle on this one through `window.opener`.
 */
export function NewTabLink({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <a href={href} className={className} target="_blank" rel="noopener noreferrer">
      {children}
      {/* Sighted users have the tab appear in front of them; screen-reader
          users get told, rather than losing their place silently. */}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}
