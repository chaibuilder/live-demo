import type { FieldHook } from 'payload'
import { sanitizeLexicalState } from './sanitizeLexicalState'

export const sanitizeRichTextField: FieldHook = ({ value }) => sanitizeLexicalState(value)
