import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import ExcelJS from 'exceljs'

const kycStatusLabels: Record<string, string> = {
  none: 'Not Verified',
  in_review: 'In Review',
  verified: 'Verified',
}

function buildWhere(params: URLSearchParams): Record<string, any> {
  const search = params.get('search') || ''
  const kyc = params.get('kyc') || ''
  const role = params.get('role') || ''

  const where: Record<string, any> = {}

  if (search) {
    const parts = search.trim().split(/\s+/)
    if (parts.length >= 2) {
      where.and = [
        { firstName: { like: parts[0] } },
        { lastName: { like: parts.slice(1).join(' ') } },
      ]
    } else {
      where.or = [
        { firstName: { like: search } },
        { lastName: { like: search } },
        { phoneNumber: { like: search } },
      ]
    }
  }
  if (kyc && ['none', 'in_review', 'verified'].includes(kyc)) {
    where.kycStatus = { equals: kyc }
  }
  if (role && ['user', 'admin'].includes(role)) {
    where.role = { equals: role }
  }

  return where
}

const fmtDate = (d: string) => {
  const date = new Date(d)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

async function generateExcel(docs: any[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'HogapayPlatform'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Users', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  sheet.columns = [
    { header: '#', key: 'num', width: 6 },
    { header: 'First Name', key: 'firstName', width: 18 },
    { header: 'Last Name', key: 'lastName', width: 18 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Phone', key: 'phone', width: 18 },
    { header: 'Country', key: 'country', width: 14 },
    { header: 'KYC Status', key: 'kycStatus', width: 14 },
    { header: 'Role', key: 'role', width: 10 },
    { header: 'Bank', key: 'bank', width: 18 },
    { header: 'Account Number', key: 'accountNumber', width: 18 },
    { header: 'Account Holder', key: 'accountHolder', width: 20 },
    { header: 'Joined', key: 'joined', width: 16 },
  ]

  // Style header row
  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true, size: 10 }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDEDF0' } }
  headerRow.alignment = { vertical: 'middle' }
  headerRow.height = 22

  docs.forEach((u, idx) => {
    const phone = u.countryCode ? `${u.countryCode} ${u.phoneNumber || ''}` : u.phoneNumber || ''

    const row = sheet.addRow({
      num: idx + 1,
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      email: u.email || '',
      phone,
      country: u.country || '',
      kycStatus: kycStatusLabels[u.kycStatus] || u.kycStatus || '',
      role: u.role || 'user',
      bank: u.bank || '',
      accountNumber: u.accountNumber || '',
      accountHolder: u.accountHolder || '',
      joined: fmtDate(u.createdAt),
    })

    // Alternate row shading
    if (idx % 2 === 1) {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBFBFC' } }
      })
    }
  })

  // Summary row
  const summaryRow = sheet.addRow({
    num: '',
    firstName: `Total: ${docs.length} users`,
  })
  summaryRow.font = { bold: true, size: 10 }
  summaryRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5F0E5' } }

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

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

    const result = await payload.find({
      collection: 'users',
      where,
      pagination: false,
      sort: '-createdAt',
      depth: 0,
      overrideAccess: true,
    })

    const docs: any[] = result.docs || []

    if (!docs.length) {
      return Response.json(
        { success: false, message: 'No users found for export' },
        { status: 404 },
      )
    }

    const buffer = await generateExcel(docs)
    const fileName = `users_export_${Date.now()}.xlsx`
    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (e: any) {
    return Response.json(
      { success: false, message: 'Failed to export users', error: e.message },
      { status: 500 },
    )
  }
}
