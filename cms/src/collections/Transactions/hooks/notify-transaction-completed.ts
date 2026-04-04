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

  const type = doc.type || 'contribution'
  const rawAmount =
    type === 'payout'
      ? Math.abs(doc.amountContributed || 0) -
          Math.abs((doc.chargesBreakdown as any)?.platformCharge ?? 0) ||
        Math.abs(doc.amountContributed || 0)
      : Math.abs(doc.amountContributed || 0)
  const amount = rawAmount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const contributor = doc.contributor || 'Unknown'
  const jarName = typeof doc.jar === 'object' ? doc.jar?.name : doc.jar || 'Unknown jar'

  const paymentMethodLabels: Record<string, string> = {
    bank: 'Bank Transfer',
    'mobile-money': 'Mobile Money',
    card: 'Card Payment',
    cash: 'Cash',
  }
  const paymentMethodLabel = doc.paymentMethod
    ? (paymentMethodLabels[doc.paymentMethod] ?? doc.paymentMethod)
    : undefined

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
      paymentMethod: paymentMethodLabel,
    })
  } catch (err: any) {
    console.error(`[notify-transaction-completed] Failed to send email:`, err.message)
  }
}
