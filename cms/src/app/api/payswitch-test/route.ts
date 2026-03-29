import { NextRequest, NextResponse } from 'next/server'

const USERNAME = 'netspy5db9ae825797b'
const API_KEY = 'YWM4NTAxYTM5OTMyNDExMjFiODRmNjM0NmRkNjFjZDI='
const PASSCODE = '1fd55c07de1058d5650298546aa9f27c'
const MERCHANT_ID = 'TTM-00000915'

const ENDPOINTS = {
  checkout: 'https://checkout-test.theteller.net/initiate',
  direct: 'https://test.theteller.net/v1.1/transaction/process',
}

export async function POST(req: NextRequest) {
  const { type, ...rest } = await req.json()

  const url = type === 'checkout' ? ENDPOINTS.checkout : ENDPOINTS.direct

  // Always inject credentials server-side — never trust what the client sends
  const isTransfer = rest.processing_code === '404000' || rest.processing_code === '404020'
  const body =
    type === 'checkout'
      ? { ...rest, merchant_id: MERCHANT_ID, API_Key: API_KEY, apiuser: USERNAME }
      : isTransfer
        ? { ...rest, merchant_id: MERCHANT_ID, pass_code: PASSCODE }
        : { ...rest, merchant_id: MERCHANT_ID }

  console.log('[Payswitch] URL:', url)
  console.log('[Payswitch] Body:', JSON.stringify(body, null, 2))

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + Buffer.from(`${USERNAME}:${API_KEY}`).toString('base64'),
      'Cache-Control': 'no-cache',
    },
    body: JSON.stringify(body),
    redirect: 'manual',
  })

  console.log('[Payswitch] Status:', res.status, res.statusText)
  console.log('[Payswitch] Location:', res.headers.get('location'))

  if (res.status >= 300 && res.status < 400) {
    return NextResponse.json(
      { error: 'Redirect', location: res.headers.get('location') },
      { status: 502 },
    )
  }

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
