import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { getEganow } from '@/utilities/initalise'

export async function GET() {
  try {
    const payload = await getPayload({ config: configPromise })
    const requestHeaders = await getHeaders()
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!user || user.role !== 'admin') {
      return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await getEganow().getToken()

    const [collectionBalance, payoutBalance] = await Promise.all([
      getEganow()
        .getCollectionBalance()
        .catch((err) => {
          console.error('Failed to fetch collection balance:', err.message)
          return { balance: null }
        }),
      getEganow()
        .getPayoutBalance()
        .catch((err) => {
          console.error('Failed to fetch payout balance:', err.message)
          return { balance: null }
        }),
    ])

    // Handle both possible response shapes
    const collBal =
      collectionBalance.balance ??
      (collectionBalance as any).data?.balance ??
      (collectionBalance as any).availableBalance
    const payBal =
      payoutBalance.balance ??
      (payoutBalance as any).data?.balance ??
      (payoutBalance as any).availableBalance

    return Response.json({
      success: true,
      collectionBalance: typeof collBal === 'number' ? collBal : null,
      payoutBalance: typeof payBal === 'number' ? payBal : null,
    })
  } catch (error: any) {
    console.error('Failed to fetch Eganow balances:', error.message)
    return Response.json({ success: false, message: error.message }, { status: 500 })
  }
}
