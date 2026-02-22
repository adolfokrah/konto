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
    // ── Collection (Contributions) ──
    {
      type: 'collapsible',
      label: 'Collection',
      admin: {
        initCollapsed: false,
        description: 'Fees charged on contributions/collections.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'collectionFee',
              label: 'Fee (%)',
              type: 'number',
              required: true,
              defaultValue: 1.95,
              min: 0,
              max: 100,
              admin: {
                description: 'Total fee on contributions (e.g., 1.95%). Paid by the contributor.',
                step: 0.01,
                width: '50%',
              },
            },
            {
              name: 'hogapayCollectionFeePercent',
              label: 'Hogapay Split (%)',
              type: 'number',
              required: true,
              defaultValue: 0.8,
              min: 0,
              max: 100,
              admin: {
                description:
                  "Hogapay's share of the collection fee (e.g., 0.8%). Rest goes to Eganow.",
                step: 0.01,
                width: '50%',
              },
            },
          ],
        },
      ],
    },

    // ── Transfer (Payouts) ──
    {
      type: 'collapsible',
      label: 'Transfer (Payout)',
      admin: {
        initCollapsed: false,
        description: 'Fees charged on withdrawals/payouts.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'transferFeePercentage',
              label: 'Fee (%)',
              type: 'number',
              required: true,
              defaultValue: 1,
              min: 0,
              max: 100,
              admin: {
                description: 'Total fee on payouts (e.g., 1%). Deducted from the payout amount.',
                step: 0.1,
                width: '50%',
              },
            },
            {
              name: 'hogapayTransferFeePercent',
              label: 'Hogapay Split (%)',
              type: 'number',
              required: true,
              defaultValue: 0.5,
              min: 0,
              max: 100,
              admin: {
                description:
                  "Hogapay's share of the transfer fee (e.g., 0.5%). Rest goes to Eganow.",
                step: 0.01,
                width: '50%',
              },
            },
          ],
        },
      ],
    },

    // ── Payout Settings ──
    {
      type: 'collapsible',
      label: 'Payout Settings',
      admin: {
        initCollapsed: false,
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'minimumPayoutAmount',
              label: 'Minimum Payout Amount',
              type: 'number',
              required: true,
              defaultValue: 10,
              min: 0,
              admin: {
                description: 'Minimum amount required to process a payout.',
                width: '50%',
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
                description: 'Delay before contributions are settled (e.g., 0.033 = ~2 min).',
                step: 0.001,
                width: '50%',
              },
            },
          ],
        },
      ],
    },
  ],
}
