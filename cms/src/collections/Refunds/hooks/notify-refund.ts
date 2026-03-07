import { emailService } from '@/utilities/emailService'

const NOTIFY_EMAIL = 'socials@usehoga.com'

/**
 * afterChange hook: sends an email to socials@usehoga.com
 * when a refund is created or its status changes to 'completed'.
 */
export const notifyRefund = async ({
  doc,
  previousDoc,
  operation,
}: {
  doc: any
  previousDoc?: any
  operation: 'create' | 'update'
}) => {
  const isNew = operation === 'create'
  const isNewlyCompleted =
    operation === 'update' && doc.status === 'completed' && previousDoc?.status !== 'completed'

  if (!isNew && !isNewlyCompleted) return

  const amount = Math.abs(doc.amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const status = doc.status || 'pending'
  const contributor = doc.accountName || 'Unknown'

  const subject = isNew
    ? `New Refund Requested — GHS ${amount}`
    : `Refund Completed — GHS ${amount} to ${contributor}`

  try {
    await emailService.sendTransactionNotificationEmail({
      to: NOTIFY_EMAIL,
      subject,
      type: 'refund',
      status,
      contributor,
      amount,
      jarName: typeof doc.jar === 'object' ? doc.jar?.name : doc.jar || 'Unknown jar',
      reference: doc.transactionReference || '—',
      date: new Date(doc.createdAt).toLocaleString(),
      phone: doc.accountNumber || undefined,
      provider: doc.mobileMoneyProvider || undefined,
    })
  } catch (err: any) {
    console.error(`[notify-refund] Failed to send email:`, err.message)
  }
}
