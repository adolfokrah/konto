import { Resend } from 'resend'
import Eganow from './eganow'
import Paystack from './paystack'

let _eganow: Eganow | null = null
let _resend: Resend | null = null
let _paystack: Paystack | null = null

export function getEganow(): Eganow {
  if (!_eganow) {
    _eganow = new Eganow({
      username: process.env.EGANOW_SECRET_USERNAME!,
      password: process.env.EGANOW_SECRET_PASSWORD!,
      xAuth: process.env.EGANOW_X_AUTH_TOKEN!,
    })
  }
  return _eganow
}

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
