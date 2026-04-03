import type { CollectionConfig } from 'payload'
import { authenticated } from '../access/authenticated'
import { anyone } from '../access/anyone'

export const PayoutFees: CollectionConfig = {
  slug: 'payout-fees',
  admin: {
    useAsTitle: 'id',
    defaultColumns: [
      'country',
      'paymentMethod',
      'fee',
      'hogapaySplit',
      'flatFeeThreshold',
      'flatFee',
    ],
    description: 'Payout fee rates per country and payment method.',
  },
  access: {
    create: authenticated,
    update: authenticated,
    delete: authenticated,
    read: anyone,
  },
  fields: [
    {
      name: 'country',
      type: 'select',
      required: true,
      options: [
        { label: 'Ghana', value: 'ghana' },
        { label: 'Nigeria', value: 'nigeria' },
      ],
    },
    {
      name: 'paymentMethod',
      type: 'relationship',
      relationTo: 'payment-methods',
      required: true,
      admin: {
        description: 'The payment method this fee applies to.',
      },
    },
    {
      name: 'fee',
      type: 'number',
      required: true,
      admin: {
        description: 'Percentage fee on payouts (%).',
      },
    },
    {
      name: 'hogapaySplit',
      type: 'number',
      required: true,
      admin: {
        description: "Hogapay's share of the fee (%).",
      },
    },
    {
      name: 'flatFeeThreshold',
      type: 'number',
      required: true,
      admin: {
        description: 'Payouts below this amount attract an additional flat fee.',
      },
    },
    {
      name: 'flatFee',
      type: 'number',
      required: true,
      admin: {
        description: 'Flat fee added when payout is below the threshold.',
      },
    },
    {
      name: 'minimumPayoutAmount',
      type: 'number',
      required: true,
      admin: {
        description: 'Minimum payout amount allowed for this payment method.',
      },
    },
  ],
}
