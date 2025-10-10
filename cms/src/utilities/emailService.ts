import { resend } from '@/utilities/initalise'
import kycVerified from '@/components/emailTemplates/kycVerified'
import Welcome from '@/components/emailTemplates/Welcome'
import ContributionsReport from '@/components/emailTemplates/contributionReport'
import AccountDeletion from '@/components/emailTemplates/accountDeletion'

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
  private shouldSkipEmail(): boolean {
    return process.env.NODE_ENV === 'test'
  }

  private async sendEmail(options: EmailOptions) {
    if (this.shouldSkipEmail()) {
      console.log(`[EmailService] Skipping email in test mode: ${options.subject}`)
      return
    }

    const emailData: any = {
      from: this.getFromEmail(options.subject),
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
    }

    if (options.html) {
      emailData.html = options.html
    }

    if (options.react) {
      emailData.react = options.react
    }

    if (options.attachments) {
      emailData.attachments = options.attachments
    }

    const data = await resend.emails.send(emailData)
    console.log(data)
    return data
  }

  private getFromEmail(subject: string): string {
    // return 'Hoga <noreply@gavazo.com>'
    // Different from addresses based on email type
    if (subject.toLowerCase().includes('kyc')) {
      return 'Hoga <onboarding@usehoga.com>'
    }
    if (subject.toLowerCase().includes('report') || subject.toLowerCase().includes('export')) {
      return 'Hoga <reports@usehoga.com>'
    }
    if (subject.toLowerCase().includes('welcome')) {
      return 'Hoga <hello@usehoga.com>'
    }
    if (subject.toLowerCase().includes('deletion')) {
      return 'Hoga <noreply@usehoga.com>'
    }

    // Default
    return process.env.RESEND_FROM_EMAIL || 'Hoga <noreply@usehoga.com>'
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
      subject: `Welcome to Hoga, ${fullName}! 🎉`,
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
      subject: `Your Hoga OTP Code`,
      html: `<p>Your OTP code is: <strong>${code}</strong></p><p>This code will expire in 10 minutes.</p>`,
    })
  }

  // Generic email method for custom emails
  async sendCustomEmail(options: EmailOptions) {
    return this.sendEmail(options)
  }
}

// Export singleton instance
export const emailService = new EmailService()
