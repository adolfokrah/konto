// Paystack.ts — Node 18+ (global fetch). For older Node, polyfill fetch as needed.

export type Currency = 'NGN' | 'GHS' | 'KES' | 'ZAR' | string

export type GhanaMoMoProvider = 'MTN' | 'VOD' | 'ATL'
export type KenyaMoMoProvider = 'MPESA' | 'MPPAYBILL' | 'MPTILL'
export type MobileMoneyProvider = GhanaMoMoProvider | KenyaMoMoProvider | string

export interface PaystackOptions {
  secretKey: string
  publicKey?: string
  baseUrl?: string // default: https://api.paystack.co
}

export interface PaystackEnvelope<T = unknown> {
  status: boolean
  message: string
  data: T
}

// ---------- Charge (Mobile Money) ----------
export interface ChargeMomoParams {
  email: string
  amount: number // subunits (e.g., 50000 = GHS 500.00)
  currency: 'GHS' | 'KES'
  phone: string // MSISDN
  provider: MobileMoneyProvider // MTN / VOD / ATL / MPESA / ...
  reference?: string
  metadata?: Record<string, unknown>
}

export type ChargeResponse = PaystackEnvelope<unknown>

// ---------- Transaction Verify ----------
export type VerifyTransactionResponse = PaystackEnvelope<unknown>

// ---------- Transfers ----------
export type TransferRecipientType =
  | 'nuban'
  | 'ghipss'
  | 'mobile_money'
  | 'mobile_money_business'
  | 'basa'

export interface CreateRecipientParams {
  type: TransferRecipientType
  name: string
  account_number: string // for MoMo: phone number
  bank_code: string // telco/bank code, e.g., MTN/VOD/ATL/MPESA
  currency: Currency // e.g., GHS or KES
  description?: string
  email?: string
  metadata?: Record<string, unknown>
}

export interface InitiateTransferWithCode {
  amount: number // subunits
  recipientCode: string // RCP_...
  currency?: Currency
  reference?: string
  reason?: string
}

export interface InitiateTransferWithCreate {
  amount: number // subunits
  recipient: CreateRecipientParams
  currency?: Currency
  reference?: string
  reason?: string
}

export type InitiateTransferParams = InitiateTransferWithCode | InitiateTransferWithCreate

export type InitiateTransferResponse = PaystackEnvelope<unknown>
export type CreateRecipientResponse = PaystackEnvelope<{ recipient_code: string }>

// ---------- Verify Account Details (Resolve) ----------
export interface VerifyAccountParams {
  account_number: string
  bank_code: string
}
export type VerifyAccountResponse = PaystackEnvelope<unknown>

// ---------- Initialize Transaction (Hosted Checkout) ----------
export interface InitializeTxParams {
  email: string
  amount: number // subunits (e.g., 20000 = NGN 200.00)
  currency?: Currency // default on your dashboard if omitted
  reference?: string // your unique reference
  callback_url?: string // where Paystack redirects after payment
  metadata?: Record<string, unknown>
  channels?: string[] // e.g., ["card","mobile_money","bank"]
}

type InitializeTxData = {
  authorization_url: string
  access_code: string
  reference: string
}

type SubmitOTParams = {
  reference: string
  otp: string
}

type SubmitOTPResponse = PaystackEnvelope<unknown>

// ---------- Subaccounts ----------
export interface CreateSubaccountParams {
  business_name: string
  settlement_bank: string // bank code (e.g., from List Banks)
  account_number: string
  percentage_charge: number // percentage main account receives
  description?: string
  primary_contact_email?: string
  primary_contact_name?: string
  primary_contact_phone?: string
  metadata?: string | Record<string, unknown> // stringified JSON per Paystack docs
}
export type CreateSubaccountResponse = PaystackEnvelope<unknown>

export interface UpdateSubaccountParams {
  business_name?: string
  description?: string
  bank_code?: string
  account_number?: string
  active?: boolean
  percentage_charge?: number
  primary_contact_email?: string
  primary_contact_name?: string
  primary_contact_phone?: string
  settlement_schedule?: 'auto' | 'weekly' | 'monthly' | 'manual' | string
  metadata?: string | Record<string, unknown>
}
export type UpdateSubaccountResponse = PaystackEnvelope<unknown>

// ---------- Settlements ----------
export interface ListSettlementsParams {
  perPage?: number
  page?: number
  from?: string // Date in YYYY-MM-DD format
  to?: string // Date in YYYY-MM-DD format
  subaccount?: string // subaccount ID
}

