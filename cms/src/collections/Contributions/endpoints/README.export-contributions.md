## Export Contributions Endpoint

Path: `GET /api/contributions/export-contributions`

Query Parameters (all optional except `jarId`):

* `jarId` (string) – Jar to scope contributions (required)
* `paymentMethods` (comma-separated) – e.g. `mobile-money,cash`
* `statuses` (comma-separated) – paymentStatus values `pending,completed,failed,transferred`
* `collectors` (comma-separated user IDs)
* `startDate` (ISO string) – inclusive lower bound
* `endDate` (ISO string) – inclusive upper bound
* `contributor` (string) – fuzzy match against contributor name or phone
* `email` (string) – override destination email (defaults to authenticated user email)
* `hasAnyFilters` (boolean) – hint flag from mobile (not required for backend logic)

Authorization: Must be authenticated. Non-jar creators only see their own collected contributions.

Response:
```
200 { success: true, message, meta: { count, totalAmount } }
404 { success: false, message }
401 { success: false, message: 'Unauthorized' }
500 { success: false, message, error? }
```

Behavior: Generates PDF in-memory and emails it as attachment via Resend. Does not stream PDF in HTTP response.

Future ideas:
* Add async job + status polling for very large datasets
* Stream direct download if `download=true` query param provided
* Support CSV export