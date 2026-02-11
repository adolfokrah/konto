import { Resend } from 'resend'
import Eganow from './eganow'

export const eganow = new Eganow({
  username: process.env.EGANOW_SECRET_USERNAME!,
  password: process.env.EGANOW_SECRET_PASSWORD!,
  xAuth: process.env.EGANOW_X_AUTH_TOKEN!,
})

export const resend = new Resend(process.env.RESEND_API_KEY)
