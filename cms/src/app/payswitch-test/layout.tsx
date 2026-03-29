import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import { cn } from '@/utilities/ui'

import '../(website)/globals.css'

export const metadata = {
  title: 'Payswitch Test',
}

export default function PayswitchLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={cn(GeistSans.variable, GeistMono.variable)} lang="en">
      <body>{children}</body>
    </html>
  )
}
