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

  const totalAmount = result.docs.reduce((sum, b) => sum + (b.amount ?? 0), 0)
  const netAmount = parseFloat(totalAmount.toFixed(4))

  // Mark all pending bonuses as paid
  await Promise.all(
    result.docs.map((bonus) =>
      req.payload.update({
        collection: 'referral-bonuses',
        id: bonus.id,
        data: { status: 'paid' },
        overrideAccess: true,
      }),
    ),
  )

  // Create a negative withdrawal record so the ledger balances to zero
  await req.payload.create({
    collection: 'referral-bonuses',
    data: {
      user: user.id,
      referral: result.docs[0].referral as string,
      bonusType: result.docs[0].bonusType,
      amount: -netAmount,
      status: 'paid',
      description: `Withdrawal of GHS ${netAmount.toFixed(2)}`,
    },
    overrideAccess: true,
  })

  return Response.json({
    success: true,
    message: `GHS ${netAmount.toFixed(2)} withdrawal submitted. Our team will process it shortly.`,
    amount: netAmount,
  })
}
