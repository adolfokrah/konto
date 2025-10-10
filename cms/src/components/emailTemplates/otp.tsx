import * as React from 'react'
import { Layout } from './layout'

interface EmailTemplateProps {
  otpCode: string
}

export default function Otp({ otpCode = '123456' }: EmailTemplateProps) {
  return (
    <Layout title={``} showSignature={false}>
      <div>
          <p>Your Hoga verification code is</p>
          <h1 className='font-bold text-2xl tracking-widest'>{otpCode}</h1>
          <p>Do not share this code with anyone.</p>
      </div>
    </Layout>
  )
}
