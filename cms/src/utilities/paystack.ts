// ─────────────────────────────────────────────────────────────────────────────
// Paystack API Client
// Docs: https://paystack.com/docs/api
// ─────────────────────────────────────────────────────────────────────────────

interface PaystackOptions {
  secretKey: string
  baseUrl?: string
}

// ── Generic envelope ──────────────────────────────────────────────────────────

interface PaystackResponse<T = unknown> {
  status: boolean
  message: string
  data: T
}

// ── Collection (charge) ───────────────────────────────────────────────────────

export interface PaystackInitializeRequest {
  /** Customer email address */
  email: string
  /** Customer phone number — pre-fills the field in Paystack's popup */
  phone?: string
  /** Amount in kobo (pesewas for GHS — i.e. multiply GHS by 100) */
  amount: number
  /** ISO currency code e.g. GHS */
  currency?: string
  /** Unique transaction reference. Auto-generated if omitted */
  reference?: string
  /** URL to redirect to after payment */
  callback_url?: string
  /** Metadata object — any extra info you want stored with the transaction */
  metadata?: Record<string, unknown>
  /** Channels to enable e.g. ['mobile_money', 'card'] */
  channels?: string[]
}

export interface PaystackInitializeResponse {
  authorization_url: string
  access_code: string
  reference: string
}

export interface PaystackVerifyResponse {
  id: number
  reference: string
  status: string // 'success' | 'failed' | 'abandoned' | 'pending'
  amount: number // in kobo/pesewas
  currency: string
  paid_at: string | null
  channel: string
  authorization: {
    authorization_code: string
    bin: string
    last4: string
    exp_month: string
    exp_year: string
    channel: string
    card_type: string
    bank: string
    country_code: string
    brand: string
    reusable: boolean
    signature: string
  }
  customer: {
    id: number
    email: string
    customer_code: string
    first_name: string | null
    last_name: string | null
  }
  metadata: Record<string, unknown> | null
}

// ── Payment Link ──────────────────────────────────────────────────────────────

export interface PaystackPaymentLinkRequest {
  name: string
  description?: string
  /** Amount in kobo. If omitted, customer can enter any amount */
  amount?: number
  currency?: string
  /** Whether the payment link can be used multiple times */
  is_recurring?: boolean
  /** URL to redirect to after payment */
  redirect_url?: string
  metadata?: Record<string, unknown>
}

export interface PaystackPaymentLinkResponse {
  split_code: string | null
  name: string
  description: string | null
  amount: number | null
  currency: string
  link_code: string
  link_url: string
  createdAt: string
  updatedAt: string
}

// ── Transfer (payout) ─────────────────────────────────────────────────────────

export interface PaystackTransferRecipientRequest {
  type: 'mobile_money' | 'ghipss' | 'nuban' | 'basa'
  name: string
  account_number: string
  bank_code: string
  currency?: string
  /** Optional description */
  description?: string
  metadata?: Record<string, unknown>
}

export interface PaystackTransferRecipientResponse {
  active: boolean
  createdAt: string
  currency: string
  description: string
  domain: string
  id: number
  integration: number
  name: string
  recipient_code: string
  type: string
  updatedAt: string
  is_deleted: boolean
  details: {
    authorization_code: string | null
    account_number: string
    account_name: string
    bank_code: string
    bank_name: string
  }
}

export interface PaystackTransferRequest {
  /** Always 'balance' for balance transfer */
  source: 'balance'
  /** Amount in kobo/pesewas */
  amount: number
  /** Recipient code from createTransferRecipient */
  recipient: string
  reason?: string
  currency?: string
  /** Unique reference for this transfer */
  reference?: string
}

export interface PaystackTransferResponse {
  reference: string
  integration: number
  domain: string
  amount: number
  currency: string
  source: string
  reason: string
  recipient: number
  status: string // 'otp' | 'pending' | 'success' | 'failed'
  transfer_code: string
  id: number
  createdAt: string
  updatedAt: string
}

export interface PaystackTransferVerifyResponse {
  reference: string
  status: string // 'success' | 'failed' | 'pending' | 'reversed'
  amount: number
  currency: string
  transfer_code: string
  reason: string
  recipient: {
    recipient_code: string
    name: string
    details: {
      account_number: string
      bank_code: string
      bank_name: string
    }
  }
  createdAt: string
  updatedAt: string
}

// ── Direct Charge (mobile money) ──────────────────────────────────────────────

