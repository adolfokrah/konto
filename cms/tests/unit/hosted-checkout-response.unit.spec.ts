import { describe, expect, it } from 'vitest'

import {
  extractCheckoutUrl,
  extractEganowReference,
} from '@/collections/Transactions/endpoints/charge-hosted-checkout-eganow'

/**
 * Eganow does not document the hosted-checkout response, and its sibling APIs disagree on
 * where the payment URL lives (`redirectUrl` on card, nested under `data` elsewhere). These
 * lock in the shapes we accept so a change in their response can't silently send a payer
 * nowhere.
 */
describe('extractCheckoutUrl', () => {
  it('reads the real hosted checkout response', () => {
    const response = {
      transactionId: 'ac0b25a0612c406f83f0ce579706f500',
      merchantReference: 'contribution-123',
      status: 'INITIATED',
      hostedCheckoutUrl:
        'https://developer.deveganowapi.com/checkout/pay/ac0b25a0612c406f83f0ce579706f500',
    }
    expect(extractCheckoutUrl(response)).toBe(response.hostedCheckoutUrl)
    expect(extractEganowReference(response)).toBe('ac0b25a0612c406f83f0ce579706f500')
  })

  it('reads the URL from each spelling Eganow might use', () => {
    expect(extractCheckoutUrl({ redirectUrl: 'https://pay.eganow.com/abc' })).toBe(
      'https://pay.eganow.com/abc',
    )
    expect(extractCheckoutUrl({ checkoutUrl: 'https://pay.eganow.com/abc' })).toBe(
      'https://pay.eganow.com/abc',
    )
    expect(extractCheckoutUrl({ paymentUrl: 'https://pay.eganow.com/abc' })).toBe(
      'https://pay.eganow.com/abc',
    )
    expect(extractCheckoutUrl({ RedirectUrl: 'https://pay.eganow.com/abc' })).toBe(
      'https://pay.eganow.com/abc',
    )
  })

  it('reads the URL when it is nested under data', () => {
    expect(
      extractCheckoutUrl({ isSuccess: true, data: { redirectUrl: 'https://pay.eganow.com/abc' } }),
    ).toBe('https://pay.eganow.com/abc')
  })

  it('trims surrounding whitespace', () => {
    expect(extractCheckoutUrl({ redirectUrl: '  https://pay.eganow.com/abc  ' })).toBe(
      'https://pay.eganow.com/abc',
    )
  })

  it('rejects values that are not links, so the payer is never sent to a bad URL', () => {
    // The card API returns 3DS *markup* under `redirectUrl`, and "N/A" when there is nothing.
    expect(extractCheckoutUrl({ redirectUrl: '<html>challenge</html>' })).toBeNull()
    expect(extractCheckoutUrl({ redirectUrl: 'N/A' })).toBeNull()
    expect(extractCheckoutUrl({ redirectUrl: '' })).toBeNull()
    expect(extractCheckoutUrl({ isSuccess: false, message: 'declined' })).toBeNull()
  })
})

describe('extractEganowReference', () => {
  it('reads the reference from each spelling, top level or nested', () => {
    expect(extractEganowReference({ eganowReferenceNo: 'GH123' })).toBe('GH123')
    expect(extractEganowReference({ referenceNo: 'GH123' })).toBe('GH123')
    expect(extractEganowReference({ transactionId: 'GH123' })).toBe('GH123')
    expect(extractEganowReference({ data: { EganowReferenceNo: 'GH123' } })).toBe('GH123')
  })

  it('treats Eganow’s empty placeholders as no reference', () => {
    expect(extractEganowReference({ eganowReferenceNo: 'N/A' })).toBeNull()
    expect(extractEganowReference({ eganowReferenceNo: '   ' })).toBeNull()
    expect(extractEganowReference({})).toBeNull()
  })
})

/**
 * Shape confirmed against the live API: hosted checkout replies HTTP 200 with an
 * `{ isSuccess, statusCode, data, errorMessage }` envelope even on failure, so a failed
 * call must never be mistaken for a missing URL.
 */
describe('hosted checkout failure envelope', () => {
  it('yields no URL when Eganow reports failure', () => {
    const envelope = {
      isSuccess: false,
      statusCode: 500,
      data: null,
      errorMessage: 'Checkout is not configured. Please contact support.',
    }
    expect(extractCheckoutUrl(envelope)).toBeNull()
    expect(extractEganowReference(envelope)).toBeNull()
  })

  it('reads the URL out of a successful envelope', () => {
    const envelope = {
      isSuccess: true,
      statusCode: 200,
      data: { redirectUrl: 'https://checkout.eganow.com/s/abc123', eganowReferenceNo: 'GH999' },
      errorMessage: null,
    }
    expect(extractCheckoutUrl(envelope)).toBe('https://checkout.eganow.com/s/abc123')
    expect(extractEganowReference(envelope)).toBe('GH999')
  })
})
