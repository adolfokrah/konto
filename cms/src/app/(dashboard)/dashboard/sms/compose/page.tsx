import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ComposeSmsForm } from '@/components/dashboard/compose-sms-form'

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ComposeSmsPage({ searchParams }: Props) {
  const params = await searchParams
  const duplicateId = typeof params.duplicate === 'string' ? params.duplicate : null

  let prefill: {
    message: string
    targetAudience?: 'all' | 'selected' | 'android' | 'ios'
    recipients?: { id: string; name: string; email: string }[]
  } | null = null

  if (duplicateId) {
    try {
      const payload = await getPayload({ config: configPromise })
      const campaign = await payload.findByID({
        collection: 'sms-campaigns',
        id: duplicateId,
        depth: 1,
        overrideAccess: true,
      })
      if (campaign) {
        let recipients: { id: string; name: string; email: string }[] | undefined
        if (
          campaign.targetAudience === 'selected' &&
          Array.isArray((campaign as any).recipients) &&
          (campaign as any).recipients.length > 0
        ) {
          recipients = ((campaign as any).recipients as any[]).map((r: any) => {
            const user = typeof r === 'object' ? r : null
            return {
              id: typeof r === 'object' ? r.id : r,
              name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
              email: user?.email || '',
            }
          })
        }
        prefill = {
          message: campaign.message as string,
          targetAudience: campaign.targetAudience as 'all' | 'selected' | 'android' | 'ios',
          recipients,
        }
      }
    } catch {}
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/sms">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>
      <ComposeSmsForm prefill={prefill} />
    </div>
  )
}
