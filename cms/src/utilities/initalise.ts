import { Resend } from 'resend'
import Eganow from './eganow'

let _eganow: Eganow | null = null
let _resend: Resend | null = null

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
