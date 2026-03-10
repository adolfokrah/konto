'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import useSWR from 'swr'
import { cn } from '@/utilities/ui'
import { Badge } from '@/components/ui/badge'
import {
  LayoutDashboard,
  Users,
  Container,
  ArrowLeftRight,
  BarChart3,
  Flag,
  Bell,
  RotateCcw,
  Wallet,
  Gift,
  Share2,
} from 'lucide-react'

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((r) => r.json())

const navItems = [
  {
    label: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Users',
    href: '/dashboard/users',
    icon: Users,
  },
  {
    label: 'Jars',
    href: '/dashboard/jars',
    icon: Container,
  },
  {
    label: 'Transactions',
    href: '/dashboard/transactions',
    icon: ArrowLeftRight,
  },
  {
    label: 'Refunds',
    href: '/dashboard/refunds',
    icon: RotateCcw,
  },
  {
    label: 'Jar Reports',
    href: '/dashboard/jar-reports',
    icon: Flag,
  },
  {
    label: 'Push Notifications',
    href: '/dashboard/push-notifications',
    icon: Bell,
  },
  {
    label: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    label: 'Ledger',
    href: '/dashboard/ledger',
    icon: Wallet,
  },
  {
    label: 'Referrals',
    href: '/dashboard/referrals',
    icon: Share2,
  },
  {
    label: 'Referral Bonuses',
    href: '/dashboard/referral-bonuses',
    icon: Gift,
  },
]

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname()

  const { data: pendingRefunds } = useSWR(
    '/api/refunds?where[status][equals]=pending&limit=0',
    fetcher,
    { refreshInterval: 30000 },
  )
  const pendingCount = pendingRefunds?.totalDocs ?? 0

  return (
    <aside className={cn('flex h-full flex-col border-r bg-card', className)}>
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <span className="text-lg">Hogapay</span>
          <span className="text-xs text-muted-foreground">Dashboard</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const badge = item.href === '/dashboard/refunds' && pendingCount > 0 ? pendingCount : null
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {badge !== null && (
                <Badge className="ml-auto bg-orange-500 text-white hover:bg-orange-500 border-0 h-5 min-w-5 justify-center px-1.5 text-[11px] ">
                  {badge}
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
