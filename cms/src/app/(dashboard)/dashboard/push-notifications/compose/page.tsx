import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ComposeCampaignForm } from '@/components/dashboard/compose-campaign-form'

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ComposePage({ searchParams }: Props) {
  const params = await searchParams
  const duplicateId = typeof params.duplicate === 'string' ? params.duplicate : null

  let prefill: {
    title: string
    message: string
    data?: Record<string, string>
    targetAudience?: 'all' | 'selected'
    recipients?: { id: string; name: string; email: string }[]
  } | null = null

  if (duplicateId) {
    try {
      const payload = await getPayload({ config: configPromise })
      const campaign = await payload.findByID({
        collection: 'push-campaigns',
        id: duplicateId,
        depth: 1,
        overrideAccess: true,
      })
      if (campaign) {
        // Resolve recipients to { id, name, email } for the form tags
        let recipients: { id: string; name: string; email: string }[] | undefined
        if (
          campaign.targetAudience === 'selected' &&
          Array.isArray(campaign.recipients) &&
          campaign.recipients.length > 0
        ) {
          recipients = (campaign.recipients as any[]).map((r: any) => {
            const user = typeof r === 'object' ? r : null
            return {
              id: typeof r === 'object' ? r.id : r,
              name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
              email: user?.email || '',
            }
          })
        }

        prefill = {
          title: campaign.title as string,
          message: campaign.message as string,
          data: campaign.data as Record<string, string> | undefined,
          targetAudience: campaign.targetAudience as 'all' | 'selected',
          recipients,
        }
      }
    } catch {}
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/push-notifications"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Push Notifications
      </Link>

      <ComposeCampaignForm prefill={prefill} />
    </div>
  )
}
