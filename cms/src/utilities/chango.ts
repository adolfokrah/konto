/**
 * Client for Chango's third-party API.
 *
 * Chango runs the money end to end: each jar is linked to a Chango campaign, contributors pay
 * into that campaign through Chango's checkout, and Chango settles to the bank account linked
 * to the campaign. We only keep the campaign in sync with the jar and start payments.
 *
 * Every response comes wrapped in `{ response_code, response_message, data }`, and failures
 * often arrive with HTTP 200, so success is decided by `response_code`, not the HTTP status.
 */

interface ChangoOptions {
  /** API Gateway key (`x-api-key`). */
  gatewayKey: string
  /** Transflow auth API key (`api-key`). */
  apiKey: string
  transflowId: string
  /** Our registered merchant product. Not a campaign id. */
  merchantProductId: string
  baseUrl?: string
}

interface ChangoEnvelope<T> {
  response_code: string
  response_message: string
  data: T
}

export class ChangoError extends Error {
  constructor(
    message: string,
    readonly responseCode: string | number,
    readonly body?: unknown,
  ) {
    super(message)
    this.name = 'ChangoError'
  }
}

export type ChangoCampaignType = 'temporary' | 'perpetual'

export interface ChangoCampaign {
  campaignId: string
  campaignName: string
  description: string
  groupId: string
  campaignType: ChangoCampaignType
  amountReceived: string
  target: string
  priority: number
  created: string
  modified: string
  status: string
}

export interface ChangoGroupCampaignsPage {
  count: number
  data: ChangoCampaign[]
  total_pages: number
  current_page: number
  per_page: number
  from: number
  to: number
}

/**
 * Body of `/groups/{groupId}/assign/campaign-account`, which creates a campaign and links the
 * bank account Chango settles into. Snake_case as the endpoint expects (the PDF's camelCase is
 * rejected), and `merchantProductId` travels only in the header.
 */
export interface ChangoCreateCampaignRequest {
  campaign_name: string
  campaign_type: ChangoCampaignType
  description: string
  /** Chango's bank UUID. */
  bank_id: string
  /** Chango's bank branch UUID. */
  branch_id: string
  /** Bank account number Chango settles into. */
  payment_destination_number: string
  /** ISO date-time the campaign closes. Temporary campaigns only. */
  end?: string
  target: number
  hide_total_amount?: boolean
  hide_donor_count?: boolean
  hide_donors?: boolean
}

export interface ChangoCreateCampaignResponse {
  campaign: ChangoCampaign & { alias?: number; countryId?: string }
  /** The settlement account as Chango verified it. */
  groupAccount: {
    campaignId: string
    groupId: string
    destinationCode: string
    paymentDestinationNumber: string
    bankBranch: string
    accountName: string
    status: string
  }
}

export type ChangoUpdateCampaignRequest = {
  campaignId: string
  groupId: string
  campaignName?: string
  description?: string
  campaignType?: ChangoCampaignType
  campaignStatus?: string
  end?: string
  target?: number
  hideTotalAmount?: boolean
  hideDonorCount?: boolean
  hideDonors?: boolean
}

export interface ChangoPaymentRequest {
  groupId: string
  campaignId: string
  amount: number
  currency: string
  narration: string
  recurring: boolean
  msisdn: string
  paymentDestinationNumber: string
  channelId: string
  destinationCode: string
  platform: string
  countryId: string
  anonymous: boolean
  pledgeRedemption: boolean
  fullName: string
  email: string
  /** Leave out to let the payer choose on Chango's checkout page. */
  paymentMethod?: 'mobile_money' | 'card'
  pageTitle: string
  name?: string
  pageDescription?: string
  timeout?: number
  logo?: string
  successRedirectUrl?: string
  failureRedirectUrl?: string
}

/** What `/payment` returns, as seen on UAT. */
export interface ChangoPaymentResponse {
  success: boolean
  invoiceId: string
  /** Checkout's reference for the session; Chango also uses it as the contribution's invoice id. */
  checkoutTransactionReference: string
  /** Chango's hosted checkout page to send the payer to. */
  checkoutUrl: string
  [key: string]: unknown
}

