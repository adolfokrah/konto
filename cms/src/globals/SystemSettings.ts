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

    // ── Refund ──
    {
      type: 'collapsible',
      label: 'Refund',
      admin: {
        initCollapsed: false,
        description: 'Fee deducted from refunds before returning funds to the contributor.',
      },
      fields: [
        {
          name: 'refundFeePercentage',
          label: 'Refund Fee (%)',
          type: 'number',
          required: true,
          defaultValue: 1,
          min: 0,
          max: 100,
          admin: {
            description:
              'Percentage deducted from the refund amount (e.g., 1%). Contributor receives refundAmount − fee.',
            step: 0.1,
            width: '50%',
          },
        },
      ],
    },

    // ── Contribution Settings ──
    {
      type: 'collapsible',
      label: 'Contribution Settings',
      admin: {
        initCollapsed: false,
        description: 'Rules applied to all contributions.',
      },
      fields: [
        {
          name: 'minimumContributionAmount',
          label: 'Minimum Contribution Amount (GHS)',
          type: 'number',
          required: true,
          defaultValue: 2,
          min: 0,
          admin: {
            description: 'Minimum amount a contributor can send (e.g., 2 = GHS 2.00).',
            step: 0.5,
            width: '50%',
          },
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

    // ── Referral Bonus ──
    {
      type: 'collapsible',
      label: 'Referral Bonus',
      admin: {
        initCollapsed: false,
        description: 'Rewards paid to referrers when their referred users are active.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'referralFirstContributionBonus',
              label: 'First Contribution Bonus (GHS)',
              type: 'number',
              required: true,
              defaultValue: 5,
              min: 0,
              admin: {
                description:
                  "Flat GHS amount paid to the referrer when a referred user's jar receives its first contribution.",
                step: 0.5,
                width: '50%',
              },
            },
            {
              name: 'referralFeeSharePercent',
              label: 'Fee Share (%)',
              type: 'number',
              required: true,
              defaultValue: 20,
              min: 0,
              max: 100,
              admin: {
                description:
                  "Percentage of Hogapay's transfer fee revenue (hogapayTransferFeePercent) shared with the referrer on each withdrawal from a referred user's jar.",
                step: 1,
                width: '50%',
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'referralMinWithdrawalAmount',
              label: 'Min Withdrawal (GHS)',
              type: 'number',
              required: true,
              defaultValue: 20,
              min: 0,
              admin: {
                description: 'Minimum referral bonus balance required to initiate a withdrawal.',
                step: 1,
                width: '50%',
              },
            },
            {
              name: 'referralMaxWithdrawalAmount',
              label: 'Max Withdrawal (GHS)',
              type: 'number',
              required: true,
              defaultValue: 500,
              min: 0,
              admin: {
                description:
                  'Maximum referral bonus amount that can be withdrawn at once. Set to 0 for no limit.',
                step: 10,
                width: '50%',
              },
            },
          ],
        },
      ],
    },
  ],
}
