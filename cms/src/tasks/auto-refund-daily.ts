import { emailService } from '@/utilities/emailService'

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000

/**
 * Auto Refund Daily Task
 *
 * Runs every day at 9 AM.
 * Finds open jars where the most recent MoMo contribution was made 14+ days ago
 * and no payout has occurred since. Creates an AutoRefund record and freezes the jar
 * pending admin review.
 */
export const autoRefundDailyTask = {
  slug: 'auto-refund-daily',
  schedule: [
    {
      cron: '0 9 * * *',
      queue: 'auto-refund-daily',
    },
  ],
  handler: async (args: any) => {
    try {
      const payload = args.req?.payload || args.payload
      const now = Date.now()

      console.log('Starting auto-refund daily check...')

      // 1. Find active jars idle for 14+ days
      const fourteenDaysAgo = new Date(now - FOURTEEN_DAYS_MS).toISOString()

      const openJars = await payload.find({
        collection: 'jars',
        where: {
          and: [
            { status: { in: ['open', 'sealed'] } },
            { lastActivityAt: { less_than: fourteenDaysAgo } },
          ],
        },
        pagination: false,
        depth: 1,
        overrideAccess: true,
      })

      if (!openJars.docs.length) {
        return { output: { success: true, message: 'No open jars', autoRefundsCreated: 0 } }
      }

      let autoRefundsCreated = 0
      let jarsSkipped = 0

      for (const jar of openJars.docs as any[]) {
        try {
          // 2a. Find completed MoMo contributions for this jar
          const momoContributions = await payload.find({
            collection: 'transactions',
            where: {
              and: [
                { jar: { equals: jar.id } },
                { type: { equals: 'contribution' } },
                { paymentStatus: { equals: 'completed' } },
                { paymentMethod: { equals: 'mobile-money' } },
              ],
            },
            pagination: false,
            depth: 1,
            select: {
              amountContributed: true,
              createdAt: true,
              contributor: true,
              contributorPhoneNumber: true,
              mobileMoneyProvider: true,
            },
            overrideAccess: true,
          })

          //  console.log(momoContributions);

          // 2b. Skip if no MoMo contributions
          if (!momoContributions.docs.length) {
            jarsSkipped++
            continue
          }

          // 2c. Find the last completed payout to filter contributions
          const lastPayoutResult = await payload.find({
            collection: 'transactions',
            where: {
              and: [
                { jar: { equals: jar.id } },
                { type: { equals: 'payout' } },
                { paymentStatus: { equals: 'completed' } },
              ],
            },
            pagination: false,
            sort: '-createdAt',
            limit: 1,
            select: { createdAt: true },
            overrideAccess: true,
          })

          const lastPayoutDate =
            lastPayoutResult.docs.length > 0 ? lastPayoutResult.docs[0]?.createdAt : null

          // 2d. Filter contributions to only those AFTER the last payout (or all if no payout)
          const filteredContributions = momoContributions.docs.filter((tx: any) => {
            if (!lastPayoutDate) return true
            return new Date(tx.createdAt).getTime() > new Date(lastPayoutDate).getTime()
          })

          if (!filteredContributions.length) {
            jarsSkipped++
            continue
          }

          // 2e. Sum their amountContributed → balance
          const balance = filteredContributions.reduce(
            (sum: number, tx: any) => sum + (tx.amountContributed ?? 0),
            0,
          )

          // 2f. Skip if balance <= 0
          if (balance <= 0) {
            jarsSkipped++
            continue
          }

          // 2g. Check no pending payout exists
          const pendingPayouts = await payload.find({
            collection: 'transactions',
            where: {
              and: [
                { jar: { equals: jar.id } },
                { type: { equals: 'payout' } },
                { paymentStatus: { in: ['pending', 'awaiting-approval', 'in-progress'] } },
              ],
            },
            pagination: false,
            limit: 1,
            select: { id: true },
            overrideAccess: true,
          })

          // 2h. Skip if pending payout exists
          if (pendingPayouts.docs.length > 0) {
            jarsSkipped++
            continue
          }

          // 2i. Check no existing awaiting_approval auto refunds for this jar
          const existingPending = await payload.find({
            collection: 'refunds',
            where: {
              and: [
                { jar: { equals: jar.id } },
                { refundType: { equals: 'auto' } },
                { status: { equals: 'awaiting_approval' } },
              ],
            },
            pagination: false,
            limit: 1,
            select: { id: true },
            overrideAccess: true,
          })

          // 2l. Skip if already pending admin review
          if (existingPending.docs.length > 0) {
            jarsSkipped++
            continue
          }

          // 2m. Create one refund record per contributor
          const triggeredAt = new Date().toISOString()
          for (const tx of filteredContributions) {
            await payload.create({
              collection: 'refunds',
              data: {
                refundType: 'auto',
                jar: jar.id,
                amount: Math.abs(tx.amountContributed ?? 0),
                accountNumber: tx.contributorPhoneNumber || '',
                accountName:
                  typeof tx.contributor === 'object'
                    ? `${tx.contributor?.firstName ?? ''} ${tx.contributor?.lastName ?? ''}`.trim() ||
                      ''
                    : '',
                mobileMoneyProvider: tx.mobileMoneyProvider || '',
                linkedTransaction: tx.id,
                status: 'awaiting_approval',
                triggeredAt,
              } as any,
              overrideAccess: true,
            })
          }

          // 2n. Freeze the jar
          await payload.update({
            collection: 'jars',
            id: jar.id,
            data: {
              status: 'frozen',
              freezeReason:
                'Auto-refund policy: balance unclaimed for 14+ days. Pending admin review.',
            } as any,
            overrideAccess: true,
          })

          // 2o. Notify jar creator
          const creator = typeof jar.creator === 'object' ? jar.creator : null
          if (creator?.email) {
            try {
              await emailService.sendAutoRefundNoticeEmail({
                to: creator.email,
                firstName: creator.firstName ?? creator.email,
                jarName: jar.name,
                totalAmount: balance,
                currency: jar.currency || 'GHS',
                contributorsCount: filteredContributions.length,
              })
            } catch (emailErr: any) {
              console.error(
                `Failed to send auto-refund notice for jar ${jar.id}:`,
                emailErr?.message,
              )
            }
          }

          autoRefundsCreated++
          console.log(
            `Auto-refund created for jar "${jar.name}" (${jar.id}). Balance: ${balance} ${jar.currency || 'GHS'}. Contributors: ${filteredContributions.length}.`,
          )
        } catch (jarErr: any) {
          console.error(`Error processing jar ${jar.id}:`, jarErr?.message || jarErr)
          jarsSkipped++
        }
      }

      return {
        output: {
          success: true,
          message: `Auto-refund check complete. ${autoRefundsCreated} auto-refund(s) created, ${jarsSkipped} jar(s) skipped.`,
          autoRefundsCreated,
          jarsSkipped,
          totalJarsChecked: openJars.docs.length,
        },
      }
    } catch (err: any) {
      console.error('Error in auto-refund daily task:', err)
      return { output: { success: false, message: err.message } }
    }
  },
}
