import { PageHeader } from '@/components/dashboard/page-header'
import { getPayload } from 'payload'
import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import configPromise from '@payload-config'
import { ProfileForm } from '@/components/dashboard/profile-form'

export default async function ProfilePage() {
  const payload = await getPayload({ config: configPromise })
  const requestHeaders = await getHeaders()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) redirect('/dashboard/login?redirect=%2Fdashboard%2Fprofile')

  return (
    <div className="max-w-3xl space-y-4">
      <PageHeader title="My profile" subtitle="Update your name and password" />

      <ProfileForm
        user={{
          id: user!.id,
          firstName: (user as any).firstName,
          lastName: (user as any).lastName,
          email: user!.email,
        }}
      />
    </div>
  )
}
