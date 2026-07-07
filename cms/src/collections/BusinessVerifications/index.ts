import type { CollectionConfig } from 'payload'
import { submitBusinessVerification } from './endpoints/submit-business-verification'
import { getMyBusinessVerification } from './endpoints/get-my-business-verification'
import { emailService } from '@/utilities/emailService'

const STATUS_OPTIONS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Under Review', value: 'under-review' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
]

// Business-verification status → the cached user.kybStatus value used for gating.
const KYB_USER_STATUS: Record<string, 'in_review' | 'approved' | 'rejected'> = {
  pending: 'in_review',
  'under-review': 'in_review',
  approved: 'approved',
  rejected: 'rejected',
}

export const BusinessVerifications: CollectionConfig = {
  slug: 'business-verifications',
  labels: {
    singular: 'Business Verification',
    plural: 'Business Verifications',
  },
  admin: {
    useAsTitle: 'businessName',
    defaultColumns: ['businessName', 'user', 'status', 'createdAt'],
  },
  access: {
    create: ({ req: { user } }) => !!user,
    read: ({ req: { user } }) => {
      const role = (user as any)?.role
      if (role === 'admin' || role === 'auditor') return true
      if (user) return { user: { equals: user.id } }
      return false
    },
    update: ({ req: { user } }) => (user as any)?.role === 'admin',
    delete: ({ req: { user } }) => (user as any)?.role === 'admin',
  },
  endpoints: [
    { path: '/submit', method: 'post', handler: submitBusinessVerification },
    { path: '/mine', method: 'get', handler: getMyBusinessVerification },
  ],
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      required: true,
      admin: { description: 'The user/organization owner submitting business verification' },
    },
    {
      name: 'businessName',
      type: 'text',
      admin: { description: 'Registered business/organization name' },
    },
    {
      name: 'companyRegistrationDoc',
      type: 'upload',
      relationTo: 'business-documents',
      required: true,
      admin: { description: 'Company registration certificate/document' },
    },
    {
      name: 'proofOfBusinessAddress',
      type: 'upload',
      relationTo: 'business-documents',
      required: true,
      admin: { description: 'Proof of business address (utility bill, lease, etc.)' },
    },
    {
      name: 'directors',
      type: 'array',
      label: 'Directors',
      minRows: 1,
      admin: { description: 'Each director and their government-issued ID' },
      fields: [
        { name: 'fullName', type: 'text', required: true },
        {
          name: 'idDocument',
          type: 'upload',
          relationTo: 'business-documents',
          required: true,
          admin: { description: 'Government-issued ID (front)' },
        },
        {
          name: 'idDocumentBack',
          type: 'upload',
          relationTo: 'business-documents',
          required: true,
          admin: { description: 'Government-issued ID (back)' },
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: STATUS_OPTIONS,
    },
    {
      name: 'rejectionReason',
      type: 'textarea',
      admin: {
        description: 'Reason shown to the user when rejected',
        condition: (data) => data?.status === 'rejected',
      },
    },
    {
      name: 'reviewedBy',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      admin: {
        readOnly: true,
        condition: (data) => ['approved', 'rejected'].includes(data?.status),
      },
    },
    {
      name: 'reviewedAt',
      type: 'date',
      admin: {
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime' },
        condition: (data) => ['approved', 'rejected'].includes(data?.status),
      },
    },
    {
      name: 'statusHistory',
      type: 'array',
      label: 'Status Change Log',
      admin: { readOnly: true },
      fields: [
        { name: 'from', type: 'select', options: STATUS_OPTIONS },
        { name: 'to', type: 'select', required: true, options: STATUS_OPTIONS },
        { name: 'reason', type: 'textarea' },
        { name: 'changedBy', type: 'relationship', relationTo: 'users', hasMany: false },
        { name: 'changedAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation, req, originalDoc }) => {
        if (operation === 'update' && req.user && data?.status) {
          const previousStatus = originalDoc?.status
          if (previousStatus && data.status !== previousStatus) {
            if (['approved', 'rejected'].includes(data.status)) {
              data.reviewedBy = req.user.id
              data.reviewedAt = new Date().toISOString()
            }
            const existing = Array.isArray(originalDoc?.statusHistory)
              ? originalDoc.statusHistory
              : []
            data.statusHistory = [
              ...existing,
              {
                from: previousStatus,
                to: data.status,
                reason: (data as any)._statusChangeReason ?? data.rejectionReason ?? '',
                changedBy: req.user.id,
                changedAt: new Date().toISOString(),
              },
            ]
          }
          delete (data as any)._statusChangeReason
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, req, operation }) => {
        const statusChanged = operation === 'create' || doc.status !== previousDoc?.status
        if (!statusChanged) return

        const userId = typeof doc.user === 'object' ? doc.user?.id : doc.user
        if (!userId) return

        const kybStatus = KYB_USER_STATUS[doc.status] ?? 'in_review'

        // Sync the cached status used for gating
        try {
          await req.payload.update({
            collection: 'users',
            id: userId,
            data: { kybStatus },
            overrideAccess: true,
          })
        } catch (e: any) {
          console.error('[business-verifications] failed to sync user.kybStatus:', e?.message)
        }

        // In-app notification (best-effort)
        const notif =
          doc.status === 'approved'
            ? {
                title: 'Business Verification Approved',
                message:
                  'Your business verification has been approved. You can now collect contributions and request payouts.',
              }
            : doc.status === 'rejected'
              ? {
                  title: 'Business Verification Rejected',
                  message: `Your business verification was rejected${
                    doc.rejectionReason ? `: ${doc.rejectionReason}` : ''
                  }. Please review and resubmit.`,
                }
              : {
                  title: 'Business Verification Received',
                  message:
                    'We received your business documents. Verification is under review — we will notify you once complete.',
                }

        try {
          await req.payload.create({
            collection: 'notifications',
            data: {
              title: notif.title,
              user: userId,
              message: notif.message,
              type: 'kyb',
              status: 'unread',
              data: { status: doc.status },
            },
            overrideAccess: true,
          })
        } catch (e: any) {
          console.error('[business-verifications] failed to create notification:', e?.message)
        }

        // Email notification for approve/reject
        if (doc.status === 'approved' || doc.status === 'rejected') {
          try {
            const user: any = await req.payload.findByID({
              collection: 'users',
              id: userId,
              depth: 0,
              overrideAccess: true,
            })
            const email = user?.email
            const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'there'
            if (email) {
              if (doc.status === 'approved') {
                await emailService.sendKybApprovedEmail(email, fullName, doc.businessName)
              } else {
                await emailService.sendKybRejectedEmail(
                  email,
                  fullName,
                  doc.rejectionReason,
                  doc.businessName,
                )
              }
            }
          } catch (e: any) {
            console.error('[business-verifications] failed to send email:', e?.message)
          }
        }
      },
    ],
  },
}
