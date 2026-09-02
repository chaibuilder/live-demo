import type { CollectionConfig, FieldHook } from 'payload'
import { contentAccess } from '@/access/authenticated'

const slugHook: FieldHook = ({ value, data }) => {
  if (value)
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
  if (data?.name)
    return data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
  return value
}

export const BlogCategories: CollectionConfig = {
  slug: 'blog-categories',
  labels: { singular: 'Blog Category', plural: 'Blog Categories' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug'],
    group: 'Collections',
  },
  versions: { drafts: true },
  access: contentAccess,
  fields: [
    { name: 'name', type: 'text', required: true, localized: true },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      required: true,
      localized: true,
      admin: { position: 'sidebar' },
      hooks: { beforeValidate: [slugHook] },
    },
    { name: 'description', type: 'textarea', localized: true },
  ],
}
