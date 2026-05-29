import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'

/**
 * Chango webhook receiver.
 *
 * Webhook body shape (UAT):
 *   {
 *     responseCode: "01",
 *     responseMessage: "Transaction processed successfully",
 *     amount, contributorName, network, charge,
 *     invoiceId,                  // matches our transactionReference
 *     uniwalletTransactionId,     // Chango's internal checkout id
 *     networkTransactionId,       // telco reference
 *     msisdn, narration, groupName, campaignName,
 *   }
 *
 * Match: webhook.invoiceId === transaction.transactionReference
 * Status: responseCode "01" => completed; otherwise failed.
 */
export const changoWebhook = async (req: PayloadRequest) => {
  await addDataAndFileToRequest(req)
  const body = (req.data ?? {}) as Record<string, any>
  console.log('[Chango] webhook body:', JSON.stringify(body, null, 2))

  const invoiceId: string | undefined = body.invoiceId
  if (!invoiceId) {
    return Response.json({ success: true, message: 'No invoiceId in body' })
  }

  const found = await req.payload.find({
    collection: 'transactions',
    where: { transactionReference: { equals: invoiceId } },
    limit: 1,
    overrideAccess: true,
  })

  const tx = found.docs[0]
  if (!tx) {
    console.warn(`[Chango] webhook: no transaction for invoiceId=${invoiceId}`)
    return Response.json({ success: true, message: 'No matching transaction' })
  }

  const paymentStatus: 'completed' | 'failed' = body.responseCode === '01' ? 'completed' : 'failed'

  await req.payload.update({
    collection: 'transactions',
    id: tx.id,
    data: {
      paymentStatus,
      webhookResponse: body,
    } as any,
    context: { skipCharges: true } as any,
    overrideAccess: true,
  })

  return Response.json({ success: true })
}
