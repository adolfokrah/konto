import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Settings } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SystemSettingsForm } from '@/components/dashboard/system-settings-form'

export default async function SettingsPage() {
  const payload = await getPayload({ config: configPromise })

  const settings = await payload.findGlobal({
    slug: 'system-settings',
    overrideAccess: true,
  })

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="text-xl font-semibold">System Settings</h1>
          <p className="text-sm text-muted-foreground">Manage fees, referral bonuses, and payout settings</p>
        </div>
      </div>

      <SystemSettingsForm settings={settings as any} />
    </div>
  )
}
