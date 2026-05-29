import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'

import { chargeChango } from './endpoints/charge-chango'
import { changoWebhook } from './endpoints/chango-webhook'
import { createPaymentLinkContribution } from './endpoints/create-payment-link-contribution'
import { setPaymentStatus } from './hooks'
import { getCharges } from './hooks/getCharges'
import { sendContributionReceipt } from './hooks/send-contribution-receipt'
import { validateJarCreatorAccount } from './hooks/validate-jar-creator-account'
import { notifyTransactionCompleted } from './hooks/notify-transaction-completed'
import { exportContributions } from './endpoints/export-contributions'
import { exportContributionsMobile } from './endpoints/export-contributions-mobile'
import { recalculateCharges } from './endpoints/recalculate-charges'
import { shareContributions } from './endpoints/share-contributions'
import { getTransaction } from './endpoints/get-transaction'
import { processReferralBonus } from './hooks/process-referral-bonus'
import { updateJarLastActivity } from './hooks/update-jar-last-activity'
import { snapshotCollector } from './hooks/snapshotCollector'
import { getCharges as getChargesEndpoint } from './endpoints/get-charges'

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
    },
    {
      name: 'remarks',
      type: 'textarea',
      required: false,
      admin: {
        description: 'Optional message from the contributor to the organizer',
      },
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
              throw new APIError('Phone number is required for mobile-money payments', 400)
            }
          },
        ],
      },
    },
    {
      name: 'contributorEmail',
      type: 'email',
      required: false,
      admin: {
        description: 'Email of the contributor (used by Chango for receipts)',
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
              throw new APIError('Mobile money provider is required for mobile-money payments', 400)
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
              throw new APIError('Account number is required for bank payments', 400)
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
        {
          name: 'hogapayRevenue',
          type: 'number',
          admin: {
            description: "Hogapay's share of the fees (revenue)",
          },
        },
        {
          name: 'discountPercent',
          type: 'number',
          admin: {
            description: 'Discount percentage applied to Hogapay fee (0 = no discount)',
            readOnly: true,
          },
        },
        {
          name: 'discountAmount',
          type: 'number',
          admin: {
            description: 'GHS amount Hogapay absorbed as discount',
            readOnly: true,
          },
        },
        {
          name: 'collectionFeePercent',
          type: 'number',
          admin: {
            description: 'Base collection fee rate (%) from system settings at time of transaction',
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
        { label: 'Awaiting Approval', value: 'awaiting-approval' },
        { label: 'Completed', value: 'completed' },
        { label: 'Failed', value: 'failed' },
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
      name: 'changoInvoiceId',
      type: 'text',
      required: false,
      index: true,
      admin: {
        description: "Chango's invoiceId returned when initiating a payment",
        readOnly: true,
      },
    },
    {
      name: 'changoCheckoutUrl',
      type: 'text',
      required: false,
      admin: {
        description: 'Hosted-checkout URL returned by Chango. Open in browser/webview.',
        readOnly: true,
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
      name: 'collectorSnapshot',
      type: 'group',
      admin: {
        description:
          'Snapshot of collector identity at transaction time — preserved even if account is deleted',
        readOnly: true,
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          admin: { readOnly: true },
        },
        {
          name: 'email',
          type: 'email',
          admin: { readOnly: true },
        },
      ],
    },
    {
      name: 'viaPaymentLink',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Check if this contribution was made via a payment link',
      },
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
    {
      name: 'customFieldValues',
      type: 'json',
      required: false,
      admin: {
        description: 'Values submitted for custom fields defined on the jar',
        readOnly: true,
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
      path: '/charge-chango',
      method: 'post',
      handler: chargeChango,
    },
    {
      path: '/chango-webhook',
      method: 'post',
      handler: changoWebhook,
    },
    {
      path: '/export-contributions',
      method: 'get',
      handler: exportContributions,
    },
    {
      path: '/export-contributions-mobile',
      method: 'get',
      handler: exportContributionsMobile,
    },
    {
      path: '/recalculate-charges',
      method: 'post',
      handler: recalculateCharges,
    },
    {
      path: '/share-contributions',
      method: 'get',
      handler: shareContributions,
    },
    {
      path: '/get-transaction',
      method: 'get',
      handler: getTransaction,
    },
    {
      path: '/get-charges',
      method: 'get',
      handler: getChargesEndpoint,
    },
  ],
  hooks: {
    beforeChange: [setPaymentStatus, getCharges, snapshotCollector],
    afterChange: [
      sendContributionReceipt,
      notifyTransactionCompleted,
      processReferralBonus,
      updateJarLastActivity,
    ],
    beforeValidate: [validateJarCreatorAccount],
  },
}
