import { addDataAndFileToRequest, PayloadRequest } from 'payload'
import { getJarBalance } from '@/utilities/getJarBalance'

export const payoutEganow = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)
    const { jarId } = req.data || {}

    if (!jarId) {
      return Response.json({ success: false, message: 'Jar ID is required' }, { status: 400 })
    }

    if (!req.user) {
      return Response.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }

    const user = req.user

    // Fetch jar and verify ownership
    const jar = await req.payload.findByID({
      collection: 'jars',
      id: jarId,
      depth: 1,
      overrideAccess: true,
    })

    if (!jar) {
      return Response.json({ success: false, message: 'Jar not found' }, { status: 404 })
    }

    if (jar.status === 'frozen') {
      return Response.json(
        { success: false, message: 'This jar is currently frozen and payouts are not allowed' },
        { status: 403 },
      )
    }

    // jar.creator is populated due to depth:1 — fall back to fetch if it's still an ID
    const creator: any =
      typeof jar.creator === 'object' && jar.creator
        ? jar.creator
        : jar.creator
          ? await req.payload.findByID({
              collection: 'users',
              id: jar.creator as string,
              overrideAccess: true,
            })
          : null

    if (!creator) {
      return Response.json({ success: false, message: 'Jar creator not found' }, { status: 404 })
    }

    if (creator.id !== user.id && user.role !== 'admin') {
      return Response.json(
        { success: false, message: 'Only the jar creator or an admin can request a payout' },
        { status: 403 },
      )
    }

    // Verification gate: a payout needs both personal KYC and business KYB.
    // Saving a withdrawal account is deliberately ungated, so KYC is checked here.
    if ((creator.kycStatus ?? 'none') !== 'verified') {
      return Response.json(
        {
          success: false,
          message: 'You must complete identity verification (KYC) before requesting a payout.',
        },
        { status: 403 },
      )
    }

    // KYB gate: jar creator must be business-verified before any payout
    if ((creator.kybStatus ?? 'none') !== 'approved') {
      return Response.json(
        {
          success: false,
          message: 'You must complete business verification (KYB) before requesting a payout.',
        },
        { status: 403 },
      )
    }

    // Resolve the destination: the jar's linked withdrawal account, else the
    // creator's default account (momo or bank).
    const accountId =
      typeof jar.withdrawalAccount === 'object'
        ? (jar.withdrawalAccount as any)?.id
        : jar.withdrawalAccount

    let account: any = accountId
      ? await req.payload
          .findByID({
            collection: 'withdrawal-accounts',
            id: accountId,
            depth: 0,
            overrideAccess: true,
          })
          .catch(() => null)
      : null

    // Fallback to the creator's default (then most recent) account.
    if (!account || String(account.user) !== String(creator.id)) {
      const found = await req.payload.find({
        collection: 'withdrawal-accounts',
        where: {
          and: [{ user: { equals: creator.id } }, { isDefault: { equals: true } }],
        },
        limit: 1,
        overrideAccess: true,
      })
      account =
        found.docs[0] ??
        (
          await req.payload.find({
            collection: 'withdrawal-accounts',
            where: { user: { equals: creator.id } },
            sort: '-createdAt',
            limit: 1,
            overrideAccess: true,
          })
        ).docs[0] ??
        null
    }

    if (!account) {
      return Response.json(
        {
          success: false,
          message:
            'No withdrawal account found. Link one to this jar or set a default withdrawal account.',
        },
        { status: 400 },
      )
    }
    if (!account.provider || !account.accountNumber || !account.accountHolder) {
      return Response.json(
        { success: false, message: 'Withdrawal account is incomplete.' },
        { status: 400 },
      )
    }
    const isBankAccount = account.type === 'bank'
    if (!isBankAccount) {
      const providerMap: Record<string, string> = { mtn: 'MTNGH', telecel: 'TCELGH' }
      if (!providerMap[String(account.provider).toLowerCase()]) {
        return Response.json(
          { success: false, message: 'Unsupported mobile money provider for Eganow payout' },
          { status: 400 },
        )
      }
    }

    // Check for pending payout and calculate balance in parallel
    const [pendingPayout, { balance: netBalance }] = await Promise.all([
      req.payload.find({
        collection: 'transactions',
        where: {
          jar: { equals: jarId },
          type: { equals: 'payout' },
          paymentStatus: { in: ['pending', 'awaiting-approval'] },
        },
        limit: 1,
        overrideAccess: true,
      }),
      getJarBalance(req.payload, jarId),
    ])

    if (pendingPayout.docs.length > 0) {
      return Response.json(
        { success: false, message: 'A payout is already pending for this jar' },
        { status: 400 },
      )
    }

    if (netBalance <= 0) {
      return Response.json(
        { success: false, message: 'No balance available for payout' },
        { status: 400 },
      )
    }

    // Bank payouts may withdraw a user-chosen amount (fee is charged on that
    // amount only). Mobile money always pays out the full available balance.
    const requestedAmount = Number(req.data?.amount)
    let payoutBase = netBalance
    if (isBankAccount && Number.isFinite(requestedAmount) && requestedAmount > 0) {
      if (requestedAmount > netBalance) {
        return Response.json(
          { success: false, message: 'Amount exceeds the available balance' },
          { status: 400 },
        )
      }
      payoutBase = requestedAmount
    }

    // Find all accepted admin collectors in the jar
    const adminCollectors = ((jar.invitedCollectors as any[]) || []).filter(
      (ic: any) => ic.role === 'admin' && ic.status === 'accepted',
    )

    if (adminCollectors.length > 0) {
      // Cap requiredApprovals to the number of admin collectors
      const requiredApprovals = Math.min(
        (jar as any).requiredApprovals || 1,
        adminCollectors.length,
      )
      if (requiredApprovals !== ((jar as any).requiredApprovals || 1)) {
        await req.payload.update({
          collection: 'jars',
          id: jarId,
          data: { requiredApprovals } as any,
          overrideAccess: true,
        })
      }

      // Jar has admin collectors — create transaction as awaiting-approval and skip Eganow
      const systemSettings = await req.payload.findGlobal({ slug: 'system-settings' })
      const transferFeePercentage = isBankAccount
        ? (systemSettings as any)?.bankTransferFeePercentage || 1
        : (systemSettings as any)?.transferFeePercentage || 1
      const transferFee = (payoutBase * transferFeePercentage) / 100
      const expectedNetAmount = payoutBase - transferFee

      const transaction = await req.payload.create({
        collection: 'transactions',
        data: {
          paymentStatus: 'awaiting-approval',
          paymentMethod: account.type,
          transactionReference: '',
          jar: jarId,
          withdrawalAccount: account.id,
          ...(isBankAccount ? {} : { mobileMoneyProvider: account.provider }),
          amountContributed: -payoutBase,
          collector: creator.id,
          contributorPhoneNumber: account.accountNumber,
          contributor: account.accountHolder,
          type: 'payout',
          payoutFeePercentage: transferFeePercentage,
          payoutFeeAmount: transferFee,
          payoutNetAmount: expectedNetAmount,
        },
        overrideAccess: true,
      })

      // Send notification to each admin collector (no approval records created yet)
      const amount = Math.abs(payoutBase).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })

      await Promise.all(
        adminCollectors.map(async (ic: any) => {
          const collectorId = typeof ic.collector === 'object' ? ic.collector?.id : ic.collector
          if (collectorId) {
            await req.payload.create({
              collection: 'notifications',
              data: {
                type: 'payout-approval',
                status: 'unread',
                title: 'Payout Approval Requested',
                message: `A payout of GHS ${amount} from ${jar.name || 'a jar'} requires your approval.`,
                user: collectorId,
                data: {
                  jarId,
                  transactionId: transaction.id,
                  amount: payoutBase,
                  type: 'payout-approval',
                },
              },
              overrideAccess: true,
            })
          }
        }),
      )

      return Response.json({
        success: true,
        message: 'Payout request submitted for approval',
      })
    }

    // No collector admin — create the payout transaction record first so any
    // subsequent request immediately sees a pending payout and is rejected,
    // eliminating the double-payout race window.
    const systemSettings = await req.payload.findGlobal({ slug: 'system-settings' })
    const transferFeePercentage = isBankAccount
      ? (systemSettings as any)?.bankTransferFeePercentage || 1
      : (systemSettings as any)?.transferFeePercentage || 1
    const transferFee = (payoutBase * transferFeePercentage) / 100
    const expectedNetAmount = payoutBase - transferFee

    const data = {
      paymentStatus: 'pending',
      paymentMethod: account.type,
      transactionReference: '',
      jar: jarId,
      withdrawalAccount: account.id,
      ...(isBankAccount ? {} : { mobileMoneyProvider: account.provider }),
      amountContributed: -payoutBase,
      collector: creator.id,
      contributorPhoneNumber: account.accountNumber,
      contributor: account.accountHolder,
      type: 'payout',
      payoutFeePercentage: transferFeePercentage,
      payoutFeeAmount: transferFee,
      payoutNetAmount: expectedNetAmount,
    }

    console.log('payout data is', data)

    const transaction = await req.payload.create({
      collection: 'transactions',
      data: data as any,
      overrideAccess: true,
    })

    await req.payload.jobs.queue({
      task: 'process-payout' as any,
      input: { existingTransactionId: transaction.id },
      queue: 'payout',
    })

    return Response.json({
      success: true,
      message: 'Payout request is being processed',
    })
  } catch (error: any) {
    console.error('Payout queue error:', error)
    return Response.json(
      {
        success: false,
        message: 'Failed to process payout request',
        error: error.message || 'Unknown error',
      },
      { status: 500 },
    )
  }
}
