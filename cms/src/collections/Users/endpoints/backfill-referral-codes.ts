import type { PayloadRequest } from 'payload'

const generateFromUsername = async (
  username: string,
  excludeUserId: string,
  payload: PayloadRequest['payload'],
) => {
  const base = (username || '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 5)
    .padEnd(5, '0')

  let code = base
  let suffix = 1
  while (suffix <= 99) {
    const existing = await payload.find({
      collection: 'users',
      where: {
        and: [{ referralCode: { equals: code } }, { id: { not_equals: excludeUserId } }],
      },
      limit: 1,
      pagination: false,
    })
    if (existing.totalDocs === 0) return code
    code = base.slice(0, 4) + suffix
    suffix++
  }
  return null
}

export const backfillReferralCodes = async (req: PayloadRequest) => {
  if (!req.user || (req.user as any).role !== 'admin') {
    return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }

  const result = await req.payload.find({
    collection: 'users',
    pagination: false,
    limit: 0,
  })

  let updated = 0
  let skipped = 0

  for (const user of result.docs) {
    const code = await generateFromUsername(user.username, user.id, req.payload)

    if (!code) {
      skipped++
      continue
    }

    await req.payload.update({
      collection: 'users',
      id: user.id,
      data: { referralCode: code },
    })
    updated++
  }

  return Response.json({
    success: true,
    message: `Backfill complete. Updated: ${updated}, Skipped: ${skipped}`,
    updated,
    skipped,
  })
}
