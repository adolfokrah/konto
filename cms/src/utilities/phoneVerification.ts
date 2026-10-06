/**
 * Proof that a phone number just passed OTP, required before we hand out a login token.
 *
 * - Existing users: `otpVerifiedAt` is stamped on the user by verify-otp and consumed by
 *   login-with-phone.
 * - New numbers (pre-registration): an in-memory grant (same lifetime as the in-memory OTP
 *   store) consumed by register-user, which then stamps `otpVerifiedAt` on the new user so
 *   the app's follow-up login works.
 */
export const PHONE_VERIFICATION_TTL_MS = 10 * 60 * 1000

const preRegistrationGrants = new Map<string, number>()

export const phoneKey = (countryCode: string, phoneNumber: string) => `${countryCode}${phoneNumber}`

export function grantPreRegistration(key: string) {
  preRegistrationGrants.set(key, Date.now() + PHONE_VERIFICATION_TTL_MS)
}

/** Returns true (and consumes the grant) if this number passed OTP within the TTL. */
export function consumePreRegistration(key: string): boolean {
  const expiry = preRegistrationGrants.get(key)
  preRegistrationGrants.delete(key)
  return Boolean(expiry && expiry > Date.now())
}

/** Whether a user's `otpVerifiedAt` is recent enough to log in on. */
export function isRecentlyVerified(otpVerifiedAt: unknown): boolean {
  if (!otpVerifiedAt) return false
  const at = new Date(otpVerifiedAt as string).getTime()
  return Number.isFinite(at) && Date.now() - at <= PHONE_VERIFICATION_TTL_MS
}
