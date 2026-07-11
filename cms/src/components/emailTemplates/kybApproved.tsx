import * as React from 'react'
import { Layout } from './layout'

interface EmailTemplateProps {
  fullname: string
  businessName?: string
}

export default function KybApproved({
  fullname = 'John Doe',
  businessName,
}: EmailTemplateProps) {
  return (
    <Layout title={`Congratulations ${fullname}! 🎉`}>
      <p>
        Your business verification{businessName ? ` for ${businessName}` : ''} has been approved.
        You can now collect contributions and request payouts.
      </p>
      <p>Restart the app to unlock the full experience.</p>
    </Layout>
  )
}
