import type { CollectionConfig } from 'payload'

export const PayoutApprovals: CollectionConfig = {
  slug: 'payout-approvals',
  labels: {
    singular: 'Payout Approval',
    plural: 'Payout Approvals',
  },
  admin: {
    useAsTitle: 'status',
    defaultColumns: ['jar', 'linkedTransaction', 'status', 'requestedBy', 'createdAt'],
  },
  access: {
    create: ({ req: { user } }) => (user as any)?.role === 'admin',
    read: ({ req: { user } }) => (user as any)?.role === 'admin',
    update: ({ req: { user } }) => (user as any)?.role === 'admin',
    delete: ({ req: { user } }) => (user as any)?.role === 'admin',
  },
  fields: [
    {
      name: 'jar',
      type: 'relationship',
      relationTo: 'jars',
      required: true,
      hasMany: false,
      admin: {
        description: 'The jar this payout approval belongs to',
      },
    },
    {
      name: 'linkedTransaction',
      type: 'relationship',
      relationTo: 'transactions',
      hasMany: false,
      admin: {
        description: 'The payout transaction linked to this approval',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
    },
    {
      name: 'requestedBy',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      admin: {
        description: 'User who requested the payout',
        readOnly: true,
      },
    },
    {
      name: 'actionBy',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      admin: {
        description: 'Admin who approved or rejected the payout',
        // readOnly: true,
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation, req }) => {
        if (operation === 'create' && req.user) {
          data.requestedBy = req.user.id
        }
        // if (operation === 'update' && req.user) {
        //   data.actionBy = req.user.id
        // }
        return data
      },
    ],
  },
}
