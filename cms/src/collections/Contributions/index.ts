import type { CollectionConfig } from 'payload'

import { setPaymentStatus } from './hooks'

export const Contributions: CollectionConfig = {
  slug: 'contributions',
  admin: {
    useAsTitle: 'contributorPhoneNumber',
  },
  fields: [
    {
      name: 'jar',
      type: 'relationship',
      relationTo: 'jars',
      required: true,
      hasMany: false,
      admin: {
        description: 'Select the jar to contribute to',
      },
    },
    {
      name: 'contributor',
      type: 'text',
      required: false,
    },
    {
      name: 'contributorPhoneNumber',
      type: 'text',
      required: true,
    },
    {
      name: 'paymentMethod',
      type: 'select',
      options: [
        { label: 'Mobile Money', value: 'mobile-money' },
        { label: 'Bank Transfer', value: 'bank-transfer' },
        { label: 'Cash', value: 'cash' },
      ],
    },
    {
      name: 'amountContributed',
      type: 'number',
      required: true,
    },
    {
      name: 'paymentStatus',
      type: 'select',
      admin: {
        readOnly: true,
        components: {
          Cell: '@collections/Contributions/components/PaymentStatus.tsx',
        },
      },
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Completed', value: 'completed' },
        { label: 'Failed', value: 'failed' },
        { label: 'Transferred', value: 'transferred' },
      ],
      defaultValue: 'pending',
    },
    {
      name: 'collector',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      required: true,
      admin: {
        description: 'User who collected the contribution',
      },
      filterOptions: async ({ data, req }) => {
        // Filter to show only the jar's collectors and creator
        if (!data?.jar) {
          return false
        }

        try {
          // Fetch the jar to get its collectors and creator
          const jar = await req.payload.findByID({
            collection: 'jars',
            id: data.jar,
          })

          if (!jar) {
            return false
          }

          const allowedUserIds = []

          // Add creator to allowed users
          if (jar.creator) {
            // Handle both ObjectId string and populated object
            const creatorId = typeof jar.creator === 'string' ? jar.creator : jar.creator.id
            allowedUserIds.push(creatorId)
          }

          // Add collectors to allowed users
          if (jar.collectors && Array.isArray(jar.collectors)) {
            jar.collectors.forEach(collector => {
              // Handle both ObjectId string and populated object
              const collectorId = typeof collector === 'string' ? collector : collector.id
              allowedUserIds.push(collectorId)
            })
          }

          if (allowedUserIds.length === 0) {
            return false
          }

          return {
            id: {
              in: allowedUserIds,
            },
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error filtering collector options:', error)
          return false
        }
      },
    },
    {
      name: 'viaPaymentLink',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Check if this contribution was made via a payment link',
      },
    },
  ],
  hooks: {
    beforeChange: [setPaymentStatus],
  },
}
