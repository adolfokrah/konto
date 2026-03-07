import type { PayloadRequest } from 'payload'
import { buildWhere, parseList } from './shared'

export const shareContributions = async (req: PayloadRequest) => {
  try {
    if (!req.user) {
      return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { transactionTypes } = req.query as Record<string, string>

    const { where, error, jar } = await buildWhere(req)
    if (error || !where) {
      return Response.json({ success: false, message: error || 'Jar not found' }, { status: 404 })
    }

    // Add transaction type filter if provided, but always exclude refunds
    const typeList = parseList(transactionTypes)
    if (typeList?.length) {
      const filtered = typeList.filter((t) => t !== 'refund')
      if (filtered.length) {
        where.type = { in: filtered }
      } else {
        where.type = { not_equals: 'refund' }
      }
    } else {
      where.type = { not_equals: 'refund' }
    }

    const contributions = await req.payload.find({
      collection: 'transactions',
      where,
      pagination: false,
      depth: 1,
    })

    const docs: any[] = contributions.docs || []

    if (!docs.length) {
      return Response.json({ success: false, message: 'No contributions found' }, { status: 404 })
    }

    const currency = jar?.currency || 'GHS'
    const jarName = jar?.name || 'Jar'

    const lines: string[] = []
    lines.push(`*${jarName}*`)
    lines.push('--------------------------------')

    let total = 0
    let counter = 0
    for (const c of docs) {
      const type = String(c.type || '').toLowerCase()
      const name = c.contributor || 'Anonymous'
      const isFailed = c.paymentStatus === 'failed'
      const amount = isFailed ? 0 : Number(c.amountContributed || 0)
      const prefix = type === 'payout' ? '-' : '-'

      if (isFailed) {
        lines.push(`${counter + 1}. ~${name} ${prefix} ${currency} ${Math.abs(amount).toFixed(2)}~`)
      } else {
        lines.push(`${counter + 1}. ${name} ${prefix} ${currency} ${Math.abs(amount).toFixed(2)}`)
      }
      total += amount
      counter++
    }

    lines.push('--------------------------------')

    // Only show total when filtered to contribution + completed
    const statusFilterList = parseList((req.query as any).statuses)
    const showTotals =
      statusFilterList?.length === 1 &&
      statusFilterList[0] === 'completed' &&
      typeList?.length === 1 &&
      typeList[0] === 'contribution'

    if (showTotals) {
      const sign = total < 0 ? '-' : ''
      lines.push(`*Total: ${sign}${currency} ${Math.abs(total).toFixed(2)}*`)
    }

    const text = lines.join('\n')

    return Response.json({ success: true, data: { text } })
  } catch (err: any) {
    return Response.json(
      { success: false, message: err?.message || 'Failed to generate share text' },
      { status: 500 },
    )
  }
}
