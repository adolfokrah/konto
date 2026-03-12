import * as React from 'react'
import { Layout } from './layout'

export interface JarSummaryRow {
  name: string
  contributionCount: number  // cash + momo combined
  cashCollected: number
  momoCollected: number
  withdrawn: number      // momo payouts only
  currency: string
}

interface WeeklyAccountSummaryProps {
  firstName: string
  weekStart: string   // e.g. "Mon 2 Jun 2025"
  weekEnd: string     // e.g. "Sun 8 Jun 2025"
  jars: JarSummaryRow[]
}

const thStyle: React.CSSProperties = {
  padding: '10px 12px',
  backgroundColor: '#F9FAFB',
  fontSize: '12px',
  color: '#6B7280',
  fontWeight: 600,
  textAlign: 'left',
  borderBottom: '2px solid #E5E7EB',
  whiteSpace: 'nowrap',
}

const thNumStyle: React.CSSProperties = {
  ...thStyle,
  textAlign: 'right',
}

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: '14px',
  borderBottom: '1px solid #F3F4F6',
  verticalAlign: 'middle',
}

const tdNumStyle: React.CSSProperties = {
  ...tdStyle,
  textAlign: 'right',
}

const totalTdStyle: React.CSSProperties = {
  ...tdStyle,
  backgroundColor: '#F9FAFB',
  fontWeight: 700,
}

const totalTdNumStyle: React.CSSProperties = {
  ...totalTdStyle,
  textAlign: 'right',
}

const defaultJars: JarSummaryRow[] = [
  { name: 'Birthday Fund', contributionCount: 12, cashCollected: 250, momoCollected: 200, withdrawn: 0, currency: 'GHS' },
  { name: 'Trip to Accra', contributionCount: 5, cashCollected: 80, momoCollected: 120, withdrawn: 150, currency: 'GHS' },
  { name: 'Office Party', contributionCount: 3, cashCollected: 30, momoCollected: 45, withdrawn: 75, currency: 'GHS' },
]

export default function WeeklyAccountSummary({
  firstName = 'John',
  weekStart = 'Mon 2 Jun 2025',
  weekEnd = 'Sun 8 Jun 2025',
  jars = defaultJars,
}: WeeklyAccountSummaryProps) {
  const fmt = (n: number, currency: string) =>
    `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const currency = jars[0]?.currency ?? 'GHS'

  const totals = jars.reduce(
    (acc, j) => ({
      contributionCount: acc.contributionCount + j.contributionCount,
      cashCollected: acc.cashCollected + j.cashCollected,
      momoCollected: acc.momoCollected + j.momoCollected,
      withdrawn: acc.withdrawn + j.withdrawn,
    }),
    { contributionCount: 0, cashCollected: 0, momoCollected: 0, withdrawn: 0 },
  )

  return (
    <Layout title="Your weekly jars summary">
      <p>Hi {firstName},</p>
      <p>
        Here&apos;s a summary of your jars activity from <strong>{weekStart}</strong> to{' '}
        <strong>{weekEnd}</strong>.
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', margin: '20px 0' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, borderBottom: '1px solid #E5E7EB' }} rowSpan={2}>Jar</th>
              <th
                colSpan={3}
                style={{
                  ...thNumStyle,
                  textAlign: 'center',
                  borderBottom: '1px solid #E5E7EB',
                  borderLeft: '1px solid #E5E7EB',
                }}
              >
                Contributions
              </th>
              <th style={{ ...thNumStyle, borderBottom: '1px solid #E5E7EB', borderLeft: '1px solid #E5E7EB' }} rowSpan={2}>
                Withdrawn
                <div style={{ fontWeight: 400, fontSize: '11px', color: '#9CA3AF' }}>MoMo only</div>
              </th>
            </tr>
            <tr>
              <th style={{ ...thNumStyle, borderLeft: '1px solid #E5E7EB' }}>Count</th>
              <th style={{ ...thNumStyle, borderLeft: '1px solid #E5E7EB' }}>Cash</th>
              <th style={{ ...thNumStyle, borderLeft: '1px solid #E5E7EB' }}>MoMo</th>
            </tr>
          </thead>
          <tbody>
            {jars.map((jar, i) => (
              <tr key={i}>
                <td style={{ ...tdStyle, fontWeight: 500 }}>{jar.name}</td>
                <td style={{ ...tdNumStyle, borderLeft: '1px solid #E5E7EB' }}>
                  {jar.contributionCount}
                </td>
                <td style={{ ...tdNumStyle, color: '#16A34A', borderLeft: '1px solid #E5E7EB' }}>
                  {fmt(jar.cashCollected, jar.currency)}
                </td>
                <td style={{ ...tdNumStyle, color: '#16A34A', borderLeft: '1px solid #E5E7EB' }}>
                  {fmt(jar.momoCollected, jar.currency)}
                </td>
                <td style={{ ...tdNumStyle, color: '#DC2626', borderLeft: '1px solid #E5E7EB' }}>
                  {`- ${fmt(jar.withdrawn, jar.currency)}`}
                </td>
              </tr>
            ))}

            {/* Totals row */}
            <tr>
              <td style={totalTdStyle}>Total</td>
              <td style={{ ...totalTdNumStyle, borderLeft: '1px solid #E5E7EB' }}>
                {totals.contributionCount}
              </td>
              <td style={{ ...totalTdNumStyle, color: '#16A34A', borderLeft: '1px solid #E5E7EB' }}>
                {fmt(totals.cashCollected, currency)}
              </td>
              <td style={{ ...totalTdNumStyle, color: '#16A34A', borderLeft: '1px solid #E5E7EB' }}>
                {fmt(totals.momoCollected, currency)}
              </td>
              <td style={{ ...totalTdNumStyle, color: '#DC2626', borderLeft: '1px solid #E5E7EB' }}>
                {`- ${fmt(totals.withdrawn, currency)}`}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p style={{ color: '#6B7280', fontSize: '13px', marginTop: '8px' }}>
        <em>Withdrawals reflect MoMo payouts only.</em>
      </p>

      <p>Keep sharing your jar links to keep the momentum going!</p>
    </Layout>
  )
}
