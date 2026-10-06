import { randomInt } from 'crypto'
import type { Payload } from 'payload'

/** Base58-style alphabet: no 0/O or 1/l/I, so codes survive being read aloud or retyped. */
const ALPHABET = '23456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ'
export const SHORT_CODE_LENGTH = 6

export function generateShortCode(length = SHORT_CODE_LENGTH): string {
  let code = ''
  for (let i = 0; i < length; i++) code += ALPHABET[randomInt(ALPHABET.length)]
  return code
}

/** A jar short code that no other jar uses yet. 57^6 ≈ 34 billion, so retries are rare. */
export async function generateUniqueJarShortCode(payload: Payload): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateShortCode()
    const existing = await payload.find({
      collection: 'jars',
      where: { shortCode: { equals: code } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (existing.docs.length === 0) return code
  }
  throw new Error('Could not generate a unique jar short code')
}
