import type { PayloadRequest } from 'payload'

import { getEganow } from '@/utilities/initalise'

export interface EganowChargesSplitInput {
  amountToSendToEganow: number // what we ask Eganow to collect (after any discount)
  discountAmount: number // GHS Hogapay absorbs (0 if no discount)
  totalCharges: number // Eganow's fee on amountToSendToEganow, from /api/partners/charges
  collectionFeePercent: number // our total fee setting, e.g. 2
  hogapayFeePercent: number // Hogapay's split of it, e.g. 0.8
}

export interface EganowChargesSplit {
  platformCharge: number
  amountPaidByContributor: number
  hogapayRevenue: number
  eganowFees: number
}

/**
 * Splits the fee Eganow quotes for a collection between Hogapay and Eganow, in the
 * proportion of our settings (Hogapay split / total fee). Hogapay absorbs any discount
 * from its share, as in calculateCharges.
 *
 *   hogapayShare   = totalCharges × hogapayFee% / collectionFee%
 *   eganowFees     = totalCharges - hogapayShare
 *   hogapayRevenue = hogapayShare - discountAmount
 */
export function splitEganowCharges(input: EganowChargesSplitInput): EganowChargesSplit {
  const {
    amountToSendToEganow,
    discountAmount,
    totalCharges,
    collectionFeePercent,
    hogapayFeePercent,
  } = input

  const hogapayRatio =
    collectionFeePercent > 0 ? Math.min(hogapayFeePercent / collectionFeePercent, 1) : 0
  const hogapayShare = totalCharges * hogapayRatio

  return {
    platformCharge: round2(totalCharges),
    amountPaidByContributor: round2(amountToSendToEganow + totalCharges),
    hogapayRevenue: round2(hogapayShare - discountAmount),
    eganowFees: round2(totalCharges - hogapayShare),
  }
}

/** Mobile money paypartner code for a Ghana number, from its network prefix. */
export function momoPaypartnerForPhone(msisdn: string): string | null {
  const local = msisdn.replace(/\D/g, '').replace(/^233/, '0')
  const prefix = local.slice(0, 3)
  if (['024', '025', '053', '054', '055', '059'].includes(prefix)) return 'MTNGH'
  if (['020', '050'].includes(prefix)) return 'TCELGH'
  if (['026', '027', '056', '057'].includes(prefix)) return 'ATGH'
  return null
}

/**
 * Asks Eganow for the fee on a contribution before the collection starts, splits it by our
 * settings and saves it on the transaction (updating `contribution` in place).
 *
 * If Eganow's quote is unavailable the settings-based breakdown already on the transaction
 * stays, so the payment can still go ahead.
 */
export async function applyEganowCharges(
  req: PayloadRequest,
  contribution: any,
  {
    paypartnerCode,
    msisdn,
    currency,
  }: { paypartnerCode: string; msisdn: string; currency: string },
): Promise<void> {
  const breakdown = contribution.chargesBreakdown ?? {}
  const amountToSendToEganow = Number(
    breakdown.amountToSendToEganow ?? contribution.amountContributed ?? 0,
  )
  if (!(amountToSendToEganow > 0)) return

  try {
    const quote = await getEganow().getCharges({
      paypartnerCode,
      amount: String(amountToSendToEganow),
      accountNoOrCardNoOrMSISDN: msisdn,
      transCurrencyIso: currency,
      languageId: 'en',
    })
    const totalCharges = Number(quote?.totalCharges)
    if (!quote?.isSuccess || !Number.isFinite(totalCharges) || totalCharges < 0) {
      console.warn(
        '[eganow-charges] no usable quote, keeping settings fees:',
        JSON.stringify(quote),
      )
      return
    }

    const settings = await req.payload.findGlobal({ slug: 'system-settings', overrideAccess: true })
    const isCard = contribution.paymentMethod === 'card'
    const collectionFeePercent = (
      isCard ? (settings.cardCollectionFee ?? 3) : (settings.collectionFee ?? 2)
    ) as number
    const hogapayFeePercent = (
      isCard
        ? (settings.hogapayCardCollectionFeePercent ?? 0.5)
        : (settings.hogapayCollectionFeePercent ?? 0.8)
    ) as number

    const split = splitEganowCharges({
      amountToSendToEganow,
      discountAmount: Number(breakdown.discountAmount ?? 0),
      totalCharges,
      collectionFeePercent,
      hogapayFeePercent,
    })

    const chargesBreakdown = {
      ...breakdown,
      ...split,
      amountToSendToEganow,
      collectionFeePercent,
      feeSource: 'eganow',
    }
    console.log(
      `[eganow-charges] ${contribution.id} totalCharges=${totalCharges}:`,
      JSON.stringify(chargesBreakdown),
    )

    await req.payload.update({
      collection: 'transactions',
      id: contribution.id,
      data: { chargesBreakdown },
      overrideAccess: true,
      context: { skipCharges: true },
    })
    contribution.chargesBreakdown = chargesBreakdown
  } catch (error: any) {
    console.warn('[eganow-charges] quote failed, keeping settings fees:', error?.message)
  }
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}
