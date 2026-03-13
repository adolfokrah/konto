import type { BasePayload } from 'payload'

function normalizeSubject(subject: string): string {
  return subject
    .replace(/^(re|fwd|fw|回复|转发)[\s:：]+/gi, '')
    .trim()
    .toLowerCase()
}

function extractEmail(addr: string): string {
  const m = addr.match(/<(.+)>$/)
  return (m ? m[1] : addr).toLowerCase().trim()
}

export async function runRethread(payload: BasePayload): Promise<number> {
  const rawFrom = process.env.RESEND_FROM_EMAIL || 'support@hogapay.com'
  const SUPPORT_ADDRESS = (
    rawFrom.match(/<([^>]+)>$/) ? rawFrom.match(/<([^>]+)>$/)![1] : rawFrom
  ).toLowerCase()

  const all = await payload.find({
    collection: 'emails',
    limit: 2000,
    sort: 'createdAt',
    overrideAccess: true,
  })

  const docs = all.docs as any[]
  const subjectGroups = new Map<string, any[]>()

  for (const doc of docs) {
    const key = normalizeSubject(doc.subject ?? '')
    if (!key) continue
    const group = subjectGroups.get(key) ?? []
    group.push(doc)
    subjectGroups.set(key, group)
  }

  let updated = 0

  for (const [, group] of subjectGroups) {
    if (group.length < 2) continue

    const clusters: any[][] = []

    // Exclude the platform's own support address from clustering comparison so that two
    // separate outbound emails to different recipients aren't merged just because they
    // share the same "from" address.
    const clusterAddrs = (doc: any) =>
      new Set(
        [
          extractEmail(doc.from ?? ''),
          ...((doc.to ?? []) as any[]).map((t: any) => extractEmail(t.email ?? '')),
        ].filter((addr) => addr !== SUPPORT_ADDRESS),
      )

    for (const doc of group) {
      const docAddresses = clusterAddrs(doc)

      const match = clusters.find((cluster) => {
        const clusterAddresses = new Set(cluster.flatMap((d: any) => [...clusterAddrs(d)]))
        return [...docAddresses].some((addr) => clusterAddresses.has(addr))
      })

      if (match) {
        match.push(doc)
      } else {
        clusters.push([doc])
      }
    }

    for (const cluster of clusters) {
      if (cluster.length < 2) continue
      const rootId = cluster[0].id as string

      for (const doc of cluster) {
        if (doc.id === rootId && !doc.threadId) continue
        if (doc.threadId === rootId) continue

        await payload.update({
          collection: 'emails',
          id: doc.id,
          data: { threadId: rootId } as any,
          overrideAccess: true,
        })
        updated++
      }
    }
  }

  return updated
}
