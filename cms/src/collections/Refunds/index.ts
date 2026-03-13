import type { CollectionConfig } from 'payload'
import { approveRefund } from './endpoints/approve-refund'
import { rejectRefund } from './endpoints/reject-refund'
import { approveAutoRefunds } from './endpoints/approve-auto-refunds'
import { rejectAutoRefunds } from './endpoints/reject-auto-refunds'
import { notifyRefund } from './hooks/notify-refund'
import { syncLinkedTransaction } from './hooks/sync-linked-transaction'
import { notifyJarCreator } from './hooks/notify-jar-creator'
import { checkAutoRefundCompletion } from './hooks/check-auto-refund-completion'

export const Refunds: CollectionConfig = {
  slug: 'refunds',
  labels: {
    singular: 'Refund',
    plural: 'Refunds',
  },
  admin: {
    useAsTitle: 'accountName',
    defaultColumns: ['refundType', 'accountName', 'amount', 'status', 'createdAt'],
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
      name: 'refundType',
      type: 'select',
      required: true,
      defaultValue: 'manual',
      options: [
        { label: 'Manual', value: 'manual' },
        { label: 'Auto (System)', value: 'auto' },
      ],
    },
    {
      name: 'jar',
      type: 'relationship',
      relationTo: 'jars',
      required: true,
      hasMany: false,
    },
    {
      name: 'initiatedBy',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      required: false,
      admin: {
        description: 'Admin who initiated the refund. Null when triggered by the system.',
        readOnly: true,
      },
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      admin: { description: 'Refund amount (stored as negative)' },
    },
    {
      name: 'accountNumber',
      type: 'text',
      required: true,
      admin: { description: 'Contributor phone number' },
    },
    {
      name: 'accountName',
      type: 'text',
      required: false,
      admin: { description: 'Contributor name' },
    },
    {
      name: 'mobileMoneyProvider',
      type: 'text',
      required: true,
      admin: { description: 'e.g. mtn, telecel' },
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
      admin: { readOnly: true },
    },
    {
      name: 'hogapayRevenue',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true },
    },
    {
      name: 'transactionReference',
      type: 'text',
      required: false,
      admin: { description: 'Eganow transaction reference', readOnly: true },
    },
    {
      name: 'webhookResponse',
      type: 'json',
      required: false,
      admin: { readOnly: true },
    },
    {
      name: 'triggeredAt',
      type: 'date',
      required: false,
      admin: {
        readOnly: true,
        description: 'When the cron job created this auto refund',
        condition: (data) => data?.refundType === 'auto',
      },
    },
    {
      name: 'reviewedBy',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      required: false,
      admin: {
        readOnly: true,
        description: 'Admin who approved or rejected this auto refund',
      },
    },
    {
      name: 'reviewedAt',
      type: 'date',
      required: false,
      admin: { readOnly: true },
    },
    {
      name: 'updatedBy',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      admin: { readOnly: true },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Awaiting Approval', value: 'awaiting_approval' },
        { label: 'Pending (Awaiting Processing)', value: 'pending' },
        { label: 'In Progress', value: 'in-progress' },
        { label: 'Completed', value: 'completed' },
        { label: 'Failed', value: 'failed' },
        { label: 'Rejected', value: 'rejected' },
      ],
    },
  ],
  endpoints: [
    { path: '/approve-refund', method: 'post', handler: approveRefund },
    { path: '/reject-refund', method: 'post', handler: rejectRefund },
    { path: '/approve-auto-refunds', method: 'post', handler: approveAutoRefunds },
    { path: '/reject-auto-refunds', method: 'post', handler: rejectAutoRefunds },
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
        if (data.amount != null && data.amount > 0) {
          data.amount = -Math.abs(data.amount)
        }
        return data
      },
    ],
    afterChange: [notifyRefund, syncLinkedTransaction, notifyJarCreator, checkAutoRefundCompletion],
  },
}
