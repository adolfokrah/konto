import type { PayloadHandler } from 'payload'

import { backfillAccountTypes, backfillJarShortCodes } from '@/utilities/backfills'

const BACKFILLS = {
  shortCodes: backfillJarShortCodes,
  accountTypes: backfillAccountTypes,
} as const

type BackfillName = keyof typeof BACKFILLS

/**
 * POST /api/run-backfills — admin only.
 *
 * Runs the data backfills that come with a release, instead of a script on the server:
 * - shortCodes: short share codes for jars created before short links
 * - accountTypes: individual/organization for users created before account types
 *
 * Body (all optional): { "dryRun": true, "only": ["shortCodes"] }
 * Safe to call again: each backfill only touches records that still need it.
 */
export const runBackfills: PayloadHandler = async (req) => {
  if ((req.user as { role?: string } | null)?.role !== 'admin') {
    return Response.json({ success: false, message: 'Forbidden' }, { status: 403 })
  }

  let body: { dryRun?: boolean; only?: string[] } = {}
  try {
    body = req.json ? await req.json() : {}
  } catch {
    body = {}
  }

  const names = (Object.keys(BACKFILLS) as BackfillName[]).filter(
    (name) => !body.only?.length || body.only.includes(name),
  )
  const unknown = (body.only ?? []).filter((name) => !(name in BACKFILLS))
  if (unknown.length) {
    return Response.json(
      { success: false, message: `Unknown backfill(s): ${unknown.join(', ')}` },
      { status: 400 },
    )
  }

  const results: Record<string, unknown> = {}
  for (const name of names) {
    results[name] = await BACKFILLS[name](req.payload, { dryRun: Boolean(body.dryRun) })
  }

  return Response.json({ success: true, dryRun: Boolean(body.dryRun), results })
}
