'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, User, ArrowLeftRight, FileText, ShieldAlert, Container, CreditCard, History } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/utilities/ui'
import { type DisputeRow } from './data-table/columns/dispute-columns'
import { ImageViewer, type ImageViewerImage } from '@/components/ui/image-viewer'

const statusStyles: Record<string, string> = {
  open: 'bg-blue-900/40 text-blue-300 border-blue-700',
  'under-review': 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
  resolved: 'bg-green-900/40 text-green-300 border-green-700',
  rejected: 'bg-red-900/40 text-red-300 border-red-700',
}

const txStatusStyles: Record<string, string> = {
  completed: 'bg-green-900/40 text-green-300 border-green-700',
  pending: 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
  failed: 'bg-red-900/40 text-red-300 border-red-700',
}

const statusLabel: Record<string, string> = {
  open: 'Open',
  'under-review': 'Under Review',
  resolved: 'Resolved',
  rejected: 'Rejected',
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((r) => r.json())

export function DisputeDetailSheet({
  selected,
  onClose,
}: {
  selected: DisputeRow | null
  onClose: () => void
}) {
  const router = useRouter()
  const [newStatus, setNewStatus] = useState<string>('')
  const [statusChangeReason, setStatusChangeReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)

  const { data: detail, isLoading } = useSWR(
    selected ? `/api/disputes/${selected.id}?depth=3` : null,
    fetcher,
  )

  const handleOpen = () => {
    setNewStatus('')
    setStatusChangeReason('')
  }

  const handleSave = async () => {
    if (!selected || !newStatus || !statusChangeReason.trim()) return
    setSaving(true)
    try {
      const body: Record<string, any> = {
        status: newStatus,
        _statusChangeReason: statusChangeReason.trim(),
      }
      if (['resolved', 'rejected'].includes(newStatus)) {
        body.resolutionNote = statusChangeReason.trim()
      }
      const res = await fetch(`/api/disputes/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to update')
      toast.success('Dispute status updated')
      onClose()
      router.refresh()
    } catch {
      toast.error('Failed to update dispute')
    } finally {
      setSaving(false)
    }
  }

  const currentStatus = detail?.status ?? selected?.status ?? ''
  const canChangeStatus = !['resolved', 'rejected'].includes(currentStatus)
  const statusHistory: any[] = detail?.statusHistory ?? []

  const evidence: any[] = detail?.evidence ?? []
  const raisedBy = typeof detail?.raisedBy === 'object' ? detail.raisedBy : null
  const transaction = typeof detail?.transaction === 'object' ? detail.transaction : null
  const jar = transaction && typeof transaction.jar === 'object' ? transaction.jar : null
  const resolvedBy = typeof detail?.resolvedBy === 'object' ? detail.resolvedBy : null

  const viewerImages: ImageViewerImage[] = evidence
    .map((item: any) => {
      const img = typeof item.image === 'object' ? item.image : null
      return img?.url ? { url: img.url, alt: img.filename ?? 'Evidence' } : null
    })
    .filter(Boolean) as ImageViewerImage[]

  return (
    <>
    <Sheet
      open={!!selected}
      onOpenChange={(open) => {
        if (!open) onClose()
        else handleOpen()
      }}
    >
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        {selected && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-2">
                <SheetTitle className="text-base flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-orange-400" />
                  Dispute
                </SheetTitle>
                {!isLoading && (
                  <Badge variant="outline" className={cn(statusStyles[currentStatus])}>
                    {statusLabel[currentStatus] ?? currentStatus}
                  </Badge>
                )}
              </div>
              <SheetDescription className="font-mono text-xs">{selected.id}</SheetDescription>
            </SheetHeader>

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                {/* Who & When */}
                <div>
                  <h4 className="text-sm font-semibold mb-1">Details</h4>
                  <Separator className="mb-2" />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-1">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        Raised By
                      </span>
                      {raisedBy ? (
                        <Link
                          href={`/dashboard/users/${raisedBy.id}`}
                          className="font-medium hover:underline"
                        >
                          {[raisedBy.firstName, raisedBy.lastName].filter(Boolean).join(' ') ||
                            raisedBy.email}
                        </Link>
                      ) : (
                        <span className="font-medium">{selected.raisedByName}</span>
                      )}
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Date</span>
                      <span className="font-medium text-right max-w-[60%]">
                        {formatDate(selected.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-sm font-semibold mb-1 flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5" />
                    Description
                  </h4>
                  <Separator className="mb-2" />
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {detail?.description}
                  </p>
                </div>

                {/* Evidence */}
                {evidence.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Evidence</h4>
                    <Separator className="mb-2" />
                    <div className="flex flex-wrap gap-2">
                      {viewerImages.map((img, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => { setViewerIndex(i); setViewerOpen(true) }}
                          className="block w-20 h-20 rounded-md overflow-hidden border border-border hover:opacity-80 transition-opacity cursor-zoom-in"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.url}
                            alt={img.alt ?? `Evidence ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Related Transaction */}
                {transaction && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1 flex items-center gap-2">
                      <ArrowLeftRight className="h-3.5 w-3.5" />
                      Related Transaction
                    </h4>
                    <Separator className="mb-2" />
                    <div className="space-y-0 text-sm">
                      <div className="flex justify-between py-1">
                        <span className="text-muted-foreground">ID</span>
                        <Link
                          href={`/dashboard/transactions?id=${transaction.id}`}
                          className="font-mono text-xs font-medium hover:underline"
                        >
                          {transaction.id}
                        </Link>
                      </div>
                      {transaction.contributor && (
                        <div className="flex justify-between py-1">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-3.5 w-3.5" />
                            Contributor
                          </span>
                          <span className="font-medium">{transaction.contributor}</span>
                        </div>
                      )}
                      {jar && (
                        <div className="flex justify-between py-1">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Container className="h-3.5 w-3.5" />
                            Jar
                          </span>
                          <Link href={`/dashboard/jars/${jar.id}`} className="font-medium hover:underline">
                            {jar.name}
                          </Link>
                        </div>
                      )}
                      {transaction.amountContributed != null && (
                        <div className="flex justify-between py-1">
                          <span className="text-muted-foreground">Amount</span>
                          <span className="font-semibold">
                            GHS {Math.abs(transaction.amountContributed).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                      {transaction.paymentMethod && (
                        <div className="flex justify-between py-1">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <CreditCard className="h-3.5 w-3.5" />
                            Payment Method
                          </span>
                          <span className="font-medium">{transaction.paymentMethod}</span>
                        </div>
                      )}
                      {transaction.mobileMoneyProvider && (
                        <div className="flex justify-between py-1">
                          <span className="text-muted-foreground">Provider</span>
                          <span className="font-medium capitalize">{transaction.mobileMoneyProvider}</span>
                        </div>
                      )}
                      {transaction.paymentStatus && (
                        <div className="flex justify-between py-1">
                          <span className="text-muted-foreground">Status</span>
                          <Badge variant="outline" className={cn(txStatusStyles[transaction.paymentStatus] ?? '')}>
                            {transaction.paymentStatus}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Resolution */}
                {(resolvedBy || detail?.resolutionNote) && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Resolution</h4>
                    <Separator className="mb-2" />
                    {resolvedBy && (
                      <div className="flex justify-between py-1 text-sm">
                        <span className="text-muted-foreground">
                          {currentStatus === 'rejected' ? 'Rejected By' : 'Resolved By'}
                        </span>
                        <Link
                          href={`/dashboard/users/${resolvedBy.id}`}
                          className="font-medium hover:underline"
                        >
                          {[resolvedBy.firstName, resolvedBy.lastName].filter(Boolean).join(' ') ||
                            resolvedBy.email}
                        </Link>
                      </div>
                    )}
                    {detail?.resolutionNote && (
                      <div className="rounded-md bg-muted/40 px-3 py-2 mt-1">
                        <p className="text-xs text-muted-foreground mb-0.5">Note</p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{detail.resolutionNote}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Status History */}
                {statusHistory.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1 flex items-center gap-2">
                      <History className="h-3.5 w-3.5" />
                      Status History
                    </h4>
                    <Separator className="mb-2" />
                    <div className="space-y-2">
                      {statusHistory.map((entry: any, i: number) => {
                        const admin = typeof entry.changedBy === 'object' ? entry.changedBy : null
                        const adminName = admin
                          ? [admin.firstName, admin.lastName].filter(Boolean).join(' ') || admin.email
                          : '—'
                        return (
                          <div key={i} className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5">
                                <Badge variant="outline" className={cn('text-xs', statusStyles[entry.from])}>
                                  {statusLabel[entry.from] ?? entry.from}
                                </Badge>
                                <span className="text-muted-foreground text-xs">→</span>
                                <Badge variant="outline" className={cn('text-xs', statusStyles[entry.to])}>
                                  {statusLabel[entry.to] ?? entry.to}
                                </Badge>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {entry.changedAt ? new Date(entry.changedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground italic">"{entry.reason}"</p>
                            <p className="text-xs text-muted-foreground mt-0.5">by {adminName}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Update Status */}
                {canChangeStatus && (
                  <div>
                    <Separator className="mb-4" />
                    <Dialog onOpenChange={(open) => { if (open) handleOpen() }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">Update Status</Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Update Dispute Status</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="space-y-1.5">
                            <Label>New Status</Label>
                            <Select value={newStatus} onValueChange={setNewStatus}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose new status…" />
                              </SelectTrigger>
                              <SelectContent>
                                {currentStatus !== 'under-review' && (
                                  <SelectItem value="under-review">Under Review</SelectItem>
                                )}
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label>Reason <span className="text-destructive">*</span></Label>
                            <Textarea
                              placeholder="Explain why the status is being changed…"
                              value={statusChangeReason}
                              onChange={(e) => setStatusChangeReason(e.target.value)}
                              rows={3}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            className="w-full"
                            disabled={!newStatus || !statusChangeReason.trim() || saving}
                            onClick={handleSave}
                          >
                            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {saving ? 'Saving…' : 'Save Changes'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
    <ImageViewer
      images={viewerImages}
      initialIndex={viewerIndex}
      open={viewerOpen}
      onClose={() => setViewerOpen(false)}
    />
    </>
  )
}
