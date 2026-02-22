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

export function JarActions({ jarId, status }: { jarId: string; status: string }) {
  const isFrozen = status === 'frozen'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
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
