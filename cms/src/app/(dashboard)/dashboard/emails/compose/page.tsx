import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ComposeEmailForm } from '@/components/dashboard/compose-email-form'

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ComposeEmailPage({ searchParams }: Props) {
  const params = await searchParams
  const to = typeof params.to === 'string' ? params.to : ''
  const subject = typeof params.subject === 'string' ? params.subject : ''
  const replyToEmailId = typeof params.replyToEmailId === 'string' ? params.replyToEmailId : ''

  return (
    <div className="space-y-6 max-w-2xl">
      <Link
        href="/dashboard/emails"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Emails
      </Link>

      <ComposeEmailForm
        prefill={
          to || subject || replyToEmailId
            ? { to, subject, replyToEmailId: replyToEmailId || undefined }
            : null
        }
      />
    </div>
  )
}
