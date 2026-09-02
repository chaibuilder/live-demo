import type { CollectionConfig } from 'payload'
import { mediaAccess } from '@/access/authenticated'
import { getMediaStoragePrefix } from '@/utilities/getAppStoragePrefix'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Site',
  },
  access: mediaAccess,
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'deletedAt',
      type: 'date',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'deletedBy',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
    /**
     * Declared here rather than left to `s3Storage`, which only injects a
     * `prefix` field when the bucket credentials happen to be set. That made the
     * database schema depend on environment variables: a deployment whose
     * migration was generated without storage configured, then run with it
     * configured, queries a `media.prefix` column that was never created.
     *
     * `s3Storage` reuses this field when it is already present, so the schema is
     * now identical either way. The default is a function on purpose — a literal
     * would be emitted as a column default, putting the app-specific prefix back
     * into the schema and reintroducing the same drift.
     */
    {
      name: 'prefix',
      type: 'text',
      admin: {
        hidden: true,
        readOnly: true,
      },
      defaultValue: () => getMediaStoragePrefix(),
    },
  ],
  upload: true,
}
