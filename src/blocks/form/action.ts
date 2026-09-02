'use server'
import config from '@payload-config'
import type { FormSubmission } from '@/payload-types'
import { getPayload } from 'payload'

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

export interface FormSubmissionData {
  formData: Record<string, JsonValue>
  additionalData?: Record<string, JsonValue>
}

export async function saveFormSubmission({ formData, additionalData = {} }: FormSubmissionData) {
  const formName = (formData.formName as string) || 'contact'
  const pageUrl = (additionalData.pageUrl as string) || ''

  if (typeof formName !== 'string' || formName.length > 255) {
    throw new Error('Invalid formName')
  }

  const app = process.env.CHAIBUILDER_APP_KEY
  if (!app) {
    throw new Error('CHAIBUILDER_APP_KEY not set')
  }

  const payloadConfig = await config
  const payloadCMS = await getPayload({ config: payloadConfig })

  await payloadCMS.create({
    collection: 'form-submissions',
    data: {
      app,
      formName,
      formData: formData as FormSubmission['formData'],
      additionalData: additionalData as FormSubmission['additionalData'],
      pageUrl,
    },
    overrideAccess: true,
  })
}

export async function formSubmit(data: FormSubmissionData) {
  try {
    const { formData, additionalData = {} } = data

    await saveFormSubmission({ formData, additionalData })

    return { success: true }
  } catch (error) {
    console.error('Form submission error:', error)
    return { success: false }
  }
}
