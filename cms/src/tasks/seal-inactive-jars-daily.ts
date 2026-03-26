import { emailService } from '@/utilities/emailService'
import { getJarBalance } from '@/utilities/getJarBalance'

const DAY_MS = 24 * 60 * 60 * 1000
const INACTIVE_THRESHOLD_DAYS = 14

/**
 * Seal Inactive Jars Daily Task
 *
 * Runs every day at 3 AM.
 * Finds open jars with a balance of 0 that have had no activity for 14+ days
 * (using lastActivityAt, or createdAt if never had a contribution), seals them,
 * and notifies the jar creator by email.
 */
export const sealInactiveJarsDailyTask = {
  slug: 'seal-inactive-jars-daily',
  schedule: [
    {
      cron: '0 12 * * *',
      queue: 'seal-inactive-jars-daily',
    },
  ],
  handler: async (args: any) => {
    try {
      const payload = args.req?.payload || args.payload
      const now = Date.now()
      const _threshold = new Date(now - INACTIVE_THRESHOLD_DAYS * DAY_MS)
      _threshold.setHours(23, 59, 59, 999)
      const thresholdDate = _threshold.toISOString()

      console.log('🔒 Starting seal-inactive-jars check...')

      // Find open jars where lastActivityAt is older than 14 days
      // (or where there's no lastActivityAt but createdAt is older than 14 days)
      const candidateJars = await payload.find({
        collection: 'jars',
        where: {
          and: [
            { status: { equals: 'open' } },
            {
              or: [
                { lastActivityAt: { less_than: thresholdDate } },
                {
                  and: [
                    { lastActivityAt: { exists: false } },
                    { createdAt: { less_than: thresholdDate } },
                  ],
                },
              ],
            },
          ],
        },
        pagination: false,
        depth: 1,
        overrideAccess: true,
      })

      if (!candidateJars.docs.length) {
        return { output: { success: true, message: 'No candidate jars found', sealed: 0 } }
      }

      // Map: userId → { user, jars[] }
      const userMap: Record<
        string,
        {
          user: any
          jars: { name: string; inactiveDays: number; createdAt: string; id: string }[]
        }
      > = {}

      let sealed = 0

      for (const jar of candidateJars.docs as any[]) {
        // Verify balance is truly 0
        const { balance } = await getJarBalance(payload, jar.id)
        if (balance > 0) continue

        // Determine how many days inactive
        const referenceDate = jar.lastActivityAt
          ? new Date(jar.lastActivityAt)
          : new Date(jar.createdAt)
        const inactiveDays = Math.floor((now - referenceDate.getTime()) / DAY_MS)

        // Seal the jar
        await payload.update({
          collection: 'jars',
          id: jar.id,
          data: { status: 'sealed' },
          overrideAccess: true,
        })
        sealed++

        const creatorId = typeof jar.creator === 'string' ? jar.creator : jar.creator?.id
        const creator = typeof jar.creator === 'object' ? jar.creator : null
        if (!creatorId || !creator?.email) continue

        if (!userMap[creatorId]) {
          userMap[creatorId] = { user: creator, jars: [] }
        }

        userMap[creatorId].jars.push({
          id: jar.id,
          name: jar.name,
          inactiveDays,
          createdAt: new Date(jar.createdAt).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
        })
      }

      // Send notification emails
      const emails = Object.values(userMap)
      if (!emails.length) {
        return {
          output: { success: true, message: `Sealed ${sealed} jar(s), no emails to send`, sealed },
        }
      }

      const batch = emails.map(({ user, jars }) => ({
        to: user.email,
        firstName: user.firstName ?? user.email,
        jars,
      }))

      const { sent: emailsSent, failed: emailsFailed } =
        await emailService.sendSealInactiveJarBatch(batch)

      console.log(`🔒 Sealed ${sealed} jar(s). Emails sent: ${emailsSent}, failed: ${emailsFailed}`)

      return {
        output: {
          success: true,
          message: `Sealed ${sealed} jar(s) and notified ${emailsSent} creator(s).`,
          sealed,
          emailsSent,
          emailsFailed,
        },
      }
    } catch (err: any) {
      console.error('❌ Error in seal-inactive-jars task:', err)
      return { output: { success: false, message: err.message } }
    }
  },
}
