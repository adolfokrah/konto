'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/ui'
import { PageHeader } from '@/components/dashboard/page-header'
import {
  Field,
  FieldLabel,
  RecipientPicker,
  Segmented,
  SmsPreview,
  fieldInputClass,
} from '@/components/dashboard/form-kit'
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
  const [targetAudience, setTargetAudience] = useState<'all' | 'selected' | 'android' | 'ios'>(
    prefill?.targetAudience ?? 'all',
  )
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
    <div className="space-y-4">
      <PageHeader
        title="New SMS"
        subtitle="Sent from HOGAPAY"
        actions={
          <Button
            onClick={handleSubmit}
            disabled={submitting || message.length === 0 || remaining < 0}
          >
            <Send className="h-4 w-4" />
            {submitting ? 'Sending…' : 'Send SMS'}
          </Button>
        }
      />

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
        <div className="space-y-3 rounded-2xl bg-card p-4">
          <div>
            <Field label="Message" htmlFor="message" className="min-h-[128px] justify-start">
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your SMS message..."
                rows={4}
                maxLength={MAX_CHARS}
                className={fieldInputClass}
              />
            </Field>
            <div className="mt-2 flex justify-between text-[12px] text-muted-foreground">
              <span
                className={cn(
                  'tabular-nums',
                  remaining < 0 && 'text-destructive',
                  remaining >= 0 && remaining < 20 && 'text-[#D9840A]',
                )}
              >
                {message.length} / {MAX_CHARS} characters
              </span>
              <span>Sender: HOGAPAY</span>
            </div>
          </div>

          <div>
            <FieldLabel>Audience</FieldLabel>
            <Segmented
              value={targetAudience}
              onChange={setTargetAudience}
              options={[
                { value: 'all', label: 'All users' },
                { value: 'android', label: 'Android' },
                { value: 'ios', label: 'iOS' },
                { value: 'selected', label: 'Selected' },
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
              placeholder="Search users by name, email or phone"
            />
          )}
        </div>

        <SmsPreview message={message} />
      </div>
    </div>
  )
}
