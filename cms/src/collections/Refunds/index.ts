import type { CollectionConfig } from 'payload'
import { approveRefund } from './endpoints/approve-refund'
import { rejectRefund } from './endpoints/reject-refund'
import { notifyRefund } from './hooks/notify-refund'
import { syncLinkedTransaction } from './hooks/sync-linked-transaction'
import { notifyJarCreator } from './hooks/notify-jar-creator'

export const Refunds: CollectionConfig = {
  slug: 'refunds',
  labels: {
    singular: 'Refund',
    plural: 'Refunds',
  },
  admin: {
    useAsTitle: 'accountName',
    defaultColumns: ['accountName', 'amount', 'status', 'createdAt'],
  },
  access: {
    create: ({ req: { user } }) => (user as any)?.role === 'admin',
    read: ({ req: { user } }) => {
      if ((user as any)?.role === 'admin') return true
      if (user) return { initiatedBy: { equals: user.id } }
      return false
    },
    update: ({ req: { user } }) => (user as any)?.role === 'admin',
    delete: ({ req: { user } }) => (user as any)?.role === 'admin',
  },
  fields: [
    {
      name: 'initiatedBy',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      required: true,
      admin: {
        description: 'User who initiated the refund',
        readOnly: true,
      },
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      admin: {
        description: 'Refund amount (positive value)',
      },
    },
    {
      name: 'accountNumber',
      type: 'text',
      required: true,
      admin: {
        description: 'Contributor phone number or account number',
      },
    },
    {
      name: 'accountName',
      type: 'text',
      required: true,
      admin: {
        description: 'Contributor name',
      },
    },
    {
      name: 'mobileMoneyProvider',
      type: 'text',
      required: true,
      admin: {
        description: 'Mobile money provider (e.g. mtn, telecel)',
      },
    },
    {
      name: 'jar',
      type: 'relationship',
      relationTo: 'jars',
      required: true,
      hasMany: false,
      admin: {
        description: 'The jar this refund belongs to',
      },
    },
    {
      name: 'linkedTransaction',
      type: 'relationship',
      relationTo: 'transactions',
      hasMany: false,
      required: true,
      admin: {
        description: 'The original contribution being refunded',
        readOnly: true,
      },
    },
    {
      name: 'eganowFees',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: "Eganow's fees for this refund",
        readOnly: true,
      },
    },
    {
      name: 'hogapayRevenue',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: "Hogapay's revenue from this refund",
        readOnly: true,
      },
    },
    {
      name: 'transactionReference',
      type: 'text',
      required: false,
      admin: {
        description: 'Eganow transaction reference number',
        readOnly: true,
      },
    },
    {
      name: 'updatedBy',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      admin: {
        description: 'Admin who last updated (approved/rejected) this refund',
        readOnly: true,
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending (Awaiting Approval)', value: 'pending' },
        { label: 'In Progress', value: 'in-progress' },
        { label: 'Failed', value: 'failed' },
        { label: 'Completed', value: 'completed' },
      ],
    },
    {
      name: 'webhookResponse',
      type: 'json',
      required: false,
      admin: {
        description: 'Raw webhook payload received from the payment provider',
        readOnly: true,
      },
    },
  ],
  endpoints: [
    {
      path: '/approve-refund',
      method: 'post',
      handler: approveRefund,
    },
    {
      path: '/reject-refund',
      method: 'post',
      handler: rejectRefund,
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation, req }) => {
        if (operation === 'create' && req.user) {
          data.initiatedBy = req.user.id
        }
        if (operation === 'update' && req.user) {
          data.updatedBy = req.user.id
        }
        // Always store amount as negative
        if (data.amount != null && data.amount > 0) {
          data.amount = -Math.abs(data.amount)
        }
        return data
      },
    ],
    afterChange: [notifyRefund, syncLinkedTransaction, notifyJarCreator],
  },
}
