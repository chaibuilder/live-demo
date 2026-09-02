import { getMeUser } from '@/utilities/getMeUser'
import EditorLoader from './editor-loader'

export default async function EditorPage() {
  const { token } = await getMeUser()
  return <EditorLoader accessToken={token} />
}
