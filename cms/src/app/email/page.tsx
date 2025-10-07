import { notFound } from 'next/navigation'
import KycVerified from '@/components/emailTemplates/kycVerified'
import Welcome from '@/components/emailTemplates/Welcome'
import ContributionsRepport from '@/components/emailTemplates/contributionReport'
import AccountDeletion from '@/components/emailTemplates/accountDeletion'

export default function Email() {
  // Only allow this route in development
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }

  return (
    <div>
      {/* <KycVerified fullname="Ben" /> */}
      {/* <Welcome fullname="Adolphus Okrah" /> */}
      {/* <ContributionsRepport jarName="Adolphus's Jar" totalRecords={5} /> */}
      <AccountDeletion fullname="Adolphus Okrah" />
    </div>
  )
}
