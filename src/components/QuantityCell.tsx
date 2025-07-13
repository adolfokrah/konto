import { cn } from '@/lib/utils/tw-merge'

export default async function QuantityCell({
  cellData,
  rowData,
}: {
  cellData?: number
  rowData: any
}) {
  if (!cellData) {
    return null
  }

  const stockAlert = rowData?.stockAlert || rowData?.inventory?.stockAlert || null
  const isLowStock = stockAlert && Number(cellData) < Number(stockAlert)

  return (
    <div
      className={cn('tw:flex tw:gap-3.5', {
        'tw:text-red-500': (Number(cellData) || isLowStock) < 0,
        'tw:text-green-500': Number(cellData) >= 0,
      })}
    >
      {cellData}

      {isLowStock && <span className="tw-text-red-500 tw-text-xs">Stock is low!</span>}
    </div>
  )
}
