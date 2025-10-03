import type { PayloadRequest } from 'payload'
import { resend } from '@/utilities/initalise'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import fs from 'fs'
import path from 'path'
import { fcmNotifications } from '@/utilities/fcmPushNotifications'

// Helper to parse list-type query params that may be comma-separated
const parseList = (value: any): string[] | undefined => {
  if (!value) return undefined
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
  }
  return undefined
}

// Build Payload `where` clause based on filters and user access (creator vs collector)
const buildWhere = async (req: PayloadRequest) => {
  const {
    jarId,
    paymentMethods,
    statuses,
    collectors,
    startDate,
    endDate,
    contributor,
    hasAnyFilters,
  } = req.query as Record<string, string>

  let jar: any = null
  if (jarId) {
    try {
      jar = await req.payload.findByID({ collection: 'jars', id: jarId, depth: 0 })
    } catch (_) {
      /* ignore */
    }
  }

  if (!jar) {
    return { error: 'Jar not found', where: null }
  }

  const isJarCreator = jar?.creator === req.user?.id || jar?.creator?.id === req.user?.id

  const where: any = {
    jar: { equals: jar.id },
  }

  // Restrict non-creators to their own collected contributions
  if (!isJarCreator) {
    where.collector = { equals: req.user!.id }
  }

  if (contributor) {
    // Loose match on contributor or phone number
    where.or = [
      { contributor: { like: contributor } },
      { contributorPhoneNumber: { like: contributor } },
    ]
  }

  const paymentList = parseList(paymentMethods)
  if (paymentList?.length) {
    where.paymentMethod = { in: paymentList }
  }

  const statusList = parseList(statuses)
  if (statusList?.length) {
    where.paymentStatus = { in: statusList }
  }

  // Collector filtering:
  // - If user is NOT the jar creator, force collector = current user (ignore any supplied collectors filter for security)
  // - If user IS the jar creator, allow optional collectors filter list
  const collectorList = parseList(collectors)
  if (isJarCreator) {
    if (collectorList?.length) {
      where.collector = { in: collectorList }
    }
  } else {
    // Already constrained earlier to the requesting user's ID; ignore incoming collectorList
    // Ensure it remains enforced (in case future refactors move code)
    where.collector = { equals: req.user!.id }
  }

  if (startDate) {
    const sd = new Date(startDate as string)
    if (!isNaN(sd.getTime())) {
      where.createdAt = where.createdAt || {}
      where.createdAt.greater_than_equal = sd.toISOString()
    }
  }
  if (endDate) {
    const ed = new Date(endDate as string)
    if (!isNaN(ed.getTime())) {
      where.createdAt = where.createdAt || {}
      where.createdAt.less_than_equal = ed.toISOString()
    }
  }

  return { where }
}

