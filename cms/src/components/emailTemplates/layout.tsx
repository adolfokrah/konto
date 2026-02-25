import * as React from 'react'
import { Container, Tailwind, Hr, Img, Html } from '@react-email/components'

interface LayoutProps {
  children: React.ReactNode
  title?: string
  showSignature?: boolean
}

export const Footer = () => {
  return (
    <div>
      <Hr className="border-t border-gray-300" />
      {/* Social Icons */}
      <div className="text-xl text-gray-400">
        <a
          href="https://www.facebook.com/profile.php?id=61581545872790"
          className="text-gray-400 no-underline"
        >
          <span style={{ fontFamily: 'Arial, sans-serif', fontWeight: 'bold' }}>f</span>
        </a>
        <a
          href="https://www.linkedin.com/company/usehoga/"
          className="text-gray-400 no-underline ml-3"
        >
          <span style={{ fontFamily: 'Arial, sans-serif', fontWeight: 'bold' }}>in</span>
        </a>
      </div>

      {/* Copyright */}
      <p className="text-sm text-gray-400 mb-6">© {new Date().getFullYear()} Hoga Ltd.</p>

      {/* Legal Text */}
      <div className="text-xs text-gray-400" style={{ lineHeight: 2.4 }}>
        <p>
          Hoga Ltd. is a private company limited by shares incorporated in Ghana under the Companies
          Act, 2019 (Act 992) and registered with the Registrar-General&apos;s Department.
          <br /> Registered office: [Insert registered address]. Company No.: [Insert registration
          number].
          <br />
          Data protection: Subject to the Ghana Data Protection Act, 2012 (Act 843) and, where
          applicable, foreign data-protection laws. Data Controller registration: [Insert DPC
          registration / ref].
          <br />
          Not a bank. Hoga is a technology platform. We do not take deposits, pay interest, or
          provide investment services.
          <br />
          Payments & Mobile Money. Card and mobile-money payments shown in the Hoga app are
          processed by licensed payment service providers (e.g., Paystack) and by telco e-money
          issuers where applicable (e.g., MTN MoMo, AirtelTigo Money, Telecel Cash). Those providers
          are regulated in their respective jurisdictions.
          <br />
          KYC. Organizer identity verification is performed via approved third-party providers
          (e.g., Didit) before a jar can be created. Funds flow & refunds. Contributions are
          collected on behalf of the organizer and are transferred to the organizer&apos;s designated
          account per the organizer&apos;s settings and applicable settlement timelines. Refunds and
          chargebacks are handled according to the organizer&apos;s policy, card network rules,
          mobile-money rules, and our Terms.
          <br />
          No investment advice. Contributions made via Hoga are not investments and may not be
          refundable. Review the event/jar details before contributing.
          <br />
          For more information, see:{' '}
          <a href="https://hogapay.com/terms" className="text-gray-500 underline">
            Terms of Use
          </a>{' '}
          ·{' '}
          <a href="https://hogapay.com/privacy-policy" className="text-gray-500 underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  )
}

export const Signature = () => {
  return (
    <p>
      With gratitude, <br />
      <b>The Hoga Team</b>
      <br />
      <span className="text-xs text-gray-500">
        Contributions made simple, transparent, and accountable.
      </span>
    </p>
  )
}

export const Layout = ({ children, title, showSignature = true }: LayoutProps) => {
  return (
    <Html>
    <Tailwind
      config={{
        theme: {
          extend: {
            fontFamily: {
              supreme: ['Arial', 'sans-serif'],
              chillax: ['Arial', 'sans-serif'],
            },
            colors: {
              primary: '#000000',
              secondary: '#6B7280',
            },
          },
        },
      }}
    >
      <Container className="mx-auto py-8 px-6 font-chillax bg-white" style={{ maxWidth: '55em' }}>
        {/* Logo with background for visibility in both themes */}
        <div className="mb-6">
           <Img
              src="https://hoga-production.up.railway.app/logo.png"
              alt="Hoga Logo"
              width="70"
              height="23"
            />
        </div>
        <h2 className="text-4xl font-bold text-primary mb-4" style={{ lineHeight: 1.6 }}>
          {title}
        </h2>
        <div className="text-sm my-5 " style={{ lineHeight: 2 }}>
          {children}
          {showSignature && <Signature />}
        </div>
        <Footer />
      </Container>
    </Tailwind>
     </Html>
  )
}
