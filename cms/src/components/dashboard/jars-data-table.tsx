'use client'

import { useRouter } from 'next/navigation'
import { MoreHorizontal, Snowflake } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { DataTable } from './data-table/data-table'
import { jarColumns, type JarRow } from './data-table/columns/jar-columns'
import { toggleJarFreeze } from '@/app/(dashboard)/dashboard/jars/actions'
import { type PaginationProps } from './data-table/types'

export function JarsDataTable({
  jars,
  pagination,
}: {
  jars: JarRow[]
  pagination?: PaginationProps
}) {
  const router = useRouter()

  return (
    <DataTable
      columns={jarColumns}
      data={jars}
      pagination={pagination}
      onRowClick={(jar) => router.push(`/dashboard/jars/${jar.id}`)}
      renderRowActions={(jar) => (
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
      )}
    />
  )
}