export interface Settlement {
  id: number
  domain: string
  status: 'success' | 'pending' | 'processing' | 'failed'
  currency: Currency
  integration: number
  total_amount: number
  effective_amount: number
  total_fees: number
  total_processed: number
  deducted_fees: boolean
  settlement_date: string
  settled_by: string
  createdAt: string
  updatedAt: string
}

export type ListSettlementsResponse = PaystackEnvelope<Settlement[]>

export interface ListSettlementTransactionsParams {
  perPage?: number
  page?: number
  from?: string // Date in YYYY-MM-DD format
  to?: string // Date in YYYY-MM-DD format
}

export interface SettlementTransaction {
  id: number
  domain: string
  status: string
  reference: string
  amount: number
  message: string | null
  gateway_response: string
  paid_at: string
  created_at: string
  channel: string
  currency: Currency
  ip_address: string | null
  metadata: Record<string, unknown>
  log: {
    start_time: number
    time_spent: number
    attempts: number
    errors: number
    success: boolean
    mobile: boolean
    input: unknown[]
    history: unknown[]
  }
  fees: number
  fees_split: unknown | null
  authorization: Record<string, unknown>
  customer: {
    id: number
    first_name: string | null
    last_name: string | null
    email: string
    customer_code: string
    phone: string | null
    metadata: Record<string, unknown>
    risk_action: string
    international_format_phone: string | null
  }
  plan: unknown | null
  split: Record<string, unknown>
  order_id: unknown | null
  paidAt: string
  createdAt: string
  requested_amount: number
  pos_transaction_data: unknown | null
  source: unknown | null
  fees_breakdown: unknown | null
  transaction_date: string
  plan_object: Record<string, unknown>
  subaccount: Record<string, unknown>
}

export type ListSettlementTransactionsResponse = PaystackEnvelope<SettlementTransaction[]>

export default class Paystack {
  private readonly secretKey: string
  public readonly publicKey?: string
  private readonly baseUrl: string

  constructor({ secretKey, publicKey, baseUrl = 'https://api.paystack.co' }: PaystackOptions) {
    if (!secretKey) throw new Error('secretKey is required')
    this.secretKey = secretKey
    this.publicKey = publicKey
    this.baseUrl = baseUrl.replace(/\/+$/, '')
  }

