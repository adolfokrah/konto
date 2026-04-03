import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import ExcelJS from 'exceljs'
import fs from 'fs'
import path from 'path'

const statusLabels: Record<string, string> = {
  pending: 'Awaiting Approval',
  'in-progress': 'In Progress',
  completed: 'Completed',
  failed: 'Failed',
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

function buildWhere(params: URLSearchParams): Record<string, any> {
  const search = params.get('search') || ''
  const status = params.get('status') || ''
  const from = params.get('from') || ''
  const to = params.get('to') || ''

  const where: Record<string, any> = {}

  if (search) {
    where.accountName = { like: search }
  }
  if (status) {
    const valid = ['pending', 'in-progress', 'completed', 'failed']
    const values = status.split(',').filter((v) => valid.includes(v))
    if (values.length === 1) where.status = { equals: values[0] }
    else if (values.length > 1) where.status = { in: values }
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

// ---------- Excel Generation ----------

async function generateExcel(docs: any[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'HogapayPlatform'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Refunds', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  sheet.columns = [
    { header: '#', key: 'num', width: 6 },
    { header: 'Contributor', key: 'contributor', width: 20 },
    { header: 'Account', key: 'account', width: 16 },
    { header: 'Provider', key: 'provider', width: 14 },
    { header: 'Jar', key: 'jar', width: 20 },
    { header: 'Amount', key: 'amount', width: 16 },
    { header: 'PSP Fees', key: 'eganowFees', width: 14 },
    { header: 'Hogapay Revenue', key: 'hogapayRevenue', width: 16 },
    { header: 'Status', key: 'status', width: 16 },
    { header: 'Initiated By', key: 'initiatedBy', width: 20 },
    { header: 'Updated By', key: 'updatedBy', width: 20 },
    { header: 'Reference', key: 'ref', width: 22 },
    { header: 'Date', key: 'date', width: 22 },
  ]

  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true, size: 10 }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDEDF0' } }
  headerRow.alignment = { vertical: 'middle' }
  headerRow.height = 22

  let totalAmount = 0
  let totalEganowFees = 0
  let totalHogapayRevenue = 0

  docs.forEach((r, idx) => {
    const jarObj = typeof r.jar === 'object' && r.jar ? r.jar : null
    const initiatedByObj = typeof r.initiatedBy === 'object' && r.initiatedBy ? r.initiatedBy : null
    const updatedByObj = typeof r.updatedBy === 'object' && r.updatedBy ? r.updatedBy : null
    const amount = Math.abs(Number(r.amount || 0))
    const eganowFees = Math.abs(Number(r.eganowFees || 0))
    const hogapayRevenue = Math.abs(Number(r.hogapayRevenue || 0))

    totalAmount += amount
    totalEganowFees += eganowFees
    totalHogapayRevenue += hogapayRevenue

    const initiatorName = initiatedByObj
      ? `${initiatedByObj.firstName || ''} ${initiatedByObj.lastName || ''}`.trim() ||
        initiatedByObj.email ||
        ''
      : ''
    const updaterName = updatedByObj
      ? `${updatedByObj.firstName || ''} ${updatedByObj.lastName || ''}`.trim() ||
        updatedByObj.email ||
        ''
      : ''

    const row = sheet.addRow({
      num: idx + 1,
      contributor: r.accountName || '',
      account: r.accountNumber || '',
      provider: r.mobileMoneyProvider || '',
      jar: jarObj?.name || '',
      amount,
      eganowFees: eganowFees || null,
      hogapayRevenue: hogapayRevenue || null,
      status: statusLabels[r.status] || r.status || '',
      initiatedBy: initiatorName,
      updatedBy: updaterName,
      ref: r.transactionReference || '',
      date: fmtDate(r.createdAt),
    })

    if (idx % 2 === 1) {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBFBFC' } }
      })
    }
  })

  const numberCols = ['amount', 'eganowFees', 'hogapayRevenue']
  numberCols.forEach((key) => {
    const col = sheet.getColumn(key)
    col.numFmt = '#,##0.00'
  })

  const totalsRow = sheet.addRow({
    num: '',
    contributor: `Totals (${docs.length} records)`,
    account: '',
    provider: '',
    jar: '',
    amount: totalAmount,
    eganowFees: totalEganowFees,
    hogapayRevenue: totalHogapayRevenue,
    status: '',
    initiatedBy: '',
    updatedBy: '',
    ref: '',
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
  pdfDoc.setTitle('Refunds Report')
  pdfDoc.setAuthor('Hoga')
  pdfDoc.setCreator('HogapayPlatform')
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
    'Contributor',
    'Account',
    'Provider',
    'Jar',
    'Amount',
    'PSP Fees',
    'Hogapay Rev',
    'Status',
    'Initiated By',
    'Updated By',
    'Ref',
    'Date',
  ]
  const usableWidth = A4_LANDSCAPE.width - pageMargin * 2
  const columnPercents = [
    0.03, 0.09, 0.08, 0.06, 0.09, 0.08, 0.07, 0.07, 0.08, 0.08, 0.08, 0.1, 0.09,
  ]
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

  page.drawText('Refunds Report', {
    x: pageMargin,
    y: cursorY,
    size: titleSize,
    font: boldFont,
    color: colors.text,
  })
  cursorY -= titleSize + 4
  const generatedAt = new Date()
  const generatedDisplay = `Generated: ${generatedAt.toLocaleDateString()} ${generatedAt.toLocaleTimeString()}`
  page.drawText(`${docs.length} refund${docs.length !== 1 ? 's' : ''} | ${generatedDisplay}`, {
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

  let totalAmount = 0
  let totalEganowFees = 0
  let totalHogapayRevenue = 0

  const drawRow = (cells: string[], rowIndex: number) => {
    const cellLines = cells.map((c, idx) => {
      const w = columnWidths[idx]
      if (idx === 11) return wrapIdText(c, 14) // Ref column
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
      const isRef = idx === 11
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
      x += columnWidths[idx]
    })

    cursorY -= thisRowHeight
  }

  docs.forEach((r, idx) => {
    const jarObj = typeof r.jar === 'object' && r.jar ? r.jar : null
    const initiatedByObj = typeof r.initiatedBy === 'object' && r.initiatedBy ? r.initiatedBy : null
    const updatedByObj = typeof r.updatedBy === 'object' && r.updatedBy ? r.updatedBy : null
    const amount = Math.abs(Number(r.amount || 0))
    const eganowFees = Math.abs(Number(r.eganowFees || 0))
    const hogapayRevenue = Math.abs(Number(r.hogapayRevenue || 0))

    totalAmount += amount
    totalEganowFees += eganowFees
    totalHogapayRevenue += hogapayRevenue

    const initiatorName = initiatedByObj
      ? `${initiatedByObj.firstName || ''} ${initiatedByObj.lastName || ''}`.trim() ||
        initiatedByObj.email ||
        ''
      : '—'
    const updaterName = updatedByObj
      ? `${updatedByObj.firstName || ''} ${updatedByObj.lastName || ''}`.trim() ||
        updatedByObj.email ||
        ''
      : '—'

    const row = [
      String(idx + 1),
      r.accountName || '—',
      r.accountNumber || '—',
      r.mobileMoneyProvider || '—',
      jarObj?.name || '—',
      fmtAmt(amount),
      fmtAmt(eganowFees || null),
      fmtAmt(hogapayRevenue || null),
      statusLabels[r.status] || r.status || '—',
      initiatorName,
      updaterName,
      r.transactionReference || '—',
      fmtDate(r.createdAt),
    ]

    drawRow(row, idx)
  })

  // Totals row
  cursorY -= 8
  if (cursorY - headerRowHeight < pageMargin + topSafeArea) {
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

    const textY = cursorY - headerFontSize - 5 + 2

    page.drawText(`Totals (${docs.length} records)`, {
      x: pageMargin + 3,
      y: textY,
      size: headerFontSize,
      font: boldFont,
      color: colors.text,
    })

    // Amount column (index 5)
    const amtX = columnWidths.slice(0, 5).reduce((a, b) => a + b, 0) + pageMargin + 3
    page.drawText(fmtAmt(totalAmount), {
      x: amtX,
      y: textY,
      size: headerFontSize,
      font: boldFont,
      color: colors.text,
    })

    // PSP Fees column (index 6)
    const egaX = columnWidths.slice(0, 6).reduce((a, b) => a + b, 0) + pageMargin + 3
    page.drawText(fmtAmt(totalEganowFees), {
      x: egaX,
      y: textY,
      size: headerFontSize,
      font: boldFont,
      color: colors.text,
    })

    // Hogapay Revenue column (index 7)
    const hogaX = columnWidths.slice(0, 7).reduce((a, b) => a + b, 0) + pageMargin + 3
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
      collection: 'refunds' as any,
      where,
      pagination: false,
      sort: '-createdAt',
      depth: 2,
      overrideAccess: true,
    })

    const docs: any[] = result.docs || []

    if (!docs.length) {
      return Response.json(
        { success: false, message: 'No refunds found for export' },
        { status: 404 },
      )
    }

    if (format === 'excel') {
      const buffer = await generateExcel(docs)
      const fileName = `refunds_export_${Date.now()}.xlsx`
      return new Response(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      })
    }

    const buffer = await generatePdf(docs)
    const fileName = `refunds_export_${Date.now()}.pdf`
    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (e: any) {
    return Response.json(
      { success: false, message: 'Failed to export refunds', error: e.message },
      { status: 500 },
    )
  }
}
