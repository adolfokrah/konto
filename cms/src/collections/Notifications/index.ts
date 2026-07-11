import { authenticated } from '@/access/authenticated'
import type { CollectionConfig } from 'payload'
import { sendPushNotification } from './hooks/send-push-notification'
import { sendJarInviteReminder } from './endpoints/send-jar-invite-reminder'
import { cleanupOldNotifications } from './endpoints/cleanup-old-notifications'

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  admin: {
    useAsTitle: 'message',
  },
  access: {
    // Users can only read/update their own notifications; admins/auditors see all.
    read: ({ req: { user } }) => {
      const role = (user as any)?.role
      if (role === 'admin' || role === 'auditor') return true
      if (user) return { user: { equals: user.id } }
      return false
    },
    create: authenticated,
    update: ({ req: { user } }) => {
      if ((user as any)?.role === 'admin') return true
      if (user) return { user: { equals: user.id } }
      return false
    },
    delete: authenticated,
  },
  fields: [
    {
      name: 'type',
      type: 'select',
      defaultValue: 'jarInvite',
      label: 'Type',
      options: [
        { label: 'Jar Invitation', value: 'jarInvite' },
        { label: 'Info', value: 'info' },
        { label: 'KYC', value: 'kyc' },
        { label: 'KYB', value: 'kyb' },
        { label: 'Jar Frozen', value: 'jarFrozen' },
        { label: 'Payout Approval', value: 'payout-approval' },
      ],
      required: true,
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'message',
      type: 'text',
      required: true,
    },
    {
      name: 'data',
      type: 'json',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'unread',
      label: 'Status',
      options: [
        { label: 'Read', value: 'read' },
        { label: 'Unread', value: 'unread' },
      ],
      required: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
  ],
  endpoints: [
    {
      path: '/send-jar-reminder',
      method: 'post',
      handler: sendJarInviteReminder,
    },
    {
      path: '/cleanup-old-notifications',
      method: 'post',
      handler: cleanupOldNotifications,
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        // Auto-mark info notifications as read on creation (no user action needed)
        if (operation === 'create' && data?.type === 'info') {
          data.status = 'read'
        }
        return data
      },
    ],
    afterChange: [sendPushNotification],
  },
}
