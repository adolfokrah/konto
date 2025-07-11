import { cn } from '@/lib/utils/twMerge'

export default async function QuantityCell({ cellData, field }: { cellData?: number; field: any }) {
  if (!cellData) {
    return null
  }

  return (
    <div
      className={cn({
        'tw:text-red-500': cellData < 0,
        'tw:text-green-500': cellData >= 0,
      })}
    >
      {cellData}
    </div>
  )
}
