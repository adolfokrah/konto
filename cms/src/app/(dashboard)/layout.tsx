import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { headers as getHeaders } from 'next/headers'

import { cn } from '@/utilities/ui'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import React from 'react'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { SidebarWrapper } from '@/components/dashboard/sidebar-wrapper'
import { TopBar } from '@/components/dashboard/top-bar'
import { Toaster } from '@/components/ui/sonner'
import NextTopLoader from 'nextjs-toploader'

import './globals.css'

export const metadata: Metadata = {
  title: 'Hogapay Dashboard',
  description: 'Admin dashboard for Hogapay',
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const payload = await getPayload({ config: configPromise })
  const requestHeaders = await getHeaders()

  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user || user.role !== 'admin') {
    const pathname = requestHeaders.get('x-pathname') ?? '/dashboard'
    redirect(`/admin?redirect=${encodeURIComponent(pathname)}`)
  }

  const userData = { firstName: user.firstName, lastName: user.lastName, email: user.email }

  return (
    <html className={cn(GeistSans.variable, GeistMono.variable, 'dashboard-dark')} lang="en" suppressHydrationWarning>
      <head>
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
      </head>
      <body className="h-screen overflow-hidden bg-background">
        <div className="flex h-screen overflow-hidden">
          <SidebarWrapper user={userData} />
          <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
            <TopBar user={userData} />
            <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
          </div>
        </div>
        <NextTopLoader color="#ffffff" showSpinner={false} />
        <Toaster />
      </body>
    </html>
  )
}
