import type { BasePayload, Where } from 'payload'

/**
 * Turn a phone-like token into the national-number digits we store
 * ("0599 399 944", "+233599399944" and "599399944" all become "599399944").
 * Returns null when the token is not phone-like.
 */
function toPhoneDigits(token: string): string | null {
  const digits = token.replace(/\D/g, '')
  if (digits.length < 4 || digits.length < token.replace(/[\s()+-]/g, '').length) return null
  return digits.replace(/^233/, '').replace(/^0/, '') || null
}

/**
 * Where clauses for a free-text user search. Every word must match the
 * first name, last name, email or phone, so "Adolphus Yaw Okrah" and
 * "0599399944" both work. `prefix` targets a nested user (e.g. "user.").
 */
export function userSearchClauses(search: string, prefix = ''): Where[] {
  // A spaced phone number ("024 530 1631") is one value, not several words.
  const wholePhone = toPhoneDigits(search.trim())
  if (wholePhone) return [{ [`${prefix}phoneNumber`]: { like: wholePhone } }]

  const tokens = search.trim().split(/\s+/).filter(Boolean)
  return tokens.map((token) => {
    const phone = toPhoneDigits(token)
    const or: Where[] = [
      { [`${prefix}firstName`]: { like: token } },
      { [`${prefix}lastName`]: { like: token } },
      { [`${prefix}email`]: { like: token } },
    ]
    if (phone) or.push({ [`${prefix}phoneNumber`]: { like: phone } })
    return { or }
  })
}

/** IDs of users matching a free-text search, for filtering by a user relationship. */
export async function findUserIdsBySearch(payload: BasePayload, search: string) {
  const users = await payload.find({
    collection: 'users',
    where: { and: userSearchClauses(search) },
    select: {},
    pagination: false,
    overrideAccess: true,
  })
  return users.docs.map((u) => u.id)
}

/** Where clause for "relationship field is one of these IDs" that matches nothing when empty. */
export function inIds(field: string, ids: (string | number)[]): Where {
  return ids.length > 0 ? { [field]: { in: ids } } : { id: { exists: false } }
}
