'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { revalidatePath } from 'next/cache'

export async function toggleCashbackPaid(id: string, isPaid: boolean): Promise<void> {
  const payload = await getPayload({ config: configPromise })
  await payload.update({
    collection: 'cashbacks' as any,
    id,
    data: { isPaid },
    overrideAccess: true,
  })
  revalidatePath('/dashboard/cashbacks')
}

export async function bulkUpdateCashbackPaid(ids: string[], isPaid: boolean): Promise<void> {
  const payload = await getPayload({ config: configPromise })
  await Promise.all(
    ids.map((id) =>
      payload.update({
        collection: 'cashbacks' as any,
        id,
        data: { isPaid },
        overrideAccess: true,
      }),
    ),
  )
  revalidatePath('/dashboard/cashbacks')
}
