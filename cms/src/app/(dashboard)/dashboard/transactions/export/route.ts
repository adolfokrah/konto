import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import ExcelJS from 'exceljs'
import fs from 'fs'
import path from 'path'

const paymentMethodLabels: Record<string, string> = {
  'mobile-money': 'Mobile Money',
  cash: 'Cash',
  bank: 'Bank',
  card: 'Card',
  'apple-pay': 'Apple Pay',
}

function buildWhere(params: URLSearchParams): Record<string, any> {
  const search = params.get('search') || ''
  const status = params.get('status') || ''
  const type = params.get('type') || ''
  const method = params.get('method') || ''
  const link = params.get('link') || ''
  const settled = params.get('settled') || ''
  const ref = params.get('ref') || ''
  const from = params.get('from') || ''
  const to = params.get('to') || ''

  const where: Record<string, any> = {}

  if (search) {
    where.contributor = { like: search }
  }
  if (status) {
    const valid = ['pending', 'completed', 'failed']
    const values = status.split(',').filter((v) => valid.includes(v))
    if (values.length === 1) where.paymentStatus = { equals: values[0] }
    else if (values.length > 1) where.paymentStatus = { in: values }
  }
  if (type) {
    const valid = ['contribution', 'payout']
    const values = type.split(',').filter((v) => valid.includes(v))
    if (values.length === 1) where.type = { equals: values[0] }
    else if (values.length > 1) where.type = { in: values }
  }
  if (method) {
    const valid = ['mobile-money', 'cash', 'bank', 'card', 'apple-pay']
    const values = method.split(',').filter((v) => valid.includes(v))
    if (values.length === 1) where.paymentMethod = { equals: values[0] }
    else if (values.length > 1) where.paymentMethod = { in: values }
  }
  if (link && ['yes', 'no'].includes(link)) {
    where.viaPaymentLink = { equals: link === 'yes' }
  }
  if (settled && ['yes', 'no'].includes(settled)) {
    where.isSettled = { equals: settled === 'yes' }
  }
  if (ref) {
    where.transactionReference = { like: ref }
  }
  if (from) {
    where.createdAt = { ...where.createdAt, greater_than_equal: new Date(from).toISOString() }
  }
  if (to) {
    const toDate = new Date(to)
    toDate.setHours(23, 59, 59, 999)
    where.createdAt = { ...where.createdAt, less_than_equal: toDate.toISOString() }
  }

  return where
}

