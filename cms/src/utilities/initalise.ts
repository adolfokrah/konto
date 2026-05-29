import { Resend } from 'resend'
import Chango from './chango'

let _chango: Chango | null = null
let _resend: Resend | null = null

export function getChango(): Chango {
  if (!_chango) {
    _chango = new Chango({
      apiKey: process.env.CHANGO_API_KEY!,
      groupId: process.env.CHANGO_GROUP_ID!,
      paymentDestinationNumber: process.env.CHANGO_PAYMENT_DESTINATION_NUMBER!,
      bankId: process.env.CHANGO_BANK_ID,
      branchId: process.env.CHANGO_BRANCH_ID,
      merchantProductId: process.env.CHANGO_MERCHANT_PRODUCT_ID,
      baseUrl: process.env.CHANGO_BASE_URL,
    })
  }
  return _chango
}

export function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}
