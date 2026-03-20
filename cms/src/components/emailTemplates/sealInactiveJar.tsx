import * as React from 'react'
import { Layout } from './layout'

interface SealInactiveJarProps {
  firstName: string
  jars: {
    name: string
    inactiveDays: number
    createdAt: string
  }[]
}

const defaultJars = [
  { name: 'Birthday Fund', inactiveDays: 14, createdAt: '1 Mar 2026' },
]

export default function SealInactiveJar({
  firstName = 'John',
  jars = defaultJars,
}: SealInactiveJarProps) {
  return (
    <Layout title={`Your jar${jars.length > 1 ? 's have' : ' has'} been sealed`}>
      <p>Hi {firstName},</p>
      <p>
        We noticed that the following jar{jars.length > 1 ? 's' : ''} had no contributions or
        activity for <strong>14 days</strong> and {jars.length > 1 ? 'have' : 'has'} been
        automatically sealed.
      </p>

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
              Created
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
              Days Inactive
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
                  color: '#6B7280',
                }}
              >
                {jar.createdAt}
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
                {jar.inactiveDays}d
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p>
        <strong>What does sealed mean?</strong>
        <br />A sealed jar can no longer receive contributions. Your jar data and history remain
        safe.
      </p>
      <p>
        You can re-open your jar anytime from the <strong>jar info</strong> screen in the app.
      </p>
    </Layout>
  )
}
