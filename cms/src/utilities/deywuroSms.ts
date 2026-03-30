/**
 * Deywuro (Npontu) SMS API
 * Base URL: https://deywuro.com/api/sms
 * Response codes: 0 = success, 401 = invalid creds, 402 = missing fields,
 *                 403 = insufficient balance, 404 = not routable, 500 = server error
 */

const DEYWURO_BASE_URL = process.env.SMS_API_BASE_URL || 'https://www.deywuro.com/api/sms'

/**
 * Normalise a phone number to the 233XXXXXXXXX format required by Deywuro.
 * Handles: 0XXXXXXXXX, +233XXXXXXXXX, 233XXXXXXXXX
 */
export function normalisePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('233') && digits.length === 12) return digits
  if (digits.startsWith('0') && digits.length === 10) return `233${digits.slice(1)}`
  if (digits.length === 9) return `233${digits}`
  return null
}

export interface SmsSendResult {
  successCount: number
  failureCount: number
}

/**
 * Send an SMS to one or more phone numbers via Deywuro.
 * Numbers should already be normalised (233XXXXXXXXX format).
 * The API accepts comma-separated destinations in a single call.
 */
export async function sendSms(phoneNumbers: string[], message: string): Promise<SmsSendResult> {
  const username = process.env.SMS_USERNAME
  const password = process.env.SMS_PASS
  const source = process.env.SMS_SOURCE || 'Hogapay'

  if (!username || !password) {
    console.error('Deywuro credentials not configured (SMS_USERNAME / SMS_PASS)')
    return { successCount: 0, failureCount: phoneNumbers.length }
  }

  if (phoneNumbers.length === 0) {
    return { successCount: 0, failureCount: 0 }
  }

  const destination = phoneNumbers.join(',')

  try {
    const res = await fetch(DEYWURO_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, source, destination, message }),
    })

    const data = await res.json()

    if (data.code === 0) {
      return { successCount: phoneNumbers.length, failureCount: 0 }
    }

    console.error(`Deywuro SMS failed — code ${data.code}: ${data.message}`)
    return { successCount: 0, failureCount: phoneNumbers.length }
  } catch (err: any) {
    console.error('Deywuro SMS request error:', err.message)
    return { successCount: 0, failureCount: phoneNumbers.length }
  }
}
