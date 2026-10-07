'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Bell, LogOut, Menu, Search, Settings } from 'lucide-react'
import useSWRMutation from 'swr/mutation'
import { Sidebar } from '@/components/dashboard/sidebar'

type Props = {
  user: {
    firstName?: string | null
    lastName?: string | null
    email?: string | null
    role?: string | null
  }
}

const pageTitles: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/users': 'Users',
  '/dashboard/deleted-accounts': 'Deleted Accounts',
  '/dashboard/jars': 'Jars',
  '/dashboard/jar-reports': 'Jar Reports',
  '/dashboard/transactions': 'Transactions',
  '/dashboard/disputes': 'Disputes',
  '/dashboard/cashbacks': 'Cashbacks',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/ledger': 'Ledger',
  '/dashboard/referrals': 'Referrals',
  '/dashboard/referral-bonuses': 'Referral Bonuses',
  '/dashboard/push-notifications': 'Push Notifications',
  '/dashboard/push-notifications/compose': 'New campaign',
  '/dashboard/sms': 'SMS',
  '/dashboard/sms/compose': 'New SMS',
  '/dashboard/emails': 'Emails',
  '/dashboard/business-verifications': 'Business Verifications',
  '/dashboard/profile': 'Profile',
  '/dashboard/settings': 'System Settings',
}

const pageGroups: Record<string, string> = {
  users: 'People',
  'deleted-accounts': 'People',
  jars: 'Jars',
  'jar-reports': 'Jars',
  transactions: 'Payments',
  disputes: 'Payments',
  'business-verifications': 'Payments',
  cashbacks: 'Payments',
  analytics: 'Finance',
  ledger: 'Finance',
  referrals: 'Finance',
  'referral-bonuses': 'Finance',
  'push-notifications': 'Comms',
  sms: 'Comms',
  emails: 'Comms',
}

const pageTitlePrefixes: Array<[string, string]> = [
  ['/dashboard/users/', 'User Detail'],
  ['/dashboard/jars/', 'Jar Detail'],
  ['/dashboard/push-notifications/', 'Push Notifications'],
  ['/dashboard/sms/', 'SMS'],
]

export function TopBar({ user }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const pageTitle =
    pageTitles[pathname] ||
    pageTitlePrefixes.find(([prefix]) => pathname.startsWith(prefix))?.[1] ||
    'Dashboard'
  const pageGroup = pageGroups[pathname.split('/')[2] ?? ''] ?? null
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'A'

  const { trigger: logout } = useSWRMutation('/api/users/logout', (url: string) =>
    fetch(url, { method: 'POST', credentials: 'include' }),
  )

  const handleLogout = async () => {
    await logout()
    router.push('/dashboard/login')
  }

  return (
    <header className="flex h-[60px] shrink-0 items-center gap-3 border-b bg-background px-4 lg:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 border-none bg-[#1B232E] p-0">
          <Sidebar user={user} collapsed={false} onToggle={() => {}} />
        </SheetContent>
      </Sheet>

      <div className="text-[12.5px] text-muted-foreground">
        {pageGroup && <>{pageGroup} / </>}
        <b className="font-semibold text-foreground">{pageTitle}</b>
      </div>

      <form
        className="ml-auto hidden h-9 w-[300px] items-center gap-2 rounded-xl border bg-card px-3 text-[13px] md:flex"
        onSubmit={(e) => {
          e.preventDefault()
          const q = new FormData(e.currentTarget).get('q')?.toString().trim()
          if (q) router.push(`/dashboard/users?search=${encodeURIComponent(q)}`)
        }}
      >
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          name="q"
          placeholder="Search users by name or phone"
          className="h-full w-full border-0 bg-transparent p-0 outline-none placeholder:text-muted-foreground"
        />
      </form>

      <div className="ml-auto flex items-center gap-2 md:ml-0">
        <Link
          href="/dashboard/disputes"
          aria-label="Open disputes"
          className="flex h-9 w-9 items-center justify-center rounded-xl border bg-card text-foreground transition-colors hover:bg-secondary"
        >
          <Bell className="h-4 w-4" />
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Account menu"
              className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#FFE8CC] text-[11px] font-semibold text-[#1B232E]"
            >
              {initials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {user.role === 'admin' && (
              <>
                <DropdownMenuItem asChild>
                  <Link href="/admin">
                    <Settings className="mr-2 h-4 w-4" />
                    Payload Admin
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
