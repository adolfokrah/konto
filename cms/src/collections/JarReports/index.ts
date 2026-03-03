import type { CollectionConfig } from 'payload'
import { submitReport } from './endpoints/submit-report'

export const JarReports: CollectionConfig = {
  slug: 'jar-reports',
  admin: {
    useAsTitle: 'message',
    defaultColumns: ['jar', 'message', 'user', 'createdAt'],
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
  ],
}
