# Chango Thirdparty API

Reference for the Chango payment integration. UAT environment.

## Credentials & IDs

| Item | Value (UAT) |
|---|---|
| Base URL | `https://thirdpartyuat.changoapp.com` |
| API Key | `ZzshkGNMKX9MOyRvTE21w1vqhAuPm8DE1zZjmzFa` |
| Group ID (Merchant ID) | `52cd710a-7ff8-485b-8f68-a651386d0932` |
| Campaign ID / Product ID | `e062a513-e691-4eb1-8b20-22d441815578` |

Auth header: `x-api-key: <key>` on every request. **Not** AWS SigV4 (the 403 "Forbidden" you may see is AWS API Gateway responding to a wrong path, not wrong auth).

> **Important**: the path uses **camelCase** `thirdParty`. `/thirdparty/` (all lowercase) returns 403 even with a valid key.

## Endpoints

| Operation | Method | Path |
|---|---|---|
| Create Transaction (initiate payment) | `POST` | `/api/v1/thirdParty/payment` |
| Create / Assign Campaign | `POST` | `/api/v1/thirdParty/groups/{groupId}/assign/campaign-account` |
| Get Campaigns for a group | `GET` | `/api/v1/thirdParty/groups/campaigns?groupId={groupId}` |
| Update Campaign | `PUT` | `/api/v1/thirdParty/groups/{groupId}/assign/campaign-account/{campaignId}` |

### Body case quirk

- **Create Transaction** body uses **camelCase** keys (`groupId`, `campaignId`, `paymentMethod`, ...)
- **Campaign endpoints** (Create / Update) use **snake_case** keys (`campaign_name`, `payment_destination_number`, `branch_id`, ...)

Yes, this is inconsistent. Yes, you have to live with it.

## 1. Create Transaction

The user-facing flow is **hosted checkout** — Chango returns a `checkoutUrl` that the customer must open in a browser/webview to actually pay.

### Required fields

| Field | Type | Notes |
|---|---|---|
| `groupId` | string (uuid) | Merchant ID |
| `campaignId` | string (uuid) | Campaign |
| `merchantProductId` | string (uuid) | In our case same as `campaignId` |
| `amount` | string | Note: STRING, not number — `"1"`, `"1.50"` |
| `currency` | string | `"GHS"` |
| `narration` | string | Description shown to user. Avoid special chars (we have `sanitizeNarration` helper) |
| `recurring` | boolean | `false` for one-off |
| `paymentDestinationNumber` | string | Phone where money lands (also used as `msisdn` fallback) |
| `channelId` | string | `"MTN"`, `"VOD"`, `"AIRTELTIGO"`, `"BANK_TRANSFER"` — **NOT** `"MOMO"` like the original doc said |
| `platform` | string | `"thirdparty"` (lowercase) |
| `countryId` | string | `"GH"` |
| `anonymous` | boolean | `false` |
| `pledgeRedemption` | boolean | `false` |
| `fullName` | string | Customer name |
| `email` | string | Customer email |
| `paymentMethod` | string | `"mobile_money"` or `"card"` |
| `msisdn` | string | Customer phone with `+` prefix (`+233245301631`) |
| `pageTitle` | string | Title shown on hosted checkout page |

### Optional fields

| Field | Notes |
|---|---|
| `pageDescription` | Subtitle on hosted page |
| `timeout` | Checkout timeout in seconds (e.g. 300) |
| `logo` | Logo URL shown on page |
| `successRedirectUrl` | Where to redirect on success |
| `failureRedirectUrl` | Where to redirect on failure |
| `name` | Contributor display name |

### Sample curl

```bash
curl -X POST 'https://thirdpartyuat.changoapp.com/api/v1/thirdParty/payment' \
  -H 'x-api-key: ZzshkGNMKX9MOyRvTE21w1vqhAuPm8DE1zZjmzFa' \
  -H 'Content-Type: application/json' \
  -d '{
    "groupId": "52cd710a-7ff8-485b-8f68-a651386d0932",
    "campaignId": "e062a513-e691-4eb1-8b20-22d441815578",
    "merchantProductId": "e062a513-e691-4eb1-8b20-22d441815578",
    "amount": "1",
    "currency": "GHS",
    "narration": "Test contribution",
    "recurring": false,
    "paymentDestinationNumber": "233245301631",
    "channelId": "MTN",
    "platform": "thirdparty",
    "countryId": "GH",
    "anonymous": false,
    "pledgeRedemption": false,
    "fullName": "Test User",
    "email": "test@example.com",
    "paymentMethod": "mobile_money",
    "msisdn": "+233245301631",
    "pageTitle": "Test",
    "pageDescription": "Test payment",
    "timeout": 300,
    "successRedirectUrl": "https://hogapay.com/success",
    "failureRedirectUrl": "https://hogapay.com/failure"
  }'
```

### Success response

