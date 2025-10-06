import * as React from 'react'
import { Layout } from './layout'

interface EmailTemplateProps {
  fullname: string
}

export default function kycVerified({ fullname = 'John Doe' }: EmailTemplateProps) {
  return (
    <Layout title={` Congratulations ${fullname}! 🎉`}>
      <p>
        Your KYC has been successfully verified. You can now access all features of your account.
        Simply restart the app to continue using it.
      </p>
    </Layout>
  )
}
