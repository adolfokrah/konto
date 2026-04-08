import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'

import { createPaymentLinkContribution } from './endpoints/create-payment-link-contribution'
import { verifyTransfer } from './endpoints/verify-transfer'
import { setPaymentStatus } from './hooks'
import { sendContributionReceipt } from './hooks/send-contribution-receipt'
import { validateJarCreatorAccount } from './hooks/validate-jar-creator-account'
import { notifyTransactionCompleted } from './hooks/notify-transaction-completed'
import { exportContributions } from './endpoints/export-contributions'
import { exportContributionsMobile } from './endpoints/export-contributions-mobile'
import { recalculateCharges } from './endpoints/recalculate-charges'
import { refundContribution } from './endpoints/refund-contribution'
import { shareContributions } from './endpoints/share-contributions'
import { getTransaction } from './endpoints/get-transaction'
import { approveRejectPayout } from './endpoints/approve-reject-payout'
import { processReferralBonus } from './hooks/process-referral-bonus'
import { updateJarLastActivity } from './hooks/update-jar-last-activity'
import { createCashback } from './hooks/create-cashback'
import { snapshotCollector } from './hooks/snapshotCollector'
import { computeAmountDue } from './hooks/computeAmountDue'
import { getCharges as getChargesEndpoint } from './endpoints/get-charges'
import { initializePaystackPayment } from './endpoints/initialize-paystack-payment'
import { verifyPaystackPayment } from './endpoints/verify-paystack-payment'
import { paystackWebhook } from './endpoints/paystack-webhook'
import { paymentStatus } from './endpoints/payment-status'
import { payoutPaystack } from './endpoints/payout-paystack'
import { getPayoutMinimum } from './endpoints/get-payout-minimum'
import { getCollectionMinimum } from './endpoints/get-collection-minimum'
import { chargeMobileMoney } from './endpoints/charge-mobile-money'
import { submitChargeOtp } from './endpoints/submit-charge-otp'

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
      name: 'contributorEmail',
      type: 'email',
      required: false,
      admin: {
        description: 'Email address of the contributor',
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
          ({ data, originalDoc }) => {
            const isPaystackFlow = data?.viaPaymentLink || originalDoc?.viaPaymentLink
            if (
              !isPaystackFlow &&
              data?.paymentMethod === 'mobile-money' &&
              !data?.contributorPhoneNumber
            ) {
              throw new APIError('Phone number is required for mobile-money payments', 400)
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
        { label: 'Cash', value: 'cash' },
        { label: 'Bank Transfer', value: 'bank-transfer' },
        { label: 'Card', value: 'card' },
      ],
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'mobileMoneyProvider',
      type: 'text',
      admin: {
        condition: (data) => data?.paymentMethod === 'mobile-money',
      },
      hooks: {
        beforeChange: [
          ({ data, originalDoc }) => {
            const isPaystackFlow = data?.viaPaymentLink || originalDoc?.viaPaymentLink
            if (
              !isPaystackFlow &&
              data?.paymentMethod === 'mobile-money' &&
              !data?.mobileMoneyProvider
            ) {
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
        condition: (data) => data?.paymentMethod === 'bank-transfer',
      },
      hooks: {
        beforeChange: [
          ({ data, originalDoc }) => {
            const isPaystackFlow = data?.viaPaymentLink || originalDoc?.viaPaymentLink
            if (
              !isPaystackFlow &&
              data?.paymentMethod === 'bank-transfer' &&
              !data?.accountNumber
            ) {
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
      name: 'currency',
      type: 'text',
      admin: {
        description: 'Currency code for this transaction (e.g. GHS, NGN, USD)',
      },
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
          name: 'eganowFees',
          type: 'number',
          admin: {
            description: "Eganow's share of the fees",
            readOnly: true,
          },
        },
        {
          name: 'hogapayRevenue',
          type: 'number',
          admin: {
            description: "Hogapay's share of the fees (revenue)",
            readOnly: true,
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
      name: 'amountDue',
      type: 'number',
      admin: {
        readOnly: true,
        description:
          'Net amount into the jar (contribution) or net amount received by creator (payout)',
      },
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
      name: 'collectionFeePaidBy',
      type: 'select',
      defaultValue: 'contributor',
      options: [
        { label: 'Contributor', value: 'contributor' },
        { label: 'Jar Creator', value: 'jar-creator' },
      ],
      admin: {
        description: 'Who paid the collection fee for this contribution',
        condition: (data) => data?.type === 'contribution',
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
      name: 'eganowPayPartnerTransactionId',
      type: 'text',
      required: false,
      admin: {
        description: "Eganow's PayPartnerTransactionId received in webhook callback",
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
      path: '/approve-reject-payout',
      method: 'post',
      handler: approveRejectPayout,
    },
    {
      path: '/verify-transfer',
      method: 'post',
      handler: verifyTransfer,
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
      path: '/refund-contribution',
      method: 'post',
      handler: refundContribution,
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
    {
      path: '/initialize-paystack-payment',
      method: 'post',
      handler: initializePaystackPayment,
    },
    {
      path: '/verify-paystack-payment',
      method: 'get',
      handler: verifyPaystackPayment,
    },
    {
      path: '/paystack-webhook',
      method: 'post',
      handler: paystackWebhook,
    },
    {
      path: '/payment-status',
      method: 'get',
      handler: paymentStatus,
    },
    {
      path: '/payout-paystack',
      method: 'post',
      handler: payoutPaystack,
    },
    {
      path: '/get-payout-minimum',
      method: 'get',
      handler: getPayoutMinimum,
    },
    {
      path: '/get-collection-minimum',
      method: 'get',
      handler: getCollectionMinimum,
    },
    {
      path: '/charge-mobile-money',
      method: 'post',
      handler: chargeMobileMoney,
    },
    {
      path: '/submit-charge-otp',
      method: 'post',
      handler: submitChargeOtp,
    },
  ],
  hooks: {
    afterRead: [computeAmountDue],
    beforeChange: [setPaymentStatus, snapshotCollector],
    afterChange: [
      sendContributionReceipt,
      notifyTransactionCompleted,
      processReferralBonus,
      updateJarLastActivity,
      createCashback,
    ],
    beforeValidate: [validateJarCreatorAccount],
  },
}
