import type { CollectionConfig } from 'payload'

export const Referrals: CollectionConfig = {
  slug: 'referrals',
  labels: {
    singular: 'Referral',
    plural: 'Referrals',
  },
  admin: {
    useAsTitle: 'referralCode',
    defaultColumns: ['referralCode', 'referredBy', 'referral', 'createdAt'],
  },
  access: {
    create: ({ req: { user } }) => (user as any)?.role === 'admin',
    read: ({ req: { user } }) => {
      if ((user as any)?.role === 'admin') return true
      if (user) {
        return {
          or: [{ referredBy: { equals: user.id } }, { referral: { equals: user.id } }],
        }
      }
      return false
    },
    update: ({ req: { user } }) => (user as any)?.role === 'admin',
    delete: ({ req: { user } }) => (user as any)?.role === 'admin',
  },
  fields: [
    {
      name: 'referralCode',
      type: 'text',
      required: true,
      admin: {
        description: 'The referral code that was entered at registration',
      },
    },
    {
      name: 'referredBy',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      required: true,
      admin: {
        description: 'The user who owns/shared this referral code',
      },
    },
    {
      name: 'referral',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      required: true,
      admin: {
        description: 'The new user who used the referral code',
      },
    },
  ],
}
