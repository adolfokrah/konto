import * as React from 'react'
import { Layout } from './layout'

interface TransactionNotificationProps {
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
}

function getTitle(type: string, status: string): string {
  if (type === 'refund') {
    return status === 'completed' ? 'Refund Completed' : 'New Refund Requested'
  }
  if (type === 'payout') {
    return 'Payout Completed'
  }
  return 'Transaction Completed'
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'completed':
      return '#16A34A'
    case 'pending':
    case 'in-progress':
      return '#D97706'
    case 'failed':
      return '#DC2626'
    default:
      return '#6B7280'
  }
}

const rowStyle: React.CSSProperties = {
  borderBottom: '1px solid #F3F4F6',
}

const labelStyle: React.CSSProperties = {
  padding: '10px 12px 10px 0',
  color: '#6B7280',
  fontSize: '14px',
  whiteSpace: 'nowrap',
}

const valueStyle: React.CSSProperties = {
  padding: '10px 0',
  textAlign: 'right',
  fontSize: '14px',
}

export default function TransactionNotification({
  type,
  status,
  contributor,
  amount,
  currency = 'GHS',
  jarName,
  reference,
  date,
  phone,
  provider,
  paymentMethod,
}: TransactionNotificationProps) {
  const title = getTitle(type, status)
  const statusColor = getStatusColor(status)
  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1)

  return (
    <Layout title={title} showSignature={false}>
      <div>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginTop: '8px',
            marginBottom: '16px',
          }}
        >
          <tbody>
            <tr style={rowStyle}>
              <td style={labelStyle}>Type</td>
              <td style={{ ...valueStyle, fontWeight: 600 }}>{typeLabel}</td>
            </tr>
            <tr style={rowStyle}>
              <td style={labelStyle}>Status</td>
              <td style={{ ...valueStyle, fontWeight: 600, color: statusColor }}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </td>
            </tr>
            <tr style={rowStyle}>
              <td style={labelStyle}>Contributor</td>
              <td style={valueStyle}>{contributor}</td>
            </tr>
            <tr style={rowStyle}>
              <td style={labelStyle}>Amount</td>
              <td style={{ ...valueStyle, fontWeight: 600 }}>
                {currency} {amount}
              </td>
            </tr>
            <tr style={rowStyle}>
              <td style={labelStyle}>Jar</td>
              <td style={valueStyle}>{jarName}</td>
            </tr>
            {paymentMethod && (
              <tr style={rowStyle}>
                <td style={labelStyle}>Payment Method</td>
                <td style={{ ...valueStyle, textTransform: 'capitalize' }}>{paymentMethod}</td>
              </tr>
            )}
            {phone && (
              <tr style={rowStyle}>
                <td style={labelStyle}>Phone</td>
                <td style={valueStyle}>{phone}</td>
              </tr>
            )}
            {provider && (
              <tr style={rowStyle}>
                <td style={labelStyle}>Provider</td>
                <td style={valueStyle}>{provider}</td>
              </tr>
            )}
            <tr style={rowStyle}>
              <td style={labelStyle}>Reference</td>
              <td style={{ ...valueStyle, fontFamily: 'monospace', fontSize: '12px' }}>
                {reference}
              </td>
            </tr>
            <tr>
              <td style={labelStyle}>Date</td>
              <td style={valueStyle}>{date}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
