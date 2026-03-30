'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getAuthenticatedAdmin() {
  const payload = await getPayload({ config: configPromise })
  const requestHeaders = await getHeaders()
  const { user } = await payload.auth({ headers: requestHeaders })
  if (!user || user.role !== 'admin') {
    return { payload: null, error: 'Unauthorized' }
  }
  return { payload, error: null }
}

export async function searchUsers(query: string) {
  const { payload } = await getAuthenticatedAdmin()
  if (!payload) return []
  if (!query || query.trim().length < 2) return []

  try {
    const result = await payload.find({
      collection: 'users',
      where: {
        or: [
          { firstName: { like: query } },
          { lastName: { like: query } },
          { email: { like: query } },
          { phoneNumber: { like: query } },
        ],
      },
      select: { firstName: true, lastName: true, email: true, phoneNumber: true },
      limit: 20,
      overrideAccess: true,
    })

    return result.docs.map((u: any) => ({
      id: u.id,
      name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
      email: u.email || '',
    }))
  } catch {
    return []
  }
}

export async function createAndSendSmsCampaign(data: {
  message: string
  targetAudience?: 'all' | 'selected' | 'android' | 'ios'
  recipients?: string[]
}) {
  const { payload, error } = await getAuthenticatedAdmin()
  if (!payload) return { success: false, message: error }

  try {
    const campaign = await payload.create({
      collection: 'sms-campaigns',
      data: {
        message: data.message,
        targetAudience: data.targetAudience || 'all',
        recipients: data.targetAudience === 'selected' ? data.recipients : undefined,
        status: 'draft',
      },
      overrideAccess: true,
    })

    await payload.jobs.queue({
      task: 'send-sms-campaign',
      input: { campaignId: campaign.id },
    })

    await payload.jobs.run()

    revalidatePath('/dashboard/sms')

    return { success: true, message: 'SMS campaign is being sent' }
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to create SMS campaign' }
  }
}

export async function deleteSmsCampaign(campaignId: string) {
  const { payload, error } = await getAuthenticatedAdmin()
  if (!payload) return { success: false, message: error }

  try {
    const campaign = await payload.findByID({
      collection: 'sms-campaigns',
      id: campaignId,
      overrideAccess: true,
    })

    if (campaign.status !== 'draft') {
      return { success: false, message: 'Can only delete draft campaigns' }
    }

    await payload.delete({
      collection: 'sms-campaigns',
      id: campaignId,
      overrideAccess: true,
    })

    revalidatePath('/dashboard/sms')

    return { success: true, message: 'Campaign deleted' }
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to delete campaign' }
  }
}
