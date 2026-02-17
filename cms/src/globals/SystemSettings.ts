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
      name: 'settlementDelayHours',
      label: 'Settlement Delay (Hours)',
      type: 'number',
      required: true,
      defaultValue: 0.033, // ~2 minutes (2/60 hours)
      min: 0,
      admin: {
        description:
          'Time delay in hours before completed contributions are automatically settled (e.g., 0.033 for ~2 minutes, 1 for 1 hour, 24 for 1 day)',
        step: 0.001,
      },
    },
  ],
}
