import { authenticated } from '@/access/authenticated'
import type { CollectionConfig } from 'payload'
import { sendPushNotification } from './hooks/send-push-notification'

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
      ],
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
  hooks: {
    afterChange: [sendPushNotification],
  },
}
