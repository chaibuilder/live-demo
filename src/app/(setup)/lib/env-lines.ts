/**
 * Formatting for the environment blocks setup hands back to the user.
 *
 * Kept free of server imports: the wizard, the success screen and the optional
 * media/AI forms all build their blocks in the browser.
 */

/**
 * One `KEY=value` line. Line breaks are stripped: a pasted value containing one
 * would split into a second, bogus variable when the block is pasted into a
 * host's environment settings.
 */
export function envLine(key: string, value: string): string {
  return `${key}=${value.replace(/[\r\n]+/g, ' ').trim()}`
}

/** Join lines into the block shown in a `<pre>` and copied to the clipboard. */
export function envBlock(lines: string[]): string {
  return lines.join('\n')
}
