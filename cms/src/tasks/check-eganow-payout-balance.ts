import { getEganow } from '@/utilities/initalise'
import { emailService } from '@/utilities/emailService'

/**
 * Check Eganow Payout Balance Task
 *
 * Scheduled to run daily at 8 AM.
 * Sums all jar balances (settled) + upcoming (unsettled) across all jars.
 * If the combined total exceeds the Eganow payout account balance,
 * sends an alert email to hello@usehoga.com so the team can top up.
 */
export const checkEganowPayoutBalanceTask = {
  slug: 'check-eganow-payout-balance',
  handler: async (args: any) => {
    try {
      const payload = args.req?.payload || args.payload

      console.log('🔍 Starting Eganow payout balance check...')

      // Fetch all transactions with needed fields
      const allTransactions = await payload.find({
        collection: 'transactions',
        pagination: false,
        select: {
          amountContributed: true,
          type: true,
          isSettled: true,
          paymentStatus: true,
          paymentMethod: true,
          jar: true,
        },
        overrideAccess: true,
      })

      // Calculate totals across all jars
      let totalSettledContributions = 0
      let totalPayouts = 0
      let totalUpcoming = 0

      for (const tx of allTransactions.docs as any[]) {
        if (tx.type === 'contribution' && tx.paymentStatus === 'completed') {
          if (tx.isSettled) {
            totalSettledContributions += tx.amountContributed || 0
          } else if (tx.paymentMethod === 'mobile-money') {
            totalUpcoming += tx.amountContributed || 0
          }
        } else if (
          tx.type === 'payout' &&
          (tx.paymentStatus === 'pending' || tx.paymentStatus === 'completed')
        ) {
          totalPayouts += tx.amountContributed || 0 // Already negative
        }
      }

      const totalJarBalances = totalSettledContributions + totalPayouts
      const combinedTotal = totalJarBalances + totalUpcoming

      console.log(
        `📊 Jar balances: ${totalJarBalances.toFixed(2)}, Upcoming: ${totalUpcoming.toFixed(2)}, Combined: ${combinedTotal.toFixed(2)}`,
      )

      // Get Eganow payout balance
      await getEganow().getToken()
      const balanceResponse = await getEganow().getPayoutBalance()

      console.log('📦 Eganow balance response:', JSON.stringify(balanceResponse))

      // Handle both possible response shapes: { balance } or { data: { balance } }
      const eganowBalance =
        balanceResponse.balance ??
        (balanceResponse as any).data?.balance ??
        (balanceResponse as any).availableBalance

      if (typeof eganowBalance !== 'number') {
        throw new Error(`Unexpected Eganow balance response: ${JSON.stringify(balanceResponse)}`)
      }

      console.log(`💰 Eganow payout balance: ${eganowBalance.toFixed(2)}`)

      if (combinedTotal > eganowBalance) {
        const shortfall = combinedTotal - eganowBalance

        console.log(`⚠️ Shortfall detected: ${shortfall.toFixed(2)} — sending alert email`)

        await emailService.sendEganowBalanceAlert({
          totalJarBalances,
          totalUpcoming,
          combinedTotal,
          eganowBalance,
          shortfall,
          currency: 'GHS',
        })

        return {
          output: {
            success: true,
            message: `Alert sent — shortfall of GHS ${shortfall.toFixed(2)}`,
            stats: {
              totalJarBalances,
              totalUpcoming,
              combinedTotal,
              eganowBalance,
              shortfall,
            },
          },
        }
      }

      console.log('✅ Eganow balance is sufficient')

      return {
        output: {
          success: true,
          message: 'Eganow balance is sufficient — no alert needed',
          stats: {
            totalJarBalances,
            totalUpcoming,
            combinedTotal,
            eganowBalance,
            surplus: eganowBalance - combinedTotal,
          },
        },
      }
    } catch (error: any) {
      console.error('❌ Eganow payout balance check error:', error)
      return {
        output: {
          success: false,
          message: `Error: ${error.message}`,
        },
      }
    }
  },
}
