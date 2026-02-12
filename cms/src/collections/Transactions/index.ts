import type { CollectionConfig } from 'payload'

import { chargeMomoEganow } from './endpoints/charge-momo-ega-now'
import { createPaymentLinkContribution } from './endpoints/create-payment-link-contribution'
import { eganowWebhook } from './endpoints/eganow-webhook'
import { eganowPayoutWebhook } from './endpoints/eganow-payout-webhook'
import { verifyTransfer } from './endpoints/verify-transfer'
import { payoutEganow } from './endpoints/payout-eganow'
import { testPayoutEganow } from './endpoints/test-payout-eganow'
import { verifyPaymentEgaNow } from './endpoints/verify-payment-ega-now'
import { setPaymentStatus, updateJarTotalContributions } from './hooks'
import { getCharges } from './hooks/getCharges'
import { sendContributionReceipt } from './hooks/send-contribution-receipt'
import { validateJarCreatorAccount } from './hooks/validate-jar-creator-account'
import { verifyPendingTransactions } from './endpoints/verify-pending-transactions'
import { exportContributions } from './endpoints/export-contributions'

export const Transactions: CollectionConfig = {
  slug: 'transactions',
  labels: {
    singular: 'Transaction',
    plural: 'Transactions',
  },
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
        { label: 'Bank Transfer', value: 'bank' },
        { label: 'Cash', value: 'cash' },
        { label: 'Card', value: 'card' },
        { label: 'Apple pay', value: 'apple-pay' },
      ],
    },
    {
      name: 'mobileMoneyProvider',
      type: 'text',
      admin: {
        condition: (data) => data?.paymentMethod === 'mobile-money',
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
        condition: (data) => data?.paymentMethod === 'bank',
      },
      hooks: {
        beforeChange: [
          ({ data }) => {
            // Account number is only required for bank payments
            if (data?.paymentMethod === 'bank' && !data?.accountNumber) {
              throw new Error('Account number is required for bank payments')
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
      name: 'chargesBreakdown',
      type: 'group',
      admin: {
        description: 'Detailed breakdown of all charges applied to this contribution',
      },
      fields: [
        {
          name: 'platformCharge',
          type: 'number',
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'amountPaidByContributor',
          type: 'number',
          admin: {
            description: 'Total amount paid by contributor (including all fees)',
            readOnly: true,
          },
        },
      ],
    },
    {
      name: 'paymentStatus',
      type: 'select',
      admin: {
        components: {
          Cell: '@collections/Transactions/components/PaymentStatus.tsx',
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
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'payout', value: 'payout' },
        { label: 'contribution', value: 'contribution' },
      ],
    },
    {
      name: 'isSettled',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether this contribution has been settled',
        condition: (data) =>
          data?.type === 'contribution' && data?.paymentMethod === 'mobile-money',
      },
    },
    {
      name: 'payoutFeePercentage',
      type: 'number',
      admin: {
        description: 'Transfer fee percentage applied to this payout',
        readOnly: true,
        condition: (data) => data?.type === 'payout',
      },
    },
    {
      name: 'payoutFeeAmount',
      type: 'number',
      admin: {
        description: 'Transfer fee amount deducted from this payout',
        readOnly: true,
        condition: (data) => data?.type === 'payout',
      },
    },
    {
      name: 'payoutNetAmount',
      type: 'number',
      admin: {
        description: 'Net amount transferred to user (after fee deduction)',
        readOnly: true,
        condition: (data) => data?.type === 'payout',
      },
    },
    {
      name: 'transactionReference',
      type: 'text',
      required: false,
      admin: {
        description: 'Transaction reference for tracking payments',
        condition: (data) => data?.paymentMethod === 'mobile-money',
      },
    },
    {
      name: 'collector',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      required: false,
      admin: {
        description: 'User who collected the contribution',
      },
      // filterOptions: async ({ data, req }) => {
      //   // Filter to show only the jar's collectors and creator
      //   if (!data?.jar) {
      //     return true // Allow all users if no jar specified
      //   }

      //   try {
      //     // Fetch the jar to get its collectors and creator
      //     const jar = await req.payload.findByID({
      //       collection: 'jars',
      //       id: data.jar,
      //     })

      //     if (!jar) {
      //       return true // Allow all users if jar doesn't exist
      //     }

      //     const allowedUserIds = []

      //     // Add creator to allowed users
      //     if (jar.creator) {
      //       // Handle both ObjectId string and populated object
      //       const creatorId = typeof jar.creator === 'string' ? jar.creator : jar.creator.id
      //       allowedUserIds.push(creatorId)
      //     }

      //     // Add invited collectors with 'accepted' status to allowed users
      //     if (jar.invitedCollectors && Array.isArray(jar.invitedCollectors)) {
      //       jar.invitedCollectors.forEach((invitedCollector) => {
      //         if (invitedCollector.collector && invitedCollector.status === 'accepted') {
      //           // Handle both ObjectId string and populated object
      //           const collectorId =
      //             typeof invitedCollector.collector === 'string'
      //               ? invitedCollector.collector
      //               : invitedCollector.collector.id
      //           allowedUserIds.push(collectorId)
      //         }
      //       })
      //     }

      //     if (allowedUserIds.length === 0) {
      //       return true // Allow all users if no valid collectors found
      //     }

      //     return {
      //       id: {
      //         in: allowedUserIds,
      //       },
      //     }
      //   } catch (error) {
      //     console.error('Error filtering collector options:', error)
      //     return true // Allow all users on any error
      //   }
      // },
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
      path: '/create-payment-link-contribution',
      method: 'post',
      handler: createPaymentLinkContribution,
    },
    {
      path: '/charge-momo-eganow',
      method: 'post',
      handler: chargeMomoEganow,
    },
    {
      path: '/eganow-webhook',
      method: 'post',
      handler: eganowWebhook,
    },
    {
      path: '/eganow-payout-webhook',
      method: 'post',
      handler: eganowPayoutWebhook,
    },
    {
      path: '/verify-payment-ega-now',
      method: 'post',
      handler: verifyPaymentEgaNow,
    },
    {
      path: '/payout-eganow',
      method: 'post',
      handler: payoutEganow,
    },
    {
      path: '/test-payout-eganow',
      method: 'post',
      handler: testPayoutEganow,
    },
    {
      path: '/verify-transfer',
      method: 'post',
      handler: verifyTransfer,
    },
    {
      path: '/verify-pending-transactions',
      method: 'get',
      handler: verifyPendingTransactions,
    },
    {
      path: '/export-contributions',
      method: 'get',
      handler: exportContributions,
    },
  ],
  hooks: {
    beforeChange: [setPaymentStatus, getCharges],
    afterChange: [sendContributionReceipt, updateJarTotalContributions],
    beforeValidate: [validateJarCreatorAccount],
  },
}
