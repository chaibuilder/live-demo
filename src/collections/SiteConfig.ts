import { canWriteContent, memberOrPublished } from '@/access/authenticated'
import { createAppScopedSingletonCreate, resolveAppId } from 'chaipro/payload'
import { revalidateTag } from 'next/cache'
import type { CollectionConfig } from 'payload'

export const SiteConfig: CollectionConfig = {
  slug: 'site-config',
  labels: {
    singular: 'Config',
    plural: 'Config',
  },
  admin: {
    group: 'Site',
    description:
      'This is site config data available on all pages. To be used with data binding.',
    useAsTitle: 'name',
    defaultColumns: ['name', 'updatedAt'],
  },
  versions: {
    drafts: true,
  },
  // One config row per app. Plugin AND-s app scope on read/update/delete.
  access: {
    create: createAppScopedSingletonCreate('site-config', { roleAccess: canWriteContent }),
    read: memberOrPublished,
    update: canWriteContent,
    delete: canWriteContent,
  },
  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        if (doc?._status && doc._status !== 'published') return

        const appId = (typeof doc?.app === 'string' && doc.app) || (await resolveAppId({ req }))
        await Promise.all([
          revalidateTag(`global:site-config:${appId}`, 'max'),
          revalidateTag(`global:site-config`, 'max'),
          revalidateTag(`site-global-data-${appId}`, 'max'),
          revalidateTag(`site-global-data`, 'max'),
        ])
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Branding',
          fields: [
            {
              name: 'name',
              type: 'text',
              required: true,
              localized: true,
            },
            {
              name: 'tagline',
              type: 'text',
              required: true,
              localized: true,
            },
            {
              name: 'logo',
              type: 'upload',
              relationTo: 'media',
            },
            {
              name: 'favicon',
              type: 'upload',
              relationTo: 'media',
            },
          ],
        },
        {
          label: 'Business',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'contactEmail',
                  type: 'text',
                },
                {
                  name: 'contactPhone',
                  type: 'text',
                },
              ],
            },
            {
              name: 'physicalAddress',
              type: 'group',
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'addressLine1',
                      type: 'text',
                      localized: true,
                    },
                    {
                      name: 'addressLine2',
                      type: 'text',
                      localized: true,
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'city',
                      type: 'text',
                      localized: true,
                    },
                    {
                      name: 'state',
                      type: 'text',
                      localized: true,
                    },
                    {
                      name: 'zip',
                      type: 'text',
                    },
                  ],
                },
                {
                  name: 'location',
                  type: 'point',
                },
              ],
            },
          ],
        },
        {
          label: 'Social',
          fields: [
            {
              name: 'socialLinks',
              type: 'array',
              fields: [
                {
                  name: 'platform',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'url',
                  type: 'text',
                  required: true,
                },
              ],
            },
          ],
        },
        {
          label: 'Legal & Compliance',
          fields: [
            {
              name: 'privacyPolicyPage',
              type: 'text',
              localized: true,
            },
            {
              name: 'termsOfServicesPage',
              type: 'text',
              localized: true,
            },
          ],
        },
      ],
    },
  ],
}
