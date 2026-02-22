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
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar - hidden on mobile, shown on lg+ */}
          <div className="hidden w-64 lg:block">
            <Sidebar />
          </div>

          {/* Main content area */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <TopBar
              user={{
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
              }}
            />
            <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  )
}
