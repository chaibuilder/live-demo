import { LoginView } from '@payloadcms/next/views'
import { Banner } from '@payloadcms/ui'
import type { AdminViewServerProps } from 'payload'
import { adminUrl } from '@/utilities/adminRoute'

const POST_LOGIN_REDIRECT = adminUrl('editor')

export function CustomLoginView(props: AdminViewServerProps) {
  const redirect =
    typeof props.searchParams?.redirect === 'string'
      ? props.searchParams.redirect
      : POST_LOGIN_REDIRECT

  return (
    <>
      <Banner type="info" className="w-full">
        <div className="flex w-full flex-col gap-3">
          <div className="text-center font-medium">Login with these credentials</div>
          <div className="flex w-full justify-between items-center px-4">
            <span>
              Email : <strong>demo1@chaibuilder.com</strong>
            </span>
          </div>
          <div className="flex w-full justify-between items-center px-4">
            <span>
              Password : <strong>Demo#123</strong>
            </span>
          </div>
        </div>
      </Banner>
      {LoginView({
        ...props,
        searchParams: { ...props.searchParams, redirect },
      })}
    </>
  )
}
