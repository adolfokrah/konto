import type { ChangoContribution } from './chango'
import { getChango } from './initalise'

/** Records fetched per call when totalling a campaign. */
const SUMMARY_PAGE_SIZE = 100
/** Stops a runaway loop on a huge campaign; the total is then a floor. */
const SUMMARY_MAX_PAGES = 50

/** A Chango contribution in the shape our pages already render. */
export interface JarContribution {
  contributor: string
  amountContributed: number
  /** ISO date-time. */
  createdAt: string
}

/** Chango sends `created` in UTC without a zone, e.g. "2026-10-28T11:19:23". */
export function toJarContribution(c: ChangoContribution): JarContribution {
  const created = /[zZ]|[+-]\d\d:?\d\d$/.test(c.created) ? c.created : `${c.created}Z`
  return {
    contributor: c.contributorName || 'Anonymous',
    amountContributed: Number(c.amount) || 0,
    createdAt: new Date(created).toISOString(),
  }
}

/** One page of a campaign's contributions, newest first, as Chango orders them. */
export async function getCampaignContributions(
  campaignId: string,
  { page = 1, limit = 10 }: { page?: number; limit?: number } = {},
) {
  const result = await getChango().listContributions(campaignId, {
    offset: (page - 1) * limit,
    pageSize: limit,
  })
  return {
    docs: result.content.map(toJarContribution),
    totalDocs: result.totalElements,
    totalPages: result.totalPages,
    hasNextPage: !result.last,
    page,
  }
}

/** Every contribution a campaign has received, newest first. */
export async function getAllCampaignContributions(campaignId: string) {
  const contributions: JarContribution[] = []
  let totalDocs = 0

  for (let page = 0; page < SUMMARY_MAX_PAGES; page++) {
    const result = await getChango().listContributions(campaignId, {
      offset: page * SUMMARY_PAGE_SIZE,
      pageSize: SUMMARY_PAGE_SIZE,
    })
    totalDocs = result.totalElements
    contributions.push(...result.content.map(toJarContribution))
    if (result.last || result.content.length === 0) break
  }

  return { contributions, totalDocs }
}

/** Total raised, number of contributions and the most recent ones for a campaign. */
export async function getCampaignSummary(campaignId: string) {
  const { contributions, totalDocs } = await getAllCampaignContributions(campaignId)
  const totalContributedAmount = contributions.reduce((sum, c) => sum + c.amountContributed, 0)

  return {
    totalContributedAmount: Number(totalContributedAmount.toFixed(2)),
    donorCount: totalDocs,
    recent: contributions.slice(0, 10),
  }
}