export interface PaystackChargeRequest {
  email: string
  amount: number
  currency?: string
  reference?: string
  mobile_money?: {
    phone: string
    provider: 'mtn' | 'vod' | 'atl' | 'tgo'
  }
  metadata?: Record<string, unknown>
}

export interface PaystackChargeResponse {
  reference: string
  status: string // 'success' | 'pending' | 'failed' | 'pay_offline' | 'send_otp' | 'send_phone'
  gateway_response: string
  amount: number
  currency: string
  channel: string
  display_text?: string
}

// ── Refund ────────────────────────────────────────────────────────────────────

export interface PaystackRefundRequest {
  /** Transaction reference or id to refund */
  transaction: string
  /** Amount in kobo to refund. If omitted, full amount is refunded */
  amount?: number
  currency?: string
  customer_note?: string
  merchant_note?: string
}

export interface PaystackRefundResponse {
  transaction: {
    id: number
    reference: string
    amount: number
    currency: string
  }
  amount: number
  currency: string
  channel: string
  status: string // 'pending' | 'processing' | 'processed' | 'failed'
  refunded_at: string | null
  refunded_by: string
  customer_note: string
  merchant_note: string
  id: number
  createdAt: string
  updatedAt: string
}

// ── Identity verification ─────────────────────────────────────────────────────

export interface PaystackResolveAccountResponse {
  account_number: string
  account_name: string
  bank_id: number
}

// ── Balance ───────────────────────────────────────────────────────────────────

export interface PaystackBalanceResponse {
  currency: string
  balance: number // in kobo/pesewas
}

// ─────────────────────────────────────────────────────────────────────────────

export default class Paystack {
  private readonly secretKey: string
  private readonly baseUrl: string

  constructor({ secretKey, baseUrl = 'https://api.paystack.co' }: PaystackOptions) {
    if (!secretKey) throw new Error('Paystack secretKey is required')
    this.secretKey = secretKey
    this.baseUrl = baseUrl.replace(/\/+$/, '')
  }

  // ── Internal helpers ────────────────────────────────────────────────────────

