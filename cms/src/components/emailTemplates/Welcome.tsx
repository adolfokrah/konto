import * as React from 'react'
import { Layout } from './layout'

interface EmailTemplateProps {
  fullname: string
}

export default function Welcome({ fullname = 'John Doe' }: EmailTemplateProps) {
  return (
    <Layout title={` You’re in! Let’s make contributions transparent ✨`}>
      <div>
        <p>Hi {fullname},</p>
        <p>My name is kelvin - I’m the founder and CEO of hoga.</p>

        <p>
          We started hoga because we wanted to make traditional contributions simple, transparent,
          and traceable.Whether you’re organizing an event or supporting one, Hoga makes every cedi
          count (and every contribution comes with a digital receipt).
        </p>
        <p>What you get with Hoga</p>
        <ul>
          <li>
            One QR for everything: share a single QR or link in WhatsApp, print it for events, and
            let anyone contribute in seconds.
          </li>
          <li>
            Real-time ledger: see contributions and transfers/payouts as they happen — full
            visibility, no guesswork.
          </li>
          <li>Receipts for trust: everyone gets an instant, shareable receipt.</li>
          <li>
            Works with what people use: MoMo, cards, bank, and cash entries — all recorded in one
            place.
          </li>
          <li>Export anytime: PDF or Excel reports for your records or community updates.</li>
          <li>
            Verified organizers: jars are created by KYC-verified organizers for safer giving.
          </li>
        </ul>
        <p>Get started in 3 quick steps</p>
        <ol>
          <li>Complete our KYC onboarding to verify your account</li>
          <li>Create or join a jar (add an event photo for that personal touch)</li>
          <li>
            Share your QR/link or manually hit the contribute button and watch contributions roll in
            — with receipts and live tracking
          </li>
        </ol>
        <p>If you’re organizing, here are two power tips:</p>
        <ul>
          <li>Post your QR Code poster at the venue and in WhatsApp groups.</li>
          <li>
            Use the Thank You message to celebrate milestones (25%, 50%, 100%) and keep momentum
            going.
          </li>
        </ul>
        <p>
          Need help? Just reply to this email or reach us at{' '}
          <a href="mailto:hello@usehoga.com">hello@usehoga.com</a> — we’re here 24/7.
        </p>
        <p>Welcome aboard 🤝</p>
      </div>
    </Layout>
  )
}
