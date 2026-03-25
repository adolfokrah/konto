import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'

/**
 * POST /api/jars/:id/custom-fields
 *
 * Appends a custom field to a jar's customFields array.
 * Admin-only.
 *
 * Body:
 * {
 *   label: string
 *   fieldType: 'text' | 'number' | 'select' | 'checkbox' | 'phone' | 'email'
 *   required?: boolean
 *   placeholder?: string
 *   options?: { label: string; value: string }[]
 * }
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await getPayload({ config: configPromise })
    const requestHeaders = await getHeaders()
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!user || user.role !== 'admin') {
      return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { label, fieldType, required = false, placeholder, options } = body

    if (!label || !fieldType) {
      return Response.json(
        { success: false, message: 'label and fieldType are required' },
        { status: 400 },
      )
    }

    const validTypes = ['text', 'number', 'select', 'checkbox', 'phone', 'email']
    if (!validTypes.includes(fieldType)) {
      return Response.json(
        { success: false, message: `fieldType must be one of: ${validTypes.join(', ')}` },
        { status: 400 },
      )
    }

    if (fieldType === 'select' && (!Array.isArray(options) || options.length === 0)) {
      return Response.json(
        { success: false, message: 'options array is required for select fields' },
        { status: 400 },
      )
    }

    // Fetch current jar
    const jar = await payload.findByID({
      collection: 'jars',
      id,
      overrideAccess: true,
    })

    const existing: any[] = Array.isArray(jar.customFields) ? jar.customFields : []

    const newField: Record<string, any> = { label, fieldType, required }
    if (placeholder) newField.placeholder = placeholder
    if (fieldType === 'select') newField.options = options

    const updated = await payload.update({
      collection: 'jars',
      id,
      data: { customFields: [...existing, newField] },
      overrideAccess: true,
    })

    return Response.json({
      success: true,
      message: `Custom field "${label}" added to jar`,
      customFields: updated.customFields,
    })
  } catch (error: any) {
    console.error('[custom-fields] error:', error)
    return Response.json(
      { success: false, message: error.message ?? 'Internal error' },
      { status: 500 },
    )
  }
}
