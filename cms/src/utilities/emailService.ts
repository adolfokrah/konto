import { getResend } from '@/utilities/initalise'
import kycVerified from '@/components/emailTemplates/kycVerified'
import Welcome from '@/components/emailTemplates/Welcome'
import ContributionsReport from '@/components/emailTemplates/contributionReport'
import AccountDeletion from '@/components/emailTemplates/accountDeletion'
import Otp from '@/components/emailTemplates/otp'
import sendKyc from '@/components/emailTemplates/sendKyc'
import EganowBalanceAlert from '@/components/emailTemplates/EganowBalanceAlert'
import TransactionNotification from '@/components/emailTemplates/transactionNotification'
import WeeklyAccountSummary, {
  type JarSummaryRow,
} from '@/components/emailTemplates/weeklyAccountSummary'
import WithdrawalReminder from '@/components/emailTemplates/withdrawalReminder'
import AutoRefundNotice from '@/components/emailTemplates/autoRefundNotice'

interface EmailOptions {
  to: string | string[]
  subject: string
  html?: string
  react?: React.ReactElement
  attachments?: Array<{
    filename: string
    content: string
  }>
}

class EmailService {
  private async sendEmail(options: EmailOptions) {
    const emailData: any = {
      from: this.getFromEmail(),
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
    }

    if (options.html) emailData.html = options.html
    if (options.react) emailData.react = options.react
    if (options.attachments) emailData.attachments = options.attachments

    await getResend().emails.send(emailData)
    return true
  }

  async sendBatch(emails: EmailOptions[]): Promise<{ sent: number; failed: number }> {
    const from = this.getFromEmail()
    const CHUNK_SIZE = 100
    let sent = 0
    let failed = 0

    for (let i = 0; i < emails.length; i += CHUNK_SIZE) {
      const chunk = emails.slice(i, i + CHUNK_SIZE).map((options) => ({
        from,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        ...(options.html ? { html: options.html } : {}),
        ...(options.react ? { react: options.react } : {}),
        ...(options.attachments ? { attachments: options.attachments } : {}),
      }))

      try {
        await getResend().batch.send(chunk)
        sent += chunk.length
      } catch (err) {
        console.error(`Batch send failed for chunk ${i / CHUNK_SIZE + 1}:`, err)
        failed += chunk.length
      }
    }

    return { sent, failed }
  }

  private getFromEmail(): string {
    return 'Hogapay <noreply@hogapay.com>'
  }

  // KYC Verification Success Email
  async sendKycVerificationEmail(userEmail: string, fullName: string) {
    return this.sendEmail({
      to: userEmail,
      subject: 'KYC Verification Successful',
      react: kycVerified({ fullname: fullName }),
    })
  }

  // Welcome Email
  async sendWelcomeEmail(userEmail: string, fullName: string) {
    return this.sendEmail({
      to: userEmail,
      subject: `Welcome to Hogapay, ${fullName}! 🎉`,
      react: Welcome({ fullname: fullName }),
    })
  }

  // Account Deletion Email
  async sendAccountDeletionEmail(userEmail: string, fullName: string) {
    return this.sendEmail({
      to: userEmail,
      subject: `Your account is deleted ${fullName}! 👋`,
      react: AccountDeletion({ fullname: fullName }),
    })
  }

  // Export Report Email
  async sendExportReportEmail(
    userEmail: string,
    jarName: string | undefined,
    recordCount: number,
    fileName: string,
    pdfBuffer: Buffer,
  ) {
    return this.sendEmail({
      to: userEmail,
      subject: `Your Contributions Report for ${jarName || 'the jar'}`,
      react: ContributionsReport({
        jarName: jarName || 'the jar',
        totalRecords: recordCount,
      }),
      attachments: [
        {
          filename: fileName,
          content: pdfBuffer.toString('base64'),
        },
      ],
    })
  }

  async sendOTPEmail(userEmail: string, code: string) {
    return this.sendEmail({
      to: userEmail,
      subject: `your Hogapay OTP Code`,
      react: Otp({ otpCode: code }),
    })
  }

  // KYC Verification Email
  async sendKycEmail(userEmail: string, link: string) {
    return this.sendEmail({
      to: userEmail,
      subject: `your Hogapay KYC Verification`,
      react: sendKyc({ link }),
    })
  }

  // Eganow Payout Balance Alert
  async sendEganowBalanceAlert(params: {
    totalJarBalances: number
    totalUpcoming: number
    combinedTotal: number
    eganowBalance: number
    shortfall: number
    currency: string
  }) {
    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return this.sendEmail({
      to: 'hello@usehoga.com',
      subject: `Eganow Payout Balance Alert — Top Up Needed`,
      react: EganowBalanceAlert({
        totalJarBalances: fmt(params.totalJarBalances),
        totalUpcoming: fmt(params.totalUpcoming),
        combinedTotal: fmt(params.combinedTotal),
        eganowBalance: fmt(params.eganowBalance),
        shortfall: fmt(params.shortfall),
        currency: params.currency,
      }),
    })
  }

