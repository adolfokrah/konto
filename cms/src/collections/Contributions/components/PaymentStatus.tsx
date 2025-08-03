import { cn } from '@lib/utils/tw-merge'

export default function PaymentStatus({ cellData }: { cellData: string }) {
  const statusStyles: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  }

  const style = statusStyles[cellData] || 'bg-gray-100 text-gray-800'

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ',
        style,
      )}
    >
      {cellData.charAt(0).toUpperCase() + cellData.slice(1)}
    </span>
  )
}
