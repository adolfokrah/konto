# Chango Working Curl Examples (UAT)

All endpoints require these headers:

```
x-api-key: ZzshkGNMKX9MOyRvTE21w1vqhAuPm8DE1zZjmzFa
api-key: 55093903053.330376e52dfd44-d1dd-485f-b69f-8539c3852402
transflow-id: dd53c2ea-ccea-4f79-93e9-23ec53175c3c
merchantProductId: e062a513-e691-4eb1-8b20-22d441815578
Content-Type: application/json
```

`merchantProductId` is now a **header** (previously query/body).

---

## Create Campaign

```bash
curl --location 'https://thirdpartyuat.changoapp.com/api/v1/thirdParty/groups/85daae6a-d221-4a37-b5f8-c88ce0eb0cad/assign/campaign-account' \
  --header 'x-api-key: ZzshkGNMKX9MOyRvTE21w1vqhAuPm8DE1zZjmzFa' \
  --header 'api-key: 55093903053.330376e52dfd44-d1dd-485f-b69f-8539c3852402' \
  --header 'transflow-id: dd53c2ea-ccea-4f79-93e9-23ec53175c3c' \
  --header 'merchantProductId: e062a513-e691-4eb1-8b20-22d441815578' \
  --header 'Content-Type: application/json' \
  --data '{
    "campaign_name": "Thirdparty Test2",
    "campaign_type": "temporary",
    "bank_id": "4d47558b-5660-4adb-bfae-a3791ce7ed6b",
    "payment_destination_number": "54657686548",
    "branch_id": "a5b427f4-9385-11ee-b11a-025b82d7db7f",
    "description": "Thirdparty Test",
    "hide_total_amount": false,
    "hide_donor_count": false,
    "hide_donors": false,
    "end": "2027-12-31T23:59:59+00:00",
    "target": 7500000
  }'
```

Notes:
- `campaign_images` must be omitted if empty (Chango rejects `[""]`).
- `campaign_type: temporary` allows `target`. `perpetual` does not.

---

## Create Transaction

```bash
curl --location 'https://thirdpartyuat.changoapp.com/api/v1/thirdParty/payment' \
  --header 'x-api-key: ZzshkGNMKX9MOyRvTE21w1vqhAuPm8DE1zZjmzFa' \
  --header 'api-key: 55093903053.330376e52dfd44-d1dd-485f-b69f-8539c3852402' \
  --header 'transflow-id: dd53c2ea-ccea-4f79-93e9-23ec53175c3c' \
  --header 'merchantProductId: e062a513-e691-4eb1-8b20-22d441815578' \
  --header 'Content-Type: application/json' \
  --data '{
    "groupId": "85daae6a-d221-4a37-b5f8-c88ce0eb0cad",
    "campaignId": "d7197c52-b4c1-4a8f-8cb8-81e89bfafcd2",
    "amount": "1",
    "currency": "GHS",
    "narration": "Test contribution",
    "recurring": false,
    "paymentDestinationNumber": "54657686548",
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
    "pageDescription": "Contribution",
    "timeout": 300,
    "logo": "https://hogapay.com/api/media/file/Group%2082.png",
    "successRedirectUrl": "http://localhost:3000/congratulations",
    "failureRedirectUrl": "http://localhost:3000/congratulations"
  }'
```

---

## Webhook Payload (received from Chango)

POST `/api/transactions/chango-webhook`

```json
{
  "responseCode": "01",
  "responseMessage": "Transaction processed successfully",
  "groupName": "Hoganam Ltd",
  "campaignName": "Thirdparty Test Hogapay2",
  "amount": "1.00",
  "contributorName": "N/A",
  "networkTransactionId": "697854802923",
  "uniwalletTransactionId": "9af95937-ba12-4b3e-a487-f2e9b21b4813",
  "invoiceId": "c57868a1-3347-40d2-bf49-672250d07507",
  "msisdn": "233245301631",
  "narration": "Testing contribution",
  "network": "MTN",
  "charge": "0.00"
}
```

Match key: `webhook.invoiceId` === `transaction.transactionReference`
(equals the `checkoutTransactionReference` returned by createTransaction).

Status: `responseCode === '01'` → completed; otherwise failed.