  private url(
    path: string,
    query?: Record<string, string | number | boolean | undefined | null>,
  ): string {
    const u = new URL(path.startsWith('/') ? path : `/${path}`, this.baseUrl)
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null) u.searchParams.set(k, String(v))
      }
    }
    return u.toString()
  }

  private async request<T = unknown>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    opts: {
      query?: Record<string, string | number | boolean | undefined | null>
      body?: unknown
    } = {},
  ): Promise<T> {
    const url = this.url(path, opts.query)
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    }

    const fetchOptions: RequestInit = { method, headers }
    if (opts.body) fetchOptions.body = JSON.stringify(opts.body)

    const response = await fetch(url, fetchOptions)
    const responseText = await response.text()

    if (!response.ok) {
      throw new Error(
        `Paystack API error: ${response.status} ${response.statusText} - ${responseText}`,
      )
    }

    let parsed: PaystackResponse<T>
    try {
      parsed = JSON.parse(responseText) as PaystackResponse<T>
    } catch {
      throw new Error(
        `Paystack API returned non-JSON response (${response.status}): ${responseText.slice(0, 200)}`,
      )
    }

    if (!parsed.status) {
      throw new Error(`Paystack error: ${parsed.message}`)
    }

    return parsed.data
  }

  // ── Collection ──────────────────────────────────────────────────────────────

  /**
   * Initialize a transaction.
   * Returns an authorization_url to redirect the customer to, or an
   * access_code for Paystack inline popup.
   */
  async initializeTransaction(
    params: PaystackInitializeRequest,
  ): Promise<PaystackInitializeResponse> {
    return this.request<PaystackInitializeResponse>('POST', '/transaction/initialize', {
      body: params,
    })
  }

  /**
   * Verify a transaction by reference.
   * Call this after the customer is redirected back or via webhook.
   */
  async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
    return this.request<PaystackVerifyResponse>(
      'GET',
      `/transaction/verify/${encodeURIComponent(reference)}`,
    )
  }

  // ── Payment Link ────────────────────────────────────────────────────────────

  /**
   * Create a payment page / payment link.
   * Useful for contribution pages where you want a hosted payment URL.
   */
  async createPaymentLink(
    params: PaystackPaymentLinkRequest,
  ): Promise<PaystackPaymentLinkResponse> {
    return this.request<PaystackPaymentLinkResponse>('POST', '/page', {
      body: params,
    })
  }

  /**
   * Update an existing payment link.
   */
  async updatePaymentLink(
    idOrSlug: string,
    params: Partial<PaystackPaymentLinkRequest>,
  ): Promise<PaystackPaymentLinkResponse> {
    return this.request<PaystackPaymentLinkResponse>(
      'PUT',
      `/page/${encodeURIComponent(idOrSlug)}`,
      {
        body: params,
      },
    )
  }

  // ── Transfer (Payout) ───────────────────────────────────────────────────────

  /**
   * Create a transfer recipient (mobile money or bank account).
   * Must be done before initiating a transfer.
   * Recipient codes can be reused — consider caching per user.
   */
  async createTransferRecipient(
    params: PaystackTransferRecipientRequest,
  ): Promise<PaystackTransferRecipientResponse> {
    return this.request<PaystackTransferRecipientResponse>('POST', '/transferrecipient', {
      body: params,
    })
  }

  /**
   * Initiate a transfer (payout) to a recipient.
   * Requires OTP finalisation if OTP is enabled on the Paystack account.
   */
  async initiateTransfer(params: PaystackTransferRequest): Promise<PaystackTransferResponse> {
    return this.request<PaystackTransferResponse>('POST', '/transfer', {
      body: params,
    })
  }

  /**
   * Finalize a transfer — submit the OTP sent to the business owner's phone/email.
   * Only required if OTP is enabled on the Paystack dashboard.
   */
  async finalizeTransfer(transferCode: string, otp: string): Promise<PaystackTransferResponse> {
    return this.request<PaystackTransferResponse>('POST', '/transfer/finalize_transfer', {
      body: { transfer_code: transferCode, otp },
    })
  }

  /**
   * Verify a transfer status by reference.
   * Uses GET /transfer/verify/:reference as per Paystack docs.
   */
  async verifyTransfer(reference: string): Promise<PaystackTransferVerifyResponse> {
    return this.request<PaystackTransferVerifyResponse>(
      'GET',
      `/transfer/verify/${encodeURIComponent(reference)}`,
    )
  }

  // ── Direct Charge ───────────────────────────────────────────────────────────

  async charge(params: PaystackChargeRequest): Promise<PaystackChargeResponse> {
    return this.request<PaystackChargeResponse>('POST', '/charge', { body: params })
  }

  async submitOtp(reference: string, otp: string): Promise<PaystackChargeResponse> {
    return this.request<PaystackChargeResponse>('POST', '/charge/submit_otp', {
      body: { reference, otp },
    })
  }

  async submitBirthday(reference: string, birthday: string): Promise<PaystackChargeResponse> {
    return this.request<PaystackChargeResponse>('POST', '/charge/submit_birthday', {
      body: { reference, birthday },
    })
  }

  async getCharge(reference: string): Promise<PaystackChargeResponse> {
    return this.request<PaystackChargeResponse>('GET', `/charge/${encodeURIComponent(reference)}`)
  }

  // ── Refund ──────────────────────────────────────────────────────────────────

  /**
   * Refund a transaction fully or partially.
   */
  async refund(params: PaystackRefundRequest): Promise<PaystackRefundResponse> {
    return this.request<PaystackRefundResponse>('POST', '/refund', {
      body: params,
    })
  }

  /**
   * Fetch a refund by its Paystack refund ID.
   */
  async getRefund(id: number | string): Promise<PaystackRefundResponse> {
    return this.request<PaystackRefundResponse>('GET', `/refund/${encodeURIComponent(String(id))}`)
  }

  // ── Identity verification ────────────────────────────────────────────────────

  /**
   * Resolve an account number to get the account holder's name.
   * Works for bank accounts and mobile money in Nigeria and Ghana.
   */
  async resolveAccount(
    accountNumber: string,
    bankCode: string,
  ): Promise<PaystackResolveAccountResponse> {
    return this.request<PaystackResolveAccountResponse>('GET', '/bank/resolve', {
      query: { account_number: accountNumber, bank_code: bankCode },
    })
  }

  // ── Balance ─────────────────────────────────────────────────────────────────

  /**
   * Fetch current Paystack balance (in kobo/pesewas).
   * Use balance[0] for the primary currency balance.
   */
  async getBalance(): Promise<PaystackBalanceResponse[]> {
    return this.request<PaystackBalanceResponse[]>('GET', '/balance')
  }
}
