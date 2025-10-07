import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'

export const sendEmptyJarReminder = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)

    console.log('🔄 Finding KYC verified users with FCM tokens for empty jar reminders...')

    // Find all KYC verified users with FCM tokens who have created jars
    const verifiedUsers = await req.payload.find({
      collection: 'users',
      where: {
        and: [
          {
            isKYCVerified: {
              equals: true,
            },
          },
          {
            fcmToken: {
              exists: true,
            },
          },
        ],
      },
      limit: 1000, // Reasonable limit to prevent memory issues
    })

    if (verifiedUsers.docs.length === 0) {
      return Response.json(
        {
          success: true,
          message: 'No KYC verified users with FCM tokens found',
          stats: {
            usersFound: 0,
            jobsQueued: 0,
          },
        },
        { status: 200 },
      )
    }

    console.log(`👥 Found ${verifiedUsers.docs.length} KYC verified users with FCM tokens`)

    // Filter users who actually have jars (quick check)
    const usersWithJars: any[] = []

    for (const user of verifiedUsers.docs) {
      try {
        // Quick check if user has any jars
        const userJars = await req.payload.find({
          collection: 'jars',
          where: {
            creator: {
              equals: user.id,
            },
            status: {
              equals: 'open', // Only consider active jars
            },
          },
          limit: 1, // Just need to know if any exist
        })

        if (userJars.docs.length > 0) {
          usersWithJars.push(user)
        }
      } catch (error) {
        console.error(`❌ Error checking jars for user ${user.id}:`, error)
        // Continue with other users even if one fails
      }
    }

    if (usersWithJars.length === 0) {
      return Response.json(
        {
          success: true,
          message: 'No users with jars found',
          stats: {
            usersFound: verifiedUsers.docs.length,
            usersWithJars: 0,
            jobsQueued: 0,
          },
        },
        { status: 200 },
      )
    }

    console.log(
      `🏺 Found ${usersWithJars.length} users with jars, creating individual queue jobs...`,
    )

    // Create individual queue jobs for each user
    const queuedJobs: any[] = []
    let successCount = 0
    let failureCount = 0

    for (const user of usersWithJars) {
      try {
        const job = await req.payload.jobs.queue({
          task: 'send-empty-jar-reminder' as any, // Type assertion for custom task
          input: {
            userId: user.id,
            userFcmToken: user.fcmToken,
            userName: user.fullName || user.email,
          },
        })

        queuedJobs.push({
          jobId: job.id,
          userId: user.id,
          userName: user.fullName || user.email,
          queuedAt: job.createdAt,
        })

        successCount++
        console.log(`✅ Queued job for user ${user.id}`)
      } catch (error) {
        console.error(`❌ Failed to queue job for user ${user.id}:`, error)
        failureCount++
      }
    }

    // Auto-process the jobs immediately after queueing
    console.log(`🚀 Auto-processing ${successCount} queued jobs...`)
    let jobProcessingResult = null

    try {
      // Small delay to ensure jobs are properly queued
      await new Promise((resolve) => setTimeout(resolve, 100))

      jobProcessingResult = await req.payload.jobs.run()
      console.log(`✅ Job processing completed:`, jobProcessingResult)
    } catch (processingError: any) {
      console.error(`⚠️ Job processing failed:`, processingError.message)
      // Don't fail the entire request if job processing fails
    }

    return Response.json(
      {
        success: true,
        message: `Successfully queued and processed ${successCount} empty jar reminder jobs`,
        stats: {
          usersFound: verifiedUsers.docs.length,
          usersWithJars: usersWithJars.length,
          jobsQueued: successCount,
          jobsFailed: failureCount,
        },
        jobs: queuedJobs,
        processing: jobProcessingResult
          ? {
              processed: Object.keys(jobProcessingResult.jobStatus || {}).length,
              successfulJobs: Object.values(jobProcessingResult.jobStatus || {}).filter(
                (status: any) => status.status === 'success',
              ).length,
              failedJobs: Object.values(jobProcessingResult.jobStatus || {}).filter(
                (status: any) => status.status === 'failed',
              ).length,
              remainingJobs: jobProcessingResult.remainingJobsFromQueried || 0,
            }
          : null,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error('❌ Error in empty jar reminder endpoint:', error)
    return Response.json(
      {
        success: false,
        message: 'Failed to process empty jar reminder request',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}
