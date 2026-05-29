import type { CollectionAfterChangeHook, PayloadRequest } from 'payload'
import { getChango } from '@/utilities/initalise'
import type {
  ChangoCampaignStatus,
  ChangoCampaignType,
  ChangoUpdateCampaignRequest,
} from '@/utilities/chango'

const JAR_STATUS_TO_CAMPAIGN_STATUS: Record<string, ChangoCampaignStatus> = {
  open: 'running',
  frozen: 'paused',
  broken: 'ended',
  sealed: 'ended',
}

const JAR_STATUS_TO_ACCOUNT_STATUS: Record<string, 'active' | 'inactive'> = {
  open: 'active',
  frozen: 'inactive',
  broken: 'inactive',
  sealed: 'inactive',
}

function campaignTypeFor(jar: any): ChangoCampaignType {
  return jar?.deadline ? 'temporary' : 'perpetual'
}

function endFor(jar: any): string | undefined {
  if (!jar?.deadline) return undefined
  const d = new Date(jar.deadline)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString()
}

export const syncChangoCampaign: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
  context,
}) => {
  if ((context as any)?.skipChangoSync) return doc
  if (operation !== 'create' && operation !== 'update') return doc

  const chango = getChango()
  const jarId = (doc as any)?.id
  const jarName = (doc as any)?.name ?? 'Konto Jar'
  const jarDescription = (doc as any)?.description ?? jarName
  const jarStatus = (doc as any)?.status ?? 'open'
  const goalAmount = (doc as any)?.goalAmount

  try {
    if (operation === 'create' || !(doc as any)?.changoCampaignId) {
      const res: any = await chango.createCampaign({
        campaign_name: jarName,
        campaign_type: campaignTypeFor(doc),
        description: jarDescription,
        end: endFor(doc),
      })

      const newCampaignId: string | undefined =
        res?.data?.campaign?.campaignId ??
        res?.data?.campaign?.id ??
        res?.data?.campaignId ??
        res?.data?.id

      if (newCampaignId) {
        await req.payload.update({
          collection: 'jars',
          id: jarId,
          data: { changoCampaignId: newCampaignId } as any,
          context: { skipChangoSync: true } as any,
          overrideAccess: true,
        })
      } else {
        req.payload.logger.warn(
          `syncChangoCampaign: created campaign for jar ${jarId} but response had no id. Raw response: ${JSON.stringify(res)}`,
        )
      }
      return doc
    }

    const campaignId = (doc as any).changoCampaignId
    const prev = (previousDoc ?? {}) as any
    const changed =
      prev.name !== jarName ||
      prev.description !== (doc as any)?.description ||
      prev.status !== jarStatus ||
      prev.deadline !== (doc as any)?.deadline ||
      prev.goalAmount !== goalAmount

    if (!changed) return doc

    const updateBody: ChangoUpdateCampaignRequest = {
      campaign_name: jarName,
      description: jarDescription,
      campaign_status: JAR_STATUS_TO_CAMPAIGN_STATUS[jarStatus] ?? 'running',
      account_status: JAR_STATUS_TO_ACCOUNT_STATUS[jarStatus] ?? 'active',
      campaign_type: campaignTypeFor(doc),
      end: endFor(doc),
    }

    await chango.updateCampaign(campaignId, updateBody)
  } catch (e) {
    ;(req as PayloadRequest).payload.logger.error(
      `syncChangoCampaign hook error for jar ${jarId}: ${(e as Error).message}`,
    )
  }

  return doc
}
