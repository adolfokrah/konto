import { addDataAndFileToRequest, PayloadRequest } from 'payload'

import { mobile_money_bank_codes } from '@/lib/constants/bank_codes'
import { paystack } from '@/payload.config'

export const transferMomo = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)
    const { contributionId, testing = true } = req.data || {}

    if (!contributionId) {
      return Response.json(
        {
          success: false,
          message: 'Contribution ID is required',
        },
        { status: 400 },
      )
    }

    const foundContribution = await req.payload.findByID({
      collection: 'contributions',
      id: contributionId,
      depth: 3,
    })

    if (!foundContribution) {
      return Response.json(
        {
          success: false,
          message: 'Contribution not found',
        },
        { status: 404 },
      )
    }

    if (foundContribution.isTransferred) {
      return Response.json(
        {
          success: false,
          message: 'Contribution has already been transferred',
        },
        { status: 400 },
      )
    }

    const pendingTransfer = await req.payload.find({
      collection: 'contributions',
      where: {
        linkedContribution: {
          equals: contributionId,
        },
        paymentStatus: {
          equals: 'pending',
        },
      },
      limit: 1,
    })

    if (pendingTransfer.docs.length > 0) {
      return Response.json(
        {
          success: false,
          message: 'Pending transfer already exists',
        },
        { status: 400 },
      )
    }

    const creator = await req.payload.findByID({
      collection: 'users',
      id:
        typeof foundContribution.jar === 'string'
          ? foundContribution.jar
          : typeof foundContribution.jar.creator === 'string'
            ? foundContribution.jar.creator
            : foundContribution.jar.creator.id,
    })

    if (!creator) {
      return Response.json(
        {
          success: false,
          message: 'Creator not found',
        },
        { status: 404 },
      )
    }

    if (!creator.bank || !creator.accountNumber || !creator.accountHolder) {
      return Response.json(
        {
          success: false,
          message: 'Creator bank information is missing',
        },
        { status: 400 },
      )
    }

    if (testing) {
      const linkedTransfer = await req.payload.create({
        collection: 'contributions',
        data: {
          paymentStatus: 'pending',
          paymentMethod: 'mobile-money',
          linkedContribution: contributionId,
          transactionReference: `TF-${contributionId}`,
          jar: foundContribution.jar,
          mobileMoneyProvider: creator.bank,
          amountContributed: -foundContribution.amountContributed,
          collector: foundContribution.collector,
          contributorPhoneNumber: creator.accountNumber,
        },
      })

      await req.payload.update({
        collection: 'contributions',
        id: contributionId,
        data: {
          isTransferred: true,
          linkedTransfer: linkedTransfer.id,
        },
      })

      await req.payload.update({
        collection: 'contributions',
        id: linkedTransfer.id,
        data: {
          paymentStatus: 'transferred',
        },
      })

      return Response.json({
        success: true,
        message: 'Transfer record created successfully',
      })
    } else {
      const response = await paystack.initiateTransfer({
        amount: foundContribution.amountContributed,
        currency: 'NGN',
        recipient: {
          type: 'mobile_money',
          name: creator.accountHolder,
          account_number: creator.accountNumber,
          bank_code:
            mobile_money_bank_codes[
              creator.bank.toLowerCase() as keyof typeof mobile_money_bank_codes
            ],
          currency: (typeof foundContribution.jar === 'string'
            ? 'GHS'
            : foundContribution.jar.currency) as 'GHS' | 'KES',
          description: `Transfer for contribution ${contributionId}`,
        },
        reason: `Transfer for contribution ${contributionId}`,
      })

      if (response.status) {
        await req.payload.create({
          collection: 'contributions',
          data: {
            paymentStatus: 'pending',
            paymentMethod: 'mobile-money',
            linkedContribution: contributionId,
            transactionReference: (response.data as any)?.reference,
            jar: foundContribution.jar,
            mobileMoneyProvider: creator.bank,
            amountContributed: foundContribution.amountContributed,
            collector: foundContribution.collector,
          },
        })

        return Response.json({
          success: true,
          message: 'Transfer record created successfully',
        })
      } else {
        return Response.json(
          {
            success: false,
            message: 'Failed to transfer payment',
            error: 'Failed',
          },
          { status: 500 },
        )
      }
    }
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        message: 'Failed to transfer payment',
        error: error.message || 'Unknown error',
      },
      { status: 500 },
    )
  }
}
