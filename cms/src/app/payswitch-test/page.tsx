'use client'

import { useState } from 'react'

function generateTxId() {
  return String(Date.now()).slice(-12).padStart(12, '0')
}

function cedisToPesewas(cedis: string) {
  const n = parseFloat(cedis) || 0
  return String(Math.round(n * 100)).padStart(12, '0')
}

type Tab = 'checkout' | 'momo' | 'card' | 'transfer'

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'checkout', label: 'Checkout', icon: '🔗' },
  { key: 'momo', label: 'Mobile Money', icon: '📱' },
  { key: 'card', label: 'Card', icon: '💳' },
  { key: 'transfer', label: 'Transfer', icon: '🏦' },
]

const inputCls = 'w-full border border-zinc-200 bg-zinc-50 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:bg-white transition placeholder:text-zinc-400'
const labelCls = 'block text-xs font-semibold text-zinc-500 mb-1.5 mt-4 uppercase tracking-wide'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  )
}

export default function PayswitchTestPage() {
  const [tab, setTab] = useState<Tab>('checkout')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; data: any } | null>(null)

  // Checkout
  const [checkoutAmount, setCheckoutAmount] = useState('10')
  const [checkoutEmail, setCheckoutEmail] = useState('')
  const [checkoutDesc, setCheckoutDesc] = useState('Test checkout payment')
  const [checkoutRedirect, setCheckoutRedirect] = useState('http://localhost:3000/payswitch-test')

  // Momo
  const [momoAmount, setMomoAmount] = useState('10')
  const [momoNetwork, setMomoNetwork] = useState('MTN')
  const [momoPhone, setMomoPhone] = useState('')
  const [momoVoucher, setMomoVoucher] = useState('')
  const [momoDesc, setMomoDesc] = useState('Test mobile money payment')

  // Card
  const [cardAmount, setCardAmount] = useState('10')
  const [cardPan, setCardPan] = useState('')
  const [cardExpMonth, setCardExpMonth] = useState('')
  const [cardExpYear, setCardExpYear] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [cardHolder, setCardHolder] = useState('')
  const [cardEmail, setCardEmail] = useState('')
  const [cardType, setCardType] = useState('VIS')
  const [card3dUrl, setCard3dUrl] = useState('http://localhost:3000/payswitch-test')

  // Transfer
  const [transferType, setTransferType] = useState<'momo' | 'bank'>('momo')
  const [transferAmount, setTransferAmount] = useState('10')
  const [transferAccount, setTransferAccount] = useState('')
  const [transferNetwork, setTransferNetwork] = useState('MTN')
  const [transferBank, setTransferBank] = useState('')
  const [transferAccountIssuer, setTransferAccountIssuer] = useState('GIP')
  const [transferDesc, setTransferDesc] = useState('Test transfer')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      let payload: any = {}

      if (tab === 'checkout') {
        payload = {
          type: 'checkout',
          transaction_id: generateTxId(),
          desc: checkoutDesc,
          amount: cedisToPesewas(checkoutAmount),
          redirect_url: checkoutRedirect,
          email: checkoutEmail,
        }
      } else if (tab === 'momo') {
        payload = {
          type: 'direct',
          processing_code: '000200',
          transaction_id: generateTxId(),
          desc: momoDesc,
          amount: cedisToPesewas(momoAmount),
          subscriber_number: momoPhone.replace(/\s/g, ''),
          'r-switch': momoNetwork,
          ...(momoNetwork === 'VDF' && { voucher_code: momoVoucher }),
        }
      } else if (tab === 'card') {
        payload = {
          type: 'direct',
          processing_code: '000000',
          transaction_id: generateTxId(),
          desc: 'Test card payment',
          amount: cedisToPesewas(cardAmount),
          'r-switch': cardType,
          pan: cardPan,
          exp_month: cardExpMonth,
          exp_year: cardExpYear,
          cvv: cardCvv,
          card_holder: cardHolder,
          currency: 'GHS',
          customer_email: cardEmail,
          '3d_url_response': card3dUrl,
        }
      } else if (tab === 'transfer') {
        payload =
          transferType === 'momo'
            ? {
                type: 'direct',
                processing_code: '404000',
                transaction_id: generateTxId(),
                desc: transferDesc,
                amount: cedisToPesewas(transferAmount),
                account_number: transferAccount.replace(/\s/g, ''),
                account_issuer: transferNetwork,
                'r-switch': 'FLT',
              }
            : {
                type: 'direct',
                processing_code: '404020',
                transaction_id: generateTxId(),
                desc: transferDesc,
                amount: cedisToPesewas(transferAmount),
                account_number: transferAccount.replace(/\s/g, ''),
                account_bank: transferBank,
                account_issuer: transferAccountIssuer,
                'r-switch': 'FLT',
              }
      }

      const res = await fetch('/api/payswitch-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      const ok =
        res.ok && (data.code === '000' || data.code === 200 || data.status === 'success')
      setResult({ ok, data })
      if (ok && data.checkout_url) window.open(data.checkout_url, '_blank')
    } catch (err: any) {
      setResult({ ok: false, data: { error: err.message } })
    }

    setLoading(false)
  }

  const submitLabel = () => {
    if (loading) return 'Processing...'
    if (tab === 'checkout') return 'Generate Checkout URL'
    if (tab === 'transfer') return 'Send Transfer'
    return 'Charge'
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-violet-50 via-white to-indigo-50 flex items-start justify-center py-16 px-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-violet-600 rounded-2xl mb-4 shadow-lg shadow-violet-200">
            <span className="text-2xl">⚡</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">Payswitch Sandbox</h1>
          <p className="text-sm text-zinc-400 mt-1">TTM-00000915 · test.theteller.net</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-zinc-100 border border-zinc-100 overflow-hidden">

          {/* Tabs */}
          <div className="grid grid-cols-4 border-b border-zinc-100">
            {TABS.map(({ key, label, icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => { setTab(key); setResult(null) }}
                className={`py-4 text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                  tab === key
                    ? 'bg-violet-600 text-white'
                    : 'text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600'
                }`}
              >
                <span className="text-base">{icon}</span>
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-1">

            {/* Checkout */}
            {tab === 'checkout' && (
              <>
                <Field label="Amount (GHS)">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-400">GHS</span>
                    <input className={inputCls + ' pl-14'} type="number" step="0.01" min="0.01" value={checkoutAmount} onChange={e => setCheckoutAmount(e.target.value)} placeholder="100" required />
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">= {cedisToPesewas(checkoutAmount)} pesewas</p>
                </Field>
                <Field label="Customer Email">
                  <input className={inputCls} type="email" placeholder="customer@example.com" value={checkoutEmail} onChange={e => setCheckoutEmail(e.target.value)} required />
                </Field>
                <Field label="Description">
                  <input className={inputCls} value={checkoutDesc} onChange={e => setCheckoutDesc(e.target.value)} />
                </Field>
                <Field label="Redirect URL">
                  <input className={inputCls} value={checkoutRedirect} onChange={e => setCheckoutRedirect(e.target.value)} required />
                </Field>
              </>
            )}

            {/* Mobile Money */}
            {tab === 'momo' && (
              <>
                <Field label="Amount (GHS)">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-400">GHS</span>
                    <input className={inputCls + ' pl-14'} type="number" step="0.01" min="0.01" value={momoAmount} onChange={e => setMomoAmount(e.target.value)} placeholder="100" required />
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">= {cedisToPesewas(momoAmount)} pesewas</p>
                </Field>
                <Field label="Network">
                  <select className={inputCls} value={momoNetwork} onChange={e => setMomoNetwork(e.target.value)}>
                    <option value="MTN">MTN Mobile Money</option>
                    <option value="VDF">Vodafone Cash</option>
                    <option value="ATL">AirtelTigo Money</option>
                  </select>
                </Field>
                <Field label="Phone Number">
                  <input className={inputCls} placeholder="0201234567" value={momoPhone} onChange={e => setMomoPhone(e.target.value)} required />
                </Field>
                {momoNetwork === 'VDF' && (
                  <Field label="Voucher Code (dial *110# to get one)">
                    <input className={inputCls} placeholder="Vodafone voucher code" value={momoVoucher} onChange={e => setMomoVoucher(e.target.value)} required />
                  </Field>
                )}
                <Field label="Description">
                  <input className={inputCls} value={momoDesc} onChange={e => setMomoDesc(e.target.value)} />
                </Field>
              </>
            )}

            {/* Card */}
            {tab === 'card' && (
              <>
                <Field label="Amount (GHS)">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-400">GHS</span>
                    <input className={inputCls + ' pl-14'} type="number" step="0.01" min="0.01" value={cardAmount} onChange={e => setCardAmount(e.target.value)} placeholder="100" required />
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">= {cedisToPesewas(cardAmount)} pesewas</p>
                </Field>
                <Field label="Card Type">
                  <select className={inputCls} value={cardType} onChange={e => setCardType(e.target.value)}>
                    <option value="VIS">Visa</option>
                    <option value="MAS">Mastercard</option>
                  </select>
                </Field>
                <Field label="Card Number">
                  <input className={inputCls} placeholder="4111 1111 1111 1111" maxLength={16} value={cardPan} onChange={e => setCardPan(e.target.value)} required />
                </Field>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Exp Month">
                    <input className={inputCls} placeholder="12" maxLength={2} value={cardExpMonth} onChange={e => setCardExpMonth(e.target.value)} required />
                  </Field>
                  <Field label="Exp Year">
                    <input className={inputCls} placeholder="26" maxLength={2} value={cardExpYear} onChange={e => setCardExpYear(e.target.value)} required />
                  </Field>
                  <Field label="CVV">
                    <input className={inputCls} placeholder="123" maxLength={4} value={cardCvv} onChange={e => setCardCvv(e.target.value)} required />
                  </Field>
                </div>
                <Field label="Cardholder Name">
                  <input className={inputCls} placeholder="John Doe" value={cardHolder} onChange={e => setCardHolder(e.target.value)} required />
                </Field>
                <Field label="Email">
                  <input className={inputCls} type="email" placeholder="john@example.com" value={cardEmail} onChange={e => setCardEmail(e.target.value)} required />
                </Field>
                <Field label="3D Secure Callback URL">
                  <input className={inputCls} value={card3dUrl} onChange={e => setCard3dUrl(e.target.value)} />
                </Field>
              </>
            )}

            {/* Transfer */}
            {tab === 'transfer' && (
              <>
                {/* Transfer type toggle */}
                <div className="flex gap-2 mb-2">
                  {(['momo', 'bank'] as const).map(t => (
                    <button key={t} type="button"
                      onClick={() => setTransferType(t)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold transition ${transferType === t ? 'bg-violet-600 text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}>
                      {t === 'momo' ? '📱 Mobile Money' : '🏦 Bank'}
                    </button>
                  ))}
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 font-medium">
                  ⚠️ Disbursement — sends funds out. Code: {transferType === 'momo' ? '404000' : '404020'}
                </div>
                <Field label="Amount (GHS)">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-400">GHS</span>
                    <input className={inputCls + ' pl-14'} type="number" step="0.01" min="0.01" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} placeholder="100" required />
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">= {cedisToPesewas(transferAmount)} pesewas</p>
                </Field>

                {transferType === 'momo' && (
                  <Field label="Network">
                    <select className={inputCls} value={transferNetwork} onChange={e => setTransferNetwork(e.target.value)}>
                      <option value="MTN">MTN Mobile Money</option>
                      <option value="VDF">Vodafone Cash</option>
                      <option value="ATL">AirtelTigo Money</option>
                    </select>
                  </Field>
                )}

                <Field label="Recipient Account Number">
                  <input className={inputCls} placeholder={transferType === 'momo' ? '0201234567' : '0082000141685300'} value={transferAccount} onChange={e => setTransferAccount(e.target.value)} required />
                </Field>

                {transferType === 'bank' && (
                  <>
                    <Field label="Bank Code (account_bank)">
                      <input className={inputCls} placeholder="e.g. GCB" value={transferBank} onChange={e => setTransferBank(e.target.value)} required />
                    </Field>
                    <Field label="Account Issuer (account_issuer)">
                      <input className={inputCls} placeholder="e.g. GIP" value={transferAccountIssuer} onChange={e => setTransferAccountIssuer(e.target.value)} required />
                    </Field>
                  </>
                )}

                <Field label="Description">
                  <input className={inputCls} value={transferDesc} onChange={e => setTransferDesc(e.target.value)} />
                </Field>
              </>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-violet-100 hover:shadow-violet-200"
              >
                {submitLabel()}
              </button>
            </div>
          </form>

          {/* Result */}
          {result && (
            <div className={`mx-6 mb-6 rounded-2xl overflow-hidden border ${result.ok ? 'border-emerald-200' : 'border-red-200'}`}>
              <div className={`px-4 py-2 flex items-center gap-2 text-xs font-bold ${result.ok ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                <span>{result.ok ? '✓ Success' : '✗ Failed'}</span>
              </div>
              <pre className={`p-4 text-xs overflow-auto max-h-60 ${result.ok ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-900'}`}>
                {JSON.stringify(result.data, null, 2)}
              </pre>
              {result.ok && result.data?.checkout_url && (
                <div className="px-4 pb-4 bg-emerald-50">
                  <a
                    href={result.data.checkout_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-violet-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-violet-700 transition"
                  >
                    Open Checkout Page →
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-zinc-300 mt-6">Netspy Limited · TTM-00000915</p>
      </div>
    </div>
  )
}
