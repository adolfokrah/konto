import type { PayloadHandler } from 'payload'

export const myBonuses: PayloadHandler = async (req) => {
  const user = req.user
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await req.payload.find({
    collection: 'referral-bonuses',
    where: { user: { equals: user.id } },
    sort: '-createdAt',
    limit: 50,
    pagination: false,
    overrideAccess: true,
  })

  // Ledger: positives = earned, negatives = withdrawals paid out
  const balance = result.docs.reduce((sum, b) => sum + (b.amount ?? 0), 0)

  const totalEarned = result.docs
    .filter((b) => (b.amount ?? 0) > 0)
    .reduce((sum, b) => sum + (b.amount ?? 0), 0)

  return Response.json({
    success: true,
    summary: {
      balance: parseFloat(balance.toFixed(4)),
      totalEarned: parseFloat(totalEarned.toFixed(4)),
    },
    bonuses: result.docs,
  })
}
