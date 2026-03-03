import type { CollectionConfig } from 'payload'
import { submitReport } from './endpoints/submit-report'

export const JarReports: CollectionConfig = {
  slug: 'jar-reports',
  admin: {
    useAsTitle: 'message',
    defaultColumns: ['jar', 'message', 'user', 'reporterName', 'status', 'createdAt'],
  },
  access: {
    create: () => true,
    read: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  endpoints: [
    {
      path: '/submit',
      method: 'post',
      handler: submitReport,
    },
  ],
  fields: [
    {
      name: 'jar',
      type: 'relationship',
      relationTo: 'jars',
      required: true,
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: false,
    },
    {
      name: 'reporterName',
      type: 'text',
      required: false,
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Reviewed', value: 'reviewed' },
        { label: 'Dismissed', value: 'dismissed' },
      ],
      defaultValue: 'pending',
      required: true,
    },
  ],
}
