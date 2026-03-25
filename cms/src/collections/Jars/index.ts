import type { CollectionConfig } from 'payload'

import { getJarSummary } from './endpoints/get-jar-summary'
import { getUserJars } from './endpoints/get-user-jars'
import { acceptDeclineInvite } from './endpoints/accept-decline-invite'
import { leaveJar } from './endpoints/leave-jar'
import { getContributionPageJar } from './endpoints/get-contribution-page-jar'
import { getRecentContributions } from './endpoints/get-recent-contributions'
import { sendInviteNotificationToUser } from './hooks/sendInviteNotificationToUser'
import { deleteInviteNotification } from './hooks/deleteInviteNotification'
import { deleteInviteNotifications } from './hooks/dleteInviteNotifications'
import { validateJarBalanceBeforeDelete } from './hooks/validateJarBalanceBeforeDelete'
import { validateJarUpdatePermission } from './hooks/validateJarUpdatePermission'
import { validateJarBalanceBeforeBreak } from './hooks/validateJarBalanceBeforeBreak'
import { sendFreezeNotificationToCreator } from './hooks/sendFreezeNotificationToCreator'
import { capRequiredApprovals } from './hooks/capRequiredApprovals'

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
      name: 'images',
      type: 'array',
      maxRows: 3,
      required: false,
      admin: {
        description: 'Upload up to 3 photos for the jar gallery',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
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
        {
          name: 'role',
          type: 'select',
          options: [
            { label: 'Member', value: 'member' },
            { label: 'Admin', value: 'admin' },
          ],
          required: true,
          defaultValue: 'member',
          admin: {
            description: 'Admin collectors have elevated privileges in this jar',
          },
        },
      ],
    },
    {
      name: 'requiredApprovals',
      type: 'number',
      defaultValue: 1,
      min: 1,
      admin: {
        description: 'Number of admin approvals needed before a payout is processed',
      },
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
        { label: 'Frozen', value: 'frozen' },
        { label: 'Broken', value: 'broken' },
        { label: 'Sealed', value: 'sealed' },
      ],
      required: true,
      index: true,
      admin: {
        description: 'Current status of the jar',
      },
    },
    {
      name: 'freezeReason',
      type: 'textarea',
      required: false,
      admin: {
        description: 'Reason for freezing the jar (AML compliance)',
        condition: (data) => data.status === 'frozen',
      },
    },
    {
      name: 'lastActivityAt',
      type: 'date',
      required: false,
      index: true,
      admin: {
        description:
          'Date of the most recent completed contribution. Used for idle-day calculations.',
      },
    },
    {
      name: 'allowAnonymousContributions',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Allow contributions from users not logged in',
      },
    },
    {
      name: 'customFields',
      type: 'array',
      required: false,
      admin: {
        description: 'Custom fields to collect from contributors on the payment page',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          admin: {
            description: 'Label shown to contributor (e.g. "T-shirt size", "Attending?")',
          },
        },
        {
          name: 'fieldType',
          type: 'select',
          required: true,
          defaultValue: 'text',
          options: [
            { label: 'Text', value: 'text' },
            { label: 'Number', value: 'number' },
            { label: 'Dropdown', value: 'select' },
            { label: 'Checkbox', value: 'checkbox' },
            { label: 'Phone', value: 'phone' },
            { label: 'Email', value: 'email' },
          ],
        },
        {
          name: 'required',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'includeInExport',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: "Include this field's value in exported PDF reports",
          },
        },
        {
          name: 'placeholder',
          type: 'text',
          required: false,
        },
        {
          name: 'options',
          type: 'array',
          required: false,
          admin: {
            description: 'Options for dropdown fields',
            condition: (_data, siblingData) => siblingData?.fieldType === 'select',
          },
          fields: [
            {
              name: 'label',
              type: 'text',
              required: true,
            },
            {
              name: 'value',
              type: 'text',
              required: true,
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      validateJarUpdatePermission,
      validateJarBalanceBeforeBreak,
      capRequiredApprovals,
    ],
    afterChange: [
      sendInviteNotificationToUser,
      deleteInviteNotification,
      deleteInviteNotifications,
      sendFreezeNotificationToCreator,
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
    {
      method: 'post',
      path: '/leave-jar',
      handler: leaveJar,
    },
    {
      method: 'get',
      path: '/:id/contribution-page',
      handler: getContributionPageJar,
    },
    {
      method: 'get',
      path: '/:id/recent-contributions',
      handler: getRecentContributions,
    },
  ],
}
