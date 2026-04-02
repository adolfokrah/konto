import { Resend } from 'resend'
import Paystack from './paystack'

let _resend: Resend | null = null
let _paystack: Paystack | null = null

export function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

export function getPaystack(): Paystack {
  if (!_paystack) {
    _paystack = new Paystack({
      secretKey: process.env.PAYSTACK_SECRET_KEY!,
    })
  }
  return _paystack
}
