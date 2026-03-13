import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Reply, User } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/ui'
import { EmailBodyViewer } from '@/components/dashboard/email-body-viewer'

type Props = {
  params: Promise<{ id: string }>
}

const statusStyles: Record<string, string> = {
  received: 'bg-blue-100 text-blue-800 border-blue-200',
  sent: 'bg-green-100 text-green-800 border-green-200',
  sending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
  draft: 'bg-gray-100 text-gray-600 border-gray-200',
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2 text-sm">
      <span className="w-20 shrink-0 text-muted-foreground">{label}</span>
      <span className="flex-1 text-foreground">{children}</span>
    </div>
  )
}

export default async function EmailDetailPage({ params }: Props) {
  const { id } = await params
  const payload = await getPayload({ config: configPromise })

  let email: any
  try {
    email = await payload.findByID({
      collection: 'emails',
      id,
      depth: 1,
      overrideAccess: true,
    })
  } catch {
    notFound()
  }
  if (!email) notFound()

  // Mark as read if inbound and unread
  if (email.direction === 'inbound' && !email.isRead) {
    try {
      await payload.update({
        collection: 'emails',
        id,
        data: { isRead: true },
        overrideAccess: true,
      })
    } catch {}
  }

  const toAddresses: string[] = (email.to ?? []).map((t: any) => t.email)
  const linkedUser =
    email.linkedUser && typeof email.linkedUser === 'object' ? email.linkedUser : null

  const replySubject = email.subject?.startsWith('Re:') ? email.subject : `Re: ${email.subject}`
  const replyTo = email.direction === 'inbound' ? email.from : toAddresses.join(', ')

  const replyHref = `/dashboard/emails/compose?to=${encodeURIComponent(replyTo)}&subject=${encodeURIComponent(replySubject)}&replyToEmailId=${email.id}`

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/dashboard/emails"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Emails
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main: email content */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-lg font-semibold leading-tight">{email.subject}</h1>
                <Badge
                  variant="outline"
                  className={cn('shrink-0 text-xs capitalize', statusStyles[email.status])}
                >
                  {email.status}
                </Badge>
              </div>
              <div className="divide-y divide-border/50 mt-2">
                <Row label="From">{email.from}</Row>
                <Row label="To">{toAddresses.join(', ')}</Row>
                <Row label="Date">
                  {new Date(email.createdAt).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </Row>
              </div>
            </CardHeader>

            <CardContent>
              <div className="border-t pt-4">
                <EmailBodyViewer html={email.bodyHtml ?? null} text={email.bodyText ?? null} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: actions + metadata */}
        <div className="space-y-4">
          {/* Actions */}
          <Card>
            <CardContent className="pt-4 space-y-2">
              <Link href={replyHref} className="w-full">
                <Button className="w-full" variant="default">
                  <Reply className="mr-2 h-4 w-4" />
                  Reply
                </Button>
              </Link>
              <Link href="/dashboard/emails/compose" className="w-full">
                <Button className="w-full" variant="outline">
                  New Email
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Linked user */}
          {linkedUser && (
            <Card>
              <CardContent className="pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                  Platform User
                </p>
                <Link
                  href={`/dashboard/users/${linkedUser.id}`}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {[linkedUser.firstName, linkedUser.lastName].filter(Boolean).join(' ') || linkedUser.email}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{linkedUser.email}</p>
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardContent className="pt-4 space-y-2 text-xs text-muted-foreground">
              <p className="font-semibold uppercase tracking-widest text-[10px] text-muted-foreground/60 mb-2">
                Metadata
              </p>
              <div className="flex justify-between">
                <span>Direction</span>
                <span className="capitalize font-medium text-foreground">{email.direction}</span>
              </div>
              <div className="flex justify-between">
                <span>Read</span>
                <span className="font-medium text-foreground">{email.isRead ? 'Yes' : 'No'}</span>
              </div>
              {email.resendEmailId && (
                <div className="flex justify-between gap-2">
                  <span>Resend ID</span>
                  <span className="font-mono text-[10px] text-foreground truncate max-w-[120px]">
                    {email.resendEmailId}
                  </span>
                </div>
              )}
              {email.threadId && (
                <div className="flex justify-between gap-2">
                  <span>Thread</span>
                  <span className="font-mono text-[10px] text-foreground truncate max-w-[120px]">
                    {email.threadId}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
