import * as React from 'react'
import { Html, Container, Head, Img, Font, Tailwind } from '@react-email/components'

interface EmailTemplateProps {
  fullname: string
}


export default function kycVerified({ fullname = 'John Doe' }: EmailTemplateProps) {
  return (
    <Html>
      <Head>
        <Font
          fontFamily="Supreme"
          fallbackFontFamily="Arial"
          webFont={{
            url: 'https://staging.usehoga.com/fonts/supreme/Supreme-Regular.otf',
            format: 'opentype',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
        <Font
          fontFamily="Chillax"
          fallbackFontFamily="Arial"
          webFont={{
            url: 'https://staging.usehoga.com/fonts/chillax/Chillax-Regular.otf',
            format: 'opentype',
          }}
          fontWeight={400}
          fontStyle="normal"
        />

        <meta name="color-scheme" content="light"></meta>
        <meta name="supported-color-schemes" content="light"></meta>
      </Head>
      <Tailwind
        config={{
          theme: {
            extend: {
              fontFamily: {
                supreme: ['Supreme', 'Arial', 'sans-serif'],
                chillax: ['Chillax', 'Arial', 'sans-serif'],
              },
              colors: {
                primary: '#000000',
                secondary: '#6B7280',
              },
            },
          },
        }}
      >
        <Container className="mx-auto py-8 px-6">
          <div className="p-8">
            <Img
              src="https://exbwvryiow.ufs.sh/f/LTX7NhlmcU3wYDN7xEFINo7JQn06T32zrjbsyhdemXfYilFE"
              alt="KYC Verified"
              width="70"
              height="23"
              className="mb-6"
            />
            <h1 className="font-chillax text-2xl font-bold text-primary mb-4">
              Congratulations {fullname}! 🎉
            </h1>
            <p className="font-supreme text-secondary text-base leading-relaxed">
              Your KYC has been successfully verified. You can now access all features of your
              account.
            </p>
          </div>
        </Container>
      </Tailwind>
    </Html>
  )
}
