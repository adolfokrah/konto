import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { headers as getHeaders } from 'next/headers'

import { cn } from '@/utilities/ui'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import React from 'react'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Sidebar } from '@/components/dashboard/sidebar'
import { TopBar } from '@/components/dashboard/top-bar'
import { Toaster } from '@/components/ui/sonner'

import '../(website)/globals.css'

export const metadata: Metadata = {
  title: 'Hogapay Dashboard',
  description: 'Admin dashboard for Hogapay',
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const payload = await getPayload({ config: configPromise })
  const requestHeaders = await getHeaders()

  // Authenticate using Payload local API (no HTTP self-fetch)
  const { user } = await payload.auth({ headers: requestHeaders })

  // Redirect if not authenticated or not admin
  if (!user || user.role !== 'admin') {
    redirect('/admin')
  }

  return (
    <html className={cn(GeistSans.variable, GeistMono.variable, 'dashboard-dark')} lang="en" suppressHydrationWarning>
      <head>
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
      </head>
      <body className="min-h-screen bg-background">
        <div className="flex min-h-screen">
          {/* Sidebar - hidden on mobile, sticky on lg+ */}
          <div className="hidden w-64 lg:block">
            <div className="sticky top-0 h-screen">
              <Sidebar />
            </div>
          </div>

          {/* Main content area */}
          <div className="flex flex-1 flex-col min-w-0">
            <div className="sticky top-0 z-10">
              <TopBar
                user={{
                  firstName: user.firstName,
                  lastName: user.lastName,
                  email: user.email,
                }}
              />
            </div>
            <main className="flex-1 p-4 lg:p-6">{children}</main>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  )
}
