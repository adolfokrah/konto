import { addDataAndFileToRequest, PayloadRequest } from 'payload'

/**
 * POST /api/transactions/approve-reject-payout
 *
 * Allows an admin collector to approve or reject a payout.
 * Body: { transactionId, action: 'approved' | 'rejected' }
 */
export const approveRejectPayout = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)
    const { transactionId, action } = req.data || {}

    if (!req.user) {
      return Response.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }

    if (!transactionId || !action) {
      return Response.json(
        { success: false, message: 'transactionId and action are required' },
        { status: 400 },
      )
    }

    if (action !== 'approved' && action !== 'rejected') {
      return Response.json(
        { success: false, message: 'action must be "approved" or "rejected"' },
        { status: 400 },
      )
    }

    // Fetch the transaction
    const transaction = await req.payload.findByID({
      collection: 'transactions',
      id: transactionId,
      depth: 1,
      overrideAccess: true,
    })

    if (!transaction) {
      return Response.json({ success: false, message: 'Transaction not found' }, { status: 404 })
    }

    if ((transaction as any).paymentStatus !== 'awaiting-approval') {
      return Response.json(
        { success: false, message: 'This transaction is not awaiting approval' },
        { status: 400 },
      )
    }

    const jarId =
      typeof (transaction as any).jar === 'object'
        ? (transaction as any).jar?.id
        : (transaction as any).jar

    // Fetch the jar to verify the user is an admin collector
    const jar = await req.payload.findByID({
      collection: 'jars',
      id: jarId,
      depth: 1,
      overrideAccess: true,
    })

    const isAdminCollector = ((jar as any).invitedCollectors || []).some((ic: any) => {
      const collectorId = typeof ic.collector === 'object' ? ic.collector?.id : ic.collector
      return collectorId === req.user!.id && ic.role === 'admin' && ic.status === 'accepted'
    })

    if (!isAdminCollector) {
      return Response.json(
        { success: false, message: 'Only admin collectors can approve or reject payouts' },
        { status: 403 },
      )
    }

    // Check if user already submitted a decision for this transaction
    const existingApproval = await req.payload.find({
      collection: 'payout-approvals' as any,
      where: {
        linkedTransaction: { equals: transactionId },
        actionBy: { equals: req.user.id },
      },
      limit: 1,
      overrideAccess: true,
    })

    if (existingApproval.docs.length > 0) {
      return Response.json(
        { success: false, message: 'You have already submitted your decision' },
        { status: 400 },
      )
    }

    const creatorId =
      typeof (jar as any).creator === 'object' ? (jar as any).creator?.id : (jar as any).creator

    if (action === 'rejected') {
      // Create a rejected approval record
      await req.payload.create({
        collection: 'payout-approvals' as any,
        data: {
          jar: jarId,
          linkedTransaction: transactionId,
          status: 'rejected',
          requestedBy: creatorId,
          actionBy: req.user.id,
        },
        overrideAccess: true,
      })

      // Count admin collectors on this jar
      const adminCollectors = ((jar as any).invitedCollectors || []).filter((ic: any) => {
        return ic.role === 'admin' && ic.status === 'accepted'
      })
      const totalAdmins = adminCollectors.length
      const requiredApprovals = (jar as any).requiredApprovals || 1

      // Count existing decisions for this transaction
      const allDecisions = await req.payload.find({
        collection: 'payout-approvals' as any,
        where: {
          linkedTransaction: { equals: transactionId },
        },
        overrideAccess: true,
      })

      const rejectedCount = allDecisions.docs.filter((d: any) => d.status === 'rejected').length

      // Fail only when rejections reach the required approvals threshold
      if (rejectedCount >= requiredApprovals) {
        await req.payload.update({
          collection: 'transactions',
          id: transactionId,
          data: { paymentStatus: 'failed' },
          overrideAccess: true,
        })

        // Notify the jar creator
        if (creatorId) {
          await req.payload.create({
            collection: 'notifications',
            data: {
              type: 'info',
              status: 'unread',
              title: 'Payout Rejected',
              message: `Your payout request for ${(jar as any).name || 'a jar'} has been rejected. Not enough approvals possible.`,
              user: creatorId,
              data: {
                jarId,
                transactionId,
                type: 'payout-rejected',
              },
            },
            overrideAccess: true,
          })
        }

        return Response.json({
          success: true,
          message: 'Payout has been rejected. Not enough approvals possible.',
        })
      }

      return Response.json({
        success: true,
        message: `Rejection recorded. ${rejectedCount} of ${requiredApprovals} rejections so far.`,
      })
    }

    // Action is 'approved' — create an approved approval record
    await req.payload.create({
      collection: 'payout-approvals' as any,
      data: {
        jar: jarId,
        linkedTransaction: transactionId,
        status: 'approved',
        requestedBy: creatorId,
        actionBy: req.user.id,
      },
      overrideAccess: true,
    })

    // Count total approved records for this transaction (including the one just created)
    const allApprovals = await req.payload.find({
      collection: 'payout-approvals' as any,
      where: {
        linkedTransaction: { equals: transactionId },
        status: { equals: 'approved' },
      },
      overrideAccess: true,
    })

    const approvedCount = allApprovals.docs.length
    const requiredApprovals = (jar as any).requiredApprovals || 1

    if (approvedCount < requiredApprovals) {
      return Response.json({
        success: true,
        message: `Approval recorded. ${approvedCount} of ${requiredApprovals} required approvals received.`,
      })
    }

    // Enough approvals — process the payout
    const creator = typeof (jar as any).creator === 'object' ? (jar as any).creator : null

    // Update transaction status to pending before processing
    await req.payload.update({
      collection: 'transactions',
      id: transactionId,
      data: { paymentStatus: 'pending' },
      overrideAccess: true,
    })

    // Queue the payout job with the existing transaction ID
    await req.payload.jobs.queue({
      task: 'process-payout' as any,
      input: {
        jarId,
        userId: creatorId,
        userBank: creator?.bank || (transaction as any).mobileMoneyProvider,
        userAccountNumber: creator?.accountNumber || (transaction as any).contributorPhoneNumber,
        userAccountHolder: creator?.accountHolder || (transaction as any).contributor,
        existingTransactionId: transactionId,
      },
      queue: 'payout',
    })

    await req.payload.jobs.run({ queue: 'payout' })

    // Notify the jar creator
    if (creatorId) {
      await req.payload.create({
        collection: 'notifications',
        data: {
          type: 'info',
          status: 'unread',
          title: 'Payout Approved',
          message: `Your payout request for ${(jar as any).name || 'a jar'} has been approved and is being processed.`,
          user: creatorId,
          data: {
            jarId,
            transactionId,
            type: 'payout-approved',
          },
        },
        overrideAccess: true,
      })
    }

    return Response.json({
      success: true,
      message: 'Payout has been approved and is being processed',
    })
  } catch (error: any) {
    console.error('Approve/reject payout error:', error)
    return Response.json(
      {
        success: false,
        message: 'Failed to process approval',
        error: error.message || 'Unknown error',
      },
      { status: 500 },
    )
  }
}
