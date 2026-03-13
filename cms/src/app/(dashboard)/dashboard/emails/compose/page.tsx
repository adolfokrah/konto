import { redirect } from 'next/navigation'

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// The compose window is now a floating panel on the emails list page.
// This page redirects there with the appropriate params.
export default async function ComposeRedirectPage({ searchParams }: Props) {
  const params = await searchParams
  const to = typeof params.to === 'string' ? params.to : ''
  const subject = typeof params.subject === 'string' ? params.subject : ''
  const replyToEmailId = typeof params.replyToEmailId === 'string' ? params.replyToEmailId : ''

  const qs = new URLSearchParams({ tab: 'inbox', compose: '1' })
  if (to) qs.set('composeTo', to)
  if (subject) qs.set('composeSubject', subject)
  if (replyToEmailId) qs.set('replyToEmailId', replyToEmailId)

  redirect(`/dashboard/emails?${qs.toString()}`)
}
