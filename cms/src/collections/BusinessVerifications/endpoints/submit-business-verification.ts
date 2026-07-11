import { addDataAndFileToRequest, PayloadRequest } from 'payload'
import { getResend } from '@/utilities/initalise'

/**
 * Submit (or resubmit) a business verification for the authenticated user.
 * Expects document IDs already uploaded to the `business-documents` collection.
 *
 * Body:
 *   businessName: string
 *   companyRegistrationDoc: string (business-documents id)
 *   proofOfBusinessAddress: string (business-documents id)
 *   directors: Array<{ fullName: string, idDocument: string, idDocumentBack?: string }>
 */
export const submitBusinessVerification = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)

    if (!req.user) {
      return Response.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }

    const { businessName, companyRegistrationDoc, proofOfBusinessAddress, directors } =
      req.data || {}

    if (!companyRegistrationDoc || !proofOfBusinessAddress) {
      return Response.json(
        {
          success: false,
          message: 'Company registration document and proof of business address are required',
        },
        { status: 400 },
      )
    }

    if (!Array.isArray(directors) || directors.length === 0) {
      return Response.json(
        { success: false, message: 'At least one director with an ID document is required' },
        { status: 400 },
      )
    }

    for (const d of directors) {
      if (!d?.fullName || !d?.idDocument || !d?.idDocumentBack) {
        return Response.json(
          {
            success: false,
            message: 'Each director needs a full name and both sides of their ID document',
          },
          { status: 400 },
        )
      }
    }

    const data = {
      user: req.user.id,
      businessName: businessName ?? undefined,
      companyRegistrationDoc,
      proofOfBusinessAddress,
      directors: directors.map((d: any) => ({
        fullName: d.fullName,
        idDocument: d.idDocument,
        idDocumentBack: d.idDocumentBack,
      })),
      status: 'under-review' as const,
    }

    // Reuse an existing non-approved record (resubmit) instead of creating duplicates.
    const existing = await req.payload.find({
      collection: 'business-verifications',
      where: { user: { equals: req.user.id } },
      limit: 1,
      sort: '-createdAt',
      overrideAccess: true,
    })

    let record
    const prev = existing.docs[0] as any
    if (prev && prev.status !== 'approved') {
      record = await req.payload.update({
        collection: 'business-verifications',
        id: prev.id,
        data,
        overrideAccess: true,
      })
    } else if (prev && prev.status === 'approved') {
      return Response.json(
        { success: false, message: 'Your business is already verified' },
        { status: 400 },
      )
    } else {
      record = await req.payload.create({
        collection: 'business-verifications',
        data,
        overrideAccess: true,
      })
    }

    // Fire-and-forget admin alert
    const adminEmail = process.env.KYB_ALERT_EMAIL ?? 'hello@usehoga.com'
    const isResubmit = Boolean(prev)
    const subject = isResubmit
      ? `KYB resubmitted — ${businessName ?? req.user.email}`
      : `New KYB submission — ${businessName ?? req.user.email}`
    getResend()
      .emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'Hogapay <support@hogapay.com>',
        to: [adminEmail],
        subject,
        html: `
          <p>${isResubmit ? 'A user resubmitted' : 'A new'} business verification.</p>
          <ul>
            <li><b>Business:</b> ${businessName ?? '—'}</li>
            <li><b>User:</b> ${(req.user as any).email ?? req.user.id}</li>
            <li><b>Record ID:</b> ${record.id}</li>
            <li><b>Directors:</b> ${directors.length}</li>
          </ul>
          <p>Review in the admin panel under Business Verifications.</p>
        `,
      })
      .catch((err) => {
        console.warn('[KYB] admin alert email failed:', err?.message ?? err)
      })

    return Response.json({
      success: true,
      message: 'Business verification submitted successfully',
      data: { id: record.id, status: record.status },
    })
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        message: 'Failed to submit business verification',
        error: error?.message || 'Unknown error',
      },
      { status: 500 },
    )
  }
}
