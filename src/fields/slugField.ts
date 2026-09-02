import type { Field } from 'payload'

export const slugField = (
  options: { localized?: boolean; required?: boolean; admin?: any } = {},
): Field => ({
  name: 'slug',
  type: 'text',
  required: options.required !== false,
  unique: true,
  index: true,
  localized: options.localized || false,
  admin: {
    ...(options.admin !== undefined ? options.admin : { position: 'sidebar' }),
  },
  validate: (val: string | null | undefined) => {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    if (val && !slugRegex.test(val)) {
      return 'Slugs must only contain lowercase letters, numbers, and hyphens.'
    }
    return true // Validation passed
  },
})
