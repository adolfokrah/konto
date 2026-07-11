import * as React from 'react'
import { Layout } from './layout'

interface EmailTemplateProps {
  fullname: string
  businessName?: string
  reason?: string
}

export default function KybRejected({
  fullname = 'John Doe',
  businessName,
  reason,
}: EmailTemplateProps) {
  return (
    <Layout title={`Business verification update, ${fullname}`}>
      <p>
        We reviewed your business verification{businessName ? ` for ${businessName}` : ''} and it
        was not approved.
      </p>
      {reason ? (
        <>
          <p>
            <b>Reason:</b>
          </p>
          <p style={{ whiteSpace: 'pre-wrap' }}>{reason}</p>
        </>
      ) : null}
      <p>Please review the details and resubmit your documents from the app.</p>
    </Layout>
  )
}
