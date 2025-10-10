import * as React from 'react'
import { Layout } from './layout'

interface EmailTemplateProps {
  link: string
}

export default function sendKyc({ link }: EmailTemplateProps) {
  return (
    <Layout title={``} showSignature={false}>
      <div>
          <p>Your KYC session has been created successfully.</p>
          <p>Please complete your verification using the following link:</p>
          <a href={link} className='text-blue-300'>{link}</a>
      </div>
    </Layout>
  )
}
