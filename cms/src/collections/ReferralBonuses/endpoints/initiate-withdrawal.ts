import type { PayloadHandler } from 'payload'
import { sendSMS } from '@/utilities/sms'

const OTP_VALIDITY_MINUTES = 5
const MINIMUM_WITHDRAWAL_AMOUNT = 20

function generateOTPCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

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

  // Guard: must have pending balance
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

  const amount = parseFloat(bonuses.docs.reduce((sum, b) => sum + (b.amount ?? 0), 0).toFixed(4))

  if (amount < MINIMUM_WITHDRAWAL_AMOUNT) {
    return Response.json(
      {
        success: false,
        message: `Minimum withdrawal amount is GHS ${MINIMUM_WITHDRAWAL_AMOUNT.toFixed(2)}. Your current balance is GHS ${amount.toFixed(2)}.`,
      },
      { status: 400 },
    )
  }

  // Generate and store OTP on the user document
  const code = fullUser.demoUser ? '123456' : generateOTPCode()
  const expiry = new Date(Date.now() + OTP_VALIDITY_MINUTES * 60 * 1000)

  await req.payload.update({
    collection: 'users',
    id: user.id,
    data: { otpCode: code, otpExpiry: expiry.toISOString(), otpAttempts: 0 },
    overrideAccess: true,
  })

  // Send OTP via SMS
  if (!fullUser.demoUser) {
    const phone = `${fullUser.countryCode}${fullUser.phoneNumber}`
    await sendSMS(phone, `Your Hogapay withdrawal code is: ${code}. Do not share this with anyone.`)
  }

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
