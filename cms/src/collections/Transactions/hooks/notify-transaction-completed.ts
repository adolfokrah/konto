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
    await emailService.sendCustomEmail({
      to: NOTIFY_EMAIL,
      subject: `Transaction Completed — ${type === 'payout' ? 'Payout' : 'Contribution'} of GHS ${amount}`,
      html: `
        <h2>Transaction Completed</h2>
        <table style="border-collapse:collapse;font-family:sans-serif;">
          <tr><td style="padding:4px 12px 4px 0;color:#666;">Type</td><td style="padding:4px 0;font-weight:600;">${type}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666;">Contributor</td><td style="padding:4px 0;">${contributor}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666;">Amount</td><td style="padding:4px 0;font-weight:600;">GHS ${amount}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666;">Jar</td><td style="padding:4px 0;">${jarName}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666;">Reference</td><td style="padding:4px 0;font-family:monospace;">${doc.transactionReference || '—'}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666;">Date</td><td style="padding:4px 0;">${new Date(doc.createdAt).toLocaleString()}</td></tr>
        </table>
      `,
    })
  } catch (err: any) {
    console.error(`[notify-transaction-completed] Failed to send email:`, err.message)
  }
}
