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
      label: 'Collection — Mobile Money',
      admin: {
        initCollapsed: false,
        description: 'Fees charged on mobile money contributions.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'mobileMoneyCollectionFee',
              label: 'Fee (%)',
              type: 'number',
              required: true,
              defaultValue: 1.95,
              min: 0,
              max: 100,
              admin: {
                description: 'Total fee on mobile money contributions (e.g., 1.95%).',
                step: 0.01,
                width: '50%',
              },
            },
            {
              name: 'mobileMoneyHogapayFeePercent',
              label: 'Hogapay Split (%)',
              type: 'number',
              required: true,
              defaultValue: 0.8,
              min: 0,
              max: 100,
              admin: {
                description: "Hogapay's share of the mobile money collection fee.",
                step: 0.01,
                width: '50%',
              },
            },
          ],
        },
      ],
    },

    {
      type: 'collapsible',
      label: 'Collection — Bank Transfer',
      admin: {
        initCollapsed: false,
        description: 'Fees charged on bank transfer contributions.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'bankTransferCollectionFee',
              label: 'Fee (%)',
              type: 'number',
              required: true,
              defaultValue: 1.95,
              min: 0,
              max: 100,
              admin: {
                description: 'Total fee on bank transfer contributions (e.g., 1.95%).',
                step: 0.01,
                width: '50%',
              },
            },
            {
              name: 'bankTransferHogapayFeePercent',
              label: 'Hogapay Split (%)',
              type: 'number',
              required: true,
              defaultValue: 0.8,
              min: 0,
              max: 100,
              admin: {
                description: "Hogapay's share of the bank transfer collection fee.",
                step: 0.01,
                width: '50%',
              },
            },
          ],
        },
      ],
    },

    {
      type: 'collapsible',
      label: 'Collection — Card',
      admin: {
        initCollapsed: false,
        description: 'Fees charged on card contributions.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'cardCollectionFee',
              label: 'Fee (%)',
              type: 'number',
              required: true,
              defaultValue: 1.95,
              min: 0,
              max: 100,
              admin: {
                description: 'Total fee on card contributions (e.g., 1.95%).',
                step: 0.01,
                width: '50%',
              },
            },
            {
              name: 'cardHogapayFeePercent',
              label: 'Hogapay Split (%)',
              type: 'number',
              required: true,
              defaultValue: 0.8,
              min: 0,
              max: 100,
              admin: {
                description: "Hogapay's share of the card collection fee.",
                step: 0.01,
                width: '50%',
              },
            },
          ],
        },
      ],
    },

    // ── Transfer (Payouts) — Mobile Money ──
    {
      type: 'collapsible',
      label: 'Transfer (Payout) — Mobile Money',
      admin: {
        initCollapsed: false,
        description: 'Fees charged on mobile money withdrawals.',
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
                description: 'Percentage fee on mobile money payouts.',
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
                description: "Hogapay's share of the mobile money transfer fee.",
                step: 0.01,
                width: '50%',
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'payoutFlatFeeThreshold',
              label: 'Flat Fee Threshold (GHS)',
              type: 'number',
              required: true,
              defaultValue: 100,
              min: 0,
              admin: {
                description: 'Mobile money payouts below this amount attract an extra flat fee.',
                step: 1,
                width: '50%',
              },
            },
            {
              name: 'payoutFlatFeeAmount',
              label: 'Flat Fee (GHS)',
              type: 'number',
              required: true,
              defaultValue: 1,
              min: 0,
              admin: {
                description: 'Extra flat fee for mobile money payouts below the threshold.',
                step: 0.5,
                width: '50%',
              },
            },
          ],
        },
      ],
    },

    // ── Transfer (Payouts) — Bank ──
    {
      type: 'collapsible',
      label: 'Transfer (Payout) — Bank',
      admin: {
        initCollapsed: false,
        description: 'Fees charged on bank transfer withdrawals.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'bankPayoutFeePercentage',
              label: 'Fee (%)',
              type: 'number',
              required: true,
              defaultValue: 1,
              min: 0,
              max: 100,
              admin: {
                description: 'Percentage fee on bank payouts.',
                step: 0.1,
                width: '50%',
              },
            },
            {
              name: 'hogapayBankPayoutFeePercent',
              label: 'Hogapay Split (%)',
              type: 'number',
              required: true,
              defaultValue: 0.5,
              min: 0,
              max: 100,
              admin: {
                description: "Hogapay's share of the bank transfer fee.",
                step: 0.01,
                width: '50%',
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'bankPayoutFlatFeeThreshold',
              label: 'Flat Fee Threshold (GHS)',
              type: 'number',
              required: true,
              defaultValue: 100,
              min: 0,
              admin: {
                description: 'Bank payouts below this amount attract an extra flat fee.',
                step: 1,
                width: '50%',
              },
            },
            {
              name: 'bankPayoutFlatFeeAmount',
              label: 'Flat Fee (GHS)',
              type: 'number',
              required: true,
              defaultValue: 1,
              min: 0,
              admin: {
                description: 'Extra flat fee for bank payouts below the threshold.',
                step: 0.5,
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
          type: 'row',
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
            {
              name: 'minimumPayoutAmount',
              label: 'Minimum Payout Amount (GHS)',
              type: 'number',
              required: true,
              defaultValue: 10,
              min: 0,
              admin: {
                description: 'Minimum amount a jar creator can withdraw (e.g., 10 = GHS 10.00).',
                step: 0.5,
                width: '50%',
              },
            },
          ],
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
