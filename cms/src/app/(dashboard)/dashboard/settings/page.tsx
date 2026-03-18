import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { SystemSettingsForm } from '@/components/dashboard/system-settings-form'
import { DbBackupButton } from '@/components/dashboard/db-backup-button'

export default async function SettingsPage() {
  const payload = await getPayload({ config: configPromise })

  const settings = await payload.findGlobal({
    slug: 'system-settings',
    overrideAccess: true,
  })

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage fees, referral bonuses, and payout settings</p>
      </div>

      <SystemSettingsForm settings={settings as any} />

      <div className="border rounded-lg p-6 space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Database Backup</h2>
          <p className="text-sm text-muted-foreground">Download a full backup of the database as a compressed archive.</p>
        </div>
        <DbBackupButton />
      </div>
    </div>
  )
}
