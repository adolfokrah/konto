'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/utilities/ui'
import {
  LayoutDashboard,
  Users,
  Container,
  ArrowLeftRight,
  BarChart3,
} from 'lucide-react'

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
    disabled: true,
  },
  {
    label: 'Jars',
    href: '/dashboard/jars',
    icon: Container,
    disabled: true,
  },
  {
    label: 'Transactions',
    href: '/dashboard/transactions',
    icon: ArrowLeftRight,
    disabled: true,
  },
  {
    label: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    disabled: true,
  },
]

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname()

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
          return (
            <Link
              key={item.href}
              href={item.disabled ? '#' : item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                item.disabled && 'pointer-events-none opacity-40',
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {item.disabled && (
                <span className="ml-auto text-[10px] uppercase tracking-wider">Soon</span>
              )}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
