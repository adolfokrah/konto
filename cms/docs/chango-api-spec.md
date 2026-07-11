# Chango Payment API — Technical Specification

This document lists every payment-related endpoint our integration needs from Chango, with request/response schemas. Some endpoints already exist; others are new and we are requesting Chango to build them.

Base URL (UAT): `https://thirdpartyuat.changoapp.com`

## Common Headers (all endpoints)

```
api-key: <merchant api key>
x-api-key: <legacy api key>
transflow-id: <merchant transflow id>
merchantProductId: <merchant product id>
Content-Type: application/json
```

## Common Envelope (all responses)

```ts
{
  response_code: string        // "200" success, "400" client error, etc.
  response_message: string
  data: T | unknown[]
}
```

---

# 1. Campaign Management

## 1.1 Create / Assign Campaign — ✅ EXISTS

`POST /api/v1/thirdParty/groups/:groupId/assign/campaign-account`

### Request body (snake_case)
```ts
{
  campaign_name: string
  campaign_type: 'temporary' | 'perpetual'
  bank_id: string
  branch_id: string
  payment_destination_number: string
  description: string
  hide_total_amount: boolean
  hide_donor_count: boolean
  hide_donors: boolean
  end?: string                  // ISO date; required if temporary
  target?: number               // only allowed when campaign_type === 'temporary'
  campaign_images?: string[]    // base64 — must not contain empty strings
}
```

### Response (200)
```ts
{
  response_code: "200",
  response_message: "Successfully assigned account to campaign",
  data: {
    campaign: {
      campaignId: string
      campaignName: string
      campaignType: 'temporary' | 'perpetual'
      status: 'running' | 'paused' | 'ended'
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
      ...
    }
    groupAccount: {
      campaignId: string
      groupId: string
      countryId: string
      destinationCode: string
      paymentDestinationNumber: string
      bankBranch: string
      status: 'active' | 'inactive'
      accountName: string
    }
  }
}
```

---

## 1.2 Update Campaign — ✅ EXISTS

`PUT /api/v1/thirdParty/groups/:groupId/assign/campaign-account/:campaignId`

### Request body (snake_case)
```ts
{
  campaign_name?: string
  campaign_type?: 'temporary' | 'perpetual'
  campaign_status?: 'running' | 'paused' | 'ended'
  end?: string
  description?: string
  hide_total_amount?: boolean
  hide_donor_count?: boolean
  hide_donors?: boolean
  enable_pledges?: boolean
  campaign_code?: string | null
  campaign_images?: string[]
  account_status?: 'active' | 'inactive'
}
```

### Response
Same shape as 1.1.

---

## 1.3 List Campaigns — ✅ EXISTS

`GET /api/v1/thirdParty/groups/campaigns?groupId=:groupId&page=&per_page=`

### Response (200)
```ts
{
  response_code: "200",
  response_message: "Successfully retrieved group campaigns",
  data: {
    count: number
    data: Campaign[]
    total_pages: number
    current_page: number
    per_page: number
    from: number
    to: number
  }
}

interface Campaign {
  campaignId: string
  campaignName: string
  description: string
  groupId: string
  campaignType: 'temporary' | 'perpetual'
  amountReceived: string
  target: string
  priority: number
  created: string         // ISO
  modified: string
  status: 'running' | 'paused' | 'ended'
}
```

---

## 1.4 Get Single Campaign — ❌ NEEDED

`GET /api/v1/thirdParty/groups/:groupId/campaigns/:campaignId`

### Use case
Fetch a single campaign's full detail (including `groupAccount`) without listing all campaigns. Currently requires paging through 1.3.

### Response (200)
Same shape as 1.1 `data` (campaign + groupAccount).

---

# 2. Transactions / Payments

## 2.1 Initiate Transaction (Hosted Checkout) — ✅ EXISTS

`POST /api/v1/thirdParty/payment`

### Request body (camelCase)
```ts
{
  groupId: string
  campaignId: string
  merchantProductId: string
  amount: string                 // STRING, decimal allowed
  currency: 'GHS'
  narration: string              // alphanumeric + spaces
  recurring: boolean
  paymentDestinationNumber: string
  channelId: 'MTN' | 'VOD' | 'AIRTELTIGO' | 'BANK_TRANSFER'
  paymentMethod: 'mobile_money' | 'card'
  msisdn: string                 // "+233..."
  fullName: string
  email: string
  pageTitle: string
  pageDescription?: string
  platform: 'thirdparty'
  countryId: 'GH'
  anonymous: boolean
  pledgeRedemption: boolean
  timeout?: number               // seconds, e.g. 300
  logo?: string
  successRedirectUrl?: string
  failureRedirectUrl?: string
}
```

### Response (200)
```ts
{
  response_code: "200",
  response_message: "Third party payment initiated successfully",
  data: {
    success: boolean
    invoiceId: string                       // Chango internal
    checkoutTransactionReference: string    // we store as transactionReference
    checkoutUrl: string                     // open in browser/webview
    checkout: {
      responseCode: 200
      responseMessage: string
      data: { transactionReference: string; checkoutUrl: string }
    }
    changoUpdate: {
      responseCode: string
      responseMessage: string
      invoiceId: string
      successful: boolean
    }
  }
}
```

### Errors
- `400 "There is an existing contribution in process"` — same `msisdn + amount + campaignId` already pending.
- `400 "Checkout did not return a transactionReference"` — downstream checkout service rejected (missing fields, etc.).

---

## 2.2 List Transactions — ❌ NEEDED (highest priority)

`GET /api/v1/thirdParty/transactions`

