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

export async function createAndSendCampaign(data: {
  title: string
  message: string
  data?: Record<string, string>
}) {
  const { payload, error } = await getAuthenticatedAdmin()
  if (!payload) return { success: false, message: error }

  try {
    const campaign = await payload.create({
      collection: 'push-campaigns',
      data: {
        title: data.title,
        message: data.message,
        data: data.data || undefined,
        targetAudience: 'all',
        status: 'draft',
      },
      overrideAccess: true,
    })

    // Queue the send task
    await payload.jobs.queue({
      task: 'send-push-campaign',
      input: { campaignId: campaign.id },
    })

    // Run queued jobs
    await payload.jobs.run()

    revalidatePath('/dashboard/push-notifications')

    return { success: true, message: 'Campaign is being sent' }
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to create campaign' }
  }
}

export async function createAndScheduleCampaign(data: {
  title: string
  message: string
  scheduledFor: string
  data?: Record<string, string>
}) {
  const { payload, error } = await getAuthenticatedAdmin()
  if (!payload) return { success: false, message: error }

  try {
    await payload.create({
      collection: 'push-campaigns',
      data: {
        title: data.title,
        message: data.message,
        data: data.data || undefined,
        targetAudience: 'all',
        status: 'scheduled',
        scheduledFor: data.scheduledFor,
      },
      overrideAccess: true,
    })

    revalidatePath('/dashboard/push-notifications')

    return { success: true, message: 'Campaign scheduled successfully' }
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to schedule campaign' }
  }
}

export async function deleteCampaign(campaignId: string) {
  const { payload, error } = await getAuthenticatedAdmin()
  if (!payload) return { success: false, message: error }

  try {
    const campaign = await payload.findByID({
      collection: 'push-campaigns',
      id: campaignId,
      overrideAccess: true,
    })

    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      return { success: false, message: 'Can only delete draft or scheduled campaigns' }
    }

    await payload.delete({
      collection: 'push-campaigns',
      id: campaignId,
      overrideAccess: true,
    })

    revalidatePath('/dashboard/push-notifications')

    return { success: true, message: 'Campaign deleted' }
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to delete campaign' }
  }
}
