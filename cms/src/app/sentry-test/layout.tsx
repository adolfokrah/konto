import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import { cn } from '@/utilities/ui'
import { Toaster } from '@/components/ui/sonner'

import '../(website)/globals.css'

export default function SentryTestLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={cn(GeistSans.variable, GeistMono.variable)} lang="en">
      <body className="bg-background p-4 lg:p-6">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