export interface ChangoContribution {
  contributorName: string
  created: string
  amount: string
  currency: string
  [key: string]: unknown
}

export interface ChangoContributionsPage {
  content: ChangoContribution[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  numberOfElements: number
  empty: boolean
}

/**
 * Paths confirmed against UAT. Campaign update is not in the docs and could not be found on the
 * gateway, so it can be set through env until Chango confirms it.
 */
const PATHS = {
  groupCampaigns: '/api/v1/thirdParty/groups/campaigns',
  payment: '/api/v1/thirdParty/payment',
  contributions: '/api/v1/thirdParty/campaign-contributions/list',
  createCampaign: (groupId: string) =>
    `/api/v1/thirdParty/groups/${encodeURIComponent(groupId)}/assign/campaign-account`,
  updateCampaign: process.env.CHANGO_UPDATE_CAMPAIGN_PATH,
}

export default class Chango {
  private readonly headers: Record<string, string>
  private readonly baseUrl: string

  constructor({
    gatewayKey,
    apiKey,
    transflowId,
    merchantProductId,
    baseUrl = 'https://thirdpartyuat.changoapp.com',
  }: ChangoOptions) {
    if (!gatewayKey || !apiKey || !transflowId || !merchantProductId) {
      throw new Error('gatewayKey, apiKey, transflowId and merchantProductId are required')
    }
    this.baseUrl = baseUrl.replace(/\/+$/, '')
    this.headers = {
      'x-api-key': gatewayKey,
      'api-key': apiKey,
      'transflow-id': transflowId,
      merchantProductId,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT',
    path: string | undefined,
    opts: { query?: Record<string, string | number | undefined>; body?: unknown } = {},
  ): Promise<T> {
    if (!path) throw new Error('Chango endpoint path is not configured')

    const url = new URL(path, this.baseUrl)
    for (const [k, v] of Object.entries(opts.query ?? {})) {
      if (v !== undefined) url.searchParams.set(k, String(v))
    }

    const response = await fetch(url, {
      method,
      headers: this.headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    })
    const text = await response.text()

    let parsed: ChangoEnvelope<T>
    try {
      parsed = JSON.parse(text)
    } catch {
      throw new ChangoError(
        `Chango returned non-JSON response (${response.status}): ${text.slice(0, 200)}`,
        response.status,
      )
    }

    // The gateway rejects bad credentials or unknown routes with its own `{ message }` body.
    if (!response.ok || parsed.response_code === undefined) {
      const message = (parsed as unknown as { message?: string }).message ?? response.statusText
      throw new ChangoError(
        `Chango API error: ${response.status} ${message}`,
        response.status,
        parsed,
      )
    }

    if (!String(parsed.response_code).startsWith('2')) {
      throw new ChangoError(parsed.response_message, parsed.response_code, parsed)
    }

    return parsed.data
  }

  /** Campaigns assigned to a group, 20 per page. */
  async getGroupCampaigns(groupId: string, page = 1): Promise<ChangoGroupCampaignsPage> {
    return this.request('GET', PATHS.groupCampaigns, { query: { groupId, page } })
  }

  /** Creates a campaign in our group and links the bank account Chango settles into. */
  async createCampaign(
    groupId: string,
    params: ChangoCreateCampaignRequest,
  ): Promise<ChangoCreateCampaignResponse> {
    return this.request('POST', PATHS.createCampaign(groupId), { body: params })
  }

  async updateCampaign(params: ChangoUpdateCampaignRequest): Promise<unknown> {
    return this.request('POST', PATHS.updateCampaign, { body: params })
  }

  /** Creates a Chango invoice and starts checkout for it. */
  async createPayment(params: ChangoPaymentRequest): Promise<ChangoPaymentResponse> {
    return this.request('POST', PATHS.payment, { body: params })
  }

  /** Read-only list of what a campaign has received. `offset` counts records, not pages. */
  async listContributions(
    campaignId: string,
    { offset = 0, pageSize = 10 }: { offset?: number; pageSize?: number } = {},
  ): Promise<ChangoContributionsPage> {
    return this.request('POST', PATHS.contributions, { body: { campaignId, offset, pageSize } })
  }
}
