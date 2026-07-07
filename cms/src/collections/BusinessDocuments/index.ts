import type { CollectionConfig } from 'payload'

/**
 * Access-controlled storage for sensitive KYB documents (company registration,
 * director government IDs, proof of business address).
 *
 * Unlike `media` (public read), these are readable ONLY by admins/auditors or the
 * user who uploaded them. Never make this collection public.
 */
export const BusinessDocuments: CollectionConfig = {
  slug: 'business-documents',
  labels: {
    singular: 'Business Document',
    plural: 'Business Documents',
  },
  admin: {
    useAsTitle: 'filename',
    hidden: false,
  },
  access: {
    create: ({ req: { user } }) => !!user,
    read: ({ req: { user } }) => {
      const role = (user as any)?.role
      if (role === 'admin' || role === 'auditor') return true
      if (user) return { uploadedBy: { equals: user.id } }
      return false
    },
    update: ({ req: { user } }) => (user as any)?.role === 'admin',
    delete: ({ req: { user } }) => (user as any)?.role === 'admin',
  },
  fields: [
    {
      name: 'uploadedBy',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      admin: { readOnly: true },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation, req }) => {
        if (operation === 'create' && req.user && !data.uploadedBy) {
          data.uploadedBy = req.user.id
        }
        return data
      },
    ],
  },
  upload: {
    // No staticDir → not served from the public folder. Files live in S3 (see payload.config).
    mimeTypes: ['image/*', 'application/pdf'],
  },
}
