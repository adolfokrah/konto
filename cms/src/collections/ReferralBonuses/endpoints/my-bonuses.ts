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

  const pending = result.docs
    .filter((b) => b.status === 'pending')
    .reduce((sum, b) => sum + (b.amount ?? 0), 0)

  const paid = result.docs
    .filter((b) => b.status === 'paid')
    .reduce((sum, b) => sum + (b.amount ?? 0), 0)

  const withdrawalRequested = result.docs
    .filter((b) => b.status === 'withdrawal-requested')
    .reduce((sum, b) => sum + (b.amount ?? 0), 0)

  return Response.json({
    success: true,
    summary: {
      pending: parseFloat(pending.toFixed(4)),
      paid: parseFloat(paid.toFixed(4)),
      withdrawalRequested: parseFloat(withdrawalRequested.toFixed(4)),
    },
    bonuses: result.docs,
  })
}
