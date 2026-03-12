import type { CollectionConfig } from 'payload'

export const Disputes: CollectionConfig = {
  slug: 'disputes',
  labels: {
    singular: 'Dispute',
    plural: 'Disputes',
  },
  admin: {
    useAsTitle: 'description',
    defaultColumns: ['transaction', 'raisedBy', 'status', 'createdAt'],
  },
  access: {
    create: ({ req: { user } }) => !!user,
    read: ({ req: { user } }) => {
      if ((user as any)?.role === 'admin') return true
      if (user) return { raisedBy: { equals: user.id } }
      return false
    },
    update: ({ req: { user } }) => (user as any)?.role === 'admin',
    delete: ({ req: { user } }) => (user as any)?.role === 'admin',
  },
  fields: [
    {
      name: 'transaction',
      type: 'relationship',
      relationTo: 'transactions',
      required: true,
      hasMany: false,
      admin: {
        description: 'The transaction being disputed',
      },
    },
    {
      name: 'raisedBy',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      required: true,
      admin: {
        description: 'User who raised the dispute',
        readOnly: true,
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Describe the issue with this transaction',
      },
    },
    {
      name: 'evidence',
      type: 'array',
      label: 'Evidence (Photos)',
      minRows: 0,
      maxRows: 5,
      admin: {
        description: 'Upload supporting photos or screenshots (max 5)',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'open',
      options: [
        { label: 'Open', value: 'open' },
        { label: 'Under Review', value: 'under-review' },
        { label: 'Resolved', value: 'resolved' },
        { label: 'Rejected', value: 'rejected' },
      ],
    },
    {
      name: 'resolvedBy',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      admin: {
        description: 'Admin who resolved or rejected this dispute',
        readOnly: true,
        condition: (data) => ['resolved', 'rejected'].includes(data?.status),
      },
    },
    {
      name: 'resolutionNote',
      type: 'textarea',
      admin: {
        description: 'Admin note on the outcome of this dispute',
        condition: (data) => ['resolved', 'rejected'].includes(data?.status),
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation, req }) => {
        if (operation === 'create' && req.user) {
          data.raisedBy = req.user.id
        }
        if (operation === 'update' && req.user && ['resolved', 'rejected'].includes(data?.status)) {
          data.resolvedBy = req.user.id
        }
        return data
      },
    ],
  },
}
