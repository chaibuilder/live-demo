/** Canonical UUID: five hex groups of 8-4-4-4-12 characters. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

/**
 * Opaque, deterministic R2 folder id for the current app.
 *
 * The app key's final group is dropped and the remaining four are joined in
 * reverse order, giving 20 hex characters:
 *
 *     926e3219-b756-4b17-856b-ad17c4fe139c  ->  856b4b17b756926e3219
 *
 * Deliberately a pure function of the app key and nothing else: an app's folder
 * is fixed for the life of the app, and there is no constant here that anyone
 * can change to send new uploads to a second folder while old files stay behind
 * in the first.
 *
 * The dropped group keeps the whole app key out of object paths — those 48 bits
 * cannot be recovered from the prefix — and the reversal stops the remainder
 * from reading as the head of a UUID.
 */
export function getAppStoragePrefix(appId?: string): string {
  const appKey = appId ?? process.env.CHAIBUILDER_APP_KEY
  if (!appKey) {
    throw new Error('CHAIBUILDER_APP_KEY is required to compute storage prefix')
  }
  const normalized = appKey.toLowerCase()
  // `/setup` always writes a `randomUUID()`. Anything else is a hand-edited key,
  // and dropping a group off a value that has none would put files at the bucket
  // root or under a prefix short enough to collide — fail loudly instead.
  if (!UUID_RE.test(normalized)) {
    throw new Error('CHAIBUILDER_APP_KEY must be a UUID to compute storage prefix')
  }
  return normalized.split('-').slice(0, -1).reverse().join('')
}

/**
 * The prefix media files are actually stored under, or `''` when uploads go to
 * local disk. Bucket credentials and the app key are both required: without
 * either one, `s3Storage` is not registered and nothing is prefixed.
 *
 * Resolved per call rather than at module load so it stays a runtime value —
 * baking it into the database schema as a column default would make the schema
 * differ between deployments and between build and run.
 */
export function getMediaStoragePrefix(): string {
  const configured =
    process.env.BUCKET_NAME &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.CHAIBUILDER_APP_KEY
  return configured ? getAppStoragePrefix() : ''
}
