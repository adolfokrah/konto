import type { CollectionConfig } from 'payload'
import { sendEndpoint } from './endpoints/send'
import { syncEndpoint } from './endpoints/sync'
import { rethreadEndpoint } from './endpoints/rethread'

export const Emails: CollectionConfig = {
  slug: 'emails',
  labels: {
    singular: 'Email',
    plural: 'Emails',
  },
  admin: {
    useAsTitle: 'subject',
    defaultColumns: ['direction', 'from', 'subject', 'status', 'createdAt'],
  },
  endpoints: [sendEndpoint, syncEndpoint, rethreadEndpoint],
  access: {
    create: ({ req: { user } }) => !!(user as any),
    read: ({ req: { user } }) => !!(user as any),
    update: ({ req: { user } }) => (user as any)?.role === 'admin',
    delete: ({ req: { user } }) => (user as any)?.role === 'admin',
  },
  fields: [
    {
      name: 'direction',
      type: 'select',
      required: true,
      defaultValue: 'outbound',
      options: [
        { label: 'Inbound', value: 'inbound' },
        { label: 'Outbound', value: 'outbound' },
      ],
    },
    {
      name: 'from',
      type: 'text',
      required: true,
    },
    {
      name: 'to',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'email',
          type: 'email',
          required: true,
        },
      ],
    },
    {
      name: 'subject',
      type: 'text',
      required: true,
    },
    {
      name: 'bodyHtml',
      type: 'textarea',
      admin: {
        description: 'HTML body of the email',
      },
    },
    {
      name: 'bodyText',
      type: 'textarea',
      admin: {
        description: 'Plain text body of the email',
      },
    },
    {
      name: 'resendEmailId',
      type: 'text',
      admin: {
        description: 'The Resend email ID (for tracking sent/received emails)',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Received', value: 'received' },
        { label: 'Sent', value: 'sent' },
        { label: 'Sending', value: 'sending' },
        { label: 'Failed', value: 'failed' },
        { label: 'Draft', value: 'draft' },
      ],
    },
    {
      name: 'linkedUser',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      admin: {
        description: 'Platform user linked to this email (auto-matched by email address)',
      },
    },
    {
      name: 'isRead',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether this email has been read in the admin dashboard',
      },
    },
    {
      name: 'messageId',
      type: 'text',
      admin: {
        description: 'RFC 2822 Message-ID header (used for threading via In-Reply-To)',
      },
    },
    {
      name: 'threadId',
      type: 'text',
      admin: {
        description: 'Thread ID for grouping related reply chains',
      },
    },
    {
      name: 'sentAt',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'attachments',
      type: 'array',
      admin: { description: 'Email attachments (base64 encoded)' },
      fields: [
        { name: 'filename', type: 'text', required: true },
        { name: 'contentType', type: 'text' },
        { name: 'content', type: 'textarea' },
      ],
    },
  ],
}
