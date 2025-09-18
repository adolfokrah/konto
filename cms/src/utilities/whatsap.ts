/**
 * WhatsApp Business API client for sending messages via Facebook Graph API.
 *
 * Environment variables used:
 *  - WHATSAPP_ACCESS_TOKEN (required)
 *  - WHATSAPP_PHONE_NUMBER_ID (required)
 *  - WHATSAPP_API_BASE_URL (optional, defaults to https://graph.facebook.com/v22.0)
 *
 * Facebook Graph API WhatsApp endpoint expects:
 *  POST https://graph.facebook.com/v22.0/{phone-number-id}/messages
 *  Headers: Authorization: Bearer {access-token}, Content-Type: application/json
 *  Body JSON: { messaging_product: "whatsapp", to: string, type: "template"|"text", template?: {...}, text?: {...} }
 *
 * This client:
 *  - Normalizes phone numbers (removes spaces, dashes, ensures proper format)
 *  - Supports both template messages and text messages
 *  - Returns structured success / error result
 */

export interface WhatsAppClientOptions {
  /** Override access token (otherwise taken from env) */
  accessToken?: string
  /** Override phone number ID (otherwise taken from env) */
  phoneNumberId?: string
  /** Override base URL (otherwise taken from env or default) */
  baseUrl?: string
  /** Abort signal for cancellation */
  signal?: AbortSignal
}

export interface SendWhatsAppTemplateParams {
  to: string | string[]
  templateName: string
  languageCode?: string
  components?: Array<{
    type: 'header' | 'body' | 'button'
    parameters?: Array<{
      type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video'
      text?: string
      currency?: { fallback_value: string; code: string; amount_1000: number }
      date_time?: { fallback_value: string }
      image?: { link: string }
      document?: { link: string; filename?: string }
      video?: { link: string }
    }>
    index?: number
    sub_type?: 'quick_reply' | 'url'
  }>
}

export interface SendWhatsAppTextParams {
  to: string | string[]
  text: string
  previewUrl?: boolean
}

export interface SendWhatsAppResult {
  success: boolean
  message: string
  recipients: string[]
  sent: number
  failed: number
  errors?: string[]
  messageIds?: string[]
}

export class WhatsAppClient {
  private readonly accessToken: string
  private readonly phoneNumberId: string
  private readonly baseUrl: string
  private readonly signal?: AbortSignal

  constructor(opts: WhatsAppClientOptions = {}) {
    const isTest = process.env.NODE_ENV === 'test'
    let accessToken = opts.accessToken || process.env.WHATSAPP_ACCESS_TOKEN || ''
    let phoneNumberId = opts.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || ''

    if (isTest) {
      if (!accessToken) accessToken = 'test_access_token'
      if (!phoneNumberId) phoneNumberId = 'test_phone_number_id'
    }

    this.accessToken = accessToken
    this.phoneNumberId = phoneNumberId
    this.baseUrl = (
      opts.baseUrl ||
      process.env.WHATSAPP_API_BASE_URL ||
      'https://graph.facebook.com/v22.0'
    ).replace(/\/$/, '')
    this.signal = opts.signal

    if (!this.accessToken)
      throw new Error('WhatsApp access token (WHATSAPP_ACCESS_TOKEN) is required')
    if (!this.phoneNumberId)
      throw new Error('WhatsApp phone number ID (WHATSAPP_PHONE_NUMBER_ID) is required')
  }

  /** Public helper to format a single phone number for WhatsApp */
  formatNumber(num: string): string {
    let cleaned = num.trim().replace(/[\s-]/g, '')
    // Ensure it starts with country code (no leading +)
    cleaned = cleaned.replace(/^\+/, '')
    // If Ghana local starting with 0 and length 10 -> convert to 233
    if (/^0\d{9}$/.test(cleaned)) {
      cleaned = '233' + cleaned.substring(1)
    }
    return cleaned
  }

  private normalizeRecipients(input: string | string[]): string[] {
    const arr = Array.isArray(input) ? input : [input]
    const formatted = arr.map((n) => this.formatNumber(n)).filter((n) => n.length >= 6) // Basic validation
    // Remove duplicates
    return Array.from(new Set(formatted))
  }

