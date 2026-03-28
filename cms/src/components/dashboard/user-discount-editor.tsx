'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateUserDiscountPercent } from '@/app/(dashboard)/dashboard/users/actions'

export function UserDiscountEditor({
  userId,
  currentDiscount,
}: {
  userId: string
  currentDiscount: number
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(currentDiscount))

  const handleSave = () => {
    const parsed = parseFloat(value)
    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
      toast.error('Enter a value between 0 and 100')
      return
    }
    startTransition(async () => {
      const result = await updateUserDiscountPercent(userId, parsed)
      if (result.success) {
        toast.success(result.message)
        setEditing(false)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  const handleCancel = () => {
    setValue(String(currentDiscount))
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {currentDiscount}%
        </span>
        <button
          onClick={() => setEditing(true)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Edit discount"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <Input
        type="number"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave()
          if (e.key === 'Escape') handleCancel()
        }}
        className="h-7 w-20 text-sm px-2"
        autoFocus
        disabled={isPending}
      />
      <span className="text-sm text-muted-foreground">%</span>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7"
        onClick={handleSave}
        disabled={isPending}
      >
        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 text-green-500" />}
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7"
        onClick={handleCancel}
        disabled={isPending}
      >
        <X className="h-3.5 w-3.5 text-destructive" />
      </Button>
    </div>
  )
}
