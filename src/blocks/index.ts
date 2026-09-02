import { registerChaiBlock } from 'chaipro/registry'
import dynamic from 'next/dynamic'
import { FormConfig } from './form/config'

//Important: Dynamic import is required for custom blocks
const ChaiForm = dynamic(() => import('./form/component'))

export const registerCustomBlocks = () => {
  registerChaiBlock(ChaiForm, FormConfig)
}
