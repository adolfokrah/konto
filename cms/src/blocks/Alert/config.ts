import type { Block } from 'payload'

export const Alert: Block = {
  slug: 'alert',
  interfaceName: 'AlertBlock',
  fields: [
    {
      name: 'style',
      type: 'select',
      defaultValue: 'warning',
      options: [
        { label: 'Info', value: 'info' },
        { label: 'Warning', value: 'warning' },
        { label: 'Error', value: 'error' },
        { label: 'Success', value: 'success' },
      ],
      required: true,
    },
    {
      name: 'title',
      type: 'text',
      label: 'Alert Title',
      required: true,
    },
  ],
}