const fmtAmt = (v: number | null | undefined) =>
  v != null
    ? `GHS ${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '—'

const fmtDate = (d: string) => {
  const date = new Date(d)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ---------- Excel Generation ----------

async function generateExcel(docs: any[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Hoga Platform'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Transactions', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  // Define columns
  sheet.columns = [
    { header: '#', key: 'num', width: 6 },
    { header: 'Ref', key: 'ref', width: 22 },
    { header: 'Contributor', key: 'contributor', width: 20 },
    { header: 'Phone', key: 'phone', width: 16 },
    { header: 'Jar', key: 'jar', width: 20 },
    { header: 'Type', key: 'type', width: 12 },
    { header: 'Method', key: 'method', width: 16 },
    { header: 'Provider', key: 'provider', width: 12 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Contribution', key: 'contribution', width: 16 },
    { header: 'Payout', key: 'payout', width: 16 },
    { header: 'Platform Charge', key: 'platformCharge', width: 16 },
    { header: 'Eganow Fees', key: 'eganowFees', width: 14 },
    { header: 'Hogapay Revenue', key: 'hogapayRevenue', width: 16 },
    { header: 'Settled', key: 'settled', width: 10 },
    { header: 'Via Link', key: 'viaLink', width: 10 },
    { header: 'Date', key: 'date', width: 22 },
  ]

  // Style header row
  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true, size: 10 }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDEDF0' } }
  headerRow.alignment = { vertical: 'middle' }
  headerRow.height = 22

  let totalContributions = 0
  let totalPayouts = 0
  let totalPlatformCharge = 0
  let totalEganowFees = 0
  let totalHogapayRevenue = 0

  docs.forEach((tx, idx) => {
    const jarObj = typeof tx.jar === 'object' && tx.jar ? tx.jar : null
    const amount = Math.abs(Number(tx.amountContributed || 0))
    const isPayout = tx.type === 'payout'
    const cb = tx.chargesBreakdown || {}
    const platformCharge = Math.abs(Number(cb.platformCharge || 0))
    const eganowFees = Math.abs(Number(cb.eganowFees || 0))
    const hogapayRevenue = Math.abs(Number(cb.hogapayRevenue || 0))

    if (isPayout) {
      totalPayouts += amount
    } else {
      totalContributions += amount
    }
    totalPlatformCharge += platformCharge
    totalEganowFees += eganowFees
    totalHogapayRevenue += hogapayRevenue

    const provider = tx.paymentMethod === 'mobile-money' ? tx.mobileMoneyProvider || '' : ''
    const methodLabel = tx.paymentMethod
      ? paymentMethodLabels[tx.paymentMethod] || tx.paymentMethod
      : ''

    const row = sheet.addRow({
      num: idx + 1,
      ref: tx.transactionReference || '',
      contributor: tx.contributor || 'Anonymous',
      phone: tx.contributorPhoneNumber || '',
      jar: jarObj?.name || '',
      type: tx.type || '',
      method: methodLabel,
      provider,
      status: tx.paymentStatus || '',
      contribution: isPayout ? null : amount,
      payout: isPayout ? -amount : null,
      platformCharge: platformCharge || null,
      eganowFees: eganowFees || null,
      hogapayRevenue: hogapayRevenue || null,
      settled: tx.isSettled ? 'Yes' : 'No',
      viaLink: tx.viaPaymentLink ? 'Yes' : 'No',
      date: fmtDate(tx.createdAt),
    })

    // Alternate row shading
    if (idx % 2 === 1) {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBFBFC' } }
      })
    }
  })

  // Format number columns
  const numberCols = ['contribution', 'payout', 'platformCharge', 'eganowFees', 'hogapayRevenue']
  numberCols.forEach((key) => {
    const col = sheet.getColumn(key)
    col.numFmt = '#,##0.00'
  })

  // Totals row
  const totalsRow = sheet.addRow({
    num: '',
    ref: `Totals (${docs.length} records)`,
    contributor: '',
    phone: '',
    jar: '',
    type: '',
    method: '',
    provider: '',
    status: '',
    contribution: totalContributions,
    payout: -totalPayouts,
    platformCharge: totalPlatformCharge,
    eganowFees: totalEganowFees,
    hogapayRevenue: totalHogapayRevenue,
    settled: '',
    viaLink: '',
    date: '',
  })
  totalsRow.font = { bold: true, size: 10 }
  totalsRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5F0E5' } }

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

// ---------- PDF Generation ----------

async function generatePdf(docs: any[]): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create()
  pdfDoc.setTitle('Transactions Report')
  pdfDoc.setAuthor('Hoga')
  pdfDoc.setCreator('Hoga Platform')
  pdfDoc.setCreationDate(new Date())

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const monoFont = await pdfDoc.embedFont(StandardFonts.Courier)

  const pageMargin = 30
  const topSafeArea = 15
  const A4_LANDSCAPE = { width: 841.89, height: 595.28 }

  const colors = {
    border: rgb(0.75, 0.75, 0.75),
    headerFill: rgb(0.93, 0.93, 0.95),
    altFill: rgb(0.985, 0.985, 0.99),
    text: rgb(0, 0, 0),
    muted: rgb(0.4, 0.4, 0.4),
    totalFill: rgb(0.9, 0.95, 0.9),
  }

  const titleSize = 16
  const headerFontSize = 7
  const bodyFontSize = 7
  const metaFontSize = 8
  const rowHeight = 18
  const headerRowHeight = 22

  const headers = [
    '#',
    'Ref',
    'Contributor',
    'Jar',
    'Method',
    'Status',
    'Contribution',
    'Payout',
    'Plat. Charge',
    'Eganow Fees',
    'Hogapay Rev',
    'Date',
  ]
  const usableWidth = A4_LANDSCAPE.width - pageMargin * 2
  const columnPercents = [0.03, 0.11, 0.11, 0.11, 0.08, 0.07, 0.08, 0.08, 0.08, 0.08, 0.08, 0.09]
  const columnWidths = columnPercents.map((p) => Math.floor(p * usableWidth))

  let logoImage: any = null
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.png')
    if (fs.existsSync(logoPath)) {
      const logoBytes = fs.readFileSync(logoPath)
      logoImage = await pdfDoc.embedPng(logoBytes)
    }
  } catch (_) {}

  let page = pdfDoc.addPage([A4_LANDSCAPE.width, A4_LANDSCAPE.height])
  let cursorY = A4_LANDSCAPE.height - pageMargin
  const pageRefs: any[] = [page]

  const applyPageBranding = (withLogo: boolean) => {
    cursorY = A4_LANDSCAPE.height - pageMargin - topSafeArea
    if (withLogo && logoImage) {
      const maxLogoWidth = 70
      const aspect = logoImage.height / logoImage.width
      const logoWidth = maxLogoWidth
      const logoHeight = logoWidth * aspect
      page.drawImage(logoImage, {
        x: pageMargin,
        y: A4_LANDSCAPE.height - pageMargin - logoHeight,
        width: logoWidth,
        height: logoHeight,
      })
      cursorY = A4_LANDSCAPE.height - pageMargin - topSafeArea - logoHeight - 14
    }
  }

  const addNewPage = () => {
    page = pdfDoc.addPage([A4_LANDSCAPE.width, A4_LANDSCAPE.height])
    pageRefs.push(page)
    applyPageBranding(false)
    drawHeader()
    return page
  }

  applyPageBranding(true)

  page.drawText('Transactions Report', {
    x: pageMargin,
    y: cursorY,
    size: titleSize,
    font: boldFont,
    color: colors.text,
  })
  cursorY -= titleSize + 4
  const generatedAt = new Date()
  const generatedDisplay = `Generated: ${generatedAt.toLocaleDateString()} ${generatedAt.toLocaleTimeString()}`
  page.drawText(`${docs.length} transaction${docs.length !== 1 ? 's' : ''} | ${generatedDisplay}`, {
    x: pageMargin,
    y: cursorY,
    size: metaFontSize,
    font,
    color: colors.muted,
  })
  cursorY -= metaFontSize + 12

  const wrapText = (text: string, maxWidth: number, size: number, f = font): string[] => {
    if (!text) return ['']
    const words = text.split(/\s+/)
    const lines: string[] = []
    let current = ''
    for (const w of words) {
      if (!current) {
        current = w
        continue
      }
      const potential = current + ' ' + w
      if (f.widthOfTextAtSize(potential, size) <= maxWidth - 6) {
        current = potential
      } else {
        lines.push(current)
        current = w
      }
    }
    if (current) lines.push(current)
    return lines
  }

  const wrapIdText = (text: string, maxChars: number): string[] => {
    if (!text) return ['']
    const lines: string[] = []
    for (let i = 0; i < text.length; i += maxChars) {
      lines.push(text.slice(i, i + maxChars))
    }
    return lines
  }

  const drawHeader = () => {
    if (cursorY - headerRowHeight < pageMargin + topSafeArea) addNewPage()
    let x = pageMargin
    headers.forEach((h, idx) => {
      const w = columnWidths[idx]
      page.drawRectangle({
        x,
        y: cursorY - headerRowHeight + 2,
        width: w,
        height: headerRowHeight,
        color: colors.headerFill,
        borderColor: colors.border,
        borderWidth: 0.5,
      })
      page.drawText(h, {
        x: x + 3,
        y: cursorY - headerFontSize - 5 + 2,
        size: headerFontSize,
        font: boldFont,
        color: colors.text,
      })
      x += w
    })
    cursorY -= headerRowHeight
  }

  drawHeader()

  let totalContributions = 0
  let totalPayouts = 0
  let totalPlatformCharge = 0
  let totalEganowFees = 0
  let totalHogapayRevenue = 0

  const drawRow = (cells: string[], rowIndex: number) => {
    const cellLines = cells.map((c, idx) => {
      const w = columnWidths[idx]
      if (idx === 1) return wrapIdText(c, 14)
      return wrapText(c, w, bodyFontSize)
    })
    const lineHeight = bodyFontSize + 2
    const contentHeight = Math.max(...cellLines.map((l) => l.length)) * lineHeight
    const thisRowHeight = Math.max(rowHeight, contentHeight + 6)

    if (cursorY - thisRowHeight < pageMargin + topSafeArea) {
      addNewPage()
    }

    let x = pageMargin
    cells.forEach((_, idx) => {
      const w = columnWidths[idx]
      page.drawRectangle({
        x,
        y: cursorY - thisRowHeight + 2,
        width: w,
        height: thisRowHeight,
        color: rowIndex % 2 === 1 ? colors.altFill : undefined,
        borderColor: colors.border,
        borderWidth: 0.5,
      })
      x += w
    })

    x = pageMargin
    cellLines.forEach((lines, idx) => {
      const w = columnWidths[idx]
      const isRef = idx === 1
      const effectiveFont = isRef ? monoFont : font
      const effectiveSize = isRef ? bodyFontSize - 1 : bodyFontSize
      let textY = cursorY - 4 - effectiveSize
      lines.forEach((ln: string) => {
        page.drawText(ln, {
          x: x + 3,
          y: textY,
          size: effectiveSize,
          font: effectiveFont,
          color: colors.text,
        })
        textY -= effectiveSize + 2
      })
      x += w
    })

    cursorY -= thisRowHeight
  }

  docs.forEach((tx, idx) => {
    const jarObj = typeof tx.jar === 'object' && tx.jar ? tx.jar : null
    const amount = Math.abs(Number(tx.amountContributed || 0))
    const isPayout = tx.type === 'payout'
    const cb = tx.chargesBreakdown || {}
    const platformCharge = Math.abs(Number(cb.platformCharge || 0))
    const eganowFees = Math.abs(Number(cb.eganowFees || 0))
    const hogapayRevenue = Math.abs(Number(cb.hogapayRevenue || 0))

    if (isPayout) {
      totalPayouts += amount
    } else {
      totalContributions += amount
    }
    totalPlatformCharge += platformCharge
    totalEganowFees += eganowFees
    totalHogapayRevenue += hogapayRevenue

    const provider = tx.paymentMethod === 'mobile-money' ? tx.mobileMoneyProvider || '' : ''
    const methodLabel = tx.paymentMethod
      ? paymentMethodLabels[tx.paymentMethod] || tx.paymentMethod
      : '—'
    const methodDisplay = provider ? `${methodLabel} (${provider})` : methodLabel

    const row = [
      String(idx + 1),
      tx.transactionReference || '—',
      tx.contributor || tx.contributorPhoneNumber || 'Anonymous',
      jarObj?.name || '—',
      methodDisplay,
      tx.paymentStatus || '—',
      isPayout ? '—' : fmtAmt(amount),
      isPayout ? `-${fmtAmt(amount)}` : '—',
      fmtAmt(platformCharge || null),
      fmtAmt(eganowFees || null),
      fmtAmt(hogapayRevenue || null),
      fmtDate(tx.createdAt),
    ]

    drawRow(row, idx)
  })

  cursorY -= 8
  if (cursorY - rowHeight * 2 < pageMargin + topSafeArea) {
    addNewPage()
    cursorY -= 8
  }

  const drawTotalsRow = () => {
    const thisRowHeight = headerRowHeight
    let x = pageMargin

    const totalWidth = columnWidths.reduce((a, b) => a + b, 0)
    page.drawRectangle({
      x,
      y: cursorY - thisRowHeight + 2,
      width: totalWidth,
      height: thisRowHeight,
      color: colors.totalFill,
      borderColor: colors.border,
      borderWidth: 0.5,
    })

    let bx = pageMargin
    columnWidths.forEach((w) => {
      page.drawRectangle({
        x: bx,
        y: cursorY - thisRowHeight + 2,
        width: w,
        height: thisRowHeight,
        borderColor: colors.border,
        borderWidth: 0.5,
      })
      bx += w
    })

    const labelX = pageMargin + 3
    const textY = cursorY - headerFontSize - 5 + 2
    page.drawText(`Totals (${docs.length} records)`, {
      x: labelX,
      y: textY,
      size: headerFontSize,
      font: boldFont,
      color: colors.text,
    })

    const colX = columnWidths.slice(0, 6).reduce((a, b) => a + b, 0) + pageMargin + 3
    page.drawText(fmtAmt(totalContributions), {
      x: colX,
      y: textY,
      size: headerFontSize,
      font: boldFont,
      color: colors.text,
    })

    const payX = columnWidths.slice(0, 7).reduce((a, b) => a + b, 0) + pageMargin + 3
    page.drawText(`-${fmtAmt(totalPayouts)}`, {
      x: payX,
      y: textY,
      size: headerFontSize,
      font: boldFont,
      color: colors.text,
    })

    const platX = columnWidths.slice(0, 8).reduce((a, b) => a + b, 0) + pageMargin + 3
    page.drawText(fmtAmt(totalPlatformCharge), {
      x: platX,
      y: textY,
      size: headerFontSize,
      font: boldFont,
      color: colors.text,
    })

    const egaX = columnWidths.slice(0, 9).reduce((a, b) => a + b, 0) + pageMargin + 3
    page.drawText(fmtAmt(totalEganowFees), {
      x: egaX,
      y: textY,
      size: headerFontSize,
      font: boldFont,
      color: colors.text,
    })

    const hogaX = columnWidths.slice(0, 10).reduce((a, b) => a + b, 0) + pageMargin + 3
    page.drawText(fmtAmt(totalHogapayRevenue), {
      x: hogaX,
      y: textY,
      size: headerFontSize,
      font: boldFont,
      color: colors.text,
    })

    cursorY -= thisRowHeight
  }

  drawTotalsRow()

  const totalPages = pageRefs.length
  pageRefs.forEach((p, idx) => {
    p.drawText(`Page ${idx + 1} of ${totalPages}`, {
      x: pageMargin,
      y: 14,
      size: 8,
      font,
      color: colors.muted,
    })
  })

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

// ---------- Route Handler ----------

export async function GET(request: Request) {
  try {
    const payload = await getPayload({ config: configPromise })
    const requestHeaders = await getHeaders()
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!user || (user as any).role !== 'admin') {
      return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const where = buildWhere(url.searchParams)
    const format = url.searchParams.get('format') || 'pdf'

    const result = await payload.find({
      collection: 'transactions',
      where,
      pagination: false,
      sort: '-createdAt',
      depth: 1,
      overrideAccess: true,
    })

    const docs: any[] = result.docs || []

    if (!docs.length) {
      return Response.json(
        { success: false, message: 'No transactions found for export' },
        { status: 404 },
      )
    }

    if (format === 'excel') {
      const buffer = await generateExcel(docs)
      const fileName = `transactions_export_${Date.now()}.xlsx`
      return new Response(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      })
    }

    const buffer = await generatePdf(docs)
    const fileName = `transactions_export_${Date.now()}.pdf`
    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (e: any) {
    return Response.json(
      { success: false, message: 'Failed to export transactions', error: e.message },
      { status: 500 },
    )
  }
}
