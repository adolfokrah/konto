# Eganow Payment Gateway - API Integration Guide

Complete documentation for integrating Eganow Payment Gateway API for mobile money collections in Ghana.

---

## Table of Contents
1. [Authentication](#authentication)
2. [KYC Verification](#kyc-verification)
3. [Mobile Money Collection](#mobile-money-collection)
4. [Transaction Status](#transaction-status)
5. [Complete Flow Example](#complete-flow-example)
6. [Test Accounts](#test-accounts)

---

## Authentication

### Get Bearer Token

**Endpoint:** `GET /api/auth/token`  
**Base URL:** `https://developer.sandbox.egacoreapi.com`  
**Method:** Basic Authentication

```bash
curl 'https://developer.sandbox.egacoreapi.com/api/auth/token' \
  --user 'SECRET_USERNAME:SECRET_PASSWORD'
```

**Response:**
```json
{
  "message": "Authentication successful",
  "egaMerchantId": "GH02331c931bb215de44c9b093c8d2f3ca3563",
  "developerJwtToken": "v4.local.bwKmQEWe...",
  "isSuccess": true
}
```

**Notes:**
- Token is valid for **1 hour**
- Use `developerJwtToken` as Bearer token for subsequent requests
- Token must be refreshed after expiry

---

### Verify Token (Optional)

**Endpoint:** `POST /api/auth/verify`  
**Headers:** 
- `Authorization: Bearer <TOKEN>`

```bash
curl -X POST 'https://developer.sandbox.egacoreapi.com/api/auth/verify' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <TOKEN>'
```

**Response:**
```json
{
  "message": "Valid Token",
  "egaMerchantId": "GH02331c931bb215de44c9b093c8d2f3ca3563",
  "developerJwtToken": "v4.local.bwKmQEWe...",
  "isSuccess": true
}
```

---

## KYC Verification

Verify mobile money account details before initiating transactions.

**Endpoint:** `POST /api/vas/kyc`  
**Headers:**
- `Authorization: Bearer <TOKEN>`
- `x-Auth: <BASE64_CREDENTIALS>`
- `Content-Type: application/json`

```bash
curl -X POST 'https://developer.sandbox.egacoreapi.com/api/vas/kyc' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <TOKEN>' \
  -H 'x-Auth: <X_AUTH_TOKEN>' \
  -d '{
    "paypartnerCode": "MTNGH",
    "accountNoOrCardNoOrMSISDN": "233245301631",
    "languageId": "en",
    "countryCode": "GH0233"
  }'
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| paypartnerCode | string | Yes | Payment partner code (e.g., MTNGH, VODAGH) |
| accountNoOrCardNoOrMSISDN | string | Yes | Phone number in international format (233...) |
| languageId | string | Yes | Language code (e.g., "en") |
| countryCode | string | Yes | Country code (e.g., "GH0233") |

**Response:**
```json
{
  "isSuccess": true,
  "accountName": "ADOLPHUS YAW OKRAH"
}
```

**Use Cases:**
- Verify customer phone number before collection
- Display account name for confirmation
- Prevent fraud and wrong number entries
- KYC/AML compliance

---

## Mobile Money Collection

Initiate a mobile money collection (debit) from customer's wallet.

**Endpoint:** `POST /api/transactions/collection`  
**Headers:**
- `Authorization: Bearer <TOKEN>`
- `x-Auth: <BASE64_CREDENTIALS>`
- `Content-Type: application/json`

```bash
curl -X POST 'https://developer.sandbox.egacoreapi.com/api/transactions/collection' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <TOKEN>' \
  -H 'x-Auth: <X_AUTH_TOKEN>' \
  -d '{
    "paypartnerCode": "MTNGH",
    "amount": "5",
    "accountNoOrCardNoOrMSISDN": "233245301631",
    "accountName": "ADOLPHUS YAW OKRAH",
    "transactionId": "TXN1731606737",
    "narration": "Test Mobile Money Collection",
    "transCurrencyIso": "GHS",
    "expiryDateMonth": 0,
    "expiryDateYear": 0,
    "cvv": "",
    "languageId": "en",
    "callback": "https://your-webhook-url.com/callback"
  }'
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| paypartnerCode | string | Yes | Payment partner (MTNGH, ATGH, TCELGH, CARDGATEWAY) |
| amount | string | Yes | Amount to charge (as string, e.g., "5") |
| accountNoOrCardNoOrMSISDN | string | Yes | Phone number (233...) |
| accountName | string | Yes | Account holder name |
| transactionId | string | Yes | Your unique transaction reference |
| narration | string | Yes | Transaction description |
| transCurrencyIso | string | Yes | Currency code (GHS) |
| expiryDateMonth | integer | No | Card expiry month (0 for mobile money) |
| expiryDateYear | integer | No | Card expiry year (0 for mobile money) |
| cvv | string | No | Card CVV (empty for mobile money) |
| languageId | string | Yes | Language code ("en") |
| callback | string | Yes | Webhook URL for transaction status updates |

**Response:**
```json
{
  "transactionStatus": "Pending",
  "eganowReferenceNo": "GHOD057E0A324CFF47C986DD3A1012A1717F",
  "message": "Transaction initiated"
}
```

**Important Notes:**
- `amount` must be a **string**, not a number
- `expiryDateMonth` and `expiryDateYear` must be **integers** (use 0 for mobile money)
- `transactionId` must be unique per transaction
- Customer receives prompt on their phone to approve payment
- Final status sent to callback URL

---

## Get Transaction Charges

Check the fees/charges for a transaction before initiating it.

**Endpoint:** `POST /api/partners/charges`  
**Headers:**
- `Authorization: Bearer <TOKEN>`
- `x-Auth: <BASE64_CREDENTIALS>`
- `Content-Type: application/json`

```bash
curl -X POST 'https://developer.sandbox.egacoreapi.com/api/partners/charges' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <TOKEN>' \
  -H 'x-Auth: <X_AUTH_TOKEN>' \
  -d '{
    "paypartnerCode": "MTNGH",
    "amount": "100",
    "accountNoOrCardNoOrMSISDN": "233245301631",
    "transCurrencyIso": "GHS",
    "languageId": "en"
  }'
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| paypartnerCode | string | Yes | Payment partner (MTNGH, ATGH, TCELGH, CARDGATEWAY) |
| amount | string | Yes | Transaction amount (as string) |
| accountNoOrCardNoOrMSISDN | string | Yes | Phone number or account identifier |
| transCurrencyIso | string | Yes | Currency code (GHS) |
| languageId | string | Yes | Language code ("en") |

**Response:**
```json
{
  "isSuccess": true,
  "errorCode": 0,
  "totalCharges": 1.5,
  "totalChargesPlusTransactionAmount": 101.5
}
```

**Response Fields:**
| Field | Description |
|-------|-------------|
| totalCharges | The fee/charge amount (e.g., 1.5 GHS) |
| totalChargesPlusTransactionAmount | Total amount customer pays (100 + 1.5 = 101.5 GHS) |

**Use Cases:**
- Display fees to customer before payment
- Calculate total amount including charges
- Compare fees across different payment partners
- Transparency in pricing

**Example:**
- Transaction amount: 100 GHS
- Charges: 1.5 GHS (1.5%)
- **Total to charge customer: 101.5 GHS**

---

## Transaction History

Get a list of past transactions (collections and payouts).

**Endpoint:** `GET /api/transactions/history`  
**Headers:**
- `Authorization: Bearer <TOKEN>`
- `x-Auth: <BASE64_CREDENTIALS>`

```bash
curl 'https://developer.sandbox.egacoreapi.com/api/transactions/history' \
  -H 'Authorization: Bearer <TOKEN>' \
  -H 'x-Auth: <X_AUTH_TOKEN>'
```

**Query Parameters (Optional):**
| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | string | Filter by start date (ISO format) |
| endDate | string | Filter by end date (ISO format) |
| transactionType | string | Filter by type (collection, payout) |
| status | string | Filter by status (SUCCESSFUL, PENDING, FAILED) |

**Response:**
```json
{
  "isSuccess": true,
  "transactions": [
    {
      "transactionId": "TXN1731606737",
      "eganowReferenceNo": "GHOD057E0A324CFF47C986DD3A1012A1717F",
      "amount": 5.00,
      "currency": "GHS",
      "status": "PENDING",
      "paypartnerCode": "MTNGH",
      "accountNo": "233245301631",
      "narration": "Test Payment",
      "createdAt": "2025-11-14T10:30:00Z"
    }
  ],
  "totalCount": 1,
  "page": 1,
  "pageSize": 50
}
```

**Use Cases:**
- View all past transactions
- Generate transaction reports
- Reconcile payments
- Track failed transactions for retry
- Filter by date range for accounting

**Note:** Sandbox may return empty or limited history.

---

## Transaction Status

Check the status of a transaction.

**Endpoint:** `POST /api/transactions/status`  
**Headers:**
- `Authorization: Bearer <TOKEN>`
- `x-Auth: <BASE64_CREDENTIALS>`
- `Content-Type: application/json`

```bash
curl -X POST 'https://developer.sandbox.egacoreapi.com/api/transactions/status' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <TOKEN>' \
  -H 'x-Auth: <X_AUTH_TOKEN>' \
  -d '{
    "transactionId": "GHOD057E0A324CFF47C986DD3A1012A1717F",
    "languageId": "en"
  }'
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| transactionId | string | Yes | Eganow reference number or your transaction ID |
| languageId | string | Yes | Language code ("en") |

**Response:**
```json
{
  "isSuccess": true,
  "message": "transaction exist",
  "transStatus": "SUCCESSFUL",
  "referenceNo": "GHJEG66CF2B24F5A64BB68A53D452707E6A47"
}
```

**Transaction Statuses:**
- `PENDING` - Transaction initiated, waiting for customer approval
- `SUCCESSFUL` - Payment completed successfully
- `FAILED` - Payment failed or declined

**Note:** Status checking may be limited in sandbox environment.

---

## Callback Webhook

After customer approves/declines payment, Eganow sends a callback to your webhook URL.

**Callback Payload:**
```json
{
  "TransactionId": "TXN1731606737",
  "EganowReferenceNo": "GHOD057E0A324CFF47C986DD3A1012A1717F",
  "TransactionStatus": "SUCCESSFUL",
  "PayPartnerTransactionId": "MP123456789"
}
```

**Your webhook should:**
1. Verify the callback signature (if provided)
2. Update transaction status in your database
3. Return 200 OK response
4. Handle idempotency (same callback may be sent multiple times)

---

## Complete Flow Example

### Step-by-Step Integration

```bash
#!/bin/bash

# Configuration
USERNAME="GH02331c931bb215de44c9b093c8d2f3ca3563"
PASSWORD="048fea7126b2aea0e6d35fb63400a5883397b7bb5adb0222e76e581d42c4bb6a"
X_AUTH="GH0233R0gwMjMzMWM5MzFiYjIxNWRlNDRjOWIwOTNjOGQyZjNjYTM1NjM6MDQ4ZmVhNzEyNmIyYWVhMGU2ZDM1ZmI2MzQwMGE1ODgzMzk3YjdiYjVhZGIwMjIyZTc2ZTU4MWQ0MmM0YmI2YQ=="
PHONE_NUMBER="233245301631"

# 1. Get Bearer Token
echo "Step 1: Getting Bearer Token..."
TOKEN_RESPONSE=$(curl -s 'https://developer.sandbox.egacoreapi.com/api/auth/token' \
  --user "${USERNAME}:${PASSWORD}")

BEARER_TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"developerJwtToken":"[^"]*' | cut -d'"' -f4)
echo "Token: ${BEARER_TOKEN:0:50}..."

# 2. Verify Token (Optional)
echo "Step 2: Verifying Token..."
curl -s -X POST 'https://developer.sandbox.egacoreapi.com/api/auth/verify' \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer ${BEARER_TOKEN}"

# 3. KYC Verification
echo "Step 3: KYC Verification..."
KYC_RESPONSE=$(curl -s -X POST 'https://developer.sandbox.egacoreapi.com/api/vas/kyc' \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer ${BEARER_TOKEN}" \
  -H "x-Auth: ${X_AUTH}" \
  -d "{
    \"paypartnerCode\": \"MTNGH\",
    \"accountNoOrCardNoOrMSISDN\": \"${PHONE_NUMBER}\",
    \"languageId\": \"en\",
    \"countryCode\": \"GH0233\"
  }")

ACCOUNT_NAME=$(echo $KYC_RESPONSE | grep -o '"accountName":"[^"]*' | cut -d'"' -f4)
echo "Account Name: $ACCOUNT_NAME"

# 4. Initiate Collection
echo "Step 4: Initiating Collection..."
TRANSACTION_ID="TXN$(date +%s)"

COLLECTION_RESPONSE=$(curl -s -X POST 'https://developer.sandbox.egacoreapi.com/api/transactions/collection' \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer ${BEARER_TOKEN}" \
  -H "x-Auth: ${X_AUTH}" \
  -d "{
    \"paypartnerCode\": \"MTNGH\",
    \"amount\": \"5\",
    \"accountNoOrCardNoOrMSISDN\": \"${PHONE_NUMBER}\",
    \"accountName\": \"${ACCOUNT_NAME}\",
    \"transactionId\": \"${TRANSACTION_ID}\",
    \"narration\": \"Test Payment\",
    \"transCurrencyIso\": \"GHS\",
    \"expiryDateMonth\": 0,
    \"expiryDateYear\": 0,
    \"cvv\": \"\",
    \"languageId\": \"en\",
    \"callback\": \"https://your-webhook.com/callback\"
  }")

echo "Collection Response: $COLLECTION_RESPONSE"

EGANOW_REF=$(echo $COLLECTION_RESPONSE | grep -o '"eganowReferenceNo":"[^"]*' | cut -d'"' -f4)
echo "Eganow Reference: $EGANOW_REF"

# 5. Check Status
echo "Step 5: Checking Status..."
curl -s -X POST 'https://developer.sandbox.egacoreapi.com/api/transactions/status' \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer ${BEARER_TOKEN}" \
  -H "x-Auth: ${X_AUTH}" \
  -d "{
    \"transactionId\": \"${EGANOW_REF}\",
    \"languageId\": \"en\"
  }"
```

---

## Test Accounts

### Account 1: Fenesam Enterprise

**Login:**
- Email: `fenesam@egacoreapi.com`
- Password: `Password@123`

**Service: Fenesam Enterprise CEDI 3DS**
- Secret Username: `GH02331c931bb215de44c9b093c8d2f3ca3563`
- Secret Password: `048fea7126b2aea0e6d35fb63400a5883397b7bb5adb0222e76e581d42c4bb6a`
- x-Auth token: `GH0233R0gwMjMzMWM5MzFiYjIxNWRlNDRjOWIwOTNjOGQyZjNjYTM1NjM6MDQ4ZmVhNzEyNmIyYWVhMGU2ZDM1ZmI2MzQwMGE1ODgzMzk3YjdiYjVhZGIwMjIyZTc2ZTU4MWQ0MmM0YmI2YQ==`

**Service: Fenesam Enterprise USD 2DS**
- Secret Username: `GH0233cbe45acb13cc4b0ab104cfb52e38610f`
- Secret Password: `fe242cdc4c274584bced97747e0a98217f0f94e10a2ded7eed0ac82b1752770f`
- x-Auth token: `GH0233R0gwMjMzY2JlNDVhY2IxM2NjNGIwYWIxMDRjZmI1MmUzODYxMGY6ZmUyNDJjZGM0YzI3NDU4NGJjZWQ5Nzc0N2UwYTk4MjE3ZjBmOTRlMTBhMmRlZDdlZWQwYWM4MmIxNzUyNzcwZg==`

**Service: Fenesam Enterprise USD 3DS**
- Secret Username: `GH02332375d195759c48279ac9f938db46a2fe`
- Secret Password: `35dff7a2bddd505fddcea508a63da901330095b8ac79dd2bf96ad6a7b66e2369`
- x-Auth token: `GH0233R0gwMjMzMjM3NWQxOTU3NTljNDgyNzlhYzlmOTM4ZGI0NmEyZmU6MzVkZmY3YTJiZGRkNTA1ZmRkY2VhNTA4YTYzZGE5MDEzMzAwOTViOGFjNzlkZDJiZjk2YWQ2YTdiNjZlMjM2OQ==`

---

### Account 2: Graceway Limited

**Login:**
- Email: `fenesam@egacoreapi.com`
- Password: `Password@123`

**Service: Graceway Limited CEDI 3DS**
- Secret Username: `GH023366e5b2db90b34145beb40ade1ced6873`
- Secret Password: `5aa1a002e041e3f8f912f7730960b8e96c4b14e284d0a19dc211362fa7a707c4`
- x-Auth token: `GH0233R0gwMjMzNjZlNWIyZGI5MGIzNDE0NWJlYjQwYWRlMWNlZDY4NzM6NWFhMWEwMDJlMDQxZTNmOGY5MTJmNzczMDk2MGI4ZTk2YzRiMTRlMjg0ZDBhMTlkYzIxMTM2MmZhN2E3MDdjNA==`

**Service: Graceway Limited USD 2DS**
- Secret Username: `GH02334c41451fadb249bea424be567bca5a63`
- Secret Password: `3f707a86f4f1c7e0281a2fba33ba4e4c677f71b7fae5a03bbb0eb4206baf6c15`
- x-Auth token: `GH0233R0gwMjMzNGM0MTQ1MWZhZGIyNDliZWE0MjRiZTU2N2JjYTVhNjM6M2Y3MDdhODZmNGYxYzdlMDI4MWEyZmJhMzNiYTRlNGM2NzdmNzFiN2ZhZTVhMDNiYmIwZWI0MjA2YmFmNmMxNQ==`

**Service: Graceway Limited USD 3DS**
- Secret Username: `GH0233c2eb24c6143f43e099537421ea31966c`
- Secret Password: `d39939e47bc7826ad0124b5c8bb9f4eb59fc4abc91c66b634604397615ac1d5d`
- x-Auth token: `GH0233R0gwMjMzYzJlYjI0YzYxNDNmNDNlMDk5NTM3NDIxZWEzMTk2NmM6ZDM5OTM5ZTQ3YmM3ODI2YWQwMTI0YjVjOGJiOWY0ZWI1OWZjNGFiYzkxYzY2YjYzNDYwNDM5NzYxNWFjMWQ1ZA==`

---

### Account 3: Skypanda Express Limited

**Login:**
- Email: `skypanda@egacoreapi.com`
- Password: `Password@123`

**Service: Skypanda Express Limited**
- Secret Username: `GH02337ee438af8be748b0aaa01922512edb3f`
- Secret Password: `a87f52d7084e4d12a67c651de33bc6d0d36dbc424e86961e81c4beda3207928d`
- x-Auth token: `GH0233R0gwMjMzN2VlNDM4YWY4YmU3NDhiMGFhYTAxOTIyNTEyZWRiM2Y6YTg3ZjUyZDcwODRlNGQxMmE2N2M2NTFkZTMzYmM2ZDBkMzZkYmM0MjRlODY5NjFlODFjNGJlZGEzMjA3OTI4ZA==`

**Service: Skypanda Express Limited USD 2DS**
- Secret Username: `GH02337fdc9020652246e7917c3f38ca8abf9f`
- Secret Password: `32f912be780382143ec42ffb9f2307e6966a46fe047a07104d3b74e9eff1068f`
- x-Auth token: `GH0233R0gwMjMzN2ZkYzkwMjA2NTIyNDZlNzkxN2MzZjM4Y2E4YWJmOWY6MzJmOTEyYmU3ODAzODIxNDNlYzQyZmZiOWYyMzA3ZTY5NjZhNDZmZTA0N2EwNzEwNGQzYjc0ZTllZmYxMDY4Zg==`

**Service: Skypanda Express Limited USD 3DS**
- Secret Username: `GH0233d6790d7cfb7c436abd72f119e5921087`
- Secret Password: `ca6d08722b0864f19dca476fc262575eea2b34c867908a26d8678e59b4ff398a`
- x-Auth token: `GH0233R0gwMjMzZDY3OTBkN2NmYjdjNDM2YWJkNzJmMTE5ZTU5MjEwODc6Y2E2ZDA4NzIyYjA4NjRmMTlkY2E0NzZmYzI2MjU3NWVlYTJiMzRjODY3OTA4YTI2ZDg2NzhlNTliNGZmMzk4YQ==`

---

## Payment Partner Codes

| Code | Type | Description |
|------|------|-------------|
| MTNGH | Mobile Money | MTN Ghana |
| TCELGH | Mobile Money | Telecel Ghana (formerly Vodafone) |
| ATGH | Mobile Money | AirtelTigo Ghana |
| CARDGATEWAY | Card | Mastercard/Visa |
| GCBGH | Bank | Ghana Commercial Bank |
| STANBICGH | Bank | Stanbic Bank |

---

## Important Notes

### Authentication
- Bearer token expires after **1 hour** - implement token refresh logic
- x-Auth is base64 encoded `username:password` with country code prefix
- Both Bearer token and x-Auth required for transaction endpoints

### Sandbox Limitations
- Transaction status endpoint may not work in sandbox
- Callbacks may not be sent in sandbox
- Use test phone numbers for testing
- Transactions return "Pending" but don't reach actual mobile money systems

### Production Considerations
1. **Security:**
   - Store credentials in environment variables
   - Never commit credentials to version control
   - Use HTTPS for all API calls
   - Validate webhook signatures

2. **Error Handling:**
   - Handle token expiry and refresh automatically
   - Retry failed requests with exponential backoff
   - Log all API interactions for debugging
   - Handle network timeouts

3. **Webhooks:**
   - Implement idempotency (same callback may be sent multiple times)
   - Return 200 OK quickly, process in background
   - Verify callback signatures
   - Have fallback status polling if webhook fails

4. **User Experience:**
   - Show loading state during transaction
   - Implement timeout (e.g., 5 minutes)
   - Allow users to check status manually
   - Clear error messages for failures

---

## Testing Checklist

- [ ] Get Bearer token successfully
- [ ] Verify token is valid
- [ ] Perform KYC verification
- [ ] Initiate collection transaction
- [ ] Handle "Pending" status
- [ ] Test with different phone numbers
- [ ] Test with different payment partners
- [ ] Handle token expiry
- [ ] Test webhook endpoint
- [ ] Test error scenarios (invalid phone, insufficient funds)

---

## Support

For production API credentials and support:
- **Website:** https://egacoreapi.com
- **Email:** support@egacoreapi.com
- **Sandbox Environment:** https://developer.sandbox.egacoreapi.com
- **Production Environment:** https://api.egacoreapi.com

---

*Last Updated: November 14, 2025*
