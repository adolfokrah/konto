'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import { cn } from '@/utilities/ui'
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
  Settings,
  LogOut,
  ChevronUp,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((r) => r.json())

const navGroups = [
  {
    label: 'Main',
    items: [
      { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Users', href: '/dashboard/users', icon: Users },
      { label: 'Jars', href: '/dashboard/jars', icon: Container },
      { label: 'Transactions', href: '/dashboard/transactions', icon: ArrowLeftRight },
    ],
  },
  {
    label: 'Manage',
    items: [
      { label: 'Refunds', href: '/dashboard/refunds', icon: RotateCcw },
      { label: 'Jar Reports', href: '/dashboard/jar-reports', icon: Flag },
      { label: 'Push Notifications', href: '/dashboard/push-notifications', icon: Bell },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
      { label: 'Ledger', href: '/dashboard/ledger', icon: Wallet },
      { label: 'Referrals', href: '/dashboard/referrals', icon: Share2 },
      { label: 'Referral Bonuses', href: '/dashboard/referral-bonuses', icon: Gift },
    ],
  },
]

type User = {
  firstName?: string | null
  lastName?: string | null
  email?: string | null
}

export function Sidebar({ className, user }: { className?: string; user: User }) {
  const pathname = usePathname()
  const router = useRouter()

  const { data: pendingRefunds } = useSWR(
    '/api/refunds?where[status][equals]=pending&limit=0',
    fetcher,
    { refreshInterval: 30000 },
  )
  const pendingCount = pendingRefunds?.totalDocs ?? 0

  const { trigger: logout } = useSWRMutation(
    '/api/users/logout',
    (url: string) => fetch(url, { method: 'POST', credentials: 'include' }),
  )

  const handleLogout = async () => {
    await logout()
    router.push('/admin')
  }

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'A'
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'Admin'

  return (
    <aside className={cn('flex h-full flex-col border-r bg-card', className)}>
      {/* Logo */}
      <div className="flex h-12 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-tight">Hogapay</span>
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
            Admin
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {navGroups.map((group, gi) => (
          <div key={group.label} className={cn(gi > 0 && 'mt-4')}>
            <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href
                const count =
                  item.href === '/dashboard/refunds' && pendingCount > 0 ? pendingCount : null

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <item.icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {count !== null && (
                      <span className="ml-auto rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-semibold text-white tabular-nums">
                        {count}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-medium leading-tight">{displayName}</p>
                <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
              </div>
              <ChevronUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-52">
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile" className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
                  {initials}
                </span>
                My Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                System Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex items-center gap-2 text-destructive focus:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
