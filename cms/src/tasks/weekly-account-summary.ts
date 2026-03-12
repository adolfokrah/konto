import { emailService } from '@/utilities/emailService'
import type { JarSummaryRow } from '@/components/emailTemplates/weeklyAccountSummary'

/**
 * Weekly Account Summary Task
 *
 * Runs every Monday at 8 AM.
 * Sends each KYC-verified jar creator a summary of their jars' activity
 * for the past 7 days — only completed transactions.
 */
export const weeklyAccountSummaryTask = {
  slug: 'weekly-account-summary',
  schedule: [
    {
      cron: '0 8 * * 0', // Every Sunday at 8 AM
      queue: 'weekly-account-summary',
    },
  ],
  handler: async (args: any) => {
    try {
      const payload = args.req?.payload || args.payload

      const now = new Date()
      const weekEnd = new Date(now)
      const weekStart = new Date(now)
      weekStart.setDate(weekStart.getDate() - 7)

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

      let emailsSent = 0
      let emailsSkipped = 0

      for (const user of users.docs) {
        try {
          if (!user.email) {
            emailsSkipped++
            continue
          }

          // Get all jars for this user
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
            // Completed contributions this week (cash + momo)
            const contributions = await payload.find({
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
            })

            // Completed payouts this week (momo only)
            const payouts = await payload.find({
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
            })

            // Skip jars with no activity this week
            if (!contributions.docs.length && !payouts.docs.length) continue

            const cashTxs = contributions.docs.filter(
              (tx: any) => tx.paymentMethod !== 'mobile-money',
            )
            const momoTxs = contributions.docs.filter(
              (tx: any) => tx.paymentMethod === 'mobile-money',
            )

            const cashCollected = cashTxs.reduce(
              (sum: number, tx: any) => sum + (tx.amountContributed || 0),
              0,
            )
            const momoCollected = momoTxs.reduce(
              (sum: number, tx: any) => sum + (tx.amountContributed || 0),
              0,
            )
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

          // Skip users with no jar activity this week
          if (!jarRows.length) {
            emailsSkipped++
            continue
          }

          await emailService.sendWeeklyAccountSummaryEmail({
            to: user.email,
            firstName: user.firstName || 'there',
            weekStart: weekStartStr,
            weekEnd: weekEndStr,
            jars: jarRows,
          })

          emailsSent++
          console.log(`✅ Sent weekly summary to ${user.email} (${jarRows.length} jar(s))`)
        } catch (err: any) {
          console.error(`❌ Failed to send weekly summary to user ${user.id}:`, err)
          emailsSkipped++
        }
      }

      return {
        output: {
          success: true,
          message: `Weekly account summary complete. Sent: ${emailsSent}, Skipped: ${emailsSkipped}`,
          emailsSent,
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