export const exportContributions = async (req: PayloadRequest) => {
  try {
    if (!req.user) {
      return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { email } = req.query as Record<string, string>
    const targetEmail = email || req.user.email

    if (!targetEmail) {
      return Response.json({ success: false, message: 'No target email provided' }, { status: 400 })
    }

    const { where, error } = await buildWhere(req)
    if (error) {
      return Response.json({ success: false, message: error }, { status: 404 })
    }

    // Fetch all matching contributions (pagination: false)
    const contributions = await req.payload.find({
      collection: 'contributions',
      where,
      pagination: false,
      depth: 1,
    })

    const docs: any[] = contributions.docs || []

    if (!docs.length) {
      return Response.json(
        { success: false, message: 'No contributions found for export' },
        { status: 404 },
      )
    }

    // Gather jar details if possible
    let currency = 'GHS'
    let jarName: string | undefined
    try {
      const jarId = where.jar?.equals || (where.jar && where.jar.in?.[0])
      if (jarId) {
        const jar = await req.payload.findByID({ collection: 'jars', id: jarId, depth: 0 })
        currency = jar?.currency || currency
        jarName = jar?.name
      }
    } catch (_) {}

    // Generate PDF with improved table styling (outlined cells & spacing)
    const pdfDoc = await PDFDocument.create()

    // Set PDF metadata for better viewer compatibility
    pdfDoc.setTitle('Contributions Report')
    pdfDoc.setAuthor('Hoga')
    pdfDoc.setSubject('Contributions Export')
    pdfDoc.setCreator('Hoga Platform')
    pdfDoc.setProducer('Hoga PDF Generator')
    pdfDoc.setCreationDate(new Date())
    pdfDoc.setModificationDate(new Date())

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const pageMargin = 40 // Reduced from 50 to 40
    const topSafeArea = 20 // Reduced from 40 to 20 for viewer app bars
    // Use A4 landscape dimensions for more horizontal space
    const A4_PORTRAIT = { width: 595.28, height: 841.89 }
    let page = pdfDoc.addPage([A4_PORTRAIT.height, A4_PORTRAIT.width]) // landscape (width > height)
    let { width: pageWidth, height: pageHeight } = page.getSize()
    const monoFont = await pdfDoc.embedFont(StandardFonts.Courier)
    const usableWidth = pageWidth - pageMargin * 2
    // Columns (reordered): ID, Contributor, Collector, Payment, Status, Type, Amount, Date
    // Amount moved to be immediately before Date per request; Date widened for full visibility.
    // Fixed widths: generous ID column (15%) to prevent overflow
    const columnPercents = [0.15, 0.14, 0.14, 0.11, 0.1, 0.09, 0.11, 0.16] // sums to 1.00
    const columnWidths = columnPercents.map((p) => Math.floor(p * usableWidth))
    const headers = [
      'ID',
      'Contributor',
      'Collector',
      'Payment',
      'Status',
      'Type',
      'Amount',
      'Date',
    ]

    const titleSize = 18
    const headerFontSize = 10
    const bodyFontSize = 9
    const idFontSize = bodyFontSize - 1
    const metaFontSize = 9
    const rowHeight = 20
    const headerRowHeight = 24
    let cursorY = pageHeight - pageMargin

    const colors = {
      border: rgb(0.75, 0.75, 0.75),
      headerFill: rgb(0.93, 0.93, 0.95),
      altFill: rgb(0.985, 0.985, 0.99),
      text: rgb(0, 0, 0),
      bold: rgb(0, 0, 0),
      total: rgb(0.15, 0.15, 0.15),
    }

    // Attempt to embed Hoga logo (PNG) for letterhead footer
    let logoImage: any = null
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logo.png')
      if (fs.existsSync(logoPath)) {
        const logoBytes = fs.readFileSync(logoPath)
        logoImage = await pdfDoc.embedPng(logoBytes)
      }
    } catch (_) {}

    const applyPageBranding = (withLogo: boolean) => {
      cursorY = pageHeight - pageMargin - topSafeArea // Add safe area for viewer UI
      if (withLogo && logoImage) {
        const maxLogoWidth = 90
        const aspect = logoImage.height / logoImage.width
        const logoWidth = maxLogoWidth
        const logoHeight = logoWidth * aspect
        page.drawImage(logoImage, {
          x: pageMargin,
          y: pageHeight - pageMargin - logoHeight,
          width: logoWidth,
          height: logoHeight,
        })
        // Reduced spacing beneath logo for more compact layout
        cursorY = pageHeight - pageMargin - topSafeArea - logoHeight - 18
      }
    }

    const pageRefs: any[] = []
    const addNewPage = () => {
      page = pdfDoc.addPage([A4_PORTRAIT.height, A4_PORTRAIT.width]) // maintain landscape orientation
      pageRefs.push(page)
      ;({ width: pageWidth, height: pageHeight } = page.getSize())
      // subsequent pages: no logo
      applyPageBranding(false)
      return page
    }

    // Apply branding to first page WITH logo and register page
    pageRefs.push(page)
    applyPageBranding(true)

    const drawText = (text: string, x: number, y: number, size = bodyFontSize) => {
      page.drawText(text, { x, y, size, font, color: colors.text })
    }

    // Title Section (after logo & margin have adjusted cursorY)
    drawText('Contributions Report', pageMargin, cursorY, titleSize)
    cursorY -= titleSize + 4
    if (jarName) {
      drawText(`Jar: ${jarName}`, pageMargin, cursorY, metaFontSize)
      cursorY -= metaFontSize + 2
    }
    // Add note about multi-page document
    drawText(
      '(Multi-page document - scroll or swipe to view all pages)',
      pageMargin,
      cursorY,
      metaFontSize - 1,
    )
    cursorY -= metaFontSize
    const generatedAt = new Date()
    const generatedDisplay = `${generatedAt.toLocaleDateString()} ${generatedAt.toLocaleTimeString()}`
    drawText(`Generated: ${generatedDisplay}`, pageMargin, cursorY, metaFontSize)
    cursorY -= metaFontSize + 10

    // Table Header
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
        const textX = x + 4
        const textY = cursorY - headerFontSize - 4 + 2
        page.drawText(h, {
          x: textX,
          y: textY,
          size: headerFontSize,
          font: idx === 0 ? monoFont : font,
          color: colors.bold,
        })
        x += w
      })
      cursorY -= headerRowHeight
    }

    let headerDrawn = false
    drawHeader()
    headerDrawn = true

    let total = 0
    // Determine if we should display totals: only when user explicitly filtered status to exactly 'completed'
    const statusFilterList = parseList((req.query as any).statuses)
    const showTotals = statusFilterList?.length === 1 && statusFilterList[0] === 'completed'
    // Simple text wrapping utility
    const wrapText = (text: string, maxWidth: number, size: number): string[] => {
      if (!text) return ['']
      const words = text.split(/\s+/)
      const lines: string[] = []
      let current = ''
      const spaceWidth = font.widthOfTextAtSize(' ', size)
      for (const w of words) {
        const wordWidth = font.widthOfTextAtSize(w, size)
        if (!current) {
          if (wordWidth <= maxWidth) {
            current = w
          } else {
            // Split long word
            let tmp = ''
            for (const ch of w) {
              if (font.widthOfTextAtSize(tmp + ch, size) > maxWidth && tmp) {
                lines.push(tmp)
                tmp = ch
              } else {
                tmp += ch
              }
            }
            if (tmp) current = tmp
          }
          continue
        }
        const potential = current + ' ' + w
        const potentialWidth = font.widthOfTextAtSize(potential, size)
        if (potentialWidth + spaceWidth <= maxWidth) {
          current = potential
        } else if (wordWidth <= maxWidth) {
          lines.push(current)
          current = w
        } else {
          // push current and split long word
          lines.push(current)
          let tmp = ''
          for (const ch of w) {
            if (font.widthOfTextAtSize(tmp + ch, size) > maxWidth && tmp) {
              lines.push(tmp)
              tmp = ch
            } else {
              tmp += ch
            }
          }
          current = tmp
        }
      }
      if (current) lines.push(current)
      return lines
    }

    // Simple character-based line breaking for IDs
    const wrapIdText = (text: string, maxChars: number): string[] => {
      if (!text) return ['']
      const lines: string[] = []
      for (let i = 0; i < text.length; i += maxChars) {
        lines.push(text.slice(i, i + maxChars))
      }
      return lines
    }
    // ID formatting: constrain to a single line with middle ellipsis if too long
    // Removed single-line truncation: ID will wrap like other columns now

    const drawRow = (cells: string[], rowIndex: number) => {
      // Determine wrapped lines for each cell
      const cellLines = cells.map((c, idx) => {
        const w = columnWidths[idx]
        if (idx === 0) {
          // ID column: simple character-based wrapping (approx 16 chars per line for mono font)
          return wrapIdText(c, 16)
        }
        return wrapText(c, w - 8, bodyFontSize)
      })
      const lineHeight = bodyFontSize + 2
      const contentHeight = Math.max(...cellLines.map((l) => l.length)) * lineHeight
      const thisRowHeight = Math.max(rowHeight, contentHeight + 6) // baseline min + padding
      if (cursorY - thisRowHeight < pageMargin + topSafeArea) {
        addNewPage()
        // Do NOT draw header on subsequent pages per updated requirement
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
      // Draw text lines
      x = pageMargin
      cellLines.forEach((lines, idx) => {
        const w = columnWidths[idx]
        const effectiveFontSize = idx === 0 ? idFontSize : bodyFontSize
        let textY = cursorY - 4 - effectiveFontSize // start near top with padding
        lines.forEach((ln: string) => {
          page.drawText(ln, {
            x: x + 4,
            y: textY,
            size: effectiveFontSize,
            font: idx === 0 ? monoFont : font,
            color: colors.text,
          })
          textY -= effectiveFontSize + 2
        })
        x += w
      })
      cursorY -= thisRowHeight
    }

    docs.forEach((c, idx) => {
      // Use full ID (no truncation) as requested
      const idShort = String(c.id)
      const contributor = String(c.contributor || c.contributorPhoneNumber || 'Anonymous')
      let collectorName = ''
      if (c.collector && typeof c.collector === 'object') {
        collectorName = c.collector.fullName || c.collector.name || c.collector.email || ''
      }
      const amountNum = Number(c.amountContributed || 0)
      const amount = `${currency} ${amountNum.toFixed(2)}`
      const payment = String(c.paymentMethod || '-')
      const statusVal = String(c.paymentStatus || '-')
      const type = String(c.type || '-')
      const dateStr = new Date(c.createdAt).toLocaleString()
      if (showTotals && type.toLowerCase() !== 'transfer' && statusVal === 'completed') {
        total += amountNum
      }
      // New order matches headers: ID, Contributor, Collector, Payment, Status, Type, Amount, Date
      const row = [idShort, contributor, collectorName, payment, statusVal, type, amount, dateStr]
      drawRow(row, idx)
    })

    if (showTotals) {
      // Totals footer
      if (cursorY - rowHeight * 3 < pageMargin + topSafeArea) {
        addNewPage()
      }
      // Add extra breathing space before totals block (increase margin)
      cursorY -= 24
      page.drawText(`Total Records: ${docs.length}`, {
        x: pageMargin,
        y: cursorY,
        size: 10,
        font,
        color: colors.total,
      })
      cursorY -= 16
      page.drawText(
        `Total Amount (Completed, excluding transfers): ${currency} ${total.toFixed(2)}`,
        { x: pageMargin, y: cursorY, size: 12, font, color: colors.total },
      )
    }

    // (Logo already placed at top-left per page during page creation)
    // Add page numbers (footer) after content creation
    const totalPages = pageRefs.length
    pageRefs.forEach((p, idx) => {
      const footerText = `Page ${idx + 1} of ${totalPages}`
      p.drawText(footerText, {
        x: pageMargin,
        y: 18,
        size: 9,
        font,
        color: colors.text,
      })
    })
    const pdfBytes = await pdfDoc.save()
    const pdfBuffer = Buffer.from(pdfBytes)

    // Email PDF via Resend
    const fileName = `contributions_${Date.now()}.pdf`
    await resend.emails.send({
      from: 'Hoga <reports@usehoga.com>',
      to: [targetEmail],
      subject: `Your Contributions Report for ${jarName || 'the jar'}`,
      html: `<p>Attached is your requested contributions report for <strong>${jarName || 'your jar'}</strong>. Total records: ${docs.length}.</p>
             <p><strong>Note:</strong> This is a multi-page PDF document. If you can't scroll in your email viewer, please download the PDF and open it in a dedicated PDF reader (like Adobe Reader, Preview, or your browser) for full navigation.</p>`,
      attachments: [
        {
          filename: fileName,
          content: pdfBuffer.toString('base64'),
        },
      ],
    })

    // Attempt push notification to the requesting user (if token available)
    try {
      // Ensure we have fresh user data (depth 0)
      let user: any = req.user
      if (user && typeof user === 'object' && !user.fcmToken) {
        try {
          user = await req.payload.findByID({ collection: 'users', id: user.id, depth: 0 })
        } catch (_) {}
      }
      const token = user?.fcmToken
      if (token) {
        await fcmNotifications.sendNotification(
          [token],
          `Your PDF export for ${jarName || 'the jar'} (${docs.length} records) has been emailed.`,
          'Contributions Export Ready',
          { type: 'export', jarName: jarName || 'jar', count: String(docs.length) },
        )
      }
    } catch (pushErr: any) {
      // Swallow push errors to not affect main response
      const msg =
        pushErr && typeof pushErr === 'object' && 'message' in pushErr
          ? (pushErr as any).message
          : String(pushErr)
      req.payload.logger.error?.(`Export push notification failed: ${msg}`)
    }

    return Response.json({
      success: true,
      message: 'Export initiated, PDF emailed successfully',
      meta: { count: docs.length, totalAmount: total },
    })
  } catch (e: any) {
    return Response.json(
      { success: false, message: 'Failed to export contributions', error: e.message },
      { status: 500 },
    )
  }
}
