import type { CollectionConfig } from 'payload'

import { getJarSummary } from './endpoints/get-jar-summary'
import { getUserJars } from './endpoints/get-user-jars'
import { generatePaymentLink } from './hooks'

export const Jars: CollectionConfig = {
  slug: 'jars',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Name of the jar',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: false,
      admin: {
        description: 'Description of the jar',
      },
    },
    {
      name: 'jarGroup',
      type: 'text',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: false,
      admin: {
        description: 'Upload an image for the jar',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether the jar is currently active',
      },
    },
    {
      name: 'isFixedContribution',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether the contribution amount is fixed',
      },
    },
    {
      name: 'acceptedContributionAmount',
      type: 'number',
      required: true,
      admin: {
        description: 'Accepted contribution amount for fixed contributions',
        condition: data => data.isFixedContribution,
      },
    },
    {
      name: 'goalAmount',
      type: 'number',
      required: false,
      defaultValue: 0,
      admin: {
        description: 'Target amount for the jar',
      },
    },
    {
      name: 'deadline',
      type: 'date',
      required: false,
      admin: {
        description: 'Deadline for contributions to this jar',
      },
    },
    {
      name: 'currency',
      type: 'text',
      required: true,
      validate: (value: unknown) => {
        if (typeof value !== 'string') {
          return 'Currency must be a string'
        }
        return true
      },
      admin: {
        description: 'Currency code (ghc or ngn)',
      },
    },
    {
      name: 'creator',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
      filterOptions: ({ req: _req }) => {
        // This filter can be customized based on the request context
        return {
          isKYCVerified: { equals: true },
        }
      },
      admin: {
        description: 'User who created the jar',
      },
    },
    {
      name: 'invitedCollectors',
      type: 'array',
      fields: [
        {
          name: 'collector',
          type: 'relationship',
          relationTo: 'users',
          required: false,
          hasMany: false,
          filterOptions: ({ data }) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const filters: any = {}

            if (data?.creator) {
              filters.id = {
                not_equals: data.creator,
              }
            }

            return filters
          },
          admin: {
            description: 'Users who can contribute to this jar (excluding the creator)',
          },
        },
        {
          name: 'phoneNumber',
          type: 'text',
          required: false,
          admin: {
            description:
              'Phone number of the invited collector (auto-populated from selected collector)',
            readOnly: true,
          },
          hooks: {
            beforeChange: [
              async ({ data, siblingData, req }) => {
                // Auto-populate phone number from selected collector
                if (siblingData?.collector && siblingData.collector !== null && data) {
                  try {
                    // Get the collector ID
                    const collectorId =
                      typeof siblingData.collector === 'object'
                        ? siblingData.collector.id
                        : siblingData.collector

                    // Fetch the user to get their phone number
                    const user = await req.payload.findByID({
                      collection: 'users',
                      id: collectorId,
                    })

                    if (user?.phoneNumber) {
                      siblingData.phoneNumber = user.phoneNumber
                      siblingData.name = user.fullName
                    }
                    // return data;
                  } catch (error) {
                    req.payload.logger.error('Error fetching collector phone number:', error)
                  }
                }
              },
            ],
          },
        },
        {
          name: 'name',
          type: 'text',
          required: false,
          admin: {
            description: 'Name of the invited collector (auto-populated from selected collector)',
            readOnly: true,
          },
        },
        {
          name: 'status',
          type: 'select',
          options: [
            { label: 'Accepted', value: 'accepted' },
            { label: 'Pending', value: 'pending' },
          ],
          required: true,
        },
      ],
    },
    {
      name: 'paymentLink',
      type: 'text',
      required: false,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'acceptAnonymousContributions',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Allow anonymous contributions to this jar',
      },
    },
    {
      name: 'acceptedPaymentMethods',
      type: 'select',
      options: [
        { label: 'Mobile Money', value: 'mobile-money' },
        { label: 'Bank Transfer', value: 'bank-transfer' },
        { label: 'Cash', value: 'cash' },
      ],
      hasMany: true,
      required: true,
      admin: {
        description: 'Payment methods accepted for contributions to this jar',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'open',
      options: [
        { label: 'Open', value: 'open' },
        { label: 'Broken', value: 'broken' },
        { label: 'Sealed', value: 'sealed' },
      ],
      required: true,
      admin: {
        description: 'Current status of the jar',
      },
    },
  ],
  hooks: {
    afterChange: [generatePaymentLink],
  },
  endpoints: [
    {
      method: 'get',
      path: '/:id/summary',
      handler: getJarSummary,
    },
    {
      method: 'get',
      path: '/user-jars',
      handler: getUserJars,
    },
  ],
}
