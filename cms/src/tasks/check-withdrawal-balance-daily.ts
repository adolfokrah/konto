import { FCMPushNotifications } from '@/utilities/fcmPushNotifications'

/**
 * Check Withdrawal Balance Daily Task
 *
 * Scheduled to run once per day at 10 AM.
 * Finds all users with jars that have available balance to withdraw and sends them reminder notifications.
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
      const fcmNotifications = new FCMPushNotifications()

      console.log('🔍 Starting daily withdrawal balance check...')

      // Fetch system settings to get minimum payout amount
      const systemSettings = await payload.findGlobal({
        slug: 'system-settings',
        overrideAccess: true,
      })

      const minimumPayoutAmount = systemSettings?.minimumPayoutAmount || 10

      console.log(`Using minimum payout amount: ${minimumPayoutAmount}`)

      // Find all open jars with balance >= minimum payout amount
      const jarsWithBalance = await payload.find({
        collection: 'jars',
        where: {
          balance: {
            greater_than_equal: minimumPayoutAmount,
          },
          status: {
            equals: 'open',
          },
        },
        pagination: false,
        depth: 1,
        overrideAccess: true,
      })

      console.log(`Found ${jarsWithBalance.docs.length} jars with withdrawable balance`)

      if (jarsWithBalance.docs.length === 0) {
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
      const userJarBalances = jarsWithBalance.docs.reduce((acc: any, jar: any) => {
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
            balance: jar.balance,
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

      // Send notifications directly to each user
      let successCount = 0
      let failureCount = 0

      for (const userWithBalance of usersWithBalance) {
        try {
          const { user, jarsWithBalance } = userWithBalance

          // Check if user has FCM token
          if (!user.fcmToken) {
            console.log(`⚠️ User ${user.id} has no FCM token, skipping`)
            failureCount++
            continue
          }

          // Calculate total balance across all jars
          const totalBalance = jarsWithBalance.reduce((sum, jar) => sum + jar.balance, 0)
          const jarCount = jarsWithBalance.length
          const currency = jarsWithBalance[0]?.currency || 'GHS'

          // Create message
          const message =
            jarCount === 1
              ? `You have ${currency} ${totalBalance.toFixed(2)} available to withdraw from "${jarsWithBalance[0].jarName}"`
              : `You have ${currency} ${totalBalance.toFixed(2)} available to withdraw from ${jarCount} jars`

          const title = 'Balance Available for Withdrawal 💰'

          // Send notification
          await fcmNotifications.sendNotification([user.fcmToken], message, title, {
            type: 'withdrawal-reminder',
            totalBalance: totalBalance.toString(),
            jarCount: jarCount.toString(),
          })

          successCount++
          console.log(
            `✅ Sent withdrawal reminder to user ${user.id} for ${jarCount} jar(s) with total ${currency} ${totalBalance.toFixed(2)}`,
          )
        } catch (error: any) {
          console.error(`❌ Failed to send notification to user ${userWithBalance.userId}:`, error)
          failureCount++
        }
      }

      return {
        output: {
          success: true,
          message: `Daily withdrawal balance check completed. Sent ${successCount} notifications.`,
          stats: {
            totalJarsWithBalance: jarsWithBalance.docs.length,
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
