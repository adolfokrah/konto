import type { Metadata } from 'next'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import { cn } from '@/utilities/ui'
import { Toaster } from '@/components/ui/sonner'
import NextTopLoader from 'nextjs-toploader'

import '../(dashboard)/globals.css'

export const metadata: Metadata = {
  title: 'Sign in · Hogapay Dashboard',
  description: 'Sign in to the Hogapay admin dashboard',
}

export default function DashboardLoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      className={cn(GeistSans.variable, GeistMono.variable, 'dashboard-dark')}
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
      </head>
      <body className="min-h-screen bg-background">
        {children}
        <NextTopLoader color="#ffffff" showSpinner={false} />
        <Toaster />
      </body>
    </html>
  )
}
