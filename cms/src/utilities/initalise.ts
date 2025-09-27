import { Resend } from 'resend'
import Paystack from './paystack'

export const paystack = new Paystack({ secretKey: process.env.PAYSTACK_SECRET! })

export const resend = new Resend(process.env.RESEND_API_KEY)
