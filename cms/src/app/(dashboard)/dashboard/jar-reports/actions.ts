'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function deleteReport(reportId: string) {
  const payload = await getPayload({ config: configPromise })
  const requestHeaders = await getHeaders()

  const { user } = await payload.auth({ headers: requestHeaders })
  if (!user || user.role !== 'admin') {
    return { success: false, message: 'Unauthorized' }
  }

  try {
    await payload.delete({
      collection: 'jar-reports',
      id: reportId,
      overrideAccess: true,
    })

    revalidatePath('/dashboard/jar-reports')

    return { success: true, message: 'Report dismissed' }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to dismiss report',
    }
  }
}
