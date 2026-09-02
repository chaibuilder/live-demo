import type { CollectionConfig } from 'payload'
import type { AppRole } from '@/access/authenticated'
import {
  appAdmin,
  appMember,
  getAppRoleForUser,
  setAppRoleForUser,
} from '@/access/authenticated'
import {
  buildForgotPasswordEmailHTML,
  buildForgotPasswordEmailSubject,
} from '@/utilities/passwordResetEmail'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    group: 'Admin',
  },
  access: {
    // Panel entry stays open to any active app member (editors/designers still use the CMS).
    admin: async ({ req }) => Boolean(await appMember({ req })),
    // Managing users is site-admin only: platform owner, or `app_users.role === 'admin'`.
    // Denying read to non-admins also hides the collection from their admin nav.
    create: appAdmin,
    read: appAdmin,
    update: appAdmin,
    // Deleting a user is global (cross-app) — restrict to the platform owner.
    delete: ({ req }) => req.user?.role === 'super_admin',
  },
  hooks: {
    // The app role is captured into req.context by the `appRole` field's beforeChange hook.
    // Persist it to `app_users` here, where the created/updated user's id is available.
    afterChange: [
      async ({ doc, req }) => {
        const role = (req.context?.appRole ?? undefined) as AppRole | undefined
        if (role) await setAppRoleForUser(String(doc.id), role)
        return doc
      },
    ],
  },
  auth: {
    forgotPassword: {
      expiration: 1000 * 60 * 60, // 1 hour
      generateEmailSubject: (args) =>
        buildForgotPasswordEmailSubject({
          token: args?.token ?? '',
          user: args?.user,
          req: args?.req,
        }),
      generateEmailHTML: (args) =>
        buildForgotPasswordEmailHTML({
          token: args?.token ?? '',
          user: args?.user,
          req: args?.req,
        }),
    },
  },
  fields: [
    {
      name: 'firstName',
      type: 'text',
      label: 'First Name',
    },
    {
      name: 'lastName',
      type: 'text',
      label: 'Last Name',
    },
    {
      name: 'role',
      type: 'select',
      options: [
        { value: 'super_admin', label: 'Super Admin' },
        { value: 'none', label: 'None' },
      ],
      defaultValue: 'none',
      // Available on req.user so access checks don't need a DB read.
      saveToJWT: true,
      // Field-level lock: only a super-admin may set/change role. Without this a
      // customer could PATCH their own record (self-update is allowed) and escalate
      // to super_admin. The webhook sets role via overrideAccess, which bypasses this.
      access: {
        create: ({ req }) => req.user?.role === 'super_admin',
        update: ({ req }) => req.user?.role === 'super_admin',
      },
    },
    {
      // App-scoped role. Virtual: never written to the `users` table — persisted to `app_users`
      // by the collection afterChange hook. A user added here stays `none` on the platform.
      name: 'appRole',
      type: 'select',
      virtual: true,
      label: 'App Role',
      options: [
        { value: 'admin', label: 'Admin' },
        { value: 'editor', label: 'Editor' },
        { value: 'designer', label: 'Designer' },
        { value: 'viewer', label: 'Viewer' },
        { value: 'user', label: 'User' },
      ],
      admin: {
        // Virtual fields default to readOnly; force it editable so admins can assign a role.
        readOnly: false,
        description:
          'Role for this app (stored in app_users). The platform "Role" above stays None.',
      },
      // Only a site admin may assign an app role.
      access: {
        create: async ({ req }) => Boolean(await appAdmin({ req })),
        update: async ({ req }) => Boolean(await appAdmin({ req })),
      },
      hooks: {
        // Populate each row from the user's active app_users membership.
        afterRead: [({ data }) => (data?.id ? getAppRoleForUser(String(data.id)) : null)],
        // Stash the submitted value for the collection afterChange hook (doc.id not yet known here).
        beforeChange: [
          ({ value, req }) => {
            req.context.appRole = value
            return value
          },
        ],
      },
    },
    // Email added by default
    // Add more fields as needed
  ],
}
