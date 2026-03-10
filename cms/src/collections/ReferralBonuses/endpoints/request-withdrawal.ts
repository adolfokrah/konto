import type { PayloadHandler } from 'payload'

export const requestWithdrawal: PayloadHandler = async (req) => {
  const user = req.user
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await req.payload.find({
    collection: 'referral-bonuses',
    where: {
      and: [{ user: { equals: user.id } }, { status: { equals: 'pending' } }],
    },
    limit: 100,
    pagination: false,
    overrideAccess: true,
  })

  if (result.totalDocs === 0) {
    return Response.json(
      { success: false, message: 'No pending bonuses to withdraw' },
      { status: 400 },
    )
  }

  await Promise.all(
    result.docs.map((bonus) =>
      req.payload.update({
        collection: 'referral-bonuses',
        id: bonus.id,
        data: { status: 'withdrawal-requested' },
        overrideAccess: true,
      }),
    ),
  )

  const totalAmount = result.docs.reduce((sum, b) => sum + (b.amount ?? 0), 0)

  return Response.json({
    success: true,
    message: `Withdrawal request of GHS ${totalAmount.toFixed(2)} submitted successfully`,
    amount: parseFloat(totalAmount.toFixed(4)),
  })
}
