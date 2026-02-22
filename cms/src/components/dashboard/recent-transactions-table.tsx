import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utilities/ui'

type Transaction = {
  id: string
  contributor: string | null
  amountContributed: number
  paymentStatus: 'pending' | 'completed' | 'failed' | 'transferred'
  paymentMethod: string | null
  type: 'contribution' | 'payout'
  jar: { name: string } | string | null
  createdAt: string
}

const typeStyles: Record<string, string> = {
  contribution: 'bg-purple-100 text-purple-800 border-purple-200',
  payout: 'bg-orange-100 text-orange-800 border-orange-200',
}

const statusStyles: Record<string, string> = {
  completed: 'bg-green-100 text-green-800 border-green-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
  transferred: 'bg-blue-100 text-blue-800 border-blue-200',
}

const paymentMethodLabels: Record<string, string> = {
  'mobile-money': 'Mobile Money',
  bank: 'Bank',
  cash: 'Cash',
  card: 'Card',
  'apple-pay': 'Apple Pay',
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function RecentTransactionsTable({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        No transactions yet
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Contributor</TableHead>
          <TableHead>Jar</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((tx) => {
          const jarName = typeof tx.jar === 'object' && tx.jar ? tx.jar.name : '—'
          return (
            <TableRow key={tx.id}>
              <TableCell className="font-medium">{tx.contributor || '—'}</TableCell>
              <TableCell className="max-w-[120px] truncate">{jarName}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn('capitalize', typeStyles[tx.type])}
                >
                  {tx.type}
                </Badge>
              </TableCell>
              <TableCell>{tx.paymentMethod ? paymentMethodLabels[tx.paymentMethod] || tx.paymentMethod : '—'}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn('capitalize', statusStyles[tx.paymentStatus])}
                >
                  {tx.paymentStatus}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-medium">
                GHS {tx.amountContributed.toFixed(2)}
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDate(tx.createdAt)}</TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
