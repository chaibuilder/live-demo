import type { CollectionConfig } from 'payload'
import { defaultRichTextValue } from '@payloadcms/richtext-lexical'
import { contentAccess } from '@/access/authenticated'
import { slugField } from '../fields/slugField'
import { sanitizeRichTextField } from '../fields/richTextFieldHooks'
import { richTextEditor } from '../fields/richTextEditor'

export const Blog: CollectionConfig = {
  slug: 'blog',
  labels: {
    singular: 'Blog',
    plural: 'Blogs',
  },
  defaultPopulate: {
    title: true,
    slug: true,
    categories: true,
  },
  admin: {
    defaultColumns: ['title', 'slug', 'updatedAt'],
    useAsTitle: 'title',
    group: 'Collections',
  },
  versions: { drafts: true },
  access: contentAccess,
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    slugField({
      localized: true,
      admin: {},
    }),
    {
      name: 'content',
      type: 'richText',
      localized: true,
      editor: richTextEditor,
      defaultValue: defaultRichTextValue,
      hooks: {
        afterRead: [sanitizeRichTextField],
        beforeChange: [sanitizeRichTextField],
      },
      label: false,
      required: true,
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Short summary of the post (used in listings and previews)',
        position: 'sidebar',
      },
    },
    {
      name: 'categories',
      type: 'relationship',
      admin: {
        position: 'sidebar',
      },
      hasMany: true,
      relationTo: 'blog-categories',
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData._status === 'published' && !value) {
              return new Date()
            }
            return value
          },
        ],
      },
    },
    {
      name: 'authors',
      type: 'relationship',
      admin: {
        position: 'sidebar',
      },
      hasMany: true,
      relationTo: 'users',
    },
  ],
  // Publish revalidation hooks are attached by chaiBuilderPlugin (payload.config.ts).
}
