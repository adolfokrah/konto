import type { CollectionConfig } from 'payload'

import { getJarSummary } from './endpoints/get-jar-summary'
import { getUserJars } from './endpoints/get-user-jars'
import { acceptDeclineInvite } from './endpoints/accept-decline-invite'
import { sendInviteNotificationToUser } from './hooks/sendInviteNotificationToUser'
import { deleteInviteNotification } from './hooks/deleteInviteNotification'
import { deleteInviteNotifications } from './hooks/dleteInviteNotifications'
import { validateJarBalanceBeforeDelete } from './hooks/validateJarBalanceBeforeDelete'

export const Jars: CollectionConfig = {
  slug: 'jars',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Name of the jar',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: false,
      admin: {
        description: 'Description of the jar',
      },
    },
    {
      name: 'jarGroup',
      type: 'text',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: false,
      admin: {
        description: 'Upload an image for the jar',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether the jar is currently active',
      },
    },
    {
      name: 'isFixedContribution',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether the contribution amount is fixed',
      },
    },
    {
      name: 'acceptedContributionAmount',
      type: 'number',
      required: true,
      admin: {
        description: 'Accepted contribution amount for fixed contributions',
        condition: (data) => data.isFixedContribution,
      },
    },
    {
      name: 'goalAmount',
      type: 'number',
      required: false,
      defaultValue: 0,
      admin: {
        description: 'Target amount for the jar',
      },
    },
    {
      name: 'deadline',
      type: 'date',
      required: false,
      admin: {
        description: 'Deadline for contributions to this jar',
      },
    },
    {
      name: 'currency',
      type: 'text',
      required: true,
      validate: (value: unknown) => {
        if (typeof value !== 'string') {
          return 'Currency must be a string'
        }
        return true
      },
      admin: {
        description: 'Currency code (GHS or ngn)',
      },
    },
    {
      name: 'creator',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
      admin: {
        description: 'User who created the jar',
      },
    },
    {
      name: 'invitedCollectors',
      type: 'array',
      required: false,
      validate: (value: unknown) => {
        if (!Array.isArray(value)) {
          return true // Allow empty or non-array values
        }

        // Check for duplicate collectors
        const collectorIds = value.map((item: any) => item?.collector).filter(Boolean)
        const uniqueIds = new Set(collectorIds)

        if (collectorIds.length !== uniqueIds.size) {
          return 'Duplicate collectors are not allowed'
        }

        return true
      },
      fields: [
        {
          name: 'collector',
          type: 'relationship',
          relationTo: 'users',
          required: true,
          hasMany: false,
          admin: {
            description: 'Users who can contribute to this jar (excluding the creator)',
          },
        },
        {
          name: 'status',
          type: 'select',
          options: [
            { label: 'Accepted', value: 'accepted' },
            { label: 'Pending', value: 'pending' },
          ],
          required: true,
          defaultValue: 'pending',
        },
      ],
    },
    {
      name: 'paymentPage',
      type: 'group',
      fields: [
        {
          name: 'showGoal',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'showRecentContributions',
          type: 'checkbox',
          defaultValue: true,
        },
      ],
    },
    {
      name: 'thankYouMessage',
      type: 'text',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'open',
      options: [
        { label: 'Open', value: 'open' },
        { label: 'Broken', value: 'broken' },
        { label: 'Sealed', value: 'sealed' },
      ],
      required: true,
      admin: {
        description: 'Current status of the jar',
      },
    },
    {
      name: 'totalContributions',
      type: 'number',
      required: false,
      defaultValue: 0,
    },
    {
      name: 'allowAnonymousContributions',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Allow contributions from users not logged in',
      },
    },
  ],
  hooks: {
    afterChange: [
      sendInviteNotificationToUser,
      deleteInviteNotification,
      deleteInviteNotifications,
    ],
    beforeRead: [],
    beforeDelete: [validateJarBalanceBeforeDelete],
  },
  endpoints: [
    {
      method: 'get',
      path: '/:id/summary',
      handler: getJarSummary,
    },
    {
      method: 'get',
      path: '/user-jars',
      handler: getUserJars,
    },
    {
      method: 'post',
      path: '/accept-decline-invite',
      handler: acceptDeclineInvite,
    },
  ],
}
