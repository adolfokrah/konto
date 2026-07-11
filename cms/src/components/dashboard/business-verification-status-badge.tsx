import { Badge } from '@/components/ui/badge'
import { cn } from '@/utilities/ui'

const statusStyles: Record<string, string> = {
  pending: 'bg-blue-900/40 text-blue-300 border-blue-700',
  'under-review': 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
  approved: 'bg-green-900/40 text-green-300 border-green-700',
  rejected: 'bg-red-900/40 text-red-300 border-red-700',
}

const statusLabel: Record<string, string> = {
  pending: 'Pending',
  'under-review': 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
}

export function BusinessVerificationStatusBadge({
  status,
  className,
}: {
  status: string
  className?: string
}) {
  return (
    <Badge variant="outline" className={cn('capitalize', statusStyles[status], className)}>
      {statusLabel[status] ?? status}
    </Badge>
  )
}
