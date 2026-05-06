'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function assertAdmin() {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!user || user.role !== 'admin') throw new Error('Unauthorized')
  return payload
}

export async function toggleCashbackPaid(id: string, isPaid: boolean): Promise<void> {
  const payload = await assertAdmin()
  await payload.update({
    collection: 'cashbacks' as any,
    id,
    data: { isPaid },
    overrideAccess: true,
  })
  revalidatePath('/dashboard/cashbacks')
}

export async function bulkUpdateCashbackPaid(ids: string[], isPaid: boolean): Promise<void> {
  const payload = await assertAdmin()
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
