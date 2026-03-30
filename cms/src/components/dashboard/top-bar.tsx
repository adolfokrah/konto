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
import { LogOut, Menu, Settings } from 'lucide-react'
import useSWRMutation from 'swr/mutation'
import { Sidebar } from '@/components/dashboard/sidebar'

type Props = {
  user: {
    firstName?: string | null
    lastName?: string | null
    email?: string | null
  }
}

const pageTitles: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/users': 'Users',
  '/dashboard/deleted-accounts': 'Deleted Accounts',
  '/dashboard/jars': 'Jars',
  '/dashboard/jar-reports': 'Jar Reports',
  '/dashboard/transactions': 'Transactions',
  '/dashboard/refunds': 'Refunds',
  '/dashboard/auto-refunds': 'Auto Refunds',
  '/dashboard/disputes': 'Disputes',
  '/dashboard/cashbacks': 'Cashbacks',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/ledger': 'Ledger',
  '/dashboard/referrals': 'Referrals',
  '/dashboard/referral-bonuses': 'Referral Bonuses',
  '/dashboard/push-notifications': 'Push Notifications',
  '/dashboard/push-notifications/compose': 'New Campaign',
  '/dashboard/sms': 'SMS',
  '/dashboard/sms/compose': 'New SMS',
  '/dashboard/emails': 'Emails',
  '/dashboard/profile': 'Profile',
  '/dashboard/settings': 'System Settings',
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
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'A'

  const { trigger: logout } = useSWRMutation(
    '/api/users/logout',
    (url: string) => fetch(url, { method: 'POST', credentials: 'include' }),
  )

  const handleLogout = async () => {
    await logout()
    router.push('/admin')
  }

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-52 border-r-border bg-card p-0">
          <Sidebar user={user} collapsed={false} onToggle={() => {}} />
        </SheetContent>
      </Sheet>

      <h1 className="text-lg font-semibold">{pageTitle}</h1>

      <div className="ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                {initials}
              </div>
              <span className="hidden text-sm sm:inline-block">
                {user.firstName} {user.lastName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/admin">
                <Settings className="mr-2 h-4 w-4" />
                Payload Admin
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
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
