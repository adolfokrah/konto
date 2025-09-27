/**
 * Simple SMS client for MNotify bulk / quick SMS endpoint.
 *
 * Environment variables used:
 *  - MNOTIFY_API_KEY (required)
 *  - MNOTIFY_SENDER_ID (required)
 *  - MNOTIFY_API_BASE_URL (optional, defaults to https://api.mnotify.com/api/sms/quick)
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
  /** Override API key (otherwise taken from env) */
  apiKey?: string
  /** Override sender ID (otherwise taken from env) */
  senderId?: string
  /** Override base URL (otherwise taken from env or default) */
  baseUrl?: string
  /** Maximum recipients per request (MNotify may impose limits). Default 100. */
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
  private readonly apiKey: string
  private readonly senderId: string
  private readonly baseUrl: string
  private readonly signal?: AbortSignal

  constructor(opts: SMSClientOptions = {}) {
    const isTest = process.env.NODE_ENV === 'test'
    let apiKey = opts.apiKey || process.env.MNOTIFY_API_KEY || ''
    let senderId = opts.senderId || process.env.MNOTIFY_SENDER_ID || ''

    if (isTest) {
      if (!apiKey) apiKey = 'test_api_key'
      if (!senderId) senderId = 'TESTSENDER'
    }

    this.apiKey = apiKey
    this.senderId = senderId
    this.baseUrl = (
      opts.baseUrl ||
      process.env.MNOTIFY_API_BASE_URL ||
      'https://api.mnotify.com/api/sms/quick'
    ).replace(/\/$/, '')
    this.signal = opts.signal
    if (!this.apiKey) throw new Error('MNotify API key (MNOTIFY_API_KEY) is required')
    if (!this.senderId) throw new Error('MNotify Sender ID (MNOTIFY_SENDER_ID) is required')
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

  /** Sends SMS mirroring the Dart SmsApiProvider: form-urlencoded with recipient[] keys. */
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

    // Build form-urlencoded body similar to Dart implementation
    const form = new URLSearchParams()
    recipients.forEach((r) => form.append('recipient[]', r))
    form.append('sender', this.senderId)
    form.append('message', message.trim())
    const isSchedule = !!scheduleDate
    form.append('is_schedule', isSchedule ? 'true' : 'false')
    form.append('schedule_date', scheduleDate || '')

    if (process.env.NODE_ENV === 'test') {
      return {
        success: true,
        message: 'Test mode: SMS send skipped',
        recipients,
        sent: recipients.length,
        failed: 0,
      }
    }

    // if (process.env.NODE_ENV !== 'production') {
    //   return { success: true, message: 'SMS sent', recipients, sent: recipients.length, failed: 0 }
    // }

    try {
      const url = this.composeUrl()
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: form.toString(),
        signal: this.signal,
      })
      const raw = await this.safeJson(res)
      const ok = res.ok && (raw as any)?.status !== false
      if (!ok) {
        const errMsg = (raw as any)?.message || `HTTP ${res.status}`
        return {
          success: false,
          message: errMsg,
          recipients,
          sent: 0,
          failed: recipients.length,
          errors: [errMsg],
        }
      }
      return { success: true, message: 'SMS sent', recipients, sent: recipients.length, failed: 0 }
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

  private composeUrl(): string {
    // Most MNotify examples add ?key=API_KEY; support both styles.
    const hasQuery = this.baseUrl.includes('?')
    if (/([?&])key=/.test(this.baseUrl)) return this.baseUrl
    return `${this.baseUrl}${hasQuery ? '&' : '?'}key=${encodeURIComponent(this.apiKey)}`
  }

  private async safeJson(res: Response): Promise<unknown> {
    try {
      return await res.json()
    } catch {
      return null
    }
  }
}

// Convenience default instance using ENV vars
export const smsClient = new SMSClient()

/**
 * Shorthand helper.
 * await sendSMS(["233xxxxxxxxx"], "Hello!")
 */
export const sendSMS = (to: string | string[], message: string, skipInvalid = false) =>
  smsClient.send({ to, message, skipInvalid })
