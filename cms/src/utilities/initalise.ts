import { Resend } from 'resend'
import Chango from './chango'
import Eganow from './eganow'

let _eganow: Eganow | null = null
let _chango: Chango | null = null
let _resend: Resend | null = null

export function getEganow(): Eganow {
  if (!_eganow) {
    _eganow = new Eganow({
      username: process.env.EGANOW_SECRET_USERNAME!,
      password: process.env.EGANOW_SECRET_PASSWORD!,
      xAuth: process.env.EGANOW_X_AUTH_TOKEN!,
      hostedCheckoutBaseUrl: process.env.EGANOW_HOSTED_CHECKOUT_BASE_URL,
    })
  }
  return _eganow
}

export function getChango(): Chango {
  if (!_chango) {
    _chango = new Chango({
      gatewayKey: process.env.CHANGO_X_API_KEY!,
      apiKey: process.env.CHANGO_API_KEY!,
      transflowId: process.env.CHANGO_TRANSFLOW_ID!,
      merchantProductId: process.env.CHANGO_MERCHANT_PRODUCT_ID!,
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
