'use client'

const ICON_URL = '/favicon.svg'

export function Icon() {
  return (
    <img src={ICON_URL} alt="ChaiBuilder" style={{ borderRadius: '8px' }} width={28} height={28} />
  )
}
