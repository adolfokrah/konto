# Account types: Individual vs Organization

Status: Phase 1 implemented (account types, type-aware verification) · Phase 2 open · Last updated: 2026-10-06

## Summary

Split Hogapay users into two account types. **Individuals** verify with KYC only and can collect as soon as they are verified. **Organizations** verify with KYB (plus the owner's KYC) and get the trust and governance features that churches, schools and associations need.

## Why

Today every user is treated as an organization:

- To collect a single cedi, a user must pass **KYC** (Didit ID + selfie) **and KYB** (company registration, proof of address, directors' IDs). KYB gates every collection path (MoMo, card, hosted checkout, payment links) and every payout.
- Someone collecting for a funeral, a wedding or a susu circle has to produce company registration documents they do not have. This is likely our biggest activation blocker.
- There is no account-type field. Every "business" feature (organization page, admin collectors with multi-approval payouts, custom fields, "Donate" wording, bank payouts) is open to everyone.
- Fees and limits are the same for everyone, and there are no payout or transaction limits at all.

## The two account types

| | Individual | Organization |
|---|---|---|
| Who | Weddings, funerals, birthdays, susu circles, personal causes | Churches, schools, alumni associations, NGOs, businesses |
| Verification | KYC only (Didit: ID + selfie, a few minutes) | KYB (registration documents, proof of address, directors) + KYC of the account owner |
| Can collect after | KYC verified | KYB approved |
| Payouts | Mobile money and bank, full balance | Mobile money and bank, including partial payouts |
| Limits | Configurable caps (e.g. per jar, or a monthly payout cap) | Higher caps or none |
| Team | Collectors (members) | Collectors with admin roles + multi-approval payouts |
| Public presence | Verified badge on the payment page | Verified organization page listing all campaigns + organization name on receipts |
| Payment page | Standard | Custom fields, "Donate" wording, branding, exports with custom fields |
| Fees | Standard | Negotiable volume discount (`hogapayDiscountPercent`) |

### Benefits

**Individuals: speed.** Sign up, verify ID, start collecting within minutes. No business paperwork.

**Organizations: trust and control.**
- A verified organization page and organization-named receipts give donors confidence.
- Admin collectors and multi-approval payouts fit treasurers and boards, where more than one person signs off on money.
- Partial payouts and higher limits suit ongoing projects (building funds, dues, offerings).

**Upgrades:** an individual can become an organization at any time by completing KYB. Their jars come with them. The change is one-way unless an admin reverts it.

## Where verification is enforced today

| Check | Location | Blocks |
|---|---|---|
| KYB (jar creator) | `cms/src/utilities/kyb.ts` → `isCreatorKybApproved` | — |
| | `Transactions/endpoints/charge-momo-ega-now.ts:99` | Mobile money contributions |
| | `Transactions/endpoints/charge-card-eganow.ts:78` | Card contributions |
| | `Transactions/endpoints/charge-hosted-checkout-eganow.ts:113` | Hosted checkout |
| | `Transactions/endpoints/create-payment-link-contribution.ts:80` | Payment-link contributions |
| | `Transactions/endpoints/payout-eganow.ts:62` (inline, not the helper) | All payouts |
| | `Jars/endpoints/get-contribution-page-jar.ts:100` | `acceptingContributions` → pay form hidden |
| | `BusinessVerifications/endpoints/get-public-business.ts:17` | Organization page |
| KYC | `WithdrawalAccounts/index.ts:103` | Adding a withdrawal account (and therefore creating a jar, via `Jars/hooks/validateWithdrawalAccount.ts:24`) |
| | `ReferralBonuses/endpoints/initiate-withdrawal.ts:15` | Referral withdrawals |
| | `Transactions/hooks/process-referral-bonus.ts:103,109` | First-contribution referral bonus |
| Mobile | `mobile_app/.../jar_detail_view.dart` `_requireKyb` (182–213) | Withdraw, contribute, request/payment link, QR |
| | `withdraw_view.dart:235`, `referral_view.dart:384` | Withdraw, referral withdrawal |
| | `user_account_view.dart:195–216` | KYB menu / "Share contribution pages" |

Not gated today: cash/manual transactions created directly on `transactions` (only the mobile UI blocks them).

## Implementation plan

### Phase 1: the split (no features removed)

**CMS**
1. Add `accountType` (`individual` | `organization`, default `individual`) to `Users`. Set at signup; editable only by admins afterwards (or by the KYB approval flow).
2. `register-user.ts`: accept and validate `accountType`.
3. Replace `isCreatorKybApproved` with a type-aware `isCreatorVerified(payload, creator)`:
   - individual → `kycStatus === 'verified'`
   - organization → `kybStatus === 'approved'` (and owner KYC verified)

   Switch the four charge endpoints, `get-contribution-page-jar.ts` and `payout-eganow.ts` (inline check) to it. Make `KYB_NOT_APPROVED_MESSAGE` type-aware ("This organizer is completing verification…").
4. `submit-business-verification.ts`: an approved KYB upgrades the user to `organization` (the upgrade path). Organization page (`get-public-business.ts`, `/organizations/[id]`) requires `organization`.
5. Add a server-side verification gate on direct `transactions` create (cash/manual).
6. Dashboard: `accountType` column, filter and export; show it on the user detail page and in the KYC/KYB analytics.
7. Migration script: users with a business-verification record → `organization`; everyone else → `individual`.

**Mobile**
1. `user.dart`: add `accountType`.
2. Registration: an account-type step ("For myself / my family" vs "For an organization").
3. `jar_detail_view.dart` `_requireKyb` → type-aware (KYC for individuals; KYC + KYB for organizations).
4. KYB menu only for organizations; add an "Upgrade to organization" entry point for individuals.
5. Update copy in the `.arb` files that says "organization" for everyone.

### Phase 2: per-type features and limits

- Limits: configurable per-type caps in `SystemSettings` (per-jar balance, monthly payout), enforced in the charge and payout endpoints.
- Restrict organization features by type: admin collectors + required approvals (`capRequiredApprovals`, `approve-reject-payout.ts`), partial bank payouts (`payout-eganow.ts`), custom fields and payment-page branding (Jars).
- Organization name on receipts (SMS receipt hook, email receipt).
- Grandfather existing individual jars that already use organization features, so nothing breaks mid-campaign.

## Security fixes to ship first (shipped separately in the security PR)

These undermine any verification split, so they come before Phase 1:

1. **Users can promote themselves.** `Users` lets a user update their own record and no field has field-level access, so `PATCH /api/users/<own id>` can set `role: "admin"`, `kycStatus: "verified"`, `kybStatus: "approved"` or `hogapayDiscountPercent: 100`. Add field-level `update` access (admin only) on `role`, `kycStatus`, `kybStatus`, `hogapayDiscountPercent`, `accountType`, `demoUser`, `otpCode`, `otpExpiry`, `otpAttempts`.
2. **`POST /api/users/update-kyc` has no authentication.** Anyone can set any user's KYC status. Restrict it to admins, or remove it (the Didit webhook and the dashboard already cover this).
3. **`GET /api/users` is public.** It returns every user's email, phone number, FCM token, role and sessions without login. `otpCode` has no read restriction either, so it is likely exposed while an OTP is pending, which would allow account takeover. Restrict `read` to self or admin, and add field-level `read: false` on the OTP fields.
4. Every account is created with the same password, `123456` (`register-user.ts`). Generate a random one, or disable password login for app users.

## Open decisions

- [x] Do organization owners also need personal KYC? **Yes** (implemented in Phase 1).
- [x] Limits for individual accounts: **Phase 2** (amounts still to decide).
- [ ] Can an organization ever downgrade to individual, or only through an admin?
- [ ] Fees: same for both types, or a standard organization rate?
