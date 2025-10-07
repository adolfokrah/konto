/**
 * Simple SMS client for MNotify bulk / quick SMS endpoint.
 *
 * MNotify "quick" endpoint typically expects:
 *  POST <baseUrl>?key=API_KEY
 *  Body JSON: { message: string, sender: string, recipients: string[] }
 *
 * This client:
 *  - Normalizes phone numbers (removes spaces, dashes, leading +)
 *  - Optionally chunks large recipient lists (configurable)
 *  - Returns structured success / error result
 */

export interface SMSClientOptions {
  /** Override SMS username (otherwise taken from env) */
  username?: string
  /** Override SMS password (otherwise taken from env) */
  password?: string
  /** Override SMS source/sender ID (otherwise taken from env) */
  source?: string
  /** Override base URL (otherwise taken from env or default) */
  baseUrl?: string
  /** Maximum recipients per request (Deywuro may impose limits). Default 100. */
  maxPerRequest?: number
  /** Abort signal for cancellation */
  signal?: AbortSignal
}

export interface SendSMSParams {
  to: string | string[]
  message: string
  /** If true, silently ignore numbers that fail basic validation (length < 6). Default false. */
  skipInvalid?: boolean
  /** Optional schedule date (ISO string or supported format by provider). If provided, is_schedule becomes true */
  scheduleDate?: string
}

export interface SendSMSResult {
  success: boolean
  message: string
  recipients: string[]
  sent: number
  failed: number
  errors?: string[]
}

export class SMSClient {
  private readonly username: string
  private readonly password: string
  private readonly source: string
  private readonly baseUrl: string
  private readonly signal?: AbortSignal

  constructor(opts: SMSClientOptions = {}) {
    const isTest = process.env.NODE_ENV === 'test'
    let username = opts.username || process.env.SMS_USERNAME || ''
    let password = opts.password || process.env.SMS_PASS || ''
    let source = opts.source || process.env.SMS_SOURCE || ''

    if (isTest) {
      if (!username) username = 'test_username'
      if (!password) password = 'test_password'
      if (!source) source = 'TEST'
    }

    this.username = username
    this.password = password
    this.source = source
    this.baseUrl = (
      opts.baseUrl ||
      process.env.SMS_API_BASE_URL ||
      'https://www.deywuro.com/api/sms'
    ).replace(/\/$/, '')
    this.signal = opts.signal
    if (!this.username) throw new Error('SMS username (SMS_USERNAME) is required')
    if (!this.password) throw new Error('SMS password (SMS_PASS) is required')
    if (!this.source) throw new Error('SMS source (SMS_SOURCE) is required')
  }

  /** Public helper to format a single phone number */
  formatNumber(num: string): string {
    let cleaned = num.trim().replace(/[\s-]/g, '')
    cleaned = cleaned.replace(/^\+/, '') // remove leading +
    // If Ghana local starting with 0 and length 10 -> convert to 233
    if (/^0\d{9}$/.test(cleaned)) {
      cleaned = '233' + cleaned.substring(1)
    }
    return cleaned
  }

  private normalizeRecipients(input: string | string[], skipInvalid: boolean): string[] {
    const arr = Array.isArray(input) ? input : [input]
    const formatted = arr
      .map((n) => this.formatNumber(n))
      .filter((n) => {
        if (n.length < 6) return !!skipInvalid
        return true
      })
    // Remove obvious duplicates
    return Array.from(new Set(formatted))
  }

  /** Sends SMS using Deywuro API with JSON POST format. */
  async send({
    to,
    message,
    skipInvalid = false,
    scheduleDate,
  }: SendSMSParams): Promise<SendSMSResult> {
    if (!message || !message.trim()) throw new Error('Message is required')
    const recipients = this.normalizeRecipients(to, skipInvalid)
    if (recipients.length === 0) {
      return { success: false, message: 'No valid recipients', recipients: [], sent: 0, failed: 0 }
    }

    // Build JSON payload for Deywuro API
    const payload = {
      username: this.username,
      password: this.password,
      source: this.source,
      message: message.trim(),
      destination: recipients.join(','), // Comma-separated recipients
    }

    if (process.env.NODE_ENV === 'test') {
      return {
        success: true,
        message: 'Test mode: SMS send skipped',
        recipients,
        sent: recipients.length,
        failed: 0,
      }
    }

    try {
      const res = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
        signal: this.signal,
      })

      const raw = await this.safeJson(res)

      // Deywuro API uses code 0 for success (not standard HTTP codes)
      const responseCode = (raw as any)?.code
      const isSuccess = responseCode === 0

      if (!isSuccess) {
        const errorMessage = this.getErrorMessage(responseCode, (raw as any)?.message)
        return {
          success: false,
          message: errorMessage,
          recipients,
          sent: 0,
          failed: recipients.length,
          errors: [errorMessage],
        }
      }

      const successMessage = (raw as any)?.message || 'SMS sent successfully'
      return {
        success: true,
        message: successMessage,
        recipients,
        sent: recipients.length,
        failed: 0,
      }
    } catch (err: any) {
      const msg = err?.message || 'Unknown error'
      return {
        success: false,
        message: msg,
        recipients,
        sent: 0,
        failed: recipients.length,
        errors: [msg],
      }
    }
  }

  private getErrorMessage(code: number, defaultMessage?: string): string {
    // Map Deywuro API error codes to user-friendly messages
    switch (code) {
      case 401:
        return 'Invalid SMS credentials'
      case 402:
        return 'Insufficient SMS balance'
      case 403:
        return 'SMS service access denied'
      case 404:
        return 'SMS service not found'
      case 500:
        return 'SMS service temporarily unavailable'
      default:
        return defaultMessage || `SMS service error (code: ${code})`
    }
  }

  private async safeJson(res: Response): Promise<unknown> {
    try {
      return await res.json()
    } catch {
      return null
    }
  }
}

// Lazy-loaded default instance using ENV vars
let _smsClient: SMSClient | null = null

export const getSmsClient = (): SMSClient => {
  if (!_smsClient) {
    _smsClient = new SMSClient()
  }
  return _smsClient
}

/**
 * Shorthand helper.
 * await sendSMS(["233xxxxxxxxx"], "Hello!")
 */
export const sendSMS = (to: string | string[], message: string, skipInvalid = false) =>
  getSmsClient().send({ to, message, skipInvalid })
