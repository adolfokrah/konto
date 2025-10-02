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
    read: authenticated,
    create: authenticated,
    update: authenticated,
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
        { label: 'KYC Failed', value: 'kycFailed' },
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
    afterChange: [sendPushNotification],
  },
}
