import * as React from 'react'
import { Layout } from './layout'

interface EmailTemplateProps {
  jarName: string
  totalRecords: number
}

export default function ContributionsReport({
  jarName = 'the jar',
  totalRecords,
}: EmailTemplateProps) {
  return (
    <Layout title={`Your Contributions Report for ${jarName || 'the jar'}  📃`}>
      <div>
        <p>
          Attached is your requested contributions report for{' '}
          <strong>{jarName || 'your jar'}</strong>. Total records: {totalRecords}.
        </p>
        <p>
          <strong>Note:</strong> This is a multi-page PDF document. If you can't scroll in your
          email viewer, please download the PDF and open it in a dedicated PDF reader (like Adobe
          Reader, Preview, or your browser) for full navigation.
        </p>
      </div>
    </Layout>
  )
}
