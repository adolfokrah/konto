'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RefreshCw, Loader2 } from 'lucide-react'
import { checkDiditKycStatus, updateUserKycStatus } from '@/app/(dashboard)/dashboard/users/actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function UserKycActions({
  userId,
  kycSessionId,
  currentStatus,
}: {
  userId: string
  kycSessionId: string | null
  currentStatus: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isChecking, setIsChecking] = useState(false)

  const handleCheckKyc = async () => {
    if (!kycSessionId) return
    setIsChecking(true)
    try {
      const result = await checkDiditKycStatus(userId, kycSessionId)
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Failed to check KYC status')
    } finally {
      setIsChecking(false)
    }
  }

  const handleUpdateKyc = (newStatus: string) => {
    startTransition(async () => {
      try {
        const result = await updateUserKycStatus(
          userId,
          newStatus as 'none' | 'in_review' | 'verified',
        )
        if (result.success) {
          toast.success(result.message)
          router.refresh()
        } else {
          toast.error(result.message)
        }
      } catch {
        toast.error('Failed to update KYC status')
      }
    })
  }

  return (
    <div className="space-y-3">
      {kycSessionId && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleCheckKyc}
          disabled={isChecking}
        >
          {isChecking ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
          )}
          Check Didit KYC Status
        </Button>
      )}

      <div className="flex items-center gap-2">
        <Select onValueChange={handleUpdateKyc} disabled={isPending}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Update KYC status..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Not Verified</SelectItem>
            <SelectItem value="in_review">In Review</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
          </SelectContent>
        </Select>
        {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
    </div>
  )
}
