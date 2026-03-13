'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/utilities/ui'

export function JarTabNav({
  activeTab,
  collectorsCount,
  transactionsCount,
}: {
  activeTab: string
  collectorsCount: number
  transactionsCount: number
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const switchTab = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    // Reset transaction pagination when switching tabs
    params.delete('page')
    router.push(`?${params.toString()}`)
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'collectors', label: 'Collectors', count: collectorsCount },
    { id: 'transactions', label: 'Transactions', count: transactionsCount },
  ]

  return (
    <div className="flex w-full border-b border-border/60">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => switchTab(t.id)}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-3 text-sm border-b-2 -mb-px transition-colors',
            activeTab === t.id
              ? 'border-primary text-foreground font-medium'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          {t.label}
          {t.count != null && t.count > 0 && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs">{t.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}
