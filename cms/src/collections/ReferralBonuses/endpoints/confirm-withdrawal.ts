import type { PayloadHandler } from 'payload'
import { addDataAndFileToRequest } from 'payload'

const MAX_OTP_ATTEMPTS = 5

const MOMO_PROVIDERS = new Set(['mtn', 'telecel'])

export const confirmWithdrawal: PayloadHandler = async (req) => {
  const user = req.user
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  await addDataAndFileToRequest(req)
  const { code } = req.data || {}

  if (!code) {
    return Response.json({ success: false, message: 'OTP code is required' }, { status: 400 })
  }

  const fullUser = await req.payload.findByID({
    collection: 'users',
    id: user.id,
    overrideAccess: true,
  })

  // Rate limit check
  if ((fullUser.otpAttempts ?? 0) >= MAX_OTP_ATTEMPTS) {
    return Response.json(
      { success: false, message: 'Too many failed attempts. Please request a new OTP.' },
      { status: 429 },
    )
  }

  if (!fullUser.otpCode || !fullUser.otpExpiry) {
    return Response.json(
      { success: false, message: 'No OTP found. Please request a new one.' },
      { status: 400 },
    )
  }

  // Expiry check
  if (new Date() > new Date(fullUser.otpExpiry)) {
    await req.payload.update({
      collection: 'users',
      id: user.id,
      data: { otpCode: '', otpExpiry: '', otpAttempts: 0 },
      overrideAccess: true,
    })
    return Response.json(
      { success: false, message: 'OTP expired. Please request a new one.' },
      { status: 400 },
    )
  }

  // Verify code
  if (fullUser.otpCode !== code) {
    await req.payload.update({
      collection: 'users',
      id: user.id,
      data: { otpAttempts: (fullUser.otpAttempts ?? 0) + 1 },
      overrideAccess: true,
    })
    return Response.json(
      { success: false, message: 'Invalid OTP. Please try again.' },
      { status: 400 },
    )
  }

  // Clear OTP
  await req.payload.update({
    collection: 'users',
    id: user.id,
    data: { otpCode: '', otpExpiry: '', otpAttempts: 0 },
    overrideAccess: true,
  })

  // Fetch pending bonuses
  const bonuses = await req.payload.find({
    collection: 'referral-bonuses',
    where: {
      and: [{ user: { equals: user.id } }, { status: { equals: 'pending' } }],
    },
    limit: 100,
    pagination: false,
    overrideAccess: true,
  })

  if (bonuses.totalDocs === 0) {
    return Response.json(
      { success: false, message: 'No pending balance to withdraw' },
      { status: 400 },
    )
  }

  const totalAmount = bonuses.docs.reduce((sum, b) => sum + (b.amount ?? 0), 0)
  const netAmount = parseFloat(totalAmount.toFixed(4))
  const accountSuffix = (fullUser.accountNumber ?? '').slice(-4)
  const bankName = fullUser.bank ?? ''
  const isMoMo = MOMO_PROVIDERS.has(bankName.toLowerCase())

  // Mark all pending bonuses as paid
  await Promise.all(
    bonuses.docs.map((bonus) =>
      req.payload.update({
        collection: 'referral-bonuses',
        id: bonus.id,
        data: { status: 'paid' },
        overrideAccess: true,
      }),
    ),
  )

  // Create negative withdrawal ledger entry (pending until payout confirms)
  const withdrawalRecord = await req.payload.create({
    collection: 'referral-bonuses',
    data: {
      user: user.id,
      referral: bonuses.docs[0].referral as string,
      bonusType: bonuses.docs[0].bonusType,
      amount: -netAmount,
      status: 'pending',
      description: `Withdrawal of GHS ${netAmount.toFixed(2)} → ${bankName} ****${accountSuffix}`,
    },
    overrideAccess: true,
  })

  if (isMoMo && fullUser.accountNumber) {
    // Queue payout — sequential processing via the payout queue prevents race conditions
    await req.payload.jobs.queue({
      task: 'process-referral-withdrawal' as any,
      input: {
        withdrawalRecordId: withdrawalRecord.id,
        userId: user.id,
        bank: bankName,
        accountNumber: fullUser.accountNumber,
        accountHolder: fullUser.accountHolder ?? fullUser.firstName ?? fullUser.username ?? '',
        amount: String(netAmount),
      },
      queue: 'payout',
    })

    await req.payload.jobs.run({ queue: 'payout' })

    return Response.json({
      success: true,
      message: `GHS ${netAmount.toFixed(2)} is being sent to your ${bankName.toUpperCase()} account ending ${accountSuffix}.`,
      amount: netAmount,
    })
  }

  // Non-MoMo — manual processing by admin
  return Response.json({
    success: true,
    message: `Withdrawal request of GHS ${netAmount.toFixed(2)} submitted. Our team will process it to your ${bankName} account ending ${accountSuffix}.`,
    amount: netAmount,
  })
}