  // Transaction / Refund Notification Email (internal)
  async sendTransactionNotificationEmail(params: {
    to: string
    subject: string
    type: 'contribution' | 'payout' | 'refund'
    status: string
    contributor: string
    amount: string
    currency?: string
    jarName: string
    reference: string
    date: string
    phone?: string
    provider?: string
    paymentMethod?: string
  }) {
    return this.sendEmail({
      to: params.to,
      subject: params.subject,
      react: TransactionNotification({
        type: params.type,
        status: params.status,
        contributor: params.contributor,
        amount: params.amount,
        currency: params.currency,
        jarName: params.jarName,
        reference: params.reference,
        date: params.date,
        phone: params.phone,
        provider: params.provider,
        paymentMethod: params.paymentMethod,
      }),
    })
  }

  // Weekly Account Summary Email
  async sendWeeklyAccountSummaryEmail(params: {
    to: string
    firstName: string
    weekStart: string
    weekEnd: string
    jars: JarSummaryRow[]
  }) {
    return this.sendEmail({
      to: params.to,
      subject: `Your weekly jars summary — ${params.weekStart} to ${params.weekEnd}`,
      react: WeeklyAccountSummary({
        firstName: params.firstName,
        weekStart: params.weekStart,
        weekEnd: params.weekEnd,
        jars: params.jars,
      }),
    })
  }

  // Batch Weekly Account Summary
  async sendWeeklyAccountSummaryBatch(
    items: {
      to: string
      firstName: string
      weekStart: string
      weekEnd: string
      jars: JarSummaryRow[]
    }[],
  ) {
    const emails: EmailOptions[] = items.map((params) => ({
      to: params.to,
      subject: `Your weekly jars summary — ${params.weekStart} to ${params.weekEnd}`,
      react: WeeklyAccountSummary({
        firstName: params.firstName,
        weekStart: params.weekStart,
        weekEnd: params.weekEnd,
        jars: params.jars,
      }),
    }))
    return this.sendBatch(emails)
  }

  // Withdrawal Reminder Email
  async sendWithdrawalReminderEmail(params: {
    to: string
    firstName: string
    reminderDay: number
    jars: { name: string; balance: number; currency: string; lastTransactionDate: string }[]
  }) {
    const subjectByDay: Record<number, string> = {
      7: 'Reminder: withdraw your jar balance',
      10: '2nd reminder: your jar balance is still unclaimed',
      12: 'Final warning: withdraw now or auto-refund begins',
    }
    const subject = subjectByDay[params.reminderDay] ?? 'Action required: withdraw your jar balance'
    return this.sendEmail({
      to: params.to,
      subject,
      react: WithdrawalReminder({
        firstName: params.firstName,
        reminderDay: params.reminderDay,
        jars: params.jars,
      }),
    })
  }

  // Batch Withdrawal Reminder
  async sendWithdrawalReminderBatch(
    items: {
      to: string
      firstName: string
      reminderDay: number
      jars: { name: string; balance: number; currency: string; lastTransactionDate: string }[]
    }[],
  ) {
    const subjectByDay: Record<number, string> = {
      7: 'Reminder: withdraw your jar balance',
      10: '2nd reminder: your jar balance is still unclaimed',
      12: 'Final warning: withdraw now or auto-refund begins',
    }
    const emails: EmailOptions[] = items.map((params) => ({
      to: params.to,
      subject: subjectByDay[params.reminderDay] ?? 'Action required: withdraw your jar balance',
      react: WithdrawalReminder({
        firstName: params.firstName,
        reminderDay: params.reminderDay,
        jars: params.jars,
      }),
    }))
    return this.sendBatch(emails)
  }

  // Auto Refund Notice Email (sent to jar creator when jar is frozen on Day 14)
  async sendAutoRefundNoticeEmail(params: {
    to: string
    firstName: string
    jarName: string
    totalAmount: number
    currency: string
    contributorsCount: number
  }) {
    return this.sendEmail({
      to: params.to,
      subject: `Your jar "${params.jarName}" has been frozen — auto-refund initiated`,
      react: AutoRefundNotice({
        firstName: params.firstName,
        jarName: params.jarName,
        totalAmount: params.totalAmount,
        currency: params.currency,
        contributorsCount: params.contributorsCount,
      }),
    })
  }

  // Generic email method for custom emails
  async sendCustomEmail(options: EmailOptions) {
    return this.sendEmail(options)
  }
}

// Export singleton instance
export const emailService = new EmailService()
