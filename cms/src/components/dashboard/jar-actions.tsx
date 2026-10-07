'use client'

import { Snowflake, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toggleJarFreeze } from '@/app/(dashboard)/dashboard/jars/actions'
import { toast } from 'sonner'
import { useIsAdmin } from '@/components/dashboard/dashboard-user-context'

export function JarActions({ jarId, status }: { jarId: string; status: string }) {
  const isFrozen = status === 'frozen'
  const isAdmin = useIsAdmin()

  if (!isAdmin) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-10 rounded-xl bg-card px-4 text-[13.5px] font-semibold"
        >
          <MoreHorizontal className="mr-2 h-4 w-4" />
          Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={async () => {
            const result = await toggleJarFreeze(jarId, !isFrozen)
            if (result.success) {
              toast.success(result.message)
            } else {
              toast.error(result.message)
            }
          }}
        >
          <Snowflake className="mr-2 h-4 w-4" />
          {isFrozen ? 'Unfreeze Jar' : 'Freeze Jar'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
