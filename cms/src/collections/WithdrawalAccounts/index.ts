import type { CollectionConfig } from 'payload'

/**
 * A user's saved withdrawal destinations. Each is either mobile money or bank.
 * Jars link to one of these; payouts for a jar go to its linked account.
 */
export const WithdrawalAccounts: CollectionConfig = {
  slug: 'withdrawal-accounts',
  labels: { singular: 'Withdrawal Account', plural: 'Withdrawal Accounts' },
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'user', 'type', 'accountNumber', 'isDefault'],
  },
  access: {
    create: ({ req: { user } }) => !!user,
    read: ({ req: { user } }) => {
      const role = (user as any)?.role
      if (role === 'admin' || role === 'auditor') return true
      if (user) return { user: { equals: user.id } }
      return false
    },
    update: ({ req: { user } }) => {
      if ((user as any)?.role === 'admin') return true
      if (user) return { user: { equals: user.id } }
      return false
    },
    delete: ({ req: { user } }) => {
      if ((user as any)?.role === 'admin') return true
      if (user) return { user: { equals: user.id } }
      return false
    },
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'mobile-money',
      options: [
        { label: 'Mobile Money', value: 'mobile-money' },
        { label: 'Bank', value: 'bank' },
      ],
    },
    {
      name: 'provider',
      type: 'text',
      required: true,
      admin: {
        description:
          'Mobile money: mtn|telecel. Bank: Eganow bank paypartner code (e.g. STANBICGH).',
      },
    },
    {
      name: 'accountNumber',
      type: 'text',
      required: true,
      admin: { description: 'Phone number (mobile money) or bank account number.' },
    },
    { name: 'accountHolder', type: 'text', required: true },
    {
      name: 'label',
      type: 'text',
      admin: { description: 'Optional nickname shown in pickers.' },
    },
    {
      name: 'isDefault',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Default account for user-level payouts (e.g. referral bonuses).' },
    },
    {
      name: 'verified',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'True when the account name was verified via name enquiry.' },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        // Owner is the acting user on create (admin/migration act without req.user).
        if (operation === 'create' && req.user && !data.user) {
          data.user = req.user.id
        }

        // No verification gate here on purpose. Saving a payout destination moves
        // no money, so a user can set one up before starting KYC/KYB. Verification
        // is enforced where value actually moves: contributing, receiving
        // contributions, and payouts (see the payout-eganow endpoint).
        return data
      },
    ],
    afterChange: [
      async ({ doc, req, operation }) => {
        // Enforce a single default per user, and make the first account default.
        const userId = typeof doc.user === 'object' ? doc.user?.id : doc.user
        if (!userId) return

        const all = await req.payload.find({
          collection: 'withdrawal-accounts',
          where: { user: { equals: userId } },
          limit: 100,
          depth: 0,
          overrideAccess: true,
        })

        const others = all.docs.filter((a: any) => a.id !== doc.id)

        if (doc.isDefault) {
          // Unset default on the user's other accounts.
          for (const a of others) {
            if ((a as any).isDefault) {
              await req.payload.update({
                collection: 'withdrawal-accounts',
                id: a.id,
                data: { isDefault: false },
                overrideAccess: true,
              })
            }
          }
        } else if (operation === 'create' && others.length === 0) {
          // First account for this user → make it the default.
          await req.payload.update({
            collection: 'withdrawal-accounts',
            id: doc.id,
            data: { isDefault: true },
            overrideAccess: true,
          })
        }
      },
    ],
  },
}
