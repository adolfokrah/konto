import { PageHeader } from '@/components/dashboard/page-header'
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
    <div className="space-y-4">
      <PageHeader
        title="System settings"
        subtitle="Fees and limits apply to new transactions immediately"
      />

      <SystemSettingsForm settings={settings as any} />

      <div className="space-y-3 rounded-2xl bg-card p-4">
        <div>
          <h2 className="font-chillax text-[15px] font-semibold">Database backup</h2>
          <p className="text-[11.5px] text-muted-foreground">
            Download a full backup of the database as a compressed archive.
          </p>
        </div>
        <DbBackupButton />
      </div>
    </div>
  )
}
