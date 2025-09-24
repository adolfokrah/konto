import type { Block } from 'payload'

import { anchorField } from '@/fields/anchor'

export const FAQ: Block = {
  slug: 'faq',
  interfaceName: 'FAQBlock',
  fields: [
    anchorField,
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Your Questions Answered',
    },
    {
      name: 'subheading',
      type: 'text',
      defaultValue: 'Simple explanations to help you get started with Hoga with confidence',
    },
    {
      name: 'faqs',
      type: 'array',
      minRows: 1,
      defaultValue: [
        {
          question: 'Is hoga a bank?',
          answer:
            'No, Hoga is not a bank. We are a financial technology platform that helps organize and track contributions for various causes and projects.',
        },
        {
          question: 'How does hoga work?',
          answer:
            'Hoga simplifies fundraising by creating digital "jars" for your causes. Contributors can donate online through secure payment methods like mobile money or cards, while collectors can also record offline cash donations directly in the app. Every contribution is automatically tracked with donor details and appears instantly in your jar\'s transparent records. Organizers get real-time updates and can monitor progress, download reports, and manage funds all in one place, making fundraising efficient and completely transparent.',
        },
        {
          question: 'Can I collect cash contributions?',
          answer:
            'Yes, absolutely! Collectors can record offline cash payments directly in the app, ensuring every contribution is properly tracked and accounted for.',
        },
        {
          question: 'How do contributors know their payments are safe?',
          answer:
            'We use industry-standard security measures and encryption to protect all transactions. All payments are processed through secure, certified payment gateways.',
        },
        {
          question: 'What fees does Hoga charge?',
          answer:
            'Hoga operates on a transparent fee structure. We charge a small processing fee on successful transactions to maintain our platform and ensure secure, reliable service for all users.',
        },
        {
          question: 'Can I withdraw funds from my jar at any time?',
          answer:
            "Funds are automatically transferred to your designated bank account or mobile money account within 24 hours after each contribution is received. There's no need for manual withdrawal requests - the process is completely automated for your convenience.",
        },
        {
          question: 'How do I know if someone has contributed to my jar?',
          answer:
            "You'll receive real-time notifications via email and SMS whenever someone contributes to your jar. You can also check the live updates in your Hoga dashboard to see all contributions and track your progress.",
        },
      ],
      fields: [
        {
          name: 'question',
          type: 'text',
          required: true,
        },
        {
          name: 'answer',
          type: 'textarea',
          required: true,
        },
      ],
    },
  ],
}
