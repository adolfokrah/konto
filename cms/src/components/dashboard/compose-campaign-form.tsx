'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Clock, Plus, X, Search, Users, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
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
    targetAudience?: 'all' | 'selected'
    recipients?: SelectedUser[]
  } | null
}) {
  const router = useRouter()
  const [title, setTitle] = useState(prefill?.title || '')
  const [message, setMessage] = useState(prefill?.message || '')
  const [dataEntries, setDataEntries] = useState<{ key: string; value: string }[]>(
    prefill?.data ? Object.entries(prefill.data).map(([key, value]) => ({ key, value })) : [],
  )
  const [targetAudience, setTargetAudience] = useState<'all' | 'selected'>(
    prefill?.targetAudience || 'all',
  )
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>(prefill?.recipients || [])
  const [userSearch, setUserSearch] = useState('')
  const [searchResults, setSearchResults] = useState<SelectedUser[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

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

        {/* Target Audience */}
        <div className="space-y-3">
          <Label>Target Audience</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={targetAudience === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTargetAudience('all')}
            >
              <Users className="mr-1.5 h-3.5 w-3.5" />
              All Users
            </Button>
            <Button
              type="button"
              variant={targetAudience === 'selected' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTargetAudience('selected')}
            >
              <User className="mr-1.5 h-3.5 w-3.5" />
              Selected Users
            </Button>
          </div>
        </div>

        {/* User Search & Selection */}
        {targetAudience === 'selected' && (
          <div className="space-y-3">
            <Label>Select Users</Label>

            {/* Selected user tags */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedUsers.map((user) => (
                  <Badge
                    key={user.id}
                    variant="secondary"
                    className="flex items-center gap-1 py-1 pl-2 pr-1"
                  >
                    <span className="text-xs">
                      {user.name} {user.email && `(${user.email})`}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeUser(user.id)}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={userSearch}
                onChange={(e) => handleUserSearch(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowResults(true)
                }}
                onBlur={() => {
                  // Delay to allow click on result
                  setTimeout(() => setShowResults(false), 200)
                }}
                className="pl-9"
              />
              {searching && (
                <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">
                  Searching...
                </span>
              )}

              {/* Search results dropdown */}
              {showResults && searchResults.length > 0 && (
                <div
                  ref={resultsRef}
                  className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md"
                >
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => addUser(user)}
                    >
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">{user.name}</span>
                      <span className="text-muted-foreground">{user.email}</span>
                    </button>
                  ))}
                </div>
              )}

              {showResults && searchResults.length === 0 && userSearch.trim().length >= 2 && !searching && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover p-3 text-center text-sm text-muted-foreground shadow-md">
                  No users found
                </div>
              )}
            </div>

            {selectedUsers.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>
        )}

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
