'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Search, Users, User, X } from 'lucide-react'
import { FaAndroid, FaApple } from 'react-icons/fa'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { createAndSendSmsCampaign, searchUsers } from '@/app/(dashboard)/dashboard/sms/actions'

type SelectedUser = { id: string; name: string; email: string }

const MAX_CHARS = 200

export function ComposeSmsForm({
  prefill,
}: {
  prefill?: {
    message: string
    targetAudience?: 'all' | 'selected' | 'android' | 'ios'
    recipients?: SelectedUser[]
  } | null
}) {
  const router = useRouter()
  const [message, setMessage] = useState(prefill?.message ?? '')
  const [targetAudience, setTargetAudience] = useState<'all' | 'selected' | 'android' | 'ios'>(prefill?.targetAudience ?? 'all')
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>(prefill?.recipients ?? [])
  const [userSearch, setUserSearch] = useState('')
  const [searchResults, setSearchResults] = useState<SelectedUser[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
    if (!message.trim()) {
      toast.error('Please enter a message')
      return
    }
    if (message.trim().length > MAX_CHARS) {
      toast.error(`Message must be ${MAX_CHARS} characters or less`)
      return
    }
    if (targetAudience === 'selected' && selectedUsers.length === 0) {
      toast.error('Please select at least one user')
      return
    }

    setSubmitting(true)
    try {
      const result = await createAndSendSmsCampaign({
        message: message.trim(),
        targetAudience,
        recipients: targetAudience === 'selected' ? selectedUsers.map((u) => u.id) : undefined,
      })

      if (result.success) {
        toast.success(result.message)
        router.push('/dashboard/sms')
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const remaining = MAX_CHARS - message.length

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Compose SMS</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Message */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="message">Message</Label>
            <span className={`text-xs tabular-nums ${remaining < 0 ? 'text-destructive' : remaining < 20 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
              {remaining} remaining
            </span>
          </div>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your SMS message..."
            rows={4}
            maxLength={MAX_CHARS}
          />
        </div>

        {/* Target Audience */}
        <div className="space-y-3">
          <Label>Target Audience</Label>
          <div className="flex flex-wrap gap-2">
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
              variant={targetAudience === 'android' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTargetAudience('android')}
            >
              <FaAndroid size={14} className="mr-1.5" />
              Android
            </Button>
            <Button
              type="button"
              variant={targetAudience === 'ios' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTargetAudience('ios')}
            >
              <FaApple size={14} className="mr-1.5" />
              iOS
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

        {/* User selection */}
        {targetAudience === 'selected' && (
          <div className="space-y-3">
            <Label>Select Users</Label>

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

            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name, email or phone..."
                value={userSearch}
                onChange={(e) => handleUserSearch(e.target.value)}
                onFocus={() => { if (searchResults.length > 0) setShowResults(true) }}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
                className="pl-9"
              />
              {searching && (
                <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">
                  Searching...
                </span>
              )}

              {showResults && searchResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
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

        <Button
          onClick={handleSubmit}
          disabled={submitting || message.length === 0 || remaining < 0}
          className="w-full"
        >
          {submitting ? (
            'Sending...'
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send SMS
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
