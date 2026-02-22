'use client'

import { useRouter } from 'next/navigation'
import { MoreHorizontal, Snowflake } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/utilities/ui'
import { toggleJarFreeze } from '@/app/(dashboard)/dashboard/jars/actions'
import { toast } from 'sonner'

export type JarRow = {
  id: string
  name: string
  creatorName: string
  creatorEmail: string
  status: 'open' | 'frozen' | 'broken' | 'sealed'
  goalAmount: number
  totalContributions: number
  contributorsCount: number
  currency: string
  createdAt: string
  description: string | null
  deadline: string | null
  isActive: boolean
  isFixedContribution: boolean
  acceptedContributionAmount: number | null
  allowAnonymousContributions: boolean
  thankYouMessage: string | null
  imageUrl: string | null
  freezeReason: string | null
}

const statusStyles: Record<string, string> = {
  open: 'bg-green-100 text-green-800 border-green-200',
  frozen: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  sealed: 'bg-blue-100 text-blue-800 border-blue-200',
  broken: 'bg-red-100 text-red-800 border-red-200',
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatAmount(amount: number, currency: string) {
  return `${currency.toUpperCase()} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function JarsTable({ jars }: { jars: JarRow[] }) {
  const router = useRouter()

  if (jars.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        No jars found
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Creator</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Goal</TableHead>
          <TableHead className="text-right">Contributions</TableHead>
          <TableHead className="text-right">Contributors</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jars.map((jar) => (
          <TableRow
            key={jar.id}
            className="cursor-pointer"
            onClick={() => router.push(`/dashboard/jars/${jar.id}`)}
          >
            <TableCell className="max-w-[200px] truncate font-medium">{jar.name}</TableCell>
            <TableCell>{jar.creatorName}</TableCell>
            <TableCell>
              <Badge variant="outline" className={cn('capitalize', statusStyles[jar.status])}>
                {jar.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              {jar.goalAmount > 0 ? formatAmount(jar.goalAmount, jar.currency) : '—'}
            </TableCell>
            <TableCell className="text-right font-medium">
              {formatAmount(jar.totalContributions, jar.currency)}
            </TableCell>
            <TableCell className="text-right">{jar.contributorsCount}</TableCell>
            <TableCell className="text-muted-foreground">{formatDate(jar.createdAt)}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={async (e) => {
                      e.stopPropagation()
                      const result = await toggleJarFreeze(jar.id, jar.status !== 'frozen')
                      if (result.success) {
                        toast.success(result.message)
                      } else {
                        toast.error(result.message)
                      }
                    }}
                  >
                    <Snowflake className="mr-2 h-4 w-4" />
                    {jar.status === 'frozen' ? 'Unfreeze Jar' : 'Freeze Jar'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
