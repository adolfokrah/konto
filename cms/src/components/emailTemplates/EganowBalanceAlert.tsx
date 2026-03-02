import * as React from 'react'
import { Layout } from './layout'

interface EganowBalanceAlertProps {
  totalJarBalances: string
  totalUpcoming: string
  combinedTotal: string
  eganowBalance: string
  shortfall: string
  currency: string
}

export default function EganowBalanceAlert({
  totalJarBalances,
  totalUpcoming,
  combinedTotal,
  eganowBalance,
  shortfall,
  currency = 'GHS',
}: EganowBalanceAlertProps) {
  return (
    <Layout title="Eganow Payout Balance Alert" showSignature={false}>
      <div>
        <p>Hi Team,</p>
        <p>
          The total outstanding jar balances and upcoming funds exceed the current Eganow payout
          account balance. Please top up to ensure payouts can be processed without interruption.
        </p>

        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginTop: '16px',
            marginBottom: '16px',
          }}
        >
          <tbody>
            <tr>
              <td style={{ padding: '8px 0', color: '#6B7280' }}>Jar Balances (settled)</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold' }}>
                {currency} {totalJarBalances}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#6B7280' }}>Upcoming (unsettled)</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold' }}>
                {currency} {totalUpcoming}
              </td>
            </tr>
            <tr style={{ borderTop: '1px solid #E5E7EB' }}>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Combined Total</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold' }}>
                {currency} {combinedTotal}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#6B7280' }}>Eganow Payout Balance</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold' }}>
                {currency} {eganowBalance}
              </td>
            </tr>
            <tr style={{ borderTop: '1px solid #E5E7EB' }}>
              <td style={{ padding: '8px 0', color: '#DC2626', fontWeight: 'bold' }}>Shortfall</td>
              <td
                style={{
                  padding: '8px 0',
                  textAlign: 'right',
                  fontWeight: 'bold',
                  color: '#DC2626',
                }}
              >
                {currency} {shortfall}
              </td>
            </tr>
          </tbody>
        </table>

        <p>
          Please log in to your Eganow merchant dashboard and top up the payout account as soon as
          possible.
        </p>
      </div>
    </Layout>
  )
}
