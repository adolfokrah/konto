import { emailService } from '@/utilities/emailService'
import { getJarBalance } from '@/utilities/getJarBalance'

const DAY_MS = 24 * 60 * 60 * 1000

// Reminder windows: [minDays, maxDays) → reminderDay label
const REMINDER_WINDOWS = [
  { min: 7, max: 10, day: 7 },
  { min: 10, max: 12, day: 10 },
  { min: 12, max: 14, day: 12 },
]

/**
 * Withdraw Reminder Daily Task
 *
 * Runs every day at 8 AM.
 * Sends reminder emails at Day 7, Day 10, and Day 12 of inactivity.
 *
 * Reference date (start of countdown):
 *   - jar.deadline if it exists and is in the past
 *   - otherwise: date of the most recent completed contribution
 *
 * Day 14 auto-refund is handled by the separate auto-refund-daily task.
 */
export const withdrawReminderDailyTask = {
  slug: 'withdraw-reminder-daily',
  schedule: [
    {
      cron: '0 9 * * *',
      queue: 'withdraw-reminder-daily',
    },
  ],
  handler: async (args: any) => {
    try {
      const payload = args.req?.payload || args.payload
      const now = Date.now()

      console.log('🔔 Starting withdraw reminder check...')

      const sevenDaysAgo = new Date(now - 7 * DAY_MS).toISOString()

      const openJars = await payload.find({
        collection: 'jars',
        where: {
          and: [
            { status: { in: ['open', 'sealed'] } },
            { lastActivityAt: { less_than: sevenDaysAgo } },
          ],
        },
        pagination: false,
        depth: 1,
        overrideAccess: true,
      })

      if (!openJars.docs.length) {
        return { output: { success: true, message: 'No open jars', emailsSent: 0 } }
      }

      // Map: userId → { user, jars grouped by reminderDay }
      const userMap: Record<
        string,
        {
          user: any
          jars: {
            name: string
            balance: number
            currency: string
            referenceDate: string
            reminderDay: number
          }[]
        }
      > = {}

      for (const jar of openJars.docs as any[]) {
        const { balance, settledContributions: contributions } = await getJarBalance(
          payload,
          jar.id,
        )

        if (!contributions.length) continue
        if (balance <= 0) continue

        // Determine reference date:
        // Use jar.deadline if it exists and has already passed, else last contribution date
        let referenceDate: Date | null = null

        if (jar.deadline) {
          const deadline = new Date(jar.deadline)
          if (deadline.getTime() <= now) {
            referenceDate = deadline
          }
        }

        if (!referenceDate) {
          const sorted = [...contributions].sort(
            (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )
          const lastTxDate = sorted[0]?.createdAt
          if (!lastTxDate) continue
          referenceDate = new Date(lastTxDate)
        }

        const idleDays = (now - referenceDate.getTime()) / DAY_MS

        // Find which reminder window this jar falls into
        const window = REMINDER_WINDOWS.find((w) => idleDays >= w.min && idleDays < w.max)
        if (!window) continue

        const creatorId = typeof jar.creator === 'string' ? jar.creator : jar.creator?.id
        const creator = typeof jar.creator === 'object' ? jar.creator : null
        if (!creatorId || !creator?.email) continue

        if (!userMap[creatorId]) {
          userMap[creatorId] = { user: creator, jars: [] }
        }

        userMap[creatorId].jars.push({
          name: jar.name,
          balance,
          currency: jar.currency ?? 'GHS',
          referenceDate: referenceDate.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
          reminderDay: window.day,
        })
      }

      const usersToNotify = Object.values(userMap)
      if (!usersToNotify.length) {
        return { output: { success: true, message: 'No jars need reminders', emailsSent: 0 } }
      }

      let emailsSent = 0
      let emailsFailed = 0

      for (const { user, jars } of usersToNotify) {
        // Group jars by reminderDay so each user gets one email per reminder level
        const byDay = jars.reduce((acc: Record<number, typeof jars>, j) => {
          if (!acc[j.reminderDay]) acc[j.reminderDay] = []
          acc[j.reminderDay].push(j)
          return acc
        }, {})

        for (const [dayStr, dayJars] of Object.entries(byDay)) {
          const reminderDay = Number(dayStr)
          try {
            await emailService.sendWithdrawalReminderEmail({
              to: user.email,
              firstName: user.firstName ?? user.email,
              reminderDay,
              jars: dayJars.map((j) => ({
                name: j.name,
                balance: j.balance,
                currency: j.currency,
                lastTransactionDate: j.referenceDate,
              })),
            })
            emailsSent++
            console.log(
              `✅ Day ${reminderDay} reminder sent to ${user.email} (${dayJars.length} jar(s))`,
            )
          } catch (err: any) {
            console.error(
              `❌ Failed to send Day ${reminderDay} reminder to ${user.email}:`,
              err.message,
            )
            emailsFailed++
          }
        }
      }

      return {
        output: {
          success: true,
          message: `Withdrawal reminders sent to ${emailsSent} user(s).`,
          emailsSent,
          emailsFailed,
        },
      }
    } catch (err: any) {
      console.error('❌ Error in withdraw reminder task:', err)
      return { output: { success: false, message: err.message } }
    }
  },
}
