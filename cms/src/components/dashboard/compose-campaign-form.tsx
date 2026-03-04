'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Clock, Plus, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import {
  createAndSendCampaign,
  createAndScheduleCampaign,
} from '@/app/(dashboard)/dashboard/push-notifications/actions'

export function ComposeCampaignForm({
  prefill,
}: {
  prefill?: { title: string; message: string; data?: Record<string, string> } | null
}) {
  const router = useRouter()
  const [title, setTitle] = useState(prefill?.title || '')
  const [message, setMessage] = useState(prefill?.message || '')
  const [dataEntries, setDataEntries] = useState<{ key: string; value: string }[]>(
    prefill?.data ? Object.entries(prefill.data).map(([key, value]) => ({ key, value })) : [],
  )
  const [schedule, setSchedule] = useState(false)
  const [scheduledFor, setScheduledFor] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title')
      return
    }
    if (!message.trim()) {
      toast.error('Please enter a message')
      return
    }
    if (schedule && !scheduledFor) {
      toast.error('Please select a date and time to schedule')
      return
    }

    setSubmitting(true)
    try {
      // Build data payload from key-value entries
      const dataPayload: Record<string, string> = {}
      for (const entry of dataEntries) {
        if (entry.key.trim()) {
          dataPayload[entry.key.trim()] = entry.value.trim()
        }
      }
      const hasData = Object.keys(dataPayload).length > 0

      let result
      if (schedule) {
        result = await createAndScheduleCampaign({
          title: title.trim(),
          message: message.trim(),
          scheduledFor: new Date(scheduledFor).toISOString(),
          data: hasData ? dataPayload : undefined,
        })
      } else {
        result = await createAndSendCampaign({
          title: title.trim(),
          message: message.trim(),
          data: hasData ? dataPayload : undefined,
        })
      }

      if (result.success) {
        toast.success(result.message)
        router.push('/dashboard/push-notifications')
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Compose Push Notification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Notification title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Notification message..."
            rows={4}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Custom Data</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDataEntries([...dataEntries, { key: '', value: '' }])}
            >
              <Plus className="mr-1 h-3 w-3" />
              Add Field
            </Button>
          </div>
          {dataEntries.length > 0 && (
            <div className="space-y-2">
              {dataEntries.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder="Key"
                    value={entry.key}
                    onChange={(e) => {
                      const updated = [...dataEntries]
                      updated[index].key = e.target.value
                      setDataEntries(updated)
                    }}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Value"
                    value={entry.value}
                    onChange={(e) => {
                      const updated = [...dataEntries]
                      updated[index].value = e.target.value
                      setDataEntries(updated)
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDataEntries(dataEntries.filter((_, i) => i !== index))}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          {dataEntries.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Optional key-value pairs sent with the notification
            </p>
          )}
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="schedule" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Schedule for later
            </Label>
            <p className="text-sm text-muted-foreground">
              Set a date and time to send this notification
            </p>
          </div>
          <Switch id="schedule" checked={schedule} onCheckedChange={setSchedule} />
        </div>

        {schedule && (
          <div className="space-y-2">
            <Label htmlFor="scheduledFor">Send at</Label>
            <Input
              id="scheduledFor"
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>
        )}

        <Button onClick={handleSubmit} disabled={submitting} className="w-full">
          {submitting ? (
            schedule ? 'Scheduling...' : 'Sending...'
          ) : schedule ? (
            <>
              <Clock className="mr-2 h-4 w-4" />
              Schedule Campaign
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send Now
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
