// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { saveFormSubmission } from '@/blocks/form/action'

const APP = '00000000-0000-4000-8000-000000000099'

describe('saveFormSubmission', () => {
  const env = process.env
  let payload: Payload

  beforeEach(async () => {
    process.env = { ...env, CHAIBUILDER_APP_KEY: APP }
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  afterEach(() => {
    process.env = env
  })

  it('creates a form submission that can be retrieved', async () => {
    const formData = {
      formName: 'contact',
      email: 'test@example.com',
      message: 'Hello',
    }
    const additionalData = { pageUrl: 'https://example.com/contact' }

    await saveFormSubmission({ formData, additionalData })

    const found = await payload.find({
      collection: 'form-submissions',
      where: {
        and: [
          { app: { equals: APP } },
          { formName: { equals: 'contact' } },
          { pageUrl: { equals: 'https://example.com/contact' } },
        ],
      },
    })

    expect(found.docs).toHaveLength(1)
    expect(found.docs[0].formData).toEqual(formData)
    expect(found.docs[0].additionalData).toEqual(additionalData)

    await payload.delete({ collection: 'form-submissions', id: found.docs[0].id })
  })

  it('defaults additionalData to empty object', async () => {
    await saveFormSubmission({
      formData: { formName: 'newsletter', email: 'sub@example.com' },
    })

    const found = await payload.find({
      collection: 'form-submissions',
      where: {
        and: [{ app: { equals: APP } }, { formName: { equals: 'newsletter' } }],
      },
    })

    expect(found.docs).toHaveLength(1)
    expect(found.docs[0].additionalData).toEqual({})
    expect(found.docs[0].pageUrl).toBe('')

    await payload.delete({ collection: 'form-submissions', id: found.docs[0].id })
  })
})
