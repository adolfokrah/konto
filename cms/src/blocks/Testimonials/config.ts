import type { Block } from 'payload'

import { anchorField } from '@/fields/anchor'

export const Testimonials: Block = {
  slug: 'testimonials',
  interfaceName: 'TestimonialsBlock',
  fields: [
    anchorField,
    {
      name: 'heading',
      type: 'text',
      localized: true,
      defaultValue: 'Building Trust One Contribution at a Time',
      admin: {
        description: 'Main heading for the testimonials section',
      },
    },
    {
      name: 'subheading',
      type: 'text',
      localized: true,
      defaultValue: 'Discover how Hoga is transforming the way people give and receive support',
      admin: {
        description: 'Subtitle or description below the main heading',
      },
    },
    {
      name: 'testimonials',
      type: 'array',
      minRows: 1,
      maxRows: 10,
      defaultValue: [
        {
          quote:
            "Hoga made it so easy to manage contributions for my mother's funeral. Every donation was tracked, and the transparency gave my family peace of mind.",
          authorName: 'Ama Ofori',
          authorTitle: 'Event Organizer',
        },
        {
          quote:
            'As a collector, I love how I can log both MoMo and cash payments quickly. Donors trust me more now because everything is recorded instantly',
          authorName: 'Kwame Mensah',
          authorTitle: 'Collector',
        },
        {
          quote:
            "I contributed to my church's project through Hoga and received a digital receipt right away. It feels safe and transparent compared to the old paper lists.",
          authorName: 'Akosua Boateng',
          authorTitle: 'Contributor',
        },
        {
          quote:
            "Managing our school's fundraising campaign became effortless with Hoga. Parents could see exactly where their contributions were going, and we raised 40% more than expected.",
          authorName: 'Samuel Asante',
          authorTitle: 'School Administrator',
        },
        {
          quote:
            'The SMS notifications and digital receipts from Hoga have completely transformed how we handle church offerings. Our members love the transparency and convenience.',
          authorName: 'Grace Osei',
          authorTitle: 'Church Treasurer',
        },
        {
          quote:
            'When my friend started using Hoga for his wedding contributions, I was amazed at how organized everything was. I knew exactly when my money was received and how it was being used.',
          authorName: 'Kofi Darko',
          authorTitle: 'Wedding Contributor',
        },
      ],
      admin: {
        description: 'List of testimonials to display',
        initCollapsed: true,
      },
      fields: [
        {
          name: 'quote',
          type: 'textarea',
          required: true,
          localized: true,
          admin: {
            description: 'The testimonial quote/text',
          },
        },
        {
          name: 'authorName',
          type: 'text',
          required: true,
          localized: true,
          admin: {
            description: 'Name of the person giving the testimonial',
          },
        },
        {
          name: 'authorTitle',
          type: 'text',
          localized: true,
          admin: {
            description:
              'Job title or description of the person (e.g., Event Organizer, Collector)',
          },
        },
        {
          name: 'authorImage',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Profile photo of the testimonial author',
          },
        },
        {
          name: 'company',
          type: 'text',
          localized: true,
          admin: {
            description: 'Company or organization (optional)',
          },
        },
      ],
    },
    {
      name: 'showNavigation',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Show navigation arrows for the testimonials section',
      },
    },
  ],
}
