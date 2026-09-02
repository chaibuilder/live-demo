/**
 * Put text on the clipboard, synchronously.
 *
 * `navigator.clipboard.writeText` is the modern API but it returns a promise and
 * requires the document to still be focused when it runs. Setup's main action
 * copies *and* opens the host's dashboard in a new tab, and the new tab takes
 * focus immediately — so an async write loses the race: it rejects with
 * "Document is not focused", or waits behind a permission prompt the user cannot
 * see because they are looking at the other tab. The clipboard then still holds
 * whatever it held before, which is the worst outcome for a screen whose whole
 * job is handing over secrets.
 *
 * `document.execCommand('copy')` is deprecated but synchronous, needs no
 * permission, and is supported in every browser this runs in. Doing it first
 * means the clipboard is written before anything can steal focus. The async API
 * remains as a fallback.
 */
export function copyText(text: string): boolean {
  if (typeof document === 'undefined') return false
  if (execCommandCopy(text)) return true

  // Nothing has navigated yet, so the document still holds focus and the async
  // API has a fair chance. Fire and forget — there is no synchronous answer.
  void navigator.clipboard?.writeText(text).catch(() => {})
  return false
}

/** The synchronous path: select text in an offscreen field and copy it. */
function execCommandCopy(text: string): boolean {
  const field = document.createElement('textarea')
  field.value = text
  // `readonly` stops iOS opening the keyboard; the field still selects.
  field.setAttribute('readonly', '')
  // Kept inside the viewport but invisible. A `display: none` or off-screen
  // element cannot be selected, and scrolling the page would be its own bug.
  field.style.position = 'fixed'
  field.style.top = '0'
  field.style.left = '0'
  field.style.width = '1px'
  field.style.height = '1px'
  field.style.padding = '0'
  field.style.border = 'none'
  field.style.opacity = '0'
  // iOS zooms toward a focused field whose text is smaller than 16px.
  field.style.fontSize = '16px'
  document.body.appendChild(field)

  const previouslyFocused = document.activeElement as HTMLElement | null

  let copied = false
  try {
    // `select()` alone is ignored by iOS Safari on a readonly field, and
    // `setSelectionRange` alone does not focus it — both are needed. Do NOT
    // reach for a Range over the element's contents: a textarea holds its text
    // in `value`, not in child nodes, so the Range selects nothing and
    // `execCommand` cheerfully reports success having copied an empty string.
    field.focus()
    field.select()
    field.setSelectionRange(0, text.length)

    copied = document.execCommand('copy')
  } catch {
    copied = false
  } finally {
    field.remove()
    // Give focus back, so the page the user was on behaves as they left it.
    previouslyFocused?.focus?.()
  }

  return copied
}
