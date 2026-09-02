import { LoginView } from '@payloadcms/next/views'
import type { AdminViewServerProps } from 'payload'
import { adminUrl } from '@/utilities/adminRoute'

const POST_LOGIN_REDIRECT = adminUrl('editor')

export function CustomLoginView(props: AdminViewServerProps) {
  const redirect =
    typeof props.searchParams?.redirect === 'string'
      ? props.searchParams.redirect
      : POST_LOGIN_REDIRECT

  return LoginView({
    ...props,
    searchParams: { ...props.searchParams, redirect },
  })
}
