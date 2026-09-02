import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getAppStoragePrefix, getMediaStoragePrefix } from '../../src/utilities/getAppStoragePrefix'

const PREFIX_RE = /^[0-9a-f]{20}$/

const APP_KEY = '926e3219-b756-4b17-856b-ad17c4fe139c'
const OTHER_APP_KEY = '3f5a1c88-2d94-4e07-b1aa-6c3e9f2d7b41'

describe('getAppStoragePrefix', () => {
  const env = process.env

  beforeEach(() => {
    process.env = { ...env }
    process.env.CHAIBUILDER_APP_KEY = APP_KEY
  })

  afterEach(() => {
    process.env = env
  })

  // The prefix shows up in object paths, so it must not read as a UUID: no
  // hyphens, and short enough that no complete UUID is published.
  it('returns 20 hex characters with no hyphens', () => {
    const prefix = getAppStoragePrefix()
    expect(prefix).toMatch(PREFIX_RE)
    expect(prefix).not.toContain('-')
  })

  it('does not publish the app key in full', () => {
    const prefix = getAppStoragePrefix()
    expect(prefix).not.toBe(APP_KEY)
    expect(prefix).not.toContain(APP_KEY.replace(/-/g, ''))
    // The final group is dropped, so those 48 bits are absent from the path.
    expect(prefix).not.toContain(APP_KEY.split('-').at(-1))
  })

  it('joins the surviving groups in reverse order', () => {
    const [first, second, third, fourth] = APP_KEY.split('-')
    expect(getAppStoragePrefix()).toBe(`${fourth}${third}${second}${first}`)
  })

  it('is stable for the same app key', () => {
    expect(getAppStoragePrefix()).toBe(getAppStoragePrefix())
  })

  it('changes when app key changes', () => {
    const a = getAppStoragePrefix()
    process.env.CHAIBUILDER_APP_KEY = OTHER_APP_KEY
    const b = getAppStoragePrefix()
    expect(a).not.toBe(b)
  })

  // The final group is dropped, so it cannot affect the folder. Harmless for
  // the `randomUUID()` keys `/setup` writes, but hand-picked sequential keys
  // that differ only in that group will share a folder.
  it("ignores the app key's final group", () => {
    expect(getAppStoragePrefix('00000000-0000-4000-8000-000000000001')).toBe(
      getAppStoragePrefix('00000000-0000-4000-8000-000000000002'),
    )
  })

  it('is unaffected by PAYLOAD_SECRET', () => {
    const before = getAppStoragePrefix()
    process.env.PAYLOAD_SECRET = 'totally-different-secret'
    expect(getAppStoragePrefix()).toBe(before)
  })

  it('accepts explicit appId override', () => {
    const fromEnv = getAppStoragePrefix()
    const fromArg = getAppStoragePrefix(APP_KEY)
    expect(fromArg).toBe(fromEnv)
  })

  it('throws when CHAIBUILDER_APP_KEY missing', () => {
    delete process.env.CHAIBUILDER_APP_KEY
    expect(() => getAppStoragePrefix()).toThrow(/CHAIBUILDER_APP_KEY/)
  })

  // Dropping a group off a key that has none would leave an empty prefix, so
  // anything not UUID-shaped has to be rejected — including a hyphen-less key
  // that carries all 32 hex characters.
  it.each([
    'my-site',
    'zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz',
    '926e3219b756',
    '926e3219b7564b17856bad17c4fe139c',
    '926e3219-b756-4b17-856b',
  ])('throws for a non-UUID app key (%j)', (key) => {
    expect(() => getAppStoragePrefix(key)).toThrow(/CHAIBUILDER_APP_KEY/)
  })

  // Pin expected output so an accidental change to the derivation is caught —
  // it would send new uploads to a different folder than every existing file.
  it('matches pinned output for a fixture app key', () => {
    expect(getAppStoragePrefix(APP_KEY)).toBe('856b4b17b756926e3219')
  })

  it('accepts an uppercase app key', () => {
    expect(getAppStoragePrefix(APP_KEY.toUpperCase())).toBe(getAppStoragePrefix(APP_KEY))
  })
})

describe('getMediaStoragePrefix', () => {
  const env = process.env

  beforeEach(() => {
    process.env = { ...env }
    process.env.CHAIBUILDER_APP_KEY = '00000000-0000-4000-8000-000000000001'
    process.env.BUCKET_NAME = 'media'
    process.env.AWS_ACCESS_KEY_ID = 'key'
    process.env.AWS_SECRET_ACCESS_KEY = 'secret'
  })

  afterEach(() => {
    process.env = env
  })

  it('returns the app storage prefix when the bucket is fully configured', () => {
    expect(getMediaStoragePrefix()).toBe(getAppStoragePrefix())
  })

  // Each of these leaves `s3Storage` unregistered, so uploads go to local disk
  // and carry no prefix. Throwing instead would break booting an unconfigured
  // deployment far enough to serve `/setup`.
  it.each(['BUCKET_NAME', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'CHAIBUILDER_APP_KEY'])(
    'returns an empty prefix when %s is missing',
    (missing) => {
      delete process.env[missing]
      expect(getMediaStoragePrefix()).toBe('')
    },
  )
})
