import * as React from 'react'
import { Layout } from './layout'

interface AutoRefundNoticeProps {
  firstName: string
  jarName: string
  totalAmount: number
  currency: string
  contributorsCount: number
}

export default function AutoRefundNotice({
  firstName = 'John',
  jarName = 'Birthday Fund',
  totalAmount = 450.0,
  currency = 'GHS',
  contributorsCount = 3,
}: AutoRefundNoticeProps) {
  const fmt = (n: number) =>
    `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <Layout title="Your jar has been frozen — auto-refund initiated">
      <p style={{ margin: '0 0 12px' }}>
        <span
          style={{
            display: 'inline-block',
            padding: '2px 10px',
            borderRadius: '9999px',
            backgroundColor: '#DC2626',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          Action Taken
        </span>
      </p>

      <p>Hi {firstName},</p>

      <p>
        Your jar <strong>{jarName}</strong> has been <strong>frozen</strong> because the balance of{' '}
        <strong style={{ color: '#DC2626' }}>{fmt(totalAmount)}</strong> was not withdrawn within 14
        days of the last activity.
      </p>

      <p>
        As per our auto-refund policy, the outstanding balance will be refunded back to the{' '}
        {contributorsCount} contributor{contributorsCount !== 1 ? 's' : ''} who made MoMo
        contributions to this jar.
      </p>

      {/* What happens next */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          margin: '20px 0',
          backgroundColor: '#F9FAFB',
          borderRadius: '8px',
        }}
      >
        <tbody>
          {[
            { step: '1', text: 'Our team will review the refund request' },
            { step: '2', text: 'A 1% processing fee will be deducted from each refund, subject to our fees policy' },
            { step: '3', text: 'Each contributor will receive their contribution back (minus the fee) via MoMo' },
            { step: '4', text: 'Your jar will be unfrozen once all refunds are processed' },
          ].map(({ step, text }) => (
            <tr key={step}>
              <td
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #E5E7EB',
                  width: '36px',
                  verticalAlign: 'top',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: '24px',
                    height: '24px',
                    lineHeight: '24px',
                    borderRadius: '50%',
                    backgroundColor: '#2563EB',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  {step}
                </span>
              </td>
              <td style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB', fontSize: '14px' }}>
                {text}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ fontSize: '13px', color: '#6B7280' }}>
        While the jar is frozen, no new contributions or withdrawals can be made. You will receive
        another email once all refunds have been completed and the jar is unfrozen.
      </p>

      <p style={{ fontSize: '13px', color: '#6B7280' }}>
        If you believe this was a mistake or have any questions, please contact our support team.
      </p>
    </Layout>
  )
}