### Query params
```
groupId        (required)
campaignId     (optional, filter by campaign)
status         (optional: success | failed | pending)
from           (optional, ISO date)
to             (optional, ISO date)
msisdn         (optional)
reference      (optional, checkoutTransactionReference or networkTransactionId)
page           (default 1)
per_page       (default 20)
```

### Use cases
- Nightly reconciliation between our DB and Chango.
- Recovery from missed webhooks.
- Customer support lookups inside our admin panel.
- Per-merchant transaction history in our app (we cannot share our Chango dashboard with merchants).
- Auditable, queryable, programmatic source of truth for compliance.

### Response (200)
```ts
{
  response_code: "200",
  response_message: "Successfully retrieved transactions",
  data: {
    count: number
    data: Transaction[]
    total_pages: number
    current_page: number
    per_page: number
  }
}

interface Transaction {
  invoiceId: string                      // matches webhook.invoiceId
  checkoutTransactionReference: string
  uniwalletTransactionId?: string
  networkTransactionId?: string
  groupId: string
  campaignId: string
  campaignName: string
  amount: string
  currency: 'GHS'
  charge: string                         // Chango's fee
  narration: string
  msisdn: string
  network: 'MTN' | 'VOD' | 'AIRTELTIGO' | 'BANK_TRANSFER'
  paymentMethod: 'mobile_money' | 'card'
  contributorName: string
  email?: string
  status: 'success' | 'failed' | 'pending'
  responseCode: string                   // "01" = success
  responseMessage: string
  created: string                        // ISO
  modified: string
  completedAt?: string                   // ISO, when status became final
}
```

---

## 2.3 Get Single Transaction — ❌ NEEDED

`GET /api/v1/thirdParty/transactions/:invoiceId`

### Use case
Look up a specific transaction by `invoiceId` (or by `checkoutTransactionReference` via query). Critical for support flows and when a webhook is delayed/missing.

### Response (200)
Same `Transaction` shape as 2.2.

---

## 2.4 Transaction Status Check — ❌ NEEDED

`GET /api/v1/thirdParty/transactions/:invoiceId/status`

### Use case
Lightweight polling endpoint when we suspect a webhook was missed. Returns just the status fields.

### Response (200)
```ts
{
  response_code: "200",
  response_message: "OK",
  data: {
    invoiceId: string
    status: 'success' | 'failed' | 'pending'
    responseCode: string
    responseMessage: string
    completedAt?: string
  }
}
```

---

# 3. Webhooks

## 3.1 Settlement Webhook — ✅ EXISTS (Chango → us)

Chango POSTs to a URL we register (`/api/transactions/chango-webhook`).

### Body (received)
```ts
{
  responseCode: "01" | string         // "01" = success
  responseMessage: string
  groupName: string
  campaignName: string
  amount: string                      // "1.00"
  contributorName: string
  networkTransactionId: string
  uniwalletTransactionId: string
  invoiceId: string                   // matches our transactionReference
  msisdn: string
  narration: string
  network: 'MTN' | 'VOD' | 'AIRTELTIGO' | 'BANK_TRANSFER'
  charge: string
}
```

### Open requests
- **Webhook URL registration endpoint.** Currently configured manually on Chango side. We need an API (or self-serve dashboard field) to register per-environment webhook URLs.
- **Signature header for verification.** Webhook is currently unsigned — we cannot verify the sender. Recommend HMAC signature (e.g. `x-chango-signature: sha256=<hex>`) computed over the raw body with a shared secret.
- **Retry policy.** Document Chango's webhook retry strategy (max attempts, backoff, idempotency key).

---

# 4. Authentication Simplification — REQUEST

Current integration requires sending the following on every request:

```
api-key
x-api-key
transflow-id
merchantProductId       (header)
groupId                 (body / query)
bank_id                 (body)
branch_id               (body)
payment_destination_number (body, for campaign create)
```

All eight are **static per merchant** — they never change. From the client side this means every endpoint repeats the same constants, which adds friction (more env vars, more risk of misconfiguration, more rotation surface area).

### Proposal
One `api-key` identifies the merchant, and the server resolves `groupId`, `merchantProductId`, `transflow-id`, `bank_id`, `branch_id`, and `payment_destination_number` from that identity. The legacy `x-api-key` can be consolidated into `api-key`.

Per-request fields that genuinely vary (amount, channelId, msisdn, campaignId, narration, etc.) would remain client-supplied.

This would simplify our integration and any future merchant onboarding.

---

# 5. Field Conventions — REQUEST

Current endpoints use inconsistent casing:
- Campaign endpoints — **snake_case** body (`campaign_name`, `payment_destination_number`)
- Transaction endpoint — **camelCase** body (`campaignId`, `paymentDestinationNumber`)
- Path uses **camelCase** `thirdParty` (lowercase `thirdparty` returns 403)

### Proposal
Standardise on one convention (preferably camelCase across all bodies + paths) to remove integration footguns.

---

# 6. Summary of Endpoints Needed

| # | Endpoint | Status | Priority |
|---|---|---|---|
| 1.1 | POST campaign-account | ✅ | — |
| 1.2 | PUT campaign-account/:id | ✅ | — |
| 1.3 | GET campaigns | ✅ | — |
| 1.4 | GET campaigns/:id | ❌ | Medium |
| 2.1 | POST payment | ✅ | — |
| 2.2 | GET transactions | ❌ | **High** |
| 2.3 | GET transactions/:id | ❌ | **High** |
| 2.4 | GET transactions/:id/status | ❌ | Medium |
| 3.1 | Webhook signature + URL registration | Partial | **High** |
| 4 | Auth header consolidation | — | Low |
| 5 | Casing consistency | — | Low |

Contact: adolphus.okrah@retraced.com
