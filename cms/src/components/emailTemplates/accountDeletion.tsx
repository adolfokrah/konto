import * as React from 'react'
import { Layout } from './layout'

interface EmailTemplateProps {
  fullname: string
}

export default function AccountDeletion({ fullname = 'John Doe' }: EmailTemplateProps) {
  return (
    <Layout title={` We’ll miss you, ${fullname}! 😔`}>
      <div>
        Hi {fullname}, This note is to confirm that your Hogapay account has been deleted. Thank you
        for being part of our community — every contribution, every receipt, every moment of trust
        matters to us.
        <p>A few important notes:</p>
        <ul>
          <li>
            <strong>Jars & access:</strong> You no longer have access to your jars from this
            account. If you were an organizer, any active jars you owned were closed or handed over
            per your settings.
          </li>
          <li>
            <strong>Receipts & records:</strong> For safety and compliance, we retain limited
            transaction records (e.g., contributions, transfers, receipts, KYC status) as required
            by law and to prevent fraud.
          </li>
          <li>
            <strong>Data protection:</strong> We follow the Ghana Data Protection Act (Act 843).
            Learn more in our policies below.
          </li>
        </ul>
        <p>
          If this wasn’t you, or if you’d like help starting fresh, just reply to this email or
          contact us: <a href="mailto:hello@hogapay.com">hello@hogapay.com</a>. We’d love to have
          you back whenever you’re ready.
        </p>
      </div>
    </Layout>
  )
}
