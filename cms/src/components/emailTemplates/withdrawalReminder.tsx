import * as React from 'react'
import { Layout } from './layout'

interface WithdrawalReminderProps {
  firstName: string
  reminderDay?: number
  jars: {
    name: string
    balance: number
    currency: string
    lastTransactionDate: string
  }[]
}

const defaultJars = [
  { name: 'Birthday Fund', balance: 450.00, currency: 'GHS', lastTransactionDate: '1 Jun 2025' },
  { name: 'Trip to Accra', balance: 120.50, currency: 'GHS', lastTransactionDate: '28 May 2025' },
]

const REMINDER_COPY: Record<number, { badge: string; badgeColor: string; intro: string; urgency: string }> = {
  7: {
    badge: 'Reminder',
    badgeColor: '#2563EB',
    intro: 'Your jar balance has been sitting unclaimed for over 7 days.',
    urgency: 'Please withdraw your balance within the next 7 days.',
  },
  10: {
    badge: '2nd Reminder',
    badgeColor: '#D97706',
    intro: 'Your jar balance is still unclaimed — it has now been over 10 days.',
    urgency: 'Please withdraw your balance within the next 4 days to avoid an automatic refund.',
  },
  12: {
    badge: 'Final Warning',
    badgeColor: '#DC2626',
    intro: 'This is your final reminder. Your jar balance has been unclaimed for over 12 days.',
    urgency: 'Withdraw your balance within the next 2 days or contributions will automatically be refunded to contributors.',
  },
}

export default function WithdrawalReminder({
  firstName = 'John',
  reminderDay = 7,
  jars = defaultJars,
}: WithdrawalReminderProps) {
  const fmt = (n: number, currency: string) =>
    `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const copy = REMINDER_COPY[reminderDay] ?? REMINDER_COPY[7]

  return (
    <Layout title="Action required: withdraw your balance">
      <p style={{ margin: '0 0 12px' }}>
        <span
          style={{
            display: 'inline-block',
            padding: '2px 10px',
            borderRadius: '9999px',
            backgroundColor: copy.badgeColor,
            color: '#fff',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          {copy.badge}
        </span>
      </p>
      <p>Hi {firstName},</p>
      <p>{copy.intro}</p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '20px 0' }}>
        <thead>
          <tr>
            <th
              style={{
                padding: '10px 12px',
                backgroundColor: '#F9FAFB',
                fontSize: '12px',
                color: '#6B7280',
                fontWeight: 600,
                textAlign: 'left',
                borderBottom: '2px solid #E5E7EB',
              }}
            >
              Jar
            </th>
            <th
              style={{
                padding: '10px 12px',
                backgroundColor: '#F9FAFB',
                fontSize: '12px',
                color: '#6B7280',
                fontWeight: 600,
                textAlign: 'right',
                borderBottom: '2px solid #E5E7EB',
              }}
            >
              Balance
            </th>
            <th
              style={{
                padding: '10px 12px',
                backgroundColor: '#F9FAFB',
                fontSize: '12px',
                color: '#6B7280',
                fontWeight: 600,
                textAlign: 'right',
                borderBottom: '2px solid #E5E7EB',
              }}
            >
              Last Activity
            </th>
          </tr>
        </thead>
        <tbody>
          {jars.map((jar, i) => (
            <tr key={i}>
              <td
                style={{
                  padding: '10px 12px',
                  fontSize: '14px',
                  borderBottom: '1px solid #F3F4F6',
                  fontWeight: 500,
                }}
              >
                {jar.name}
              </td>
              <td
                style={{
                  padding: '10px 12px',
                  fontSize: '14px',
                  borderBottom: '1px solid #F3F4F6',
                  textAlign: 'right',
                  color: '#16A34A',
                  fontWeight: 600,
                }}
              >
                {fmt(jar.balance, jar.currency)}
              </td>
              <td
                style={{
                  padding: '10px 12px',
                  fontSize: '14px',
                  borderBottom: '1px solid #F3F4F6',
                  textAlign: 'right',
                  color: '#6B7280',
                }}
              >
                {jar.lastTransactionDate}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p>{copy.urgency}</p>

      {reminderDay >= 12 && (
        <p style={{ color: '#DC2626', fontSize: '13px' }}>
          <strong>Note:</strong> Unclaimed balances are subject to our auto-refund policy. Refunds
          are irreversible once initiated.
        </p>
      )}
    </Layout>
  )
}