```json
{
  "response_code": "200",
  "response_message": "Third party payment initiated successfully",
  "data": {
    "success": true,
    "invoiceId": "d2d2055e-c914-4b10-a726-dcd2f689e47a",
    "checkoutTransactionReference": "badd830c-5d04-4edb-9f66-51f2ae487f5d",
    "checkoutUrl": "https://checkoutuat.itcsrvc.com/<campaignId>?req=<base64-payload>",
    "checkout": { "responseCode": 200, "responseMessage": "Success", "data": { "transactionReference": "...", "checkoutUrl": "..." } },
    "changoUpdate": { "responseCode": "01", "responseMessage": "Contribution initiation successful", "invoiceId": "...", "successful": true }
  }
}
```

The IDs you'll care about:
- `invoiceId` — Chango's internal invoice ID
- `checkoutTransactionReference` — what we should store as our `transactionReference` (matches `changoUpdate.invoiceId`)
- `checkoutUrl` — open this in browser/webview so user can complete payment

### Common errors

| Response | Meaning | Workaround |
|---|---|---|
| `400 "There is an existing contribution in process"` | Duplicate detected — same `msisdn` + `amount` + `campaignId` recently used | Wait for the previous one to settle/expire, or change `amount` (e.g. `"1.50"` instead of `"1"`) |
| `403 "Missing Authentication Token"` | AWS API Gateway — path is wrong | Check path uses camelCase `thirdParty` |
| `403 "Forbidden"` | API key wrong or path requires key | Confirm `x-api-key` header is set with correct value |

### Open questions on this endpoint
- Is there an **idempotency key / external reference** we can pass to bypass the "existing contribution" lock on retries? Currently retries are blocked if a prior attempt is still pending.

---

## 2. Get Campaigns

```bash
curl 'https://thirdpartyuat.changoapp.com/api/v1/thirdParty/groups/campaigns?groupId=52cd710a-7ff8-485b-8f68-a651386d0932' \
  -H 'x-api-key: ZzshkGNMKX9MOyRvTE21w1vqhAuPm8DE1zZjmzFa'
```

Returns campaigns assigned to the given group.

---

## 3. Create / Assign Campaign

**Note: snake_case body** (different from Create Transaction!).

```bash
curl -X POST 'https://thirdpartyuat.changoapp.com/api/v1/thirdParty/groups/52cd710a-7ff8-485b-8f68-a651386d0932/assign/campaign-account' \
  -H 'x-api-key: ZzshkGNMKX9MOyRvTE21w1vqhAuPm8DE1zZjmzFa' \
  -H 'Content-Type: application/json' \
  -d '{
    "campaign_name": "Thirdparty Test",
    "campaign_type": "temporary",
    "bank_id": "<bank-uuid>",
    "payment_destination_number": "54657686548",
    "branch_id": "<branch-uuid>",
    "description": "Description",
    "hide_total_amount": false,
    "hide_donor_count": false,
    "hide_donors": false,
    "campaign_images": ["<base64-jpeg-or-png>"],
    "end": "2024-12-31T23:59:59+00:00",
    "target": 7500000
  }'
```

To **assign an existing campaign** instead of creating a new one, include `campaignId` in the body and the linked-account fields (`bank_id`, `branch_id`, `payment_destination_number`, `channel_id`).

---

## 4. Update Campaign

**Snake_case body**, `PUT` method.

```bash
curl -X PUT 'https://thirdpartyuat.changoapp.com/api/v1/thirdParty/groups/52cd710a-7ff8-485b-8f68-a651386d0932/assign/campaign-account/<campaignId>' \
  -H 'x-api-key: ZzshkGNMKX9MOyRvTE21w1vqhAuPm8DE1zZjmzFa' \
  -H 'Content-Type: application/json' \
  -d '{
    "campaign_type": "perpetual",
    "campaign_status": "running",
    "end": "07-31-2025",
    "campaign_name": "Updated name",
    "bank_id": "...",
    "payment_destination_number": "...",
    "branch_id": "...",
    "description": "Updated desc",
    "hide_total_amount": true,
    "hide_donor_count": false,
    "hide_donors": true,
    "enable_pledges": false,
    "campaign_code": null,
    "campaign_images": ["<base64>"],
    "account_status": "active"
  }'
```

---

## Still missing from Chango

Open questions for the Chango team:

1. **Webhook spec** — does Chango POST to a URL we register when payment settles? Payload shape? Signature header for verification?
2. **Status-check endpoint** — how to poll `checkoutTransactionReference` / `invoiceId` for current state.
3. **Payout API** — sending money OUT to jar creators. The shared doc does not mention payouts.
4. **Idempotency** — how to safely retry a Create Transaction without hitting the "existing contribution" dedup.
5. **Channel codes** — full list of `channelId` values (`MTN`, `VOD`, `AIRTELTIGO`, `BANK_TRANSFER`, others?). Currency support per channel.

## Mental model

- backend → Chango → returns `checkoutUrl`. Customer opens URL → completes on hosted page → success/failure redirect + (presumed) webhook.
- The mobile app / web dashboard must open `checkoutUrl` (in-app webview / browser tab) and listen for completion via redirect URL or webhook.
