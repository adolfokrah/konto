import { Resend } from 'resend'
import Chango from './chango'

let _chango: Chango | null = null
let _resend: Resend | null = null

export function getChango(): Chango {
  if (!_chango) {
    const k = process.env.CHANGO_API_KEY
    console.log(
      `[Chango] init: apiKey present=${!!k} len=${k?.length ?? 0} startsWithQuote=${k?.startsWith('"') ?? false}`,
    )
    _chango = new Chango({
      apiKey: process.env.CHANGO_API_KEY!,
      xApiKey: process.env.CHANGO_X_API_KEY,
      groupId: process.env.CHANGO_GROUP_ID!,
      paymentDestinationNumber: process.env.CHANGO_PAYMENT_DESTINATION_NUMBER!,
      bankId: process.env.CHANGO_BANK_ID,
      branchId: process.env.CHANGO_BRANCH_ID,
      merchantProductId: process.env.CHANGO_MERCHANT_PRODUCT_ID,
      transflowId: process.env.CHANGO_TRANSFLOW_ID,
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
