import * as React from 'react'
import { Img, Button } from '@react-email/components'
import { Layout } from './layout'

interface CustomFieldsAnnouncementProps {
  fullname: string
}

export default function CustomFieldsAnnouncement({
  fullname = 'there',
}: CustomFieldsAnnouncementProps) {
  return (
    <Layout title="Collect exactly what you need — now with Custom Fields ✨">
      <div>
        <p>Hi {fullname},</p>

        <p>
          We just shipped something you've been asking for — <strong>Custom Fields</strong> on your
          contribution page.
        </p>

        <p>
          Now when someone contributes to your jar, you can ask them anything upfront — their name,
          meal preference, table number, T-shirt size, or any other detail that matters to you.
        </p>

        {/* Hero image placeholder */}
        <div
          style={{
            borderRadius: 12,
            overflow: 'hidden',
            margin: '24px 0',
            background: '#F3F4F6',
            textAlign: 'center' as const,
          }}
        >
          <Img
            src="https://hoga-production.up.railway.app/emails/custom-fields-hero.png"
            alt="Custom Fields feature screenshot"
            width="100%"
            style={{ display: 'block', borderRadius: 12 }}
          />
        </div>

        <p>
          <strong>What you can add:</strong>
        </p>
        <ul>
          <li>📝 Text — free-form answers (name, note, address)</li>
          <li>🔢 Number — quantities, sizes, seat numbers</li>
          <li>📋 Dropdown — pick from a list (e.g. meal choices)</li>
          <li>✅ Checkbox — yes/no questions</li>
          <li>📞 Phone & Email — validated contact fields</li>
        </ul>

        <p>You can mark any field as required so contributors can't skip it.</p>

        {/* In-app screenshot placeholder */}
        <div
          style={{
            borderRadius: 12,
            overflow: 'hidden',
            margin: '24px 0',
            background: '#F3F4F6',
            textAlign: 'center' as const,
          }}
        >
          <Img
            src="https://hoga-production.up.railway.app/emails/custom-fields-setup.png"
            alt="Setting up custom fields in the app"
            width="100%"
            style={{ display: 'block', borderRadius: 12 }}
          />
        </div>

        <p>
          <strong>Where to find it:</strong> Open any jar → Jar Info → Custom Fields. Add as many
          fields as you need, arrange them, and save. They'll appear instantly on your contribution
          page.
        </p>

        <p>
          All responses are saved with each transaction — and included when you export your
          contributions as PDF or Excel, or share via WhatsApp.
        </p>

        {/* CTA */}
        <div style={{ textAlign: 'center' as const, margin: '32px 0' }}>
          <Button
            href="https://hogapay.com"
            style={{
              backgroundColor: '#000000',
              color: '#ffffff',
              borderRadius: 8,
              padding: '14px 32px',
              fontSize: 15,
              fontWeight: 'bold',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Try Custom Fields →
          </Button>
        </div>

        <p>
          Questions? Reply to this email or reach us at{' '}
          <a href="mailto:hello@hogapay.com">hello@hogapay.com</a> — we're always happy to help.
        </p>
      </div>
    </Layout>
  )
}
