import type { GlobalConfig } from 'payload'

export const SystemSettings: GlobalConfig = {
  slug: 'system-settings',
  label: 'System Settings',
  access: {
    read: () => true, // Allow mobile app to read
    update: ({ req }) => {
      // Only admins can update system settings
      return req.user?.role === 'admin'
    },
  },
  fields: [
    {
      name: 'collectionFee',
      label: 'Collection Fee Percentage',
      type: 'number',
      required: true,
      defaultValue: 1.95,
      min: 0,
      max: 100,
      admin: {
        description:
          'Percentage fee charged on contributions/collections (e.g., 1.95 for 1.95%). This fee is added to the contribution amount and paid by the contributor.',
        step: 0.01,
      },
    },
    {
      name: 'transferFeePercentage',
      label: 'Transfer Fee Percentage',
      type: 'number',
      required: true,
      defaultValue: 1,
      min: 0,
      max: 100,
      admin: {
        description:
          'Percentage fee charged on withdrawals/payouts (e.g., 1 for 1%). This fee is deducted from the payout amount.',
        step: 0.1,
      },
    },
    {
      name: 'minimumPayoutAmount',
      label: 'Minimum Payout Amount',
      type: 'number',
      required: true,
      defaultValue: 10,
      min: 0,
      admin: {
        description:
          'Minimum amount (in base currency) required to process a payout. Users cannot withdraw if their balance is below this amount.',
      },
    },
    {
      name: 'payoutProcessingMessage',
      label: 'Payout Processing Message',
      type: 'text',
      admin: {
        description:
          'Optional message displayed to users when they initiate a payout (e.g., "Payouts are processed within 24-48 hours")',
      },
    },
  ],
}
