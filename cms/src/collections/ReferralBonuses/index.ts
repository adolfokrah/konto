import type { CollectionConfig } from 'payload'
import { myBonuses } from './endpoints/my-bonuses'
import { initiateWithdrawal } from './endpoints/initiate-withdrawal'
import { confirmWithdrawal } from './endpoints/confirm-withdrawal'

export const ReferralBonuses: CollectionConfig = {
  slug: 'referral-bonuses',
  labels: {
    singular: 'Referral Bonus',
    plural: 'Referral Bonuses',
  },
  admin: {
    useAsTitle: 'description',
    defaultColumns: ['user', 'bonusType', 'amount', 'status', 'createdAt'],
  },
  access: {
    create: ({ req: { user } }) => (user as any)?.role === 'admin',
    read: ({ req: { user } }) => {
      if ((user as any)?.role === 'admin') return true
      if (user) return { user: { equals: user.id } }
      return false
    },
    update: ({ req: { user } }) => (user as any)?.role === 'admin',
    delete: ({ req: { user } }) => (user as any)?.role === 'admin',
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      required: true,
      admin: {
        description: 'The user who earns this bonus',
      },
    },
    {
      name: 'referral',
      type: 'relationship',
      relationTo: 'referrals',
      hasMany: false,
      required: true,
      admin: {
        description: 'The referral event that triggered this bonus',
      },
    },
    {
      name: 'transaction',
      type: 'relationship',
      relationTo: 'transactions',
      hasMany: false,
      required: false,
      admin: {
        description: 'The transaction that triggered this bonus (for fee_share bonuses)',
      },
    },
    {
      name: 'bonusType',
      type: 'select',
      required: true,
      options: [
        { label: 'First Contribution', value: 'first_contribution' },
        { label: 'Fee Share', value: 'fee_share' },
      ],
      admin: {
        description:
          'GHS 5 flat for first contribution, or 20% of fee for each subsequent contribution',
      },
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      admin: {
        description: 'Bonus amount in GHS',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Paid', value: 'paid' },
        { label: 'Failed', value: 'failed' },
      ],
    },
    {
      name: 'description',
      type: 'text',
      required: false,
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
      path: '/my-bonuses',
      method: 'get',
      handler: myBonuses,
    },
    {
      path: '/initiate-withdrawal',
      method: 'post',
      handler: initiateWithdrawal,
    },
    {
      path: '/confirm-withdrawal',
      method: 'post',
      handler: confirmWithdrawal,
    },
  ],
}
