import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utilities/ui'

export type CollectorRow = {
  id: string
  name: string
  email: string
  phone: string
  status: string
  role: string
}

const collectorStatusStyles: Record<string, string> = {
  accepted: 'bg-green-100 text-green-800 border-green-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
}

const collectorRoleStyles: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800 border-purple-200',
  member: 'bg-gray-100 text-gray-800 border-gray-200',
}

export const collectorColumns: ColumnDef<CollectorRow, any>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span>,
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.phone}</span>,
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => (
      <Badge variant="outline" className={cn('capitalize', collectorRoleStyles[row.original.role])}>
        {row.original.role}
      </Badge>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant="outline" className={cn('capitalize', collectorStatusStyles[row.original.status])}>
        {row.original.status}
      </Badge>
    ),
  },
]