  /** Sends WhatsApp template message */
  async sendTemplate({
    to,
    templateName,
    languageCode = 'en_US',
    components = [],
  }: SendWhatsAppTemplateParams): Promise<SendWhatsAppResult> {
    if (!templateName?.trim()) throw new Error('Template name is required')

    const recipients = this.normalizeRecipients(to)
    if (recipients.length === 0) {
      return {
        success: false,
        message: 'No valid recipients',
        recipients: [],
        sent: 0,
        failed: 0,
      }
    }

    if (process.env.NODE_ENV === 'test') {
      return {
        success: true,
        message: 'Test mode: WhatsApp template send skipped',
        recipients,
        sent: recipients.length,
        failed: 0,
        messageIds: recipients.map(() => 'test_message_id'),
      }
    }

    const results: SendWhatsAppResult = {
      success: true,
      message: 'WhatsApp messages sent',
      recipients,
      sent: 0,
      failed: 0,
      errors: [],
      messageIds: [],
    }

    // Send to each recipient individually (WhatsApp API requirement)
    for (const recipient of recipients) {
      try {
        const payload = {
          messaging_product: 'whatsapp',
          to: recipient,
          type: 'template',
          template: {
            name: templateName,
            language: { code: languageCode },
            ...(components.length > 0 && { components }),
          },
        }

        if (process.env.NODE_ENV !== 'production') {
          results.sent++
          results.messageIds?.push('dev_message_id')
          continue
        }

        const response = await fetch(`${this.baseUrl}/${this.phoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: this.signal,
        })

        const result = await this.safeJson(response)

        if (response.ok && result?.messages?.[0]?.id) {
          results.sent++
          results.messageIds?.push(result.messages[0].id)
        } else {
          results.failed++
          results.errors?.push(
            `Failed to send to ${recipient}: ${result?.error?.message || 'Unknown error'}`,
          )
        }
      } catch (error: any) {
        results.failed++
        results.errors?.push(`Failed to send to ${recipient}: ${error.message}`)
      }
    }

    results.success = results.sent > 0
    if (results.failed > 0) {
      results.message = `Sent ${results.sent}/${recipients.length} messages`
    }

    return results
  }

  /** Sends WhatsApp text message */
  async sendText({
    to,
    text,
    previewUrl = false,
  }: SendWhatsAppTextParams): Promise<SendWhatsAppResult> {
    if (!text?.trim()) throw new Error('Text message is required')

    const recipients = this.normalizeRecipients(to)
    if (recipients.length === 0) {
      return {
        success: false,
        message: 'No valid recipients',
        recipients: [],
        sent: 0,
        failed: 0,
      }
    }

    if (process.env.NODE_ENV === 'test') {
      return {
        success: true,
        message: 'Test mode: WhatsApp text send skipped',
        recipients,
        sent: recipients.length,
        failed: 0,
        messageIds: recipients.map(() => 'test_message_id'),
      }
    }

    const results: SendWhatsAppResult = {
      success: true,
      message: 'WhatsApp messages sent',
      recipients,
      sent: 0,
      failed: 0,
      errors: [],
      messageIds: [],
    }

    // Send to each recipient individually
    for (const recipient of recipients) {
      try {
        const payload = {
          messaging_product: 'whatsapp',
          to: recipient,
          type: 'text',
          text: {
            body: text.trim(),
            preview_url: previewUrl,
          },
        }

        if (process.env.NODE_ENV !== 'production') {
          results.sent++
          results.messageIds?.push('dev_message_id')
          continue
        }

        const response = await fetch(`${this.baseUrl}/${this.phoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: this.signal,
        })

        const result = await this.safeJson(response)

        if (response.ok && result?.messages?.[0]?.id) {
          results.sent++
          results.messageIds?.push(result.messages[0].id)
        } else {
          results.failed++
          results.errors?.push(
            `Failed to send to ${recipient}: ${result?.error?.message || 'Unknown error'}`,
          )
        }
      } catch (error: any) {
        results.failed++
        results.errors?.push(`Failed to send to ${recipient}: ${error.message}`)
      }
    }

    results.success = results.sent > 0
    if (results.failed > 0) {
      results.message = `Sent ${results.sent}/${recipients.length} messages`
    }

    return results
  }

  private async safeJson(response: Response): Promise<any> {
    try {
      return await response.json()
    } catch (error: any) {
      return { error: { message: `Invalid JSON response: ${error.message}` } }
    }
  }
}
