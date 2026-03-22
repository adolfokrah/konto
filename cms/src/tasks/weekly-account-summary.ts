import { emailService } from '@/utilities/emailService'
import type { JarSummaryRow } from '@/components/emailTemplates/weeklyAccountSummary'

type WeeklySummaryPayload = {
  to: string
  firstName: string
  weekStart: string
  weekEnd: string
  jars: JarSummaryRow[]
}

/**
 * Weekly Account Summary Task
 *
 * Runs every Monday at 8 AM.
 * Sends each KYC-verified jar creator a summary of their jars' activity
 * for the previous Monday–Sunday week — only completed transactions.
 */
export const weeklyAccountSummaryTask = {
  slug: 'weekly-account-summary',
  schedule: [
    {
      cron: '0 8 * * 1', // Every Monday at 8 AM
      queue: 'weekly-account-summary',
    },
  ],
  handler: async (args: any) => {
    try {
      const payload = args.req?.payload || args.payload

      const now = new Date()
      // Runs on Monday — previous week is Mon–Sun
      const weekEnd = new Date(now)
      weekEnd.setDate(now.getDate() - 1) // yesterday = Sunday
      weekEnd.setHours(23, 59, 59, 999)
      const weekStart = new Date(weekEnd)
      weekStart.setDate(weekEnd.getDate() - 6) // 6 days back = Monday
      weekStart.setHours(0, 0, 0, 0)

      const formatDate = (d: Date) =>
        d.toLocaleDateString('en-GB', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })

      const weekStartStr = formatDate(weekStart)
      const weekEndStr = formatDate(weekEnd)

      console.log(`📧 Starting weekly account summary (${weekStartStr} – ${weekEndStr})`)

      // Find all users with an email
      const users = await payload.find({
        collection: 'users',
        where: {
          role: { equals: 'user' },
        },
        pagination: false,
        overrideAccess: true,
      })

      if (!users.docs.length) {
        return { output: { success: true, message: 'No verified users found', emailsSent: 0 } }
      }

      const batch: WeeklySummaryPayload[] = []
      let emailsSkipped = 0

      for (const user of users.docs) {
        if (!user.email) {
          emailsSkipped++
          continue
        }

        const jarsResult = await payload.find({
          collection: 'jars',
          where: { creator: { equals: user.id } },
          pagination: false,
          overrideAccess: true,
        })

        if (!jarsResult.docs.length) {
          emailsSkipped++
          continue
        }

        const jarRows: JarSummaryRow[] = []

        for (const jar of jarsResult.docs) {
          const [contributions, payouts] = await Promise.all([
            payload.find({
              collection: 'transactions',
              where: {
                and: [
                  { jar: { equals: jar.id } },
                  { type: { equals: 'contribution' } },
                  { paymentStatus: { equals: 'completed' } },
                  { createdAt: { greater_than_equal: weekStart.toISOString() } },
                  { createdAt: { less_than_equal: weekEnd.toISOString() } },
                ],
              },
              pagination: false,
              overrideAccess: true,
            }),
            payload.find({
              collection: 'transactions',
              where: {
                and: [
                  { jar: { equals: jar.id } },
                  { type: { equals: 'payout' } },
                  { paymentStatus: { equals: 'completed' } },
                  { createdAt: { greater_than_equal: weekStart.toISOString() } },
                  { createdAt: { less_than_equal: weekEnd.toISOString() } },
                ],
              },
              pagination: false,
              overrideAccess: true,
            }),
          ])

          if (!contributions.docs.length && !payouts.docs.length) continue

          const cashCollected = contributions.docs
            .filter((tx: any) => tx.paymentMethod !== 'mobile-money')
            .reduce((sum: number, tx: any) => sum + (tx.amountContributed || 0), 0)

          const momoCollected = contributions.docs
            .filter((tx: any) => tx.paymentMethod === 'mobile-money')
            .reduce((sum: number, tx: any) => sum + (tx.amountContributed || 0), 0)

          const withdrawn = payouts.docs.reduce(
            (sum: number, tx: any) => sum + Math.abs(tx.amountContributed || 0),
            0,
          )

          jarRows.push({
            name: jar.name,
            contributionCount: contributions.docs.length,
            cashCollected,
            momoCollected,
            withdrawn,
            currency: jar.currency || 'GHS',
          })
        }

        if (!jarRows.length) {
          emailsSkipped++
          continue
        }

        batch.push({
          to: user.email,
          firstName: user.firstName || 'there',
          weekStart: weekStartStr,
          weekEnd: weekEndStr,
          jars: jarRows,
        })
      }

      const { sent: emailsSent, failed: emailsFailed } =
        batch.length > 0
          ? await emailService.sendWeeklyAccountSummaryBatch(batch)
          : { sent: 0, failed: 0 }

      return {
        output: {
          success: true,
          message: `Weekly account summary complete. Sent: ${emailsSent}, Failed: ${emailsFailed}, Skipped: ${emailsSkipped}`,
          emailsSent,
          emailsFailed,
          emailsSkipped,
        },
      }
    } catch (error: any) {
      console.error('❌ Error in weekly account summary task:', error)
      return {
        output: {
          success: false,
          message: `Error: ${error.message}`,
        },
      }
    }
  },
}
