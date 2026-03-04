/**
 * Check Withdrawal Balance Daily Task
 *
 * Scheduled to run once per day at 10 AM.
 * Finds all users with jars that have available balance to withdraw
 * and creates notification records (push is sent automatically via the afterChange hook).
 * Skips users who already have an unread withdrawal reminder to avoid duplicates.
 */
export const checkWithdrawalBalanceDailyTask = {
  slug: 'check-withdrawal-balance-daily',
  schedule: [
    {
      cron: '0 10 * * *', // Every day at 10:00 AM
      queue: 'check-withdrawal-balance-daily',
    },
  ],
  handler: async (args: any) => {
    try {
      const payload = args.req?.payload || args.payload

      console.log('🔍 Starting daily withdrawal balance check...')

      // Fetch system settings to get minimum payout amount
      const systemSettings = await payload.findGlobal({
        slug: 'system-settings',
        overrideAccess: true,
      })

      const minimumPayoutAmount = systemSettings?.minimumPayoutAmount || 0

      console.log(`Using minimum payout amount: ${minimumPayoutAmount}`)

      // Find all open jars
      const openJars = await payload.find({
        collection: 'jars',
        where: {
          status: { equals: 'open' },
        },
        pagination: false,
        depth: 1,
        overrideAccess: true,
      })

      // Calculate balance for each jar from transactions
      const jarsWithCalculatedBalance: Array<{
        jar: any
        balance: number
      }> = []

      for (const jar of openJars.docs as any[]) {
        const transactions = await payload.find({
          collection: 'transactions',
          where: { jar: { equals: jar.id } },
          pagination: false,
          select: { amountContributed: true, type: true, isSettled: true, paymentStatus: true },
          overrideAccess: true,
        })

        const settledSum = transactions.docs
          .filter(
            (tx: any) =>
              tx.type === 'contribution' &&
              tx.paymentStatus === 'completed' &&
              tx.isSettled === true,
          )
          .reduce((sum: number, tx: any) => sum + (tx.amountContributed || 0), 0)

        const payoutsSum = transactions.docs
          .filter(
            (tx: any) =>
              (tx.type === 'payout' || tx.type === 'refund') &&
              (tx.paymentStatus === 'pending' || tx.paymentStatus === 'completed'),
          )
          .reduce((sum: number, tx: any) => sum + (tx.amountContributed || 0), 0)

        const balance = settledSum + payoutsSum

        if (balance >= minimumPayoutAmount) {
          jarsWithCalculatedBalance.push({ jar, balance })
        }
      }

      console.log(`Found ${jarsWithCalculatedBalance.length} jars with withdrawable balance`)

      if (jarsWithCalculatedBalance.length === 0) {
        return {
          output: {
            success: true,
            message: 'No jars with withdrawable balance found',
            stats: {
              totalJarsWithBalance: 0,
              usersNotified: 0,
              notificationsSent: 0,
              notificationsFailed: 0,
            },
          },
        }
      }

      // Group jars by user (creator) and collect jar details
      const userJarBalances = jarsWithCalculatedBalance.reduce((acc: any, { jar, balance }) => {
        const userId = typeof jar.creator === 'string' ? jar.creator : jar.creator?.id
        const creator = typeof jar.creator === 'string' ? null : jar.creator

        if (userId && creator) {
          if (!acc[userId]) {
            acc[userId] = {
              userId,
              user: creator,
              jarsWithBalance: [],
            }
          }

          acc[userId].jarsWithBalance.push({
            jarId: jar.id,
            jarName: jar.name,
            balance,
            currency: jar.currency,
          })
        }
        return acc
      }, {})

      const usersWithBalance = Object.values(userJarBalances) as Array<{
        userId: string
        user: any
        jarsWithBalance: Array<{
          jarId: string
          jarName: string
          balance: number
          currency: string
        }>
      }>

      console.log(`Found ${usersWithBalance.length} users with withdrawable balance`)

      let successCount = 0
      let failureCount = 0

      for (const userWithBalance of usersWithBalance) {
        try {
          const { userId, jarsWithBalance } = userWithBalance

          // Skip if user already has an unread withdrawal reminder
          const existing = await payload.find({
            collection: 'notifications',
            where: {
              user: { equals: userId },
              type: { equals: 'info' },
              status: { equals: 'unread' },
              'data.kind': { equals: 'withdrawal-reminder' },
            },
            limit: 1,
            overrideAccess: true,
          })

          if (existing.docs.length > 0) {
            console.log(`⏭️ User ${userId} already has unread withdrawal reminder, skipping`)
            continue
          }

          // Calculate total balance across all jars
          const totalBalance = jarsWithBalance.reduce((sum, jar) => sum + jar.balance, 0)
          const jarCount = jarsWithBalance.length
          const currency = jarsWithBalance[0]?.currency || 'GHS'

          const message =
            jarCount === 1
              ? `You have ${currency} ${totalBalance.toFixed(2)} available to withdraw from "${jarsWithBalance[0].jarName}"`
              : `You have ${currency} ${totalBalance.toFixed(2)} available to withdraw from ${jarCount} jars`

          const title = 'Balance Available for Withdrawal 💰'

          // Create notification record (push is sent automatically via afterChange hook)
          await payload.create({
            collection: 'notifications',
            data: {
              title,
              message,
              user: userId,
              type: 'info',
              status: 'unread',
              data: {
                kind: 'withdrawal-reminder',
                totalBalance: totalBalance.toFixed(2),
                jarCount,
                currency,
                jars: jarsWithBalance,
              },
            },
            overrideAccess: true,
          })

          successCount++
          console.log(
            `✅ Created withdrawal reminder for user ${userId} — ${jarCount} jar(s), ${currency} ${totalBalance.toFixed(2)}`,
          )
        } catch (error: any) {
          console.error(
            `❌ Failed to create notification for user ${userWithBalance.userId}:`,
            error,
          )
          failureCount++
        }
      }

      return {
        output: {
          success: true,
          message: `Daily withdrawal balance check completed. Created ${successCount} notifications.`,
          stats: {
            totalJarsWithBalance: jarsWithCalculatedBalance.length,
            usersNotified: successCount,
            notificationsSent: successCount,
            notificationsFailed: failureCount,
          },
        },
      }
    } catch (error: any) {
      console.error('❌ Error in daily withdrawal balance check:', error)
      return {
        output: {
          success: false,
          message: `Error: ${error.message}`,
        },
      }
    }
  },
}
