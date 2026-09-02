'use client'

import * as React from 'react'
import { useState } from 'react'
import { ChaiBlockComponentProps } from 'chaipro/types'
import { formSubmit } from './action'

type FormJSON = Record<string, string | boolean | number | null>
type ChaiStyles = Record<string, string>

function getFormData(form: HTMLFormElement): FormJSON {
  const result: FormJSON = {}
  const fd = new FormData(form)

  for (const [k, v] of fd.entries()) {
    if (v instanceof File) continue
    result[k] = v
  }

  const elements = Array.from(form.elements) as Element[]
  const boolGroups = new Map<string, HTMLInputElement[]>()

  for (const el of elements) {
    if (
      el instanceof HTMLInputElement &&
      (el.type === 'checkbox' || el.type === 'radio') &&
      el.name
    ) {
      const arr = boolGroups.get(el.name) ?? []
      arr.push(el)
      boolGroups.set(el.name, arr)
    }
  }

  for (const [name, group] of boolGroups.entries()) {
    const isChecked = group.some((i) => i.checked)
    result[name] = isChecked
  }

  return result
}

const getAdditionalData = () => {
  const pageUrl = typeof window !== 'undefined' ? window.location.href : ''
  const referrer = typeof window !== 'undefined' ? document.referrer : ''
  const pageTitle = typeof window !== 'undefined' ? document.title : ''

  return {
    pageUrl,
    referrer,
    pageTitle,
  }
}

const SubmissionResponse = ({
  state,
  successMessage,
  errorMessage,
}: {
  state: string
  successMessage: string
  errorMessage: string
}) => {
  if (state === '' || state === 'loading') return null

  if (state === 'success') {
    return (
      <div className="text-green-500" dangerouslySetInnerHTML={{ __html: successMessage }}></div>
    )
  }

  if (state === 'error') {
    return <div className="text-red-500" dangerouslySetInnerHTML={{ __html: errorMessage }}></div>
  }
}

const FormComponent = ({
  blockProps,
  styles,
  formName,
  children,
  errorMessage,
  successMessage,
  inBuilder,
}: {
  blockProps: React.HTMLAttributes<HTMLFormElement>
  styles: ChaiStyles
  formName: string
  children: React.ReactNode
  successMessage: string
  errorMessage: string
  inBuilder: boolean
}) => {
  const [state, setState] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (inBuilder) return

    setState('loading')
    try {
      const form = e.currentTarget
      const formData = getFormData(form)
      const additionalData = getAdditionalData()

      const result = await formSubmit({ formData, additionalData })
      setState(result.success ? 'success' : 'error')

      if (result.success) {
        form.reset()
      }
    } catch (error) {
      console.error('Form submission error:', error)
      setState('error')
    }
  }

  return (
    <form
      method="POST"
      onSubmit={handleSubmit}
      {...blockProps}
      {...styles}
      className={`relative ${styles?.className || ''} ${blockProps?.className || ''}`}
    >
      <input type="hidden" value={formName} name="formName" readOnly hidden />
      <fieldset disabled={state === 'loading'}>{children as React.ReactNode}</fieldset>
      <SubmissionResponse
        state={state}
        successMessage={successMessage}
        errorMessage={errorMessage}
      />
    </form>
  )
}

type ChaiFormProps = {
  successMessage: string
  errorMessage: string
  styles: ChaiStyles
  inBuilder: boolean
  formName: string
  children: React.ReactNode
}

const ChaiForm = (props: ChaiBlockComponentProps<ChaiFormProps>) => {
  return (
    <FormComponent
      {...props}
      blockProps={props.blockProps as React.HTMLAttributes<HTMLFormElement>}
    />
  )
}

export default ChaiForm
