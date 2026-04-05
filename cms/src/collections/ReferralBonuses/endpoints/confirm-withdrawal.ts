import type { PayloadHandler } from 'payload'
import { addDataAndFileToRequest } from 'payload'
import { getCharges } from '@/utilities/getCharges'
import type { PaymentMethod } from '@/payload-types'

const MAX_OTP_ATTEMPTS = 5

const MOMO_PROVIDERS = new Set(['mtn', 'telecel'])

const bankCodeMap: Record<string, string> = {
  mtn: 'MTN',
  telecel: 'VOD',
  vodafone: 'VOD',
  airteltigo: 'ATL',
  atl: 'ATL',
}

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

  // Compute available balance from all records
  const allBonuses = await req.payload.find({
    collection: 'referral-bonuses',
    where: { user: { equals: user.id } },
    limit: 1000,
    pagination: false,
    overrideAccess: true,
  })

  const totalAmount = allBonuses.docs.reduce((sum, b) => sum + (b.amount ?? 0), 0)
  const grossAmount = parseFloat(totalAmount.toFixed(4))

  if (grossAmount <= 0) {
    return Response.json({ success: false, message: 'No balance to withdraw' }, { status: 400 })
  }

  const accountSuffix = (fullUser.accountNumber ?? '').slice(-4)
  const bankName = fullUser.bank ?? ''
  const isMoMo = MOMO_PROVIDERS.has(bankName.toLowerCase())
  const resolvedBankCode = bankCodeMap[bankName.toLowerCase()] ?? null

  const withdrawalPaymentMethod = fullUser.withdrawalPaymentMethod
  const paymentMethodSlug =
    typeof withdrawalPaymentMethod === 'object' && withdrawalPaymentMethod !== null
      ? (withdrawalPaymentMethod as PaymentMethod).slug
      : (withdrawalPaymentMethod as string | null | undefined)

  // Referral withdrawal only charges the flat fee (no percentage rate)
  const payoutCharges = await getCharges(req.payload, {
    amount: grossAmount,
    type: 'referral-payout',
    paymentMethod: paymentMethodSlug ?? 'mobile-money',
    country: (fullUser.country as string | undefined)?.toLowerCase(),
  })

  const processingFee = payoutCharges.processingFee
  const netAmount = payoutCharges.netAmount

  if (netAmount <= 0) {
    return Response.json(
      { success: false, message: 'Balance is insufficient to cover payout fees' },
      { status: 400 },
    )
  }

  // Get a referral reference from the most recent earned bonus
  const earnedBonus = allBonuses.docs.find((b) => (b.amount ?? 0) > 0)

  // Create negative withdrawal ledger entry (pending until payout confirms)
  const withdrawalRecord = await req.payload.create({
    collection: 'referral-bonuses',
    data: {
      user: user.id,
      referral: earnedBonus?.referral as string,
      bonusType: earnedBonus?.bonusType ?? 'fee_share',
      amount: -grossAmount,
      status: 'pending',
      description: `Withdrawal of GHS ${netAmount.toFixed(2)} (fee: GHS ${processingFee.toFixed(2)}) → ${bankName} ****${accountSuffix}`,
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
        bankCode: resolvedBankCode ?? '',
        accountNumber: fullUser.accountNumber,
        accountHolder: fullUser.accountHolder ?? fullUser.firstName ?? fullUser.username ?? '',
        amount: String(netAmount),
      },
      queue: 'payout',
    })

    return Response.json({
      success: true,
      message: `GHS ${netAmount.toFixed(2)} is being sent to your ${bankName.toUpperCase()} account ending ${accountSuffix}.`,
      grossAmount,
      processingFee,
      amount: netAmount,
    })
  }

  // Non-MoMo — manual processing by admin
  return Response.json({
    success: true,
    message: `Withdrawal request of GHS ${netAmount.toFixed(2)} submitted. Our team will process it to your ${bankName} account ending ${accountSuffix}.`,
    grossAmount,
    processingFee,
    amount: netAmount,
  })
}
