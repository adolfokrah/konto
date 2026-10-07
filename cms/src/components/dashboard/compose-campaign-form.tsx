'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Clock, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { PageHeader } from '@/components/dashboard/page-header'
import {
  Field,
  FieldLabel,
  PushPreview,
  RecipientPicker,
  Segmented,
  fieldInputClass,
} from '@/components/dashboard/form-kit'
import { toast } from 'sonner'
import {
  createAndSendCampaign,
  createAndScheduleCampaign,
  searchUsers,
} from '@/app/(dashboard)/dashboard/push-notifications/actions'

type SelectedUser = { id: string; name: string; email: string }

export function ComposeCampaignForm({
  prefill,
}: {
  prefill?: {
    title: string
    message: string
    data?: Record<string, string>
    targetAudience?: 'all' | 'selected' | 'android' | 'ios'
    recipients?: SelectedUser[]
  } | null
}) {
  const router = useRouter()
  const [title, setTitle] = useState(prefill?.title || '')
  const [message, setMessage] = useState(prefill?.message || '')
  const [dataEntries, setDataEntries] = useState<{ key: string; value: string }[]>(
    prefill?.data ? Object.entries(prefill.data).map(([key, value]) => ({ key, value })) : [],
  )
  const [targetAudience, setTargetAudience] = useState<'all' | 'selected' | 'android' | 'ios'>(
    prefill?.targetAudience || 'all',
  )
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>(prefill?.recipients || [])
  const [userSearch, setUserSearch] = useState('')
  const [searchResults, setSearchResults] = useState<SelectedUser[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [schedule, setSchedule] = useState(false)
  const [scheduledFor, setScheduledFor] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleUserSearch = useCallback(
    (query: string) => {
      setUserSearch(query)
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)

      if (query.trim().length < 2) {
        setSearchResults([])
        setShowResults(false)
        return
      }

      setSearching(true)
      searchTimeoutRef.current = setTimeout(async () => {
        const results = await searchUsers(query)
        // Filter out already selected users
        const filtered = results.filter(
          (r: SelectedUser) => !selectedUsers.some((s) => s.id === r.id),
        )
        setSearchResults(filtered)
        setShowResults(true)
        setSearching(false)
      }, 300)
    },
    [selectedUsers],
  )

  const addUser = (user: SelectedUser) => {
    setSelectedUsers((prev) => [...prev, user])
    setUserSearch('')
    setSearchResults([])
    setShowResults(false)
  }

  const removeUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId))
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title')
      return
    }
    if (!message.trim()) {
      toast.error('Please enter a message')
      return
    }
    if (targetAudience === 'selected' && selectedUsers.length === 0) {
      toast.error('Please select at least one user')
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
          targetAudience,
          recipients: targetAudience === 'selected' ? selectedUsers.map((u) => u.id) : undefined,
        })
      } else {
        result = await createAndSendCampaign({
          title: title.trim(),
          message: message.trim(),
          data: hasData ? dataPayload : undefined,
          targetAudience,
          recipients: targetAudience === 'selected' ? selectedUsers.map((u) => u.id) : undefined,
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

  const submitLabel = submitting
    ? schedule
      ? 'Scheduling…'
      : 'Sending…'
    : schedule
      ? 'Schedule campaign'
      : 'Send now'

  return (
    <div className="space-y-4">
      <PageHeader
        title="New campaign"
        subtitle="Push notification"
        actions={
          <Button onClick={handleSubmit} disabled={submitting}>
            {schedule ? <Clock className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            {submitLabel}
          </Button>
        }
      />

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
        <div className="space-y-3 rounded-2xl bg-card p-4">
          <Field label="Title" htmlFor="title">
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title"
              className={fieldInputClass}
            />
          </Field>

          <Field label="Message" htmlFor="message" className="min-h-[104px] justify-start">
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What do you want to tell people?"
              rows={3}
              className={fieldInputClass}
            />
          </Field>

          <div>
            <FieldLabel>Target audience</FieldLabel>
            <Segmented
              value={targetAudience}
              onChange={setTargetAudience}
              options={[
                { value: 'all', label: 'All users' },
                { value: 'android', label: 'Android' },
                { value: 'ios', label: 'iOS' },
                { value: 'selected', label: 'Selected users' },
              ]}
            />
          </div>

          {targetAudience === 'selected' && (
            <RecipientPicker
              selected={selectedUsers}
              onRemove={removeUser}
              query={userSearch}
              onQuery={handleUserSearch}
              results={searchResults}
              onPick={addUser}
              searching={searching}
              open={showResults}
              setOpen={setShowResults}
            />
          )}

          <div>
            <div className="flex items-center justify-between">
              <FieldLabel>Custom data</FieldLabel>
              <button
                type="button"
                onClick={() => setDataEntries([...dataEntries, { key: '', value: '' }])}
                className="inline-flex items-center gap-1 text-[12px] font-semibold"
              >
                <Plus className="h-3.5 w-3.5" />
                Add field
              </button>
            </div>
            {dataEntries.length === 0 ? (
              <p className="text-[12px] text-muted-foreground">
                Optional key-value pairs sent with the notification, e.g. screen = jar_detail
              </p>
            ) : (
              <div className="space-y-2">
                {dataEntries.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Field label="Key" className="flex-1">
                      <input
                        value={entry.key}
                        onChange={(e) => {
                          const updated = [...dataEntries]
                          updated[index].key = e.target.value
                          setDataEntries(updated)
                        }}
                        placeholder="screen"
                        className={fieldInputClass}
                      />
                    </Field>
                    <Field label="Value" className="flex-1">
                      <input
                        value={entry.value}
                        onChange={(e) => {
                          const updated = [...dataEntries]
                          updated[index].value = e.target.value
                          setDataEntries(updated)
                        }}
                        placeholder="jar_detail"
                        className={fieldInputClass}
                      />
                    </Field>
                    <button
                      type="button"
                      aria-label="Remove field"
                      onClick={() => setDataEntries(dataEntries.filter((_, i) => i !== index))}
                      className="flex h-9 w-9 items-center justify-center rounded-[10px] text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Switch id="schedule" checked={schedule} onCheckedChange={setSchedule} />
            <label htmlFor="schedule" className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-semibold">Schedule for later</span>
              <span className="block text-[12px] text-muted-foreground">
                Set a date and time to send this notification
              </span>
            </label>
            {schedule && (
              <Field label="Send at" htmlFor="scheduledFor" className="w-[260px]">
                <input
                  id="scheduledFor"
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className={fieldInputClass}
                />
              </Field>
            )}
          </div>
        </div>

        <PushPreview title={title} message={message} />
      </div>
    </div>
  )
}
