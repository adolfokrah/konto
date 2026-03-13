'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/dashboard/data-table/data-table'
import { autoRefundColumns, type AutoRefundRow, type AutoRefundItem } from '@/components/dashboard/data-table/columns/auto-refund-columns'
import { RefundStatusBadge } from '@/components/dashboard/refund-status-badge'
import { AutoRefundActions } from '@/components/dashboard/auto-refund-actions'

function CopyableId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <span className="group flex items-center gap-1">
      <span className="font-mono">{id}</span>
      <button
        onClick={(e) => {
          e.stopPropagation()
          navigator.clipboard.writeText(id)
          setCopied(true)
          toast.success('Copied to clipboard')
          setTimeout(() => setCopied(false), 1500)
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
      >
        {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
      </button>
    </span>
  )
}

function formatAmount(amount: number, currency = 'GHS') {
  return `${currency} ${amount.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function ExpandedRefundItems({ group }: { group: AutoRefundRow }) {
  return (
    <div className="border-b bg-muted/20">
      {group.status === 'awaiting_approval' && (
        <div className="flex items-center gap-2 px-6 py-3 border-b" onClick={(e) => e.stopPropagation()}>
          <AutoRefundActions jarId={group.jarId} />
        </div>
      )}
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="py-2 pl-10 pr-4 text-left font-medium text-muted-foreground w-[200px]">Name</th>
            <th className="py-2 pr-4 text-left font-medium text-muted-foreground w-36">Account</th>
            <th className="py-2 pr-4 text-left font-medium text-muted-foreground w-[100px]">Provider</th>
            <th className="py-2 pr-4 text-left font-medium text-muted-foreground w-[200px]">ID</th>
            <th className="py-2 pr-4 text-left font-medium text-muted-foreground">Reference</th>
            <th className="py-2 pr-4 text-right font-medium text-muted-foreground w-[120px]">Amount</th>
            <th className="py-2 pr-6 text-right font-medium text-muted-foreground w-[110px]">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {group.items.map((item: AutoRefundItem) => {
            const isFailed = item.status === 'failed' || item.status === 'rejected'
            return (
              <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                <td className="py-2.5 pl-10 pr-4 font-medium">{item.accountName || '—'}</td>
                <td className="py-2.5 pr-4 font-mono text-muted-foreground">{item.accountNumber || '—'}</td>
                <td className="py-2.5 pr-4 text-muted-foreground">{item.mobileMoneyProvider || '—'}</td>
                <td className="py-2.5 pr-4 text-muted-foreground"><CopyableId id={item.id} /></td>
                <td className="py-2.5 pr-4 font-mono text-muted-foreground">{item.transactionReference || '—'}</td>
                <td className={`py-2.5 pr-4 text-right tabular-nums font-medium ${isFailed ? 'line-through opacity-40' : 'text-red-400'}`}>
                  {formatAmount(item.amount, group.currency)}
                </td>
                <td className="py-2.5 pr-6 text-right">
                  <RefundStatusBadge status={item.status} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

type Props = { data: AutoRefundRow[] }

export function AutoRefundsDataTable({ data }: Props) {
  return (
    <DataTable
      columns={autoRefundColumns}
      data={data}
      renderExpandedRow={(row) => <ExpandedRefundItems group={row} />}
      emptyMessage="No auto refunds found."
      tableId="auto-refunds"
    />
  )
}
