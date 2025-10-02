import type { Metadata } from 'next'
import { cn } from '@/utilities/ui'
import { AdminBar } from '@/components/AdminBar'
import { draftMode } from 'next/headers'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { GoogleAnalytics } from '@next/third-parties/google';
import { Analytics } from "@vercel/analytics/next"

import '../globals.css'
export interface LocaleLayoutProps {
  children: React.ReactNode
  params: Promise<{
    locale: string
  }>
}

// Generate metadata based on locale
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params

  const titles = {
    en: 'Konto - Your Financial Companion',
    fr: 'Konto - Votre Compagnon Financier',
  }

  const descriptions = {
    en: 'Manage your finances with ease using Konto',
    fr: 'Gérez vos finances facilement avec Konto',
  }

  return {
    title: titles[locale as keyof typeof titles] || titles.en,
    description: descriptions[locale as keyof typeof descriptions] || descriptions.en,
    other: {
      locale: locale,
    },
  }
}

// Validate that the locale is supported
export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'fr' }]
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params
  const { isEnabled } = await draftMode()

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
        <GoogleAnalytics gaId="G-V14P9R71JY" />
      </head>
      <body className="bg-primary-light text-black font-supreme" data-theme="light">
        <div className="fixed top-0 left-0 w-full z-40">
          <AdminBar
            adminBarProps={{
              preview: isEnabled,
            }}
          />
          <Header />
        </div>
        {children}
        <Footer />
        <Analytics/>
      </body>
    </html>
  )
}
