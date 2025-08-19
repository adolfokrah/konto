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
      type: 'relationship',
      relationTo: 'jar-groups',
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
      type: 'select',
      options: [
        { label: 'Ghanaian Cedi', value: 'ghc' },
        { label: 'Nigerian Naira', value: 'ngn' },
      ],
      required: true,
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
                if (siblingData?.collector) {
                  try {
                    // Get the first selected collector
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
                      return user.phoneNumber
                    }
                  } catch (error) {
                    console.error('Error fetching collector phone number:', error)
                  }
                }

                // Return existing value if no collector selected or error occurred
                return data
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
          hooks: {
            beforeChange: [
              async ({ data, siblingData, req }) => {
                // Auto-populate name from selected collector
                if (siblingData?.collector) {
                  try {
                    // Get the first selected collector
                    const collectorId =
                      typeof siblingData.collector === 'object'
                        ? siblingData.collector.id
                        : siblingData.collector

                    // Fetch the user to get their full name
                    const user = await req.payload.findByID({
                      collection: 'users',
                      id: collectorId,
                    })

                    if (user?.fullName) {
                      return user.fullName
                    }
                  } catch (error) {
                    console.error('Error fetching collector name:', error)
                  }
                }

                // Return existing value if no collector selected or error occurred
                return data
              },
            ],
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
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Frozen', value: 'frozen' },
      ],
      required: true,
      admin: {
        description: 'Current status of the jar',
      },
    },
  ],
  hooks: {
    beforeChange: [],
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
