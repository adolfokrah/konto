import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'

export const sendEmptyJarReminder = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)

    const emptyJars = await req.payload.find({
      collection: 'jars',
      where: {
        totalContributions: {
          equals: 0,
        },
        status: {
          equals: 'open', // Only consider active jars
        },
      },
      pagination: false,
      overrideAccess: true,
    })

    // Group jars by user and count empty jars per user
    const userEmptyJarCounts = emptyJars.docs.reduce((acc: any, jar: any) => {
      const user = typeof jar.creator === 'string' ? jar.creator : jar.creator
      if (user) {
        if (!acc[user.id]) {
          acc[user.id] = { user: user.id, emptyJarCounts: 0, name: user.fullName }
        }
        acc[user.id].emptyJarCounts++
      }
      return acc
    }, {})

    const usersWithEmptyJars = Object.values(userEmptyJarCounts) as Array<{
      user: string
      emptyJarCounts: number
    }>

    // Create individual queue jobs for each user
    const queuedJobs: any[] = []
    let successCount = 0
    let failureCount = 0

    for (const userWithEmptyJars of usersWithEmptyJars) {
      try {
        const job = await req.payload.jobs.queue({
          task: 'send-empty-jar-reminder' as any, // Type assertion for custom task
          input: {
            userId: userWithEmptyJars.user,
            emptyJarCounts: userWithEmptyJars.emptyJarCounts,
          },
        })

        queuedJobs.push({
          jobId: job.id,
          userId: userWithEmptyJars.user,
          emptyJarCounts: userWithEmptyJars.emptyJarCounts,
          queuedAt: job.createdAt,
        })

        successCount++
        console.log(
          `✅ Queued job for user ${userWithEmptyJars.user} with ${userWithEmptyJars.emptyJarCounts} empty jars`,
        )
      } catch (error) {
        console.error(`❌ Failed to queue job for user ${userWithEmptyJars.user}:`, error)
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
          totalEmptyJars: emptyJars.docs.length,
          usersWithEmptyJars: usersWithEmptyJars.length,
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
