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
  MoreHorizontal,
  ShieldAlert,
  Mail,
  UserX,
  RefreshCcwDot,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

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
      { label: 'Auto Refunds', href: '/dashboard/auto-refunds', icon: RefreshCcwDot },
      { label: 'Disputes', href: '/dashboard/disputes', icon: ShieldAlert },
      { label: 'Jar Reports', href: '/dashboard/jar-reports', icon: Flag },
      { label: 'Push Notifications', href: '/dashboard/push-notifications', icon: Bell },
      { label: 'Emails', href: '/dashboard/emails', icon: Mail },
      { label: 'Deleted Accounts', href: '/dashboard/deleted-accounts', icon: UserX },
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

type Props = {
  className?: string
  user: User
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ className, user, collapsed, onToggle }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  const { data: pendingRefunds } = useSWR(
    '/api/refunds?where[status][equals]=pending&limit=0',
    fetcher,
    { refreshInterval: 30000 },
  )
  const pendingCount = pendingRefunds?.totalDocs ?? 0

  const { data: openDisputes } = useSWR(
    '/api/disputes?where[or][0][status][equals]=open&where[or][1][status][equals]=under-review&limit=0',
    fetcher,
    { refreshInterval: 30000 },
  )
  const openDisputesCount = openDisputes?.totalDocs ?? 0

  const { data: pendingAutoRefunds } = useSWR(
    '/api/refunds?where[refundType][equals]=auto&where[status][equals]=awaiting_approval&limit=100&depth=0',
    fetcher,
    { refreshInterval: 30000 },
  )
  const pendingAutoRefundsCount = pendingAutoRefunds?.docs
    ? new Set(pendingAutoRefunds.docs.map((r: any) => r.jar)).size
    : 0

  const { data: unreadEmails } = useSWR(
    '/api/emails?where[direction][equals]=inbound&where[isRead][equals]=false&limit=0',
    fetcher,
    { refreshInterval: 30000 },
  )
  const unreadEmailsCount = unreadEmails?.totalDocs ?? 0

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
    <TooltipProvider delayDuration={0}>
      <aside className={cn('flex h-full flex-col border-r bg-card transition-all duration-200', className)}>
        {/* Logo + toggle */}
        <div className="flex h-12 items-center border-b px-3 gap-2">
          {!collapsed && (
            <Link href="/dashboard" className="flex flex-1 items-center gap-2 overflow-hidden">
              <span className="truncate text-sm font-semibold tracking-tight">Hogapay</span>
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary shrink-0">
                Admin
              </span>
            </Link>
          )}
          {collapsed && <div className="flex-1" />}
          <button
            onClick={onToggle}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {navGroups.map((group, gi) => (
            <div key={group.label} className={cn(gi > 0 && 'mt-4')}>
              {!collapsed && (
                <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                  {group.label}
                </p>
              )}
              {collapsed && gi > 0 && <div className="my-2 border-t" />}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href
                  const count =
                    item.href === '/dashboard/refunds' && pendingCount > 0 ? pendingCount :
                    item.href === '/dashboard/disputes' && openDisputesCount > 0 ? openDisputesCount :
                    item.href === '/dashboard/emails' && unreadEmailsCount > 0 ? unreadEmailsCount :
                    item.href === '/dashboard/auto-refunds' && pendingAutoRefundsCount > 0 ? pendingAutoRefundsCount :
                    null

                  const link = (
                    <Link
                      href={item.href}
                      className={cn(
                        'relative flex items-center rounded-md transition-colors',
                        collapsed
                          ? 'justify-center p-2'
                          : 'gap-2.5 px-2 py-1.5 text-[13px] font-medium',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      <item.icon className="h-3.5 w-3.5 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {count !== null && (
                            <span className="ml-auto rounded bg-orange-500 px-1.5 py-0.5 text-[10px] font-semibold text-white tabular-nums">
                              {count}
                            </span>
                          )}
                        </>
                      )}
                      {collapsed && count !== null && (
                        <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-orange-500" />
                      )}
                    </Link>
                  )

                  if (collapsed) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right" className="flex items-center gap-2">
                          {item.label}
                          {count !== null && (
                            <span className="rounded bg-orange-500 px-1.5 py-0.5 text-[10px] font-semibold text-white tabular-nums">
                              {count}
                            </span>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    )
                  }

                  return <div key={item.href}>{link}</div>
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t p-2">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-center py-1">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground cursor-default">
                    {initials}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">{displayName}</TooltipContent>
            </Tooltip>
          ) : (
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
                  <MoreHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="w-56">
                  <div className="flex items-center gap-2.5 px-2 py-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                      {initials}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold leading-tight">{displayName}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Account
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
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
