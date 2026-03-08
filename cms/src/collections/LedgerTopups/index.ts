import type { CollectionConfig } from 'payload'
import { initiateTopup } from './endpoints/initiate-topup'
import { eganowTopupWebhook } from './endpoints/eganow-topup-webhook'

export const LedgerTopups: CollectionConfig = {
  slug: 'ledger-topups',
  labels: {
    singular: 'Ledger Top-Up',
    plural: 'Ledger Top-Ups',
  },
  admin: {
    useAsTitle: 'transactionReference',
    defaultColumns: ['amount', 'provider', 'status', 'createdAt'],
  },
  access: {
    create: ({ req: { user } }) => (user as any)?.role === 'admin',
    read: ({ req: { user } }) => (user as any)?.role === 'admin',
    update: ({ req: { user } }) => (user as any)?.role === 'admin',
    delete: ({ req: { user } }) => (user as any)?.role === 'admin',
  },
  fields: [
    {
      name: 'amount',
      type: 'number',
      required: true,
      admin: {
        description: 'Top-up amount in GHS',
      },
    },
    {
      name: 'phoneNumber',
      type: 'text',
      required: true,
      admin: {
        description: 'Mobile money phone number used for top-up',
      },
    },
    {
      name: 'accountName',
      type: 'text',
      admin: {
        description: 'Account holder name from KYC lookup',
      },
    },
    {
      name: 'provider',
      type: 'select',
      required: true,
      options: [
        { label: 'MTN', value: 'mtn' },
        { label: 'Telecel', value: 'telecel' },
      ],
      admin: {
        description: 'Mobile money provider',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Completed', value: 'completed' },
        { label: 'Failed', value: 'failed' },
      ],
    },
    {
      name: 'transactionReference',
      type: 'text',
      admin: {
        description: 'Eganow transaction reference',
        readOnly: true,
      },
    },
    {
      name: 'initiatedBy',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      admin: {
        description: 'Admin who initiated this top-up',
        readOnly: true,
      },
    },
  ],
  endpoints: [
    {
      path: '/initiate-topup',
      method: 'post',
      handler: initiateTopup,
    },
    {
      path: '/eganow-topup-webhook',
      method: 'post',
      handler: eganowTopupWebhook,
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation, req }) => {
        if (operation === 'create' && req.user) {
          data.initiatedBy = req.user.id
        }
        return data
      },
    ],
  },
}
