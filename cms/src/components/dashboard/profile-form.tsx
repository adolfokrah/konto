'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Eye, EyeOff } from 'lucide-react'

function PasswordInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-10"
      />
      <button
        type="button"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setShow((s) => !s)}
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

type Props = {
  user: { id: string; firstName?: string | null; lastName?: string | null; email?: string | null }
}

export function ProfileForm({ user }: Props) {
  const [details, setDetails] = useState({
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    email: user.email ?? '',
  })
  const [password, setPassword] = useState({ current: '', next: '', confirm: '' })
  const [savingDetails, setSavingDetails] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const handleSaveDetails = async () => {
    setSavingDetails(true)
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ firstName: details.firstName, lastName: details.lastName, email: details.email }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.errors?.[0]?.message ?? `Failed (${res.status})`)
      }
      toast.success('Profile updated')
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to update profile')
    } finally {
      setSavingDetails(false)
    }
  }

  const handleChangePassword = async () => {
    if (password.next !== password.confirm) {
      toast.error('New passwords do not match')
      return
    }
    if (!password.next) {
      toast.error('New password is required')
      return
    }
    setSavingPassword(true)
    try {
      const res = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ oldPassword: password.current, newPassword: password.next }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.errors?.[0]?.message ?? err?.message ?? `Failed (${res.status})`)
      }
      toast.success('Password changed')
      setPassword({ current: '', next: '', confirm: '' })
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to change password')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>First Name</Label>
              <Input value={details.firstName} onChange={(e) => setDetails((p) => ({ ...p, firstName: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Last Name</Label>
              <Input value={details.lastName} onChange={(e) => setDetails((p) => ({ ...p, lastName: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={details.email} onChange={(e) => setDetails((p) => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveDetails} disabled={savingDetails}>
              {savingDetails && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {savingDetails ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Current Password</Label>
            <PasswordInput value={password.current} onChange={(v) => setPassword((p) => ({ ...p, current: v }))} />
          </div>
          <div className="space-y-1.5">
            <Label>New Password</Label>
            <PasswordInput value={password.next} onChange={(v) => setPassword((p) => ({ ...p, next: v }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Confirm New Password</Label>
            <PasswordInput value={password.confirm} onChange={(v) => setPassword((p) => ({ ...p, confirm: v }))} />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleChangePassword} disabled={savingPassword}>
              {savingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {savingPassword ? 'Changing…' : 'Change Password'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
