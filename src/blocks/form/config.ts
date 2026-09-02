import { registerChaiBlockProps, stylesProp } from 'chaipro/registry'

const FormConfig = {
  type: 'Form',
  label: 'Form',
  category: 'core',
  group: 'form',
  blocks: () => [
    { _type: 'Form', _id: 'form', styles: '#styles:,p-1 space-y-2' },
    { _type: 'Input', _id: 'form_input', _parent: 'form', styles: '#styles:,' },
    {
      _type: 'FormButton',
      _id: 'form_submit_btn',
      _parent: 'form',
      styles: '#styles:,bg-black text-white rounded px-3 py-1',
    },
  ],
  props: registerChaiBlockProps({
    properties: {
      styles: stylesProp(''),
      formName: {
        type: 'string',
        title: 'Form Name',
        default: 'contact',
      },
      successMessage: {
        type: 'string',
        title: 'Success Message',
        default: 'Form submitted successfully.',
        ui: { 'ui:widget': 'richtext' },
      },
      errorMessage: {
        type: 'string',
        title: 'Error Message',
        default: 'Something went wrong. Please try again.',
        ui: { 'ui:widget': 'richtext' },
      },
    },
  }),
  i18nProps: ['errorMessage', 'successMessage'],
  canAcceptBlock: () => true,
}

export { FormConfig }
