'use client'

import { useEffect, useRef, useState } from 'react'
import { copyText } from './copy-text'

/**
 * Copy-to-clipboard button with a short-lived confirmation. Used by the wizard,
 * the success screen and the optional media/AI forms.
 *
 * Copying is synchronous — see `copy-text` — so the confirmation reflects work
 * that has already happened rather than a promise that may still be waiting on
 * a permission prompt.
 */
export function CopyButton({
  value,
  label = 'Copy',
  copiedLabel = '✓ Copied',
  className,
  disabled,
}: {
  value: string
  label?: string
  copiedLabel?: string
  className?: string
  disabled?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Without this, the timeout fires after the button has gone (switching AI
  // provider, leaving a step) and React warns about setting state on unmounted.
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  return (
    <button
      type="button"
      className={className}
      disabled={disabled}
      onClick={() => {
        copyText(value)
        setCopied(true)
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(() => setCopied(false), 2500)
      }}
    >
      {copied ? copiedLabel : label}
    </button>
  )
}
