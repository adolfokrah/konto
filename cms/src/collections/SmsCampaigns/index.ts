import type { CollectionConfig } from 'payload'

export const SmsCampaigns: CollectionConfig = {
  slug: 'sms-campaigns',
  admin: {
    useAsTitle: 'message',
    defaultColumns: [
      'message',
      'status',
      'targetAudience',
      'recipientCount',
      'sentAt',
      'createdAt',
    ],
  },
  access: {
    create: ({ req: { user } }) => !!user,
    read: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  fields: [
    {
      name: 'message',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Max 200 characters',
      },
    },
    {
      name: 'targetAudience',
      type: 'select',
      options: [
        { label: 'All Users', value: 'all' },
        { label: 'Selected Users', value: 'selected' },
        { label: 'Android Users', value: 'android' },
        { label: 'iOS Users', value: 'ios' },
      ],
      defaultValue: 'all',
      required: true,
    },
    {
      name: 'recipients',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      required: false,
      admin: {
        description: 'Select specific users (only used when target audience is "Selected Users")',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Sending', value: 'sending' },
        { label: 'Sent', value: 'sent' },
        { label: 'Failed', value: 'failed' },
      ],
      defaultValue: 'draft',
      required: true,
    },
    {
      name: 'sentAt',
      type: 'date',
      required: false,
      admin: { readOnly: true },
    },
    {
      name: 'recipientCount',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true },
    },
    {
      name: 'successCount',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true },
    },
    {
      name: 'failureCount',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true },
    },
  ],
}
