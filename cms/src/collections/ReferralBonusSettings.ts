import type { CollectionConfig } from 'payload'
import { authenticated } from '../access/authenticated'
import { anyone } from '../access/anyone'

export const ReferralBonusSettings: CollectionConfig = {
  slug: 'referral-bonus-settings',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['country', 'firstContributionBonus', 'feeShare', 'minWithdrawal'],
    description: 'Referral bonus rates per country.',
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
      name: 'firstContributionBonus',
      type: 'number',
      required: true,
      admin: {
        description: "Bonus paid when the referred user's jar gets its first contribution.",
      },
    },
    {
      name: 'feeShare',
      type: 'number',
      required: true,
      admin: {
        description: "% of Hogapay's transfer fee shared with the referrer.",
      },
    },
    {
      name: 'minWithdrawal',
      type: 'number',
      required: true,
      admin: {
        description: 'Minimum referral balance required to initiate a withdrawal.',
      },
    },
  ],
}
