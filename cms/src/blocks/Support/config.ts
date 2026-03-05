import type { Block } from 'payload'

export const Support: Block = {
  slug: 'support',
  interfaceName: 'SupportBlock',
  fields: [
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'How can we help?',
    },
    {
      name: 'subheading',
      type: 'text',
      defaultValue: 'Reach out to us through any of the channels below.',
    },
    {
      name: 'phoneNumber',
      type: 'text',
      required: true,
      admin: {
        description: 'Phone number for calls (e.g. +233241234567)',
      },
    },
    {
      name: 'whatsappNumber',
      type: 'text',
      required: true,
      admin: {
        description: 'WhatsApp number (e.g. +233241234567)',
      },
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      defaultValue: 'hello@usehoga.com',
    },
    {
      name: 'businessHours',
      type: 'text',
      defaultValue: 'Monday - Friday: 9:00 AM - 5:00 PM (GMT)',
    },
    {
      name: 'closedDays',
      type: 'text',
      defaultValue: 'Saturday - Sunday: Closed',
    },
  ],
}
