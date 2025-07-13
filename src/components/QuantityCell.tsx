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
  const isLowStock = stockAlert && Number(cellData) <= Number(stockAlert)

  return (
    <div
      className={cn(
        'tw:flex tw:gap-3.5 tw:bg-[#2F2F2F] tw:rounded-sm tw:w-max tw:shadow tw:p-0.5 tw:px-2 tw:text-green-500',
        {
          'tw:text-red-500': Number(cellData) < 0 || isLowStock,
        },
      )}
    >
      {cellData}

      {isLowStock && <span>Stock is low!</span>}
    </div>
  )
}
