import type { CollectionConfig } from 'payload'

import { chargeMomo } from './endpoints/charge-momo'
import { paystackWebhook } from './endpoints/paystack-webhook'
import { sendOtp } from './endpoints/send-otp'
import { transferMomo } from './endpoints/transfer-momo'
import { verifyPayment } from './endpoints/verify-payment'
import { setPaymentStatus } from './hooks'

export const Contributions: CollectionConfig = {
  slug: 'contributions',
  admin: {
    useAsTitle: 'contributor',
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
      required: false,
      admin: {
        description: 'Phone number of the contributor',
      },
      hooks: {
        beforeChange: [
          ({ data }) => {
            // Phone number is only required for mobile-money payments
            if (data?.paymentMethod === 'mobile-money' && !data?.contributorPhoneNumber) {
              throw new Error('Phone number is required for mobile-money payments')
            }
          },
        ],
      },
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
      name: 'mobileMoneyProvider',
      type: 'text',
      admin: {
        condition: data => data?.paymentMethod === 'mobile-money',
      },
      hooks: {
        beforeChange: [
          ({ data }) => {
            // Mobile money provider is required for mobile-money payments
            if (data?.paymentMethod === 'mobile-money' && !data?.mobileMoneyProvider) {
              throw new Error('Mobile money provider is required for mobile-money payments')
            }
          },
        ],
      },
    },
    {
      name: 'accountNumber',
      type: 'text',
      required: false,
      admin: {
        description: 'Account number for bank transfers',
        condition: data => data?.paymentMethod === 'bank-transfer',
      },
      hooks: {
        beforeChange: [
          ({ data }) => {
            // Account number is only required for bank-transfer payments
            if (data?.paymentMethod === 'bank-transfer' && !data?.accountNumber) {
              throw new Error('Account number is required for bank-transfer payments')
            }
          },
        ],
      },
    },
    {
      name: 'amountContributed',
      type: 'number',
      required: true,
    },
    {
      name: 'charges',
      type: 'number',
      required: false,
    },
    {
      name: 'paymentStatus',
      type: 'select',
      admin: {
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
      name: 'linkedContribution',
      type: 'relationship',
      relationTo: 'contributions',
      hasMany: false,
      admin: {
        description: 'Select the linked deposit for this contribution',
      },
    },
    {
      name: 'linkedTransfer',
      type: 'relationship',
      relationTo: 'contributions',
      hasMany: false,
      admin: {
        description: 'Select the linked transfer for this contribution',
      },
    },
    {
      name: 'isTransferred',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Check if this contribution has been transferred',
      },
    },
    {
      name: 'transactionReference',
      type: 'text',
      required: false,
      admin: {
        description: 'Transaction reference for tracking payments',
        condition: data => data?.paymentMethod === 'mobile-money',
      },
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

          // Add invited collectors with 'accepted' status to allowed users
          if (jar.invitedCollectors && Array.isArray(jar.invitedCollectors)) {
            jar.invitedCollectors.forEach(invitedCollector => {
              if (invitedCollector.collector && invitedCollector.status === 'accepted') {
                // Handle both ObjectId string and populated object
                const collectorId =
                  typeof invitedCollector.collector === 'string'
                    ? invitedCollector.collector
                    : invitedCollector.collector.id
                allowedUserIds.push(collectorId)
              }
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
  endpoints: [
    {
      path: '/charge-momo',
      method: 'post',
      handler: chargeMomo,
    },
    {
      path: '/send-otp',
      method: 'post',
      handler: sendOtp,
    },
    {
      path: '/verify-payment',
      method: 'post',
      handler: verifyPayment,
    },
    {
      path: '/transfer-momo',
      method: 'post',
      handler: transferMomo,
    },
    {
      path: '/paystack-webhook',
      method: 'post',
      handler: paystackWebhook,
    },
  ],
  hooks: {
    beforeChange: [setPaymentStatus],
  },
}
