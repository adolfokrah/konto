import type { PayloadHandler } from 'payload'
import { generateAndSendOtp } from '@/utilities/otp'

export const initiateWithdrawal: PayloadHandler = async (req) => {
  const user = req.user
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const fullUser = await req.payload.findByID({
    collection: 'users',
    id: user.id,
    overrideAccess: true,
  })

  // Guard: KYC must be verified
  if (fullUser.kycStatus !== 'verified') {
    return Response.json(
      {
        success: false,
        message: 'KYC verification required before withdrawal',
        code: 'KYC_REQUIRED',
      },
      { status: 403 },
    )
  }

  // Guard: withdrawal account must be set
  if (!fullUser.accountNumber || !fullUser.bank) {
    return Response.json(
      {
        success: false,
        message: 'Please set your withdrawal account first',
        code: 'WITHDRAWAL_ACCOUNT_REQUIRED',
      },
      { status: 403 },
    )
  }

  // Guard: no withdrawal already in progress
  const inProgress = await req.payload.find({
    collection: 'referral-bonuses',
    where: {
      and: [{ user: { equals: user.id } }, { status: { equals: 'pending' } }],
    },
    limit: 1,
    pagination: false,
    overrideAccess: true,
  })

  if (inProgress.totalDocs > 0) {
    return Response.json(
      { success: false, message: 'A withdrawal is already being processed. Please wait.' },
      { status: 400 },
    )
  }

  // Compute available balance from all records
  const bonuses = await req.payload.find({
    collection: 'referral-bonuses',
    where: { user: { equals: user.id } },
    limit: 1000,
    pagination: false,
    overrideAccess: true,
  })

  const amount = parseFloat(bonuses.docs.reduce((sum, b) => sum + (b.amount ?? 0), 0).toFixed(4))

  if (amount <= 0) {
    return Response.json({ success: false, message: 'No balance to withdraw' }, { status: 400 })
  }

  // Fetch withdrawal limits from system settings
  const settings = await req.payload.findGlobal({ slug: 'system-settings' })
  const minWithdrawal = settings?.referralMinWithdrawalAmount ?? 20
  const maxWithdrawal = settings?.referralMaxWithdrawalAmount ?? 500

  if (amount < minWithdrawal) {
    return Response.json(
      {
        success: false,
        message: `Minimum withdrawal amount is GHS ${minWithdrawal.toFixed(2)}. Your current balance is GHS ${amount.toFixed(2)}.`,
      },
      { status: 400 },
    )
  }

  if (maxWithdrawal > 0 && amount > maxWithdrawal) {
    return Response.json(
      {
        success: false,
        message: `Maximum withdrawal amount is GHS ${maxWithdrawal.toFixed(2)}.`,
      },
      { status: 400 },
    )
  }

  // Generate OTP and send via SMS + email
  const phone = `${fullUser.countryCode}${fullUser.phoneNumber}`
  await generateAndSendOtp(req.payload, user.id, {
    phone,
    email: fullUser.email,
    isDemoUser: fullUser.demoUser ?? false,
    message: `Your Hogapay withdrawal code is: {code}. Do not share this with anyone.`,
  })

  // Mask phone for display
  const rawPhone = fullUser.phoneNumber ?? ''
  const maskedPhone = rawPhone.length > 4 ? `****${rawPhone.slice(-4)}` : '****'

  return Response.json({
    success: true,
    amount,
    maskedPhone,
    bank: fullUser.bank,
    accountNumber: `****${(fullUser.accountNumber ?? '').slice(-4)}`,
    message: `OTP sent to ${maskedPhone}`,
  })
}
