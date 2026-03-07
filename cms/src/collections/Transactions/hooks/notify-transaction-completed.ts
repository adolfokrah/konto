import { emailService } from '@/utilities/emailService'

const NOTIFY_EMAIL = 'socials@usehoga.com'

/**
 * afterChange hook: sends an email to socials@usehoga.com
 * when a transaction status changes to 'completed'.
 */
export const notifyTransactionCompleted = async ({
  doc,
  previousDoc,
  operation,
}: {
  doc: any
  previousDoc?: any
  operation: 'create' | 'update'
}) => {
  const isNewlyCompleted =
    doc.paymentStatus === 'completed' &&
    (operation === 'create' || previousDoc?.paymentStatus !== 'completed')

  if (!isNewlyCompleted) return

  const amount = Math.abs(doc.amountContributed || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const type = doc.type || 'contribution'
  const contributor = doc.contributor || 'Unknown'
  const jarName = typeof doc.jar === 'object' ? doc.jar?.name : doc.jar || 'Unknown jar'

  try {
    await emailService.sendTransactionNotificationEmail({
      to: NOTIFY_EMAIL,
      subject: `Transaction Completed — ${type === 'payout' ? 'Payout' : 'Contribution'} of GHS ${amount}`,
      type,
      status: 'completed',
      contributor,
      amount,
      jarName,
      reference: doc.transactionReference || '—',
      date: new Date(doc.createdAt).toLocaleString(),
      provider: doc.mobileMoneyProvider || undefined,
      paymentMethod: doc.paymentMethod || undefined,
    })
  } catch (err: any) {
    console.error(`[notify-transaction-completed] Failed to send email:`, err.message)
  }
}
