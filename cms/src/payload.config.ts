import { buildConfig } from 'payload'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

// Import collections directly
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Categories } from './collections/Categories'
import { Transactions } from './collections/Transactions'
import { Jars } from './collections/Jars'
import { Posts } from './collections/Posts'
import { Pages } from './collections/Pages'
import { plugins } from './plugins'
import { s3Storage } from '@payloadcms/storage-s3'
import { getServerSideURL } from './utilities/getURL'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { SystemSettings } from './globals/SystemSettings'
import { resendAdapter } from '@payloadcms/email-resend'
import { Notifications } from './collections/Notifications'
import { settleContributionsTask } from './tasks/settle-contributions'
import { checkEmptyJarsDailyTask } from './tasks/check-empty-jars-daily'
import { checkWithdrawalBalanceDailyTask } from './tasks/check-withdrawal-balance-daily'
import { verifyPendingTransactionsTask } from './tasks/verify-pending-transactions-task'
import { jarCreationReminderDailyTask } from './tasks/jar-creation-reminder-daily'
import { processPayoutTask } from './tasks/process-payout'
import { processReferralWithdrawalTask } from './tasks/process-referral-withdrawal'
import { checkEganowPayoutBalanceTask } from './tasks/check-eganow-payout-balance'
import { processRefundTask } from './tasks/process-refund'
import { getSystemSettings } from './endpoints/get-system-settings'
import { DeletedUserAccounts } from './collections/DeletedUserAccounts'
import { DailyActiveUsers } from './collections/DailyActiveUsers'
import { JarReports } from './collections/JarReports'
import { PushCampaigns } from './collections/PushCampaigns'
import { Refunds } from './collections/Refunds'
import { PayoutApprovals } from './collections/PayoutApprovals'
import { LedgerTopups } from './collections/LedgerTopups'
import { Referrals } from './collections/Referrals'
import { ReferralBonuses } from './collections/ReferralBonuses'
import { Disputes } from './collections/Disputes'
import { sendPushCampaignTask } from './tasks/send-push-campaign'
import { sendScheduledCampaignsTask } from './tasks/send-scheduled-campaigns'
import { verifyPendingRefundsTask } from './tasks/verify-pending-refunds-task'
import { verifyPendingTopupsTask } from './tasks/verify-pending-topups-task'
import { weeklyAccountSummaryTask } from './tasks/weekly-account-summary'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    autoRefresh: true,
    components: {
      beforeDashboard: ['@/components/BeforeDashboard'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: 'users',
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  collections: [
    Pages,
    Posts,
    Media,
    Categories,
    Users,
    Transactions,
    Jars,
    Notifications,
    DeletedUserAccounts,
    DailyActiveUsers,
    JarReports,
    PushCampaigns,
    Refunds,
    PayoutApprovals,
    LedgerTopups,
    Referrals,
    ReferralBonuses,
    Disputes,
  ],
  cors: [getServerSideURL(), 'https://hogapay.com'].filter(Boolean),
  globals: [Header, Footer, SystemSettings],
  db: mongooseAdapter({
    url:
      process.env.NODE_ENV == 'test'
        ? process.env.DATABASE_URI_TEST || 'mongodb://localhost:27017/test'
        : process.env.DATABASE_URI || 'mongodb://localhost:27017/test',
  }),
  editor: lexicalEditor({}),
  plugins: [
    ...plugins,
    ...(process.env.ACCESS_KEY_ID &&
    process.env.SECRET_ACCESS_KEY &&
    process.env.NODE_ENV !== 'test'
      ? [
          s3Storage({
            collections: {
              media: true,
            },
            bucket: process.env.BUCKET || process.env.RAILWAY_BUCKET_NAME || '',
            config: {
              credentials: {
                accessKeyId: process.env.ACCESS_KEY_ID || '',
                secretAccessKey: process.env.SECRET_ACCESS_KEY || '',
              },
              region: process.env.REGION || 'us-east-1',
              endpoint: process.env.ENDPOINT,
              forcePathStyle: false,
            },
          }),
        ]
      : []),
  ],
  secret: process.env.PAYLOAD_SECRET || 'test-secret',
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  localization: {
    locales: ['en', 'fr'], // required
    defaultLocale: 'en', // required
  },
  email: resendAdapter({
    defaultFromAddress: 'dev@payloadcms.com',
    defaultFromName: 'Payload CMS',
    apiKey: process.env.RESEND_API_KEY || '',
  }),
  jobs: {
    jobsCollectionOverrides: ({ defaultJobsCollection }) => ({
      ...defaultJobsCollection,
      admin: {
        ...defaultJobsCollection.admin,
        hidden: false,
      },
    }),
    access: {
      run: ({ req }) => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${process.env.CRON_SECRET}`
      },
    },
    tasks: [
      settleContributionsTask as any,
      checkEmptyJarsDailyTask as any,
      checkWithdrawalBalanceDailyTask as any,
      verifyPendingTransactionsTask as any,
      jarCreationReminderDailyTask as any,
      processPayoutTask as any,
      processReferralWithdrawalTask as any,
      checkEganowPayoutBalanceTask as any,
      processRefundTask as any,
      sendPushCampaignTask as any,
      sendScheduledCampaignsTask as any,
      verifyPendingRefundsTask as any,
      verifyPendingTopupsTask as any,
      weeklyAccountSummaryTask as any,
    ],
    autoRun: [
      {
        cron: '*/5 * * * *', // Every 5 minutes
        queue: 'settle-contributions',
      },
      {
        cron: '0 9 * * *', // Every day at 9:00 AM
        queue: 'check-empty-jars-daily',
      },
      {
        cron: '0 10 * * *', // Every day at 10:00 AM
        queue: 'check-withdrawal-balance-daily',
      },
      {
        cron: '*/2 * * * *', // Every 2 minutes (testing)
        queue: 'verify-pending-transactions',
      },
      {
        cron: '0 11 * * *', // Every day at 11:00 AM
        queue: 'jar-creation-reminder-daily',
      },
      {
        cron: '0 * * * *', // Every hour
        queue: 'check-eganow-payout-balance',
      },
      {
        cron: '* * * * *', // Every minute
        queue: 'send-scheduled-campaigns',
      },
      {
        cron: '*/6 * * * *', // Every 6 minutes
        queue: 'verify-pending-refunds',
      },
      {
        cron: '*/8 * * * *', // Every 5 minutes
        queue: 'verify-pending-topups',
      },
      {
        cron: '0 8 * * 0', // Every Sunday at 8 AM
        queue: 'weekly-account-summary',
      },
    ],
  },
  endpoints: [
    {
      path: '/system-settings',
      method: 'get',
      handler: getSystemSettings,
    },
  ],
})
