import { getPayload } from 'payload'
import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import configPromise from '@payload-config'
import { UserCircle } from 'lucide-react'
import { ProfileForm } from '@/components/dashboard/profile-form'

export default async function ProfilePage() {
  const payload = await getPayload({ config: configPromise })
  const requestHeaders = await getHeaders()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) redirect('/login?redirect=/dashboard/profile')

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <UserCircle className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="text-xl font-semibold">My Profile</h1>
          <p className="text-sm text-muted-foreground">Update your name and password</p>
        </div>
      </div>

      <ProfileForm user={{ id: user!.id, firstName: (user as any).firstName, lastName: (user as any).lastName, email: user!.email }} />
    </div>
  )
}
