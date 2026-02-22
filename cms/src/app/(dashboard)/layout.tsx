import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { cn } from '@/utilities/ui'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import React from 'react'

import { getMeUser } from '@/utilities/getMeUser'
import { Sidebar } from '@/components/dashboard/sidebar'
import { TopBar } from '@/components/dashboard/top-bar'

import '../(website)/globals.css'

export const metadata: Metadata = {
  title: 'Konto Dashboard',
  description: 'Admin dashboard for Konto',
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getMeUser({ nullUserRedirect: '/admin' })

  // Only admins can access the dashboard
  if (user?.role !== 'admin') {
    redirect('/admin')
  }

  return (
    <html className={cn(GeistSans.variable, GeistMono.variable)} lang="en" suppressHydrationWarning>
      <head>
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
      </head>
      <body className="min-h-screen bg-muted/30">
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
