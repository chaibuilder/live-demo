'use client'

const LOGO_URL = '/favicon.svg'

export function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <img
        src={LOGO_URL}
        alt="ChaiBuilder"
        width={48}
        height={48}
        style={{ maxWidth: '100%', height: 'auto', borderRadius: '10px' }}
      />
      <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'currentColor' }}>
        ChaiBuilder
      </span>
    </div>
  )
}
