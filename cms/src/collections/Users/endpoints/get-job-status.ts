import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'

export const getJobStatus = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)

    const { jobId, action } = req.query

    // If action is 'run', try to manually run the job processor
    if (action === 'run') {
      try {
        // Try to manually trigger job processing
        const result = await req.payload.jobs.run()
        return Response.json(
          {
            success: true,
            message: 'Job processor executed',
            result,
          },
          { status: 200 },
        )
      } catch (runError: any) {
        return Response.json(
          {
            success: false,
            message: 'Failed to run job processor',
            error: runError.message,
          },
          { status: 500 },
        )
      }
    }

    if (jobId) {
      // Get specific job by ID
      const job = await req.payload.findByID({
        collection: 'payload-jobs',
        id: jobId as string,
      })

      return Response.json(
        {
          success: true,
          job,
        },
        { status: 200 },
      )
    } else {
      // Get all recent jobs (not just empty jar reminders)
      const recentJobs = await req.payload.find({
        collection: 'payload-jobs',
        sort: '-createdAt',
        limit: 10,
      })

      return Response.json(
        {
          success: true,
          totalJobs: recentJobs.totalDocs,
          jobs: recentJobs.docs.map((job) => ({
            id: job.id,
            taskSlug: job.taskSlug,
            createdAt: job.createdAt,
            completedAt: job.completedAt,
            processing: job.processing,
            hasError: job.hasError,
            error: job.error,
            input: job.input,
            log: job.log,
          })),
        },
        { status: 200 },
      )
    }
  } catch (error: any) {
    console.error('❌ Error fetching job status:', error)
    return Response.json(
      {
        success: false,
        message: 'Failed to fetch job status',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}
