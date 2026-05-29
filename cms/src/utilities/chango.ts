interface ChangoOptions {
  apiKey: string
  xApiKey?: string
  groupId: string
  paymentDestinationNumber: string
  bankId?: string
  branchId?: string
  merchantProductId?: string
  transflowId?: string
  baseUrl?: string
}

/**
 * Strip characters Chango's narration field doesn't accept.
 * Keeps alphanumerics and spaces; collapses repeated spaces.
 */
export function sanitizeNarration(s: string): string {
  return (s ?? '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export type ChangoCampaignType = 'temporary' | 'perpetual'
export type ChangoCampaignStatus = 'running' | 'paused' | 'ended'
export type ChangoAccountStatus = 'active' | 'inactive'
export type ChangoChannelId = 'MTN' | 'VOD' | 'AIRTELTIGO' | 'BANK_TRANSFER'
export type ChangoPaymentMethod = 'mobile_money' | 'card'

export interface ChangoCreateCampaignRequest {
  campaign_name: string
  campaign_type: ChangoCampaignType
  bank_id?: string
  branch_id?: string
  description: string
  hide_total_amount?: boolean
  hide_donor_count?: boolean
  hide_donors?: boolean
  campaign_images?: string[]
  end?: string
  target?: number
  payment_destination_number?: string
}

export interface ChangoUpdateCampaignRequest {
  campaign_name?: string
  campaign_type?: ChangoCampaignType
  campaign_status?: ChangoCampaignStatus
  end?: string
  bank_id?: string
  branch_id?: string
  description?: string
  hide_total_amount?: boolean
  hide_donor_count?: boolean
  hide_donors?: boolean
  enable_pledges?: boolean
  campaign_code?: string | null
  campaign_images?: string[]
  account_status?: ChangoAccountStatus
  payment_destination_number?: string
}

export interface ChangoCreateTransactionRequest {
  campaignId: string
  merchantProductId?: string
  amount: string
  currency: string
  narration: string
  recurring?: boolean
  channelId: ChangoChannelId
  countryId?: string
  anonymous?: boolean
  pledgeRedemption?: boolean
  fullName: string
  email: string
  paymentMethod: ChangoPaymentMethod
  msisdn: string
  pageTitle: string
  pageDescription?: string
  timeout?: number
  logo?: string
  successRedirectUrl?: string
  failureRedirectUrl?: string
  name?: string
  paymentDestinationNumber?: string
}

export interface ChangoEnvelope<T = unknown> {
  response_code?: string
  response_message?: string
  data?: T
  [key: string]: any
}

export interface ChangoCampaignData {
  campaign: {
    campaignId: string
    campaignName: string
    campaignType: ChangoCampaignType
    status: ChangoCampaignStatus
    description: string
    start: string
    end: string
    target: number
    groupId: string
    countryId: string
    hideTotalAmount: boolean
    hideDonorCount: boolean
    hideDonors: boolean
    amountReceived: string
    [key: string]: any
  }
  groupAccount: {
    campaignId: string
    groupId: string
    countryId: string
    destinationCode: string
    paymentDestinationNumber: string
    bankBranch: string
    status: string
    accountName: string
    [key: string]: any
  }
}

export interface ChangoTransactionData {
  success: boolean
  invoiceId: string
  checkoutTransactionReference: string
  checkoutUrl: string
  checkout?: {
    responseCode: number
    responseMessage: string
    data?: {
      transactionReference?: string
      checkoutUrl?: string
    }
  }
  changoUpdate?: {
    responseCode: string
    responseMessage: string
    invoiceId: string
    successful: boolean
  }
}

export default class Chango {
  private readonly apiKey: string
  private readonly xApiKey?: string
  private readonly groupId: string
  private readonly paymentDestinationNumber: string
  private readonly bankId?: string
  private readonly branchId?: string
  private readonly merchantProductId?: string
  private readonly transflowId?: string
  private readonly baseUrl: string

  constructor({
    apiKey,
    xApiKey,
    groupId,
    paymentDestinationNumber,
    bankId,
    branchId,
    merchantProductId,
    transflowId,
    baseUrl = 'https://thirdpartyuat.changoapp.com',
  }: ChangoOptions) {
    if (!apiKey || !groupId || !paymentDestinationNumber) {
      throw new Error('apiKey, groupId, and paymentDestinationNumber are required')
    }

    this.apiKey = apiKey
    this.xApiKey = xApiKey
    this.groupId = groupId
    this.paymentDestinationNumber = paymentDestinationNumber
    this.bankId = bankId
    this.branchId = branchId
    this.merchantProductId = merchantProductId
    this.transflowId = transflowId
    this.baseUrl = baseUrl.replace(/\/+$/, '')
  }

  private url(path: string, query?: Record<string, string | undefined>): string {
    const u = new URL(path.startsWith('/') ? path : `/${path}`, this.baseUrl)
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null && v !== '') u.searchParams.set(k, v)
      }
    }
    return u.toString()
  }

  private async request<T = unknown>(
    method: 'GET' | 'POST' | 'PUT',
    path: string,
    body?: unknown,
    query?: Record<string, string | undefined>,
  ): Promise<T> {
    const fullUrl = this.url(path, query)
    console.log(
      `[Chango] ${method} ${fullUrl} apiKey.len=${this.apiKey?.length ?? 0} baseUrl=${this.baseUrl}`,
    )
    const headers = new Headers()
    if (this.xApiKey) headers.set('x-api-key', this.xApiKey)
    headers.set('api-key', this.apiKey)
    if (this.transflowId) headers.set('transflow-id', this.transflowId)
    headers.set('Content-Type', 'application/json')
    const response = await fetch(fullUrl, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
    console.log(`[Chango] response status=${response.status} ${response.statusText}`)

    const text = await response.text()

    if (!response.ok) {
      throw new Error(`Chango API error: ${response.status} ${response.statusText} - ${text}`)
    }

    try {
      return JSON.parse(text) as T
    } catch {
      throw new Error(
        `Chango API returned non-JSON response (${response.status}): ${text.slice(0, 200)}`,
      )
    }
  }

  /**
   * Create / Assign a campaign for the configured group.
   * Path uses camelCase `thirdParty`; body uses snake_case.
   */
  async createCampaign(
    params: ChangoCreateCampaignRequest,
  ): Promise<ChangoEnvelope<ChangoCampaignData>> {
    const { campaign_images, ...rest } = params
    const body: Record<string, any> = {
      payment_destination_number: this.paymentDestinationNumber,
      bank_id: this.bankId,
      branch_id: this.branchId,
      hide_total_amount: false,
      hide_donor_count: false,
      hide_donors: false,
      ...rest,
    }
    // Chango rejects empty entries in campaign_images — only include if non-empty.
    const cleaned = (campaign_images ?? []).filter((s) => s && s.length > 0)
    if (cleaned.length > 0) body.campaign_images = cleaned
    if (!body.bank_id || !body.branch_id) {
      throw new Error('bank_id and branch_id are required (set them in env or pass per-call)')
    }
    return this.request(
      'POST',
      `/api/v1/thirdParty/groups/${this.groupId}/assign/campaign-account`,
      body,
      { merchantProductId: this.merchantProductId },
    )
  }

  /**
   * Update an existing campaign by ID. Snake_case body.
   */
  async updateCampaign(
    campaignId: string,
    params: ChangoUpdateCampaignRequest,
  ): Promise<ChangoEnvelope> {
    return this.request(
      'PUT',
      `/api/v1/thirdParty/groups/${this.groupId}/assign/campaign-account/${campaignId}`,
      params,
      { merchantProductId: this.merchantProductId },
    )
  }

  /**
   * Initiate a hosted-checkout payment. Camel_case body.
   * Returns a `checkoutUrl` the customer opens in browser/webview.
   */
  async createTransaction(
    params: ChangoCreateTransactionRequest,
  ): Promise<ChangoEnvelope<ChangoTransactionData>> {
    const merchantProductId = params.merchantProductId ?? this.merchantProductId
    const body = {
      groupId: this.groupId,
      paymentDestinationNumber: this.paymentDestinationNumber,
      merchantProductId,
      platform: 'thirdparty',
      countryId: 'GH',
      recurring: false,
      anonymous: false,
      pledgeRedemption: false,
      timeout: 300,
      ...params,
      narration: sanitizeNarration(params.narration),
    }
    return this.request('POST', '/api/v1/thirdParty/payment', body, {
      merchantProductId,
    })
  }
}
