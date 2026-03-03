'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet'

export default function ReportJarButton({ jarId }: { jarId: string }) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [reporterName, setReporterName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error('Please enter a reason for your report')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/jar-reports/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jarId,
          message: message.trim(),
          ...(reporterName.trim() ? { reporterName: reporterName.trim() } : {}),
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Report submitted successfully')
        setMessage('')
        setReporterName('')
        setOpen(false)
      } else {
        toast.error(data.message || 'Failed to submit report')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="text-sm text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors">
          Report this jar
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Report Jar</SheetTitle>
          <SheetDescription>Tell us why you want to report this jar.</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Your name (optional)
            </label>
            <input
              type="text"
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              placeholder="Enter your name"
              className="flex h-10 w-full rounded border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Reason for report
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the issue..."
              rows={4}
            />
          </div>
          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