  // ------------------ Internal helpers ------------------

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
    method: 'GET' | 'POST' | 'PUT',
    path: string,
    opts: {
      query?: Record<string, string | number | boolean | undefined | null>
      body?: unknown
      headers?: Record<string, string>
    } = {},
  ): Promise<PaystackEnvelope<T>> {
    const res = await fetch(this.url(path, opts.query), {
      method,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
        ...(opts.headers ?? {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    })

    let json: PaystackEnvelope<T> | undefined
    try {
      json = (await res.json()) as PaystackEnvelope<T>
    } catch {
      throw new Error(`Paystack: HTTP ${res.status}`)
    }

    if (!res.ok || json.status === false) {
      const err = new Error(json?.message ?? `Paystack: HTTP ${res.status}`)
      ;(err as any).details = json
      throw err
    }
    return json
  }

  // ------------------ 1) Charge via Mobile Money ------------------

  async chargeMomo(params: ChargeMomoParams): Promise<ChargeResponse> {
    const { email, amount, currency, phone, provider, reference, metadata } = params
    if (!email || !amount || !currency || !phone || !provider) {
      throw new Error('email, amount, currency, phone, provider are required')
    }
    return this.request('POST', '/charge', {
      body: {
        email,
        amount,
        currency,
        reference,
        metadata,
        mobile_money: { phone, provider },
      },
    })
  }

  // ------------------ 2) Check transaction status ------------------

  async checkTransactionStatus(reference: string): Promise<VerifyTransactionResponse> {
    if (!reference) throw new Error('reference is required')
    return this.request('GET', `/transaction/verify/${encodeURIComponent(reference)}`)
  }

  // ------------------ 3) Initiate a transfer ------------------

  async initiateTransfer(params: InitiateTransferParams): Promise<InitiateTransferResponse> {
    if (!('amount' in params) || !params.amount) {
      throw new Error('amount is required')
    }

    let recipientCode: string | undefined
    if ('recipientCode' in params && params.recipientCode) {
      recipientCode = params.recipientCode
    } else if ('recipient' in params && params.recipient) {
      const created = await this.request<CreateRecipientResponse['data']>(
        'POST',
        '/transferrecipient',
        {
          body: params.recipient,
        },
      )
      recipientCode = (created.data as any).recipient_code
      if (!recipientCode) throw new Error('Failed to create transfer recipient')
    } else {
      throw new Error('Provide either recipientCode or recipient')
    }

    return this.request('POST', '/transfer', {
      body: {
        source: 'balance',
        amount: params.amount,
        recipient: recipientCode,
        reference: 'reference' in params ? params.reference : undefined,
        reason: 'reason' in params ? params.reason : undefined,
        ...(params.currency ? { currency: params.currency } : {}),
      },
    })
  }

  // ------------------ 4) Verify user account details ------------------

  async verifyAccountDetails(params: VerifyAccountParams): Promise<VerifyAccountResponse> {
    const { account_number, bank_code } = params
    if (!account_number || !bank_code) {
      throw new Error('account_number and bank_code are required')
    }
    return this.request('GET', '/bank/resolve', {
      query: { account_number, bank_code },
    })
  }

  // ------------------ NEW: Initialize transaction & get checkout URL -------

  /**
   * Initialize a transaction and return the hosted checkout URL.
   * Useful when you want to redirect the customer to Paystack’s checkout.
   * Returns the `authorization_url` string.
   */
  async chargeWithAuthorizeUrl(params: InitializeTxParams): Promise<string> {
    const resp = await this.request<InitializeTxData>('POST', '/transaction/initialize', {
      body: params,
    })
    return resp.data.authorization_url
  }

  // Submit OTP for mobile money charge

  async submitOtp(params: SubmitOTParams): Promise<SubmitOTPResponse> {
    const resp = await this.request<SubmitOTPResponse>('POST', '/charge/submit_otp', {
      body: params,
    })

    return resp
  }

  // ------------------ 5) Subaccounts: Create ------------------

  /**
   * Create a subaccount on your integration.
   * Docs: https://paystack.com/docs/api/subaccount/#create
   */
  async createSubaccount(params: CreateSubaccountParams): Promise<CreateSubaccountResponse> {
    const { metadata, ...rest } = params
    const body: Record<string, unknown> = { ...rest }
    if (metadata !== undefined) {
      body.metadata = typeof metadata === 'string' ? metadata : JSON.stringify(metadata)
    }
    return this.request<CreateSubaccountResponse['data']>('POST', '/subaccount', {
      body,
    })
  }

  // ------------------ 6) Subaccounts: Update ------------------

  /**
   * Update a subaccount by ID or code.
   * Docs: https://paystack.com/docs/api/subaccount/#update
   */
  async updateSubaccount(
    idOrCode: string,
    params: UpdateSubaccountParams,
  ): Promise<UpdateSubaccountResponse> {
    if (!idOrCode) throw new Error('idOrCode is required')
    const { metadata, ...rest } = params || {}
    const body: Record<string, unknown> = { ...rest }
    if (metadata !== undefined) {
      body.metadata = typeof metadata === 'string' ? metadata : JSON.stringify(metadata)
    }
    return this.request<UpdateSubaccountResponse['data']>(
      'PUT',
      `/subaccount/${encodeURIComponent(idOrCode)}`,
      { body },
    )
  }

  // ------------------ 7) Settlements: List ------------------

  /**
   * Get all settlements on your integration.
   * Docs: https://paystack.com/docs/api/settlement/#list
   */
  async listSettlements(params: ListSettlementsParams = {}): Promise<ListSettlementsResponse> {
    const query: Record<string, string | number | boolean | undefined | null> = {}

    if (params.perPage !== undefined) query.perPage = params.perPage
    if (params.page !== undefined) query.page = params.page
    if (params.from !== undefined) query.from = params.from
    if (params.to !== undefined) query.to = params.to
    if (params.subaccount !== undefined) query.subaccount = params.subaccount

    return this.request<ListSettlementsResponse['data']>('GET', '/settlement', {
      query,
    })
  }

  // ------------------ 8) Settlements: Get Transactions ------------------

  /**
   * Get the transactions that make up a particular settlement.
   * Docs: https://paystack.com/docs/api/settlement/#transactions
   */
  async getSettlementTransactions(
    settlementId: string | number,
    params: ListSettlementTransactionsParams = {},
  ): Promise<ListSettlementTransactionsResponse> {
    if (!settlementId) throw new Error('settlementId is required')

    const query: Record<string, string | number | boolean | undefined | null> = {}

    if (params.perPage !== undefined) query.perPage = params.perPage
    if (params.page !== undefined) query.page = params.page
    if (params.from !== undefined) query.from = params.from
    if (params.to !== undefined) query.to = params.to

    return this.request<ListSettlementTransactionsResponse['data']>(
      'GET',
      `/settlement/${encodeURIComponent(settlementId)}/transactions`,
      { query },
    )
  }
}
