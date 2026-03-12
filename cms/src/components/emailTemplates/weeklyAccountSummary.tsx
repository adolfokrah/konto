import * as React from 'react'
import { Layout } from './layout'

export interface JarSummaryRow {
  name: string
  contributionCount: number
  collected: number      // cash + momo contributions
  withdrawn: number      // momo payouts only
  balance: number        // momo contributions - withdrawn
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
  { name: 'Birthday Fund', contributionCount: 12, collected: 450, withdrawn: 0, balance: 300, currency: 'GHS' },
  { name: 'Trip to Accra', contributionCount: 5, collected: 200, withdrawn: 150, balance: 50, currency: 'GHS' },
  { name: 'Office Party', contributionCount: 3, collected: 75, withdrawn: 75, balance: 0, currency: 'GHS' },
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
      collected: acc.collected + j.collected,
      withdrawn: acc.withdrawn + j.withdrawn,
      balance: acc.balance + j.balance,
    }),
    { contributionCount: 0, collected: 0, withdrawn: 0, balance: 0 },
  )

  return (
    <Layout title="Your weekly jars summary">
      <p>Hi {firstName},</p>
      <p>
        Here&apos;s how your jars performed from <strong>{weekStart}</strong> to{' '}
        <strong>{weekEnd}</strong>.
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', margin: '20px 0' }}>
          <thead>
            <tr>
              <th style={thStyle}>Jar</th>
              <th style={thNumStyle}>Contributions</th>
              <th style={{ ...thNumStyle }}>
                Collected
                <div style={{ fontWeight: 400, fontSize: '11px', color: '#9CA3AF' }}>Cash + MoMo</div>
              </th>
              <th style={{ ...thNumStyle }}>
                Withdrawn
                <div style={{ fontWeight: 400, fontSize: '11px', color: '#9CA3AF' }}>MoMo only</div>
              </th>
              <th style={{ ...thNumStyle }}>
                Balance
                <div style={{ fontWeight: 400, fontSize: '11px', color: '#9CA3AF' }}>MoMo only</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {jars.map((jar, i) => (
              <tr key={i}>
                <td style={{ ...tdStyle, fontWeight: 500 }}>{jar.name}</td>
                <td style={tdNumStyle}>{jar.contributionCount}</td>
                <td style={{ ...tdNumStyle, color: '#16A34A' }}>
                  {fmt(jar.collected, jar.currency)}
                </td>
                <td style={{ ...tdNumStyle, color: jar.withdrawn > 0 ? '#DC2626' : '#9CA3AF' }}>
                  {jar.withdrawn > 0 ? `- ${fmt(jar.withdrawn, jar.currency)}` : '—'}
                </td>
                <td style={{ ...tdNumStyle, fontWeight: 600 }}>
                  {fmt(jar.balance, jar.currency)}
                </td>
              </tr>
            ))}

            {/* Totals row */}
            <tr>
              <td style={totalTdStyle}>Total</td>
              <td style={totalTdNumStyle}>{totals.contributionCount}</td>
              <td style={{ ...totalTdNumStyle, color: '#16A34A' }}>
                {fmt(totals.collected, currency)}
              </td>
              <td style={{ ...totalTdNumStyle, color: totals.withdrawn > 0 ? '#DC2626' : '#9CA3AF' }}>
                {totals.withdrawn > 0 ? `- ${fmt(totals.withdrawn, currency)}` : '—'}
              </td>
              <td style={{ ...totalTdNumStyle }}>{fmt(totals.balance, currency)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p style={{ color: '#6B7280', fontSize: '13px', marginTop: '8px' }}>
        <em>Collected includes both cash and MoMo contributions. Balance and withdrawals reflect MoMo only.</em>
      </p>

      <p>Keep sharing your jar links to keep the momentum going!</p>
    </Layout>
  )
}
