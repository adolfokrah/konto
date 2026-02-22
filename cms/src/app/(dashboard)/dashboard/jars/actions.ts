'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function toggleJarFreeze(jarId: string, freeze: boolean, freezeReason?: string) {
  const payload = await getPayload({ config: configPromise })
  const requestHeaders = await getHeaders()

  const { user } = await payload.auth({ headers: requestHeaders })
  if (!user || user.role !== 'admin') {
    return { success: false, message: 'Unauthorized' }
  }

  try {
    await payload.update({
      collection: 'jars',
      id: jarId,
      data: {
        status: freeze ? 'frozen' : 'open',
        freezeReason: freeze ? freezeReason || null : null,
      },
      overrideAccess: true,
    })

    revalidatePath('/dashboard/jars')
    revalidatePath(`/dashboard/jars/${jarId}`)

    return {
      success: true,
      message: freeze ? 'Jar frozen successfully' : 'Jar unfrozen successfully',
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to update jar',
    }
  }
}
