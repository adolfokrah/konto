import * as React from 'react';
import {  Html, Container, Head, Img, Font, Tailwind } from "@react-email/components";

interface EmailTemplateProps {
  fullname: string;
}

export default function kycVerified({ fullname = 'John Doe' }: EmailTemplateProps) {
  return (
    <Html>
      <Head>
        <Font
          fontFamily="Supreme"
          fallbackFontFamily="Arial"
          webFont={{
            url: "/fonts/supreme/Supreme-Regular.otf",
            format: "opentype",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Tailwind
        config={{
          theme: {
            extend: {
              fontFamily: {
                'supreme': ['Supreme', 'Arial', 'sans-serif'],
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <Img
              src={`${process.env.NEXT_PUBLIC_APP_URL}/Logo.svg`}
              alt="KYC Verified"
              width="70"
              height="50"
              className="mb-6"
              style={{ filter: 'brightness(0)' }}
            />
            <h1 className="font-supreme text-2xl font-bold text-primary mb-4">
              Congratulations {fullname}! 🎉
            </h1>
            <p className="font-supreme text-secondary text-base leading-relaxed">
              Your KYC has been successfully verified. You can now access all features of your account.
            </p>
          </div>
        </Container>
      </Tailwind>
    </Html>
  );
}