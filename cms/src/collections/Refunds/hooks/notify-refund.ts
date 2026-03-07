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
  const phone = doc.accountNumber || '—'

  const subject = isNew
    ? `New Refund Requested — GHS ${amount}`
    : `Refund Completed — GHS ${amount} to ${contributor}`

  try {
    await emailService.sendCustomEmail({
      to: NOTIFY_EMAIL,
      subject,
      html: `
        <h2>${isNew ? 'New Refund Requested' : 'Refund Completed'}</h2>
        <table style="border-collapse:collapse;font-family:sans-serif;">
          <tr><td style="padding:4px 12px 4px 0;color:#666;">Status</td><td style="padding:4px 0;font-weight:600;">${status}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666;">Contributor</td><td style="padding:4px 0;">${contributor}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666;">Phone</td><td style="padding:4px 0;">${phone}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666;">Amount</td><td style="padding:4px 0;font-weight:600;">GHS ${amount}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666;">Provider</td><td style="padding:4px 0;">${doc.mobileMoneyProvider || '—'}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666;">Reference</td><td style="padding:4px 0;font-family:monospace;">${doc.transactionReference || '—'}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666;">Date</td><td style="padding:4px 0;">${new Date(doc.createdAt).toLocaleString()}</td></tr>
        </table>
      `,
    })
  } catch (err: any) {
    console.error(`[notify-refund] Failed to send email:`, err.message)
  }
}
